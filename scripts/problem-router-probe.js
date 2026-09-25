/* eslint-disable @typescript-eslint/no-require-imports */
/* Sealed probe: cards on /problems link into /editor?problem=<slug>, and each
 * slug renders the matching problem title in the editor header. Runs against
 * out/ over mkcert HTTPS (localhost:8443). */
const { spawn } = require("child_process");
const path = require("path");
const { chromium } = require("playwright");

const ROOT = path.join(__dirname, "..");
const PORT = 8443;
const BASE = `https://localhost:${PORT}`;

const EXPECTED = [
  ["two-sum", "Two Sum"],
  ["valid-parentheses", "Valid Parentheses"],
  ["merge-intervals", "Merge Intervals"],
  ["longest-increasing-subsequence", "Longest Increasing Subsequence"],
  ["word-ladder", "Word Ladder"],
  ["median-of-two-sorted-arrays", "Median of Two Sorted Arrays"],
];

(async () => {
  const server = spawn(process.execPath, [path.join(ROOT, "scripts", "serve-https.js"), "out"], {
    cwd: ROOT,
    stdio: ["ignore", "inherit", "inherit"],
    env: { ...process.env, HTTPS_PORT: String(PORT) },
  });

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
  if (!up) { server.kill(); console.error("server not up"); process.exit(1); }
  await new Promise((r) => setTimeout(r, 400));

  const browser = await chromium.launch({ headless: true, ignoreHTTPSErrors: true });
  const page = await browser.newPage();

  let fails = 0;

  await page.goto(`${BASE}/problems.html`, { waitUntil: "networkidle" });
  const links = await page.$$eval("a", (as) => as.map((a) => a.getAttribute("href")));
  const cardLinks = links.filter((h) => h && h.includes("/editor?problem="));
  const expectedLinks = EXPECTED.map(([slug]) => `/editor?problem=${slug}`);
  const okLinks = expectedLinks.every((l) => cardLinks.includes(l));
  console.log(`cards link to editor?`, okLinks);
  if (!okLinks) { fails++; console.log("  got:", JSON.stringify(cardLinks, null, 2)); }

  for (const [slug, title] of EXPECTED) {
    await page.goto(`${BASE}/editor?problem=${slug}`, { waitUntil: "networkidle" });
    const h1 = await page.$eval("h1", (el) => el.textContent || "");
    const match = h1.trim() === title;
    console.log(`/editor?problem=${slug} -> h1=${h1.trim()}`, match ? "OK" : "MISMATCH");
    if (!match) fails++;
  }

  await browser.close();
  server.kill();

  if (fails) {
    console.error(`PROBLEM-ROUTER PROBE: ${fails} failure(s)`);
    process.exit(1);
  }
  console.log("PROBLEM-ROUTER PROBE: all OK");
})().catch((e) => {
  console.error(`PROBE CRASH: ${e.message}`);
  process.exit(1);
});