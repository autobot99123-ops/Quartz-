/* eslint-disable @typescript-eslint/no-require-imports */
/* Post-build step: generate out/sw.js from scripts/sw.js.template with a
 * manifest of every static asset in out/, using forward-slash URLs (Serwist
 * emits Windows backslash URLs, which break CacheStorage matching offline).
 */
const fs = require("fs");
const path = require("path");

const OUT = path.resolve(__dirname, "..", "out");
const TEMPLATE = path.join(__dirname, "sw.js.template");
const VERSION = new Date().toISOString().slice(0, 10).replace(/-/g, "");

function walk(dir) {
  const out = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      out.push(...walk(full));
    } else {
      out.push(full);
    }
  }
  return out;
}

const files = walk(OUT);
const manifest = [];
for (const file of files) {
  const rel = path.relative(OUT, file).split(path.sep).join("/");
  if (rel === "sw.js" || rel.endsWith(".map")) continue;
  manifest.push("/" + rel);
}
manifest.sort();
manifest.unshift("/");

const template = fs.readFileSync(TEMPLATE, "utf8");
const sw = template
  .replace("__CACHE_NAME__", JSON.stringify("qz-" + VERSION))
  .replace("__PRECACHE_MANIFEST__", JSON.stringify(manifest));

fs.writeFileSync(path.join(OUT, "sw.js"), sw);
console.log(`sw.js generated: ${manifest.length} precache entries (version ${VERSION})`);