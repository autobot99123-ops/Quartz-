/* eslint-disable @typescript-eslint/no-require-imports */
/* Sealed HTTPS tunnel smoke:
 * server (8080) + cloudflared quick tunnel + offline milestone, all in one
 * process so nothing gets reaped between steps. Exits non-zero if the
 * milestone fails. Cold-cache Pyodide timing comes from the milestone's
 * first-submit measurement against the HTTPS origin.
 */
const { spawn, execSync } = require("child_process");
const path = require("path");
const fs = require("fs");

const ROOT = path.join(__dirname, "..");
const LOG_DIR = path.join(process.env.TEMP || "/tmp", "opencode");
fs.mkdirSync(LOG_DIR, { recursive: true });
const LOG = path.join(LOG_DIR, "cl_https.log");
const ERRG = LOG + ".err";
for (const f of [LOG, ERRG]) { try { fs.unlinkSync(f); } catch {} }

function waitForUrl(proc, timeoutMs) {
  const started = Date.now();
  return new Promise((resolve, reject) => {
    const poll = () => {
      if (Date.now() - started > timeoutMs) {
        return reject(new Error("cloudflared URL not found in time"));
      }
      let lines = "";
      try { lines = fs.readFileSync(LOG, "utf8") + fs.readFileSync(ERRG, "utf8"); } catch {}
      const m = lines.match(/https:\/\/[a-z0-9-]+\.trycloudflare\.com/);
      if (m) return resolve(m[0]);
      setTimeout(poll, 500);
    };
    poll();
  });
}

function findCloudflared() {
  const candidates = [
    path.join(process.env.USERPROFILE || "", "scoop", "shims", "cloudflared.exe"),
    process.env.CLOUDFLARED,
  ];
  for (const c of candidates) {
    if (c && fs.existsSync(c)) return c;
  }
  return "cloudflared";
}

(async () => {
  const server = spawn(process.execPath, [path.join(ROOT, "scripts", "serve-static.js"), "out"], {
    cwd: ROOT,
    stdio: "ignore",
  });
  await new Promise((r) => setTimeout(r, 1500));

  let tunnel;
  let url;
  try {
    const cfPath = findCloudflared();
    tunnel = spawn(cfPath, ["tunnel", "--no-autoupdate", "--url", "http://localhost:8080"], {
      cwd: ROOT,
      stdio: ["ignore", fs.openSync(LOG, "w"), fs.openSync(ERRG, "w")],
    });
    url = await waitForUrl(tunnel, 60000);
    console.log("TUNNEL:", url);
  } catch (e) {
    if (tunnel) tunnel.kill();
    server.kill();
    console.error("TUNNEL FAILED:", e.message);
    process.exit(1);
  }

  try {
    const out = execSync(`"${process.execPath}" scripts/offline-milestone.js`, {
      cwd: ROOT,
      env: { ...process.env, BASE_URL: url },
      encoding: "utf8",
      timeout: 240000,
    });
    console.log(out);
  } catch (e) {
    console.error("MILESTONE FAILED:", (e.stdout || "") + (e.stderr || "") + e.message);
    if (tunnel) tunnel.kill();
    server.kill();
    process.exit(1);
  }

  if (tunnel) tunnel.kill();
  server.kill();
  console.log("Sealed HTTPS tunnel smoke: DONE");
})().catch((e) => {
  console.error(`FAIL: ${e.message}`);
  process.exit(1);
});