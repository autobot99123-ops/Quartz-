/* eslint-disable @typescript-eslint/no-require-imports */
// One-off generator: renders the Quartz badge to PNG icons for the PWA manifest.
const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

const outDir = path.join(__dirname, '..', 'public', 'icons');
fs.mkdirSync(outDir, { recursive: true });

const html = (size) => `<!doctype html>
<html>
<head><style>
  html, body { margin: 0; padding: 0; width: ${size}px; height: ${size}px; overflow: hidden; background: transparent; }
  .badge {
    width: ${size}px; height: ${size}px;
    border-radius: ${Math.round(size * 0.22)}px;
    background: radial-gradient(circle at 30% 25%, #ffb56b 0%, #f5871f 45%, #b35f00 100%);
    box-shadow: inset 0 0 ${Math.round(size * 0.12)}px rgba(0,0,0,0.35);
    display: flex; align-items: center; justify-content: center;
    font-family: 'Segoe UI', Arial, sans-serif;
    font-weight: 700; color: #fff; text-shadow: 0 ${Math.round(size * 0.02)}px ${Math.round(size * 0.03)}px rgba(0,0,0,0.35);
  }
  .q { font-size: ${Math.round(size * 0.52)}px; letter-spacing: -${Math.round(size * 0.02)}px; }
  .rock { width: ${Math.round(size * 0.34)}px; height: ${Math.round(size * 0.16)}px; background: #fff; border-radius: ${Math.round(size * 0.03)}px; opacity: 0.9; position: relative; top: ${Math.round(size * 0.04)}px; left: ${Math.round(size * 0.01)}px; transform: rotate(-6deg); }
</style></head>
<body><div class="badge"><div style="display:flex; align-items:center;"><span class="q">Q</span><span class="rock"></span></div></div></body>
</html>`;

(async () => {
  const browser = await chromium.launch({ headless: true });
  for (const size of [512, 192, 180]) {
    const page = await browser.newPage({ viewport: { width: size, height: size } });
    await page.setContent(html(size));
    await page.screenshot({
      path: path.join(outDir, size === 180 ? 'apple-touch-icon.png' : `icon-${size}.png`),
      clip: { x: 0, y: 0, width: size, height: size },
    });
    console.log(`OK: ${size}px`);
    await page.close();
  }
  await browser.close();
})();