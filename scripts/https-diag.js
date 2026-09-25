/* eslint-disable @typescript-eslint/no-require-imports */
/* Sealed HTTPS diagnostic: server + cloudflared + ONLINE probe.
 * Dumps SW state, cache contents, failed requests, console errors, and a
 * direct module-worker Pyodide readiness check over the tunnel origin. */
const { spawn } = require("child_process");
const { chromium } = require("playwright");
const path = require("path");
const fs = require("fs");

const ROOT = path.join(__dirname, "..");
const LOG_DIR = path.join(process.env.TEMP || "/tmp", "opencode");
fs.mkdirSync(LOG_DIR, { recursive: true });
const LOG = path.join(LOG_DIR, "cl_https.log");
const ERRG = LOG + ".err";
for (const f of [LOG, ERRG]) { try { fs.unlinkSync(f); } catch {} }

function findCloudflared() {
  const candidates = [
    path.join(process.env.USERPROFILE || "", "scoop", "shims", "cloudflared.exe"),
    process.env.CLOUDFLARED,
  ];
  for (const c of candidates) if (c && fs.existsSync(c)) return c;
  return "cloudflared";
}

function waitForUrl(timeoutMs) {
  const started = Date.now();
  return new Promise((resolve, reject) => {
    const poll = () => {
      if (Date.now() - started > timeoutMs) return reject(new Error("no URL in time"));
      let lines = "";
      try { lines = fs.readFileSync(LOG, "utf8") + fs.readFileSync(ERRG, "utf8"); } catch {}
      const m = lines.match(/https:\/\/[a-z0-9-]+\.trycloudflare\.com/);
      if (m) return resolve(m[0]);
      setTimeout(poll, 500);
    };
    poll();
  });
}

(async () => {
  const server = spawn(process.execPath, [path.join(ROOT, "scripts", "serve-static.js"), "out"], {
    cwd: ROOT, stdio: "ignore",
  });
  await new Promise((r) => setTimeout(r, 1500));

  let tunnel, url;
  try {
    tunnel = spawn(findCloudflared(), ["tunnel", "--no-autoupdate", "--url", "http://localhost:8080"], {
      cwd: ROOT, stdio: ["ignore", fs.openSync(LOG, "w"), fs.openSync(ERRG, "w")],
    });
    url = await waitForUrl(60000);
    console.log("TUNNEL:", url);
  } catch (e) {
    if (tunnel) tunnel.kill();
    server.kill();
    console.error("TUNNEL FAILED:", e.message);
    process.exit(1);
  }

  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  const failed = new Set();
  const consoleMsgs = [];
  page.on("requestfailed", (r) => failed.add(r.url() + " :: " + (r.failure() ? r.failure().errorText : "")));
  page.on("console", (m) => { if (m.type() === "error" || m.type() === "warning") consoleMsgs.push(`[${m.type()}] ${m.text()}`); });
  page.on("pageerror", (e) => consoleMsgs.push(`[pageerror] ${e.message}`));

  try {
    let ok = false;
    for (let i = 0; i < 6 && !ok; i++) {
      try {
        await page.goto(url + "/editor", { waitUntil: "networkidle", timeout: 60000 });
        ok = true;
      } catch (e) {
        console.log("nav attempt", i + 1, "failed:", e.message.includes("NAME_NOT_RESOLVED") ? "dns" : e.message);
        await page.waitForTimeout(8000);
      }
    }
    if (!ok) throw new Error("could not navigate to tunnel origin");
    await page.waitForTimeout(8000);

    const swState = await page.evaluate(async () => {
      const reg = await navigator.serviceWorker.getRegistration();
      const keys = await caches.keys();
      const detail = {};
      for (const n of keys) {
        const c = await caches.open(n);
        const ks = await c.keys();
        detail[n] = ks.length;
      }
      return {
        hasController: !!navigator.serviceWorker.controller,
        activeState: reg && reg.active ? reg.active.state : null,
        installState: reg && reg.installing ? reg.installing.state : null,
        caches: detail,
      };
    });
    console.log("SW:", JSON.stringify(swState));

    const workerTest = await page.evaluate(async () => {
      try {
        const w = new Worker(location.origin + "/pyodide-worker.js", { type: "module" });
        return await new Promise((resolve) => {
          let done = false;
          const fin = (r) => { if (!done) { done = true; resolve(r); } };
          w.onmessage = (e) => fin(e.data && e.data.type === "ready" ? "worker-ready" : "msg:" + JSON.stringify(e.data));
          w.onerror = (e) => fin("worker-error: " + (e && e.message));
          setTimeout(() => fin("worker-timeout"), 30000);
        });
      } catch (e) {
        return "threw: " + e.message;
      }
    });
    console.log("WORKER:", workerTest);

    console.log("FAILED REQUESTS (" + failed.size + "):");
    [...failed].forEach((f) => console.log("  ", f));
    console.log("CONSOLE: " + (consoleMsgs.length ? consoleMsgs.join(" | ") : "none"));
  } catch (e) {
    console.log("PROBE ERROR:", e.message);
    console.log("FAILED REQUESTS (" + failed.size + "):");
    [...failed].forEach((f) => console.log("  ", f));
    console.log("CONSOLE: " + (consoleMsgs.length ? consoleMsgs.join(" | ") : "none"));
  }

  await browser.close();
  tunnel.kill();
  server.kill();
})().catch((e) => {
  console.error(`FAIL: ${e.message}`);
  process.exit(1);
});