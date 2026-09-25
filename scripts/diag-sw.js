/* eslint-disable @typescript-eslint/no-require-imports */
const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 430, height: 900 }, isMobile: true });
  const page = await context.newPage();
  const logs = [];
  page.on('pageerror', (e) => logs.push('pageerror: ' + e.message));
  page.on('console', (m) => { if (m.type() === 'error') logs.push('console: ' + m.text()); });

  await page.goto('http://localhost:8080/editor.html', { waitUntil: 'networkidle' });

  await page.waitForFunction(async () => {
    const reg = await navigator.serviceWorker.getRegistration();
    return !!(reg && reg.active);
  }, { timeout: 30000 }).catch(() => {});

  const swState = await page.evaluate(async () => {
    const reg = await navigator.serviceWorker.getRegistration();
    return reg && reg.active ? `${reg.active.scriptURL} / ${reg.active.state} / controlled=${!!navigator.serviceWorker.controller}` : 'none';
  });
  console.log('SW:', swState);

  const probe = await page.evaluate(() => {
    const before = document.querySelector('h1') ? document.querySelector('h1').textContent : 'no-h1';
    const btn = [...document.querySelectorAll('button')].find((b) => b.textContent.trim() === 'Python');
    if (btn) btn.click();
    return new Promise((res) => setTimeout(() => {
      const after = document.querySelector('h1') ? document.querySelector('h1').textContent : 'no-h1';
      res({ before, after, changed: before !== after });
    }, 400));
  });
  console.log('HYDRATION probe (Python tab click):', JSON.stringify(probe));

  const reg2 = await page.evaluate(async () => (await navigator.serviceWorker.getRegistration()) ? 'now-registered' : 'still-none');
  console.log('Registration after probe:', reg2);

  const manual = await page.evaluate(async () => {
    try {
      const reg = await navigator.serviceWorker.register('/sw.js');
      return { ok: true, active: !!(reg.active || reg.installing || reg.waiting), state: reg.active ? reg.active.state : (reg.installing ? 'installing' : 'queued') };
    } catch (e) {
      return { ok: false, error: e.message };
    }
  });
  console.log('MANUAL register:', JSON.stringify(manual));
  await page.waitForTimeout(4000);

  const snap = () => page.evaluate(async () => {
    const out = [];
    for (const name of await caches.keys()) {
      const c = await caches.open(name);
      const n = (await c.keys()).length;
      const hasWasn = (await c.keys()).some((k) => k.url.includes('pyodide.asm.wasm'));
      out.push({ name, n, hasWasn });
    }
    return out;
  });
  console.log('CACHES:', JSON.stringify(await snap()));
  await page.waitForTimeout(3000);
  console.log('CACHES at +3s:', JSON.stringify(await snap()));

  const onlineFetch = await page.evaluate(async () => {
    const r = await fetch('/pyodide/pyodide.js');
    return { status: r.status };
  }).catch((e) => ({ error: e.message }));
  console.log('ONLINE fetch /pyodide/pyodide.js:', JSON.stringify(onlineFetch));

  await context.setOffline(true);
  const offlineFetch = await page.evaluate(async () => {
    try {
      const r = await fetch('/pyodide/pyodide.js');
      return { status: r.status, bytes: (await r.text()).length };
    } catch (e) {
      return { error: e.message };
    }
  }).catch((e) => ({ evaluateError: e.message }));
  console.log('OFFLINE fetch /pyodide/pyodide.js:', JSON.stringify(offlineFetch));

  const offlineNav = await page.evaluate(async () => {
    const r = await fetch('/index.html');
    return r.status;
  }).catch((e) => ({ error: e.message }));
  console.log('OFFLINE fetch /index.html:', JSON.stringify(offlineNav));

  const workerTest = await page.evaluate(async () => {
    try {
      const w = new Worker(location.origin + '/pyodide-worker.js', { type: 'module' });
      return await new Promise((resolve) => {
        w.onmessage = (e) => resolve(e.data && e.data.type === 'ready' ? 'ready-msg-received' : 'message: ' + JSON.stringify(e.data));
        w.onerror = (e) => resolve('worker-error: ' + (e && (e.message || e.filename || '')));
        setTimeout(() => resolve('timeout'), 15000);
      });
    } catch (e) {
      return 'threw: ' + e.message;
    }
  });
  console.log('OFFLINE blob-worker importScripts /pyodide/pyodide.js:', workerTest);
  console.log('LOGS:', logs.length ? logs.join(' | ') : 'none');

  await browser.close();
  console.log('Done');
})().catch((e) => { console.error('FAIL:', e.message); process.exit(1); });