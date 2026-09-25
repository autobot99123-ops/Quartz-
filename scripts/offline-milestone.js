/* eslint-disable @typescript-eslint/no-require-imports */
/* Offline PWA milestone:
 *  online load -> SW active + Pyodide precached -> go offline ->
 *  type Python solution -> submit -> expect 100% (4/4) + measure first-load,
 *  reload offline -> shell serves from cache (navigateFallback).
 */
const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

const BASE = process.env.BASE_URL || 'http://localhost:8080';

const CORRECT = `def solution(nums):
    largest = nums[0]
    for n in nums:
        if n > largest:
            largest = n
    return largest
`;

(async () => {
  const browser = await chromium.launch({
    headless: true,
    ignoreHTTPSErrors: process.env.HTTPS_TEST === "1",
  });
  const context = await browser.newContext({
    viewport: { width: 430, height: 900 },
    deviceScaleFactor: 2,
    isMobile: true,
    hasTouch: true,
    userAgent:
      'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 Version/17.0 Mobile/15E148 Safari/604.1',
  });
  const page = await context.newPage();
  const cdnHits = [];
  const consoleMsgs = [];
  page.on('request', (req) => {
    if (req.url().includes('cdn.jsdelivr.net')) cdnHits.push(req.url());
  });
  page.on('console', (msg) => {
    if (msg.type() === 'error' || msg.type() === 'warning') consoleMsgs.push(`[${msg.type()}] ${msg.text()}`);
  });
  page.on('pageerror', (err) => consoleMsgs.push(`[pageerror] ${err.message}`));

  const outDir = path.join(__dirname, '..', 'screenshots');
  fs.mkdirSync(outDir, { recursive: true });

  // 1) Online visit: register + precache Pyodide.
  //    Retry navigation — tunnel/base origins can have transient DNS on first hit.
  let navOk = false;
  for (let i = 0; i < 8 && !navOk; i++) {
    try {
      await page.goto(BASE + '/editor', { waitUntil: 'networkidle', timeout: 60000 });
      navOk = true;
    } catch (e) {
      console.log(`nav attempt ${i + 1} failed:`, e.message.split('\n')[0]);
      await page.waitForTimeout(7000);
    }
  }
  if (!navOk) throw new Error('could not navigate to ' + BASE);
  await page.waitForFunction(
    async () => {
      const reg = await navigator.serviceWorker.getRegistration();
      if (!reg || !reg.active || !navigator.serviceWorker.controller) return false;
      const names = await caches.keys();
      for (const n of names) {
        const c = await caches.open(n);
        const keys = await c.keys();
        if (keys.some((k) => k.url.includes('/pyodide/pyodide.asm.wasm'))) return true;
      }
      return false;
    },
    { timeout: 60000 },
  );
  const installability = await page.evaluate(async () => {
    for (let i = 0; i < 100; i++) {
      const r = await navigator.serviceWorker.getRegistration();
      if (r && r.active && navigator.serviceWorker.controller) {
        return {
          manifest: !!document.querySelector('link[rel="manifest"]'),
          sw: r.active.state,
          caches: (await caches.keys()).join(','),
        };
      }
      await new Promise((res) => setTimeout(res, 200));
    }
    return { manifest: null, sw: null, caches: '' };
  });
  console.log('ONLINE: precache ready. manifest link:', installability.manifest, '| SW:', installability.sw);
  console.log('ONLINE: caches =', installability.caches);

  // 2) Go offline and switch to the Python problem.
  await context.setOffline(true);
  await page.click('text=Python');

  // 3) Type the correct solution into CodeMirror.
  await page.waitForSelector('.cm-content', { timeout: 10000 });
  await page.click('.cm-content');
  await page.keyboard.press('Control+A');
  await page.keyboard.insertText(CORRECT);
  await page.waitForTimeout(200);
  const editorText = await page.evaluate(() =>
    (document.querySelector('.cm-content') || {}).innerText || '',
  );
  console.log('EDITOR after typing contains def solution?', editorText.includes('def solution(nums)'));

  // 4) Submit and time Pyodide first-load.
  const t0 = Date.now();
  await page.evaluate(() => {
    const btn = [...document.querySelectorAll('button')].find((b) => b.innerText.includes('Submit Solution'));
    if (btn) btn.click();
  });
  const clicked = await page.evaluate(() => document.body.innerText.includes('Running'));
  console.log('After direct click, showing Running state?', clicked);
  try {
    await page.waitForSelector('text=100%', { timeout: 90000 });
  } catch (e) {
    await page.waitForTimeout(1500);
    const dbg = await page.evaluate(() => document.body.innerText.slice(-1500));
    console.log('SUBMIT DID NOT REACH 100%. Tail fragment:', JSON.stringify(dbg));
    console.log('Console/page errors so far:', consoleMsgs.length ? consoleMsgs.join(' | ') : 'none');
    throw e;
  }
  const firstLoadMs = Date.now() - t0;

  const bodyText = await page.evaluate(() => document.body.innerText);
  const pct = bodyText.match(/(\d+)%/);
  const verdicts = (bodyText.match(/Accepted/g) || []).length;
  const pyWorkers = await page.evaluate(() =>
    window.__quartzJudge ? window.__quartzJudge.getPyActiveWorkerCount() : -1,
  );

  console.log('OFFLINE SUBMIT: 100% badge?', pct && pct[1], '| Accepted entries:', verdicts, '| first Python submit (incl. Pyodide init):', firstLoadMs + 'ms', '| active pyodide workers:', pyWorkers);
  await page.screenshot({ path: path.join(outDir, 'offline-python.png'), fullPage: false });

  // 5) Reload (offline) -> navigateFallback shell must serve from cache.
  await page.reload({ waitUntil: 'domcontentloaded', timeout: 30000 }).catch(() => {});
  await page.waitForFunction(() => !!navigator.serviceWorker.controller && document.readyState === 'complete', { timeout: 15000 }).catch(() => {});
  // The editor resolves its problem from the (cached) catalog asynchronously —
  // wait for the header to render before sampling the shell.
  await page.waitForFunction(
    () => {
      const h1 = document.querySelector('h1');
      return !!h1 && h1.textContent.trim().length > 0;
    },
    { timeout: 15000 },
  ).catch(() => {});
  const shellText = await page.evaluate(() => document.body.innerText.slice(0, 200));
  console.log('OFFLINE RELOAD: first 120 chars =', JSON.stringify(shellText.slice(0, 120)));
  console.log('CDN hits during session:', cdnHits.length);
  console.log('Console/page errors:', consoleMsgs.length ? consoleMsgs.join(' | ') : 'none');

  await browser.close();
  console.log('Done');
})().catch((e) => {
  console.error('FAIL:', e.message);
  process.exit(1);
});