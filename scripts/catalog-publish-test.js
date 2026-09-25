/* eslint-disable @typescript-eslint/no-require-imports */
/* Sealed publish-propagation test for the catalog + SW versioning contract:
 *   1. Install the app online over local HTTPS (SW active, precache filled).
 *   2. Go offline, reload -> stale pre-publish content still served.
 *   3. Publish: mutate the catalog in a SANDBOX out copy   (new title for the
 *      default problem) and regenerate sandbox/sw.js via scripts/build-sw.js
 *      (version = content hash => new cache name).
 *   4. Still offline -> reload -> old content (stale precache wins).
 *   5. Go online -> reload -> the new SW installs + claims; reload again ->
 *      NEW content visible, old cache swept.
 *   6. Offline again -> reload -> new content still available.
 *
 * Real out/ is never mutated (sandbox copy under os.tmpdir). Requires the
 * normal gates first (build + build-sw on real out). Run sealed (owns :8443).
 */
const { spawn, execSync } = require("child_process");
const { chromium } = require("playwright");
const fs = require("fs");
const os = require("os");
const path = require("path");

const ROOT = path.join(__dirname, "..");
const OUT = path.join(ROOT, "out");
const PORT = 8443;
const BASE = `https://localhost:${PORT}`;

const ORIGINAL_TITLE = "Maximum of List";
const PUBLISHED_TITLE = "Max of List";

function copyDir(src, dest) {
  return fs.cpSync(src, dest, { recursive: true });
}

function rewriteProblemTitle(dir, id, title) {
  const file = path.join(dir, "catalog", "problems", `${id}.json`);
  const problem = JSON.parse(fs.readFileSync(file, "utf8"));
  problem.title = title;
  fs.writeFileSync(file, JSON.stringify(problem, null, 2) + "\n");
}

(async () => {
  const sandbox = path.join(os.tmpdir(), `qz-publish-${Date.now()}`);
  copyDir(OUT, sandbox);
  console.log(`sandbox out copy: ${sandbox}`);

  const server = spawn(process.execPath, [path.join(ROOT, "scripts", "serve-https.js"), sandbox], {
    cwd: ROOT,
    stdio: ["ignore", "inherit", "inherit"],
    env: { ...process.env, HTTPS_PORT: String(PORT) },
  });
  await new Promise((r) => setTimeout(r, 1500));

  let up = false;
  for (let i = 0; i < 40 && !up; i++) {
    try {
      await new Promise((res, rej) => {
        const s = require("net").connect(PORT, "127.0.0.1", () => { s.end(); res(); });
        s.on("error", rej);
      });
      up = true;
    } catch {}
    if (!up) await new Promise((r) => setTimeout(r, 500));
  }
  if (!up) { server.kill(); console.error("HTTPS server not listening"); process.exit(1); }

  const browser = await chromium.launch({ headless: true, ignoreHTTPSErrors: true });
  const context = await browser.newContext({ viewport: { width: 430, height: 900 } });
  const page = await context.newPage();
  const consoleErrs = [];
  page.on("console", (m) => { if (m.type() === "error") consoleErrs.push(m.text()); });
  page.on("pageerror", (e) => consoleErrs.push(e.message));

  const waitSWReady = async () => {
    await page.goto(BASE + "/editor.html", { waitUntil: "networkidle", timeout: 60000 });
    await page.waitForFunction(
      async () => {
        const reg = await navigator.serviceWorker.getRegistration();
        if (!reg || !reg.active || !navigator.serviceWorker.controller) return false;
        const names = await caches.keys();
        for (const n of names) {
          const c = await caches.open(n);
          const keys = await c.keys();
          if (keys.some((k) => k.url.includes("/catalog/index.json"))) return true;
        }
        return false;
      },
      { timeout: 60000 },
    );
    // Claim vs. offline is racy right after first load: the `controllerchange`
    // lands ~1s after load. Require control to be STABLE across consecutive
    // samples before the sealed steps go offline.
    await page.evaluate(
      () =>
        new Promise((resolve) => {
          let ok = 0;
          const step = async () => {
            const reg = await navigator.serviceWorker.getRegistration();
            const c = !!navigator.serviceWorker.controller;
            if (c && reg && reg.active && reg.active.state === "activated") ok++;
            else ok = 0;
            if (ok >= 4) resolve(true);
            else setTimeout(step, 150);
          };
          step();
        }),
    );
    return page.evaluate(async () => ({
      cacheNames: (await caches.keys()).sort(),
    }));
  };

  const title = () => page.evaluate(() => (document.querySelector("h1") || {}).innerText || "");
  const reloadWith = async (opts) => page.reload(opts).catch(() => {});
  const assert = (cond, label, detail) => {
    if (!cond) throw new Error(`FAIL: ${label}${detail ? " — " + detail : ""}`);
    console.log(`PASS: ${label}`);
  };
  // Reload and wait for the async catalog-driven header before reading it.
  const reloadTitle = async (expected) => {
    await reloadWith({ waitUntil: "domcontentloaded", timeout: 20000 });
    for (let i = 0; i < 80; i++) {
      let t = "";
      try {
        t = await title();
      } catch {
        // frame being replaced mid-navigation; keep polling
      }
      if (t === expected) return t;
      await page.waitForTimeout(250);
    }
    const last = await title();
    if (last !== expected) await dumpState("stuck-reload");
    return last;
  };
  const dumpState = async (tag) => {
    const info = await page.evaluate(async () => {
      const probes = {
        href: location.href,
        readyState: document.readyState,
        h1: (document.querySelector("h1") || {}).innerText || "",
        bodyHead: (document.body ? document.body.innerText : "no-body").slice(0, 120),
      };
      for (const [k, fn] of Object.entries({
        controller: () => !!navigator.serviceWorker.controller,
        cachesType: () => typeof window.caches,
        regActive: async () => {
          const r = await navigator.serviceWorker.getRegistration();
          return r && r.active ? r.active.state : "none";
        },
        regScope: async () => {
          const r = await navigator.serviceWorker.getRegistration();
          return r ? r.scope : "none";
        },
      })) {
        try {
          probes[k] = await fn();
        } catch (e) {
          probes[k] = "ERR:" + String(e).slice(0, 60);
        }
      }
      try {
        if (window.caches) {
          probes.caches = (await caches.keys()).join(",");
        }
      } catch (e) {
        probes.caches = "ERR:" + String(e).slice(0, 60);
      }
      return probes;
    });
    console.log(`[${tag}]`, JSON.stringify(info));
  };

  // ---- 1) Online install -------------------------------------------------
  const s1 = await waitSWReady();
  const v1 = s1.cacheNames.find((n) => n.startsWith("qz-"));
  await page.waitForFunction(
    () => document.querySelector("h1") && document.querySelector("h1").innerText,
    { timeout: 15000 },
  );
  const t1 = await title();
  assert(t1 === ORIGINAL_TITLE, "1. online install shows original title", `got "${t1}"`);
  assert(!!v1, "1. SW active with versioned cache", s1.cacheNames.join(","));
  console.log(`   cache v1 = ${v1}`);

  // ---- 2) Offline reload -> stale content -------------------------------
  await context.setOffline(true);
  const t2 = await reloadTitle(ORIGINAL_TITLE);
  assert(t2 === ORIGINAL_TITLE, "2. offline reload serves stale pre-publish content", `got "${t2}"`);

  // ---- 3) Publish in sandbox (content change + new SW) -------------------
  rewriteProblemTitle(sandbox, "max-of-list", PUBLISHED_TITLE);
  execSync(`"${process.execPath}" scripts/build-sw.js`, {
    cwd: ROOT,
    env: { ...process.env, OUT_DIR: sandbox },
    encoding: "utf8",
  });
  const sandboxSw = fs.readFileSync(path.join(sandbox, "sw.js"), "utf8");
  const v2 = (sandboxSw.match(/CACHE_NAME = "([^"]+)"/) || [])[1];
  console.log(`   publish done: title -> "${PUBLISHED_TITLE}", new cache ${v2}`);

  // ---- 4) Still offline -> stale cache keeps old title -------------------
  const t4 = await reloadTitle(ORIGINAL_TITLE);
  assert(t4 === ORIGINAL_TITLE, "4. offline after publish still serves stale content", `got "${t4}"`);

  // ---- 5) Online -> SW updates -> new content -----------------------------
  await context.setOffline(false);
  await reloadWith({ waitUntil: "networkidle", timeout: 60000 });
  // Give the new SW time to install, claim, and have its precache ready.
  let t5 = "WAITING";
  for (let i = 0; i < 40; i++) {
    t5 = await title();
    if (t5 === PUBLISHED_TITLE) break;
    await page.waitForTimeout(500);
    await reloadWith({ waitUntil: "networkidle", timeout: 60000 }).catch(() => {});
  }
  assert(
    t5 === PUBLISHED_TITLE,
    "5. online reconnect picks up the published change (new SW + new content)",
    `got "${t5}"`,
  );
  const s5 = await page.evaluate(async () => ({
    cacheNames: (await caches.keys()).sort(),
    swState: (await navigator.serviceWorker.getRegistration()).active ? "activated" : "none",
  }));
  const hasV2 = s5.cacheNames.includes(v2);
  const v1Swept = !s5.cacheNames.includes(v1);
  assert(hasV2 && v1Swept, "5. new version cache present, old cache swept",
    `caches = ${s5.cacheNames.join(",")}`);
  console.log(`   cache v2 = ${v2}`);

  // ---- 6) Offline again -> NEW content from new precache ------------------
  await context.setOffline(true);
  const t6 = await reloadTitle(PUBLISHED_TITLE);
  assert(t6 === PUBLISHED_TITLE, "6. offline now serves the published content", `got "${t6}"`);

  console.log("Console/page errors:", consoleErrs.length ? consoleErrs.join(" | ") : "none");

  await browser.close();
  server.kill();
  fs.rmSync(sandbox, { recursive: true, force: true });
  console.log("Publish-propagation test: DONE");
})().catch((e) => {
  console.error("FAIL:", e.message);
  process.exit(1);
});