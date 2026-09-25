/* eslint-disable @typescript-eslint/no-require-imports */
const { chromium } = require('playwright');
const path = require('path');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  
  const pages = [
    { name: 'landing', url: 'http://localhost:3000/' },
    { name: 'problems', url: 'http://localhost:3000/problems' },
    { name: 'editor', url: 'http://localhost:3000/editor' },
    { name: 'admin', url: 'http://localhost:3000/admin' },
  ];
  
  const outDir = path.join(__dirname, '..', 'screenshots', 'after');
  require('fs').mkdirSync(outDir, { recursive: true });
  
  for (const p of pages) {
    try {
      await page.goto(p.url, { waitUntil: 'networkidle', timeout: 30000 });
      await page.waitForTimeout(1500);
      const filePath = path.join(outDir, `${p.name}.png`);
      await page.screenshot({ path: filePath, fullPage: true });
      console.log(`OK: ${p.name} -> ${filePath}`);
    } catch (e) {
      console.error(`FAIL: ${p.name}: ${e.message}`);
    }
  }
  
  await browser.close();
  console.log('Done');
})();
