/* eslint-disable @typescript-eslint/no-require-imports */
/* Sealed LOCAL HTTPS smoke: serve-https (8443) + offline milestone in one
 * process. Self-signed cert, Chromium launched with ignoreHTTPSErrors so the
 * secure-context behavior (SW + module worker + Pyodide) is realistic. */
const { spawn, execSync } = require("child_process");
const path = require("path");

const ROOT = path.join(__dirname, "..");
const PORT = 8443;

(async () => {
  const server = spawn(process.execPath, [path.join(ROOT, "scripts", "serve-https.js"), "out"], {
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
  await new Promise((r) => setTimeout(r, 500));

  try {
    const out = execSync(`"${process.execPath}" scripts/offline-milestone.js`, {
      cwd: ROOT,
      env: { ...process.env, BASE_URL: `https://localhost:${PORT}`, HTTPS_TEST: process.env.HTTPS_TEST ?? "1" },
      encoding: "utf8",
      timeout: 240000,
    });
    console.log(out);
  } catch (e) {
    console.error("MILESTONE FAILED:", (e.stdout || "") + (e.stderr || ""));
    server.kill();
    process.exit(1);
  }

  server.kill();
  console.log("Local HTTPS sealed smoke: DONE");
})().catch((e) => {
  console.error(`FAIL: ${e.message}`);
  process.exit(1);
});