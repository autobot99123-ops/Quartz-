/* eslint-disable @typescript-eslint/no-require-imports */
/* Post-build step: generate out/sw.js (and the committed public/sw.js used by
 * static hosts that serve public/ verbatim) from scripts/sw.js.template with a
 * manifest of every static asset in out/ (forward-slash URLs).
 *
 * Cache version = content hash of every precached payload, so ANY publish
 * (catalog index change, live flag flip, new/edited problem file, code change)
 * yields a different cache name and installed devices pick it up on next
 * reconnect. Identical content ⇒ identical version (no pointless churn).
 *
 * live-only catalog precache: /catalog/index.json plus the problem files of
 * live entries are precached; not-live problems are cached on first fetch.
 *
 * OUT_DIR env override points at a sandbox copy (used by
 * scripts/catalog-publish-test.js so real out/ is never mutated).
 */
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const OUT = process.env.OUT_DIR
  ? path.resolve(process.env.OUT_DIR)
  : path.resolve(__dirname, "..", "out");
const TEMPLATE = path.join(__dirname, "sw.js.template");

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

let liveProblemIds = new Set();
try {
  const index = JSON.parse(fs.readFileSync(path.join(OUT, "catalog", "index.json"), "utf8"));
  liveProblemIds = new Set(index.filter((e) => e.live === true).map((e) => e.id));
} catch {
  console.warn("catalog/index.json not found in out/ — precaching every catalog file.");
}

const files = walk(OUT);
const manifest = [];
const hasher = crypto.createHash("sha1");
for (const file of files) {
  const rel = path.relative(OUT, file).split(path.sep).join("/");
  if (rel === "sw.js" || rel.endsWith(".map")) continue;
  const url = "/" + rel;
  const m = url.match(/^\/catalog\/problems\/(.+)\.json$/);
  if (m && !liveProblemIds.has(m[1])) continue; // not-live: runtime cache only
  manifest.push(url);
  hasher.update(fs.readFileSync(file));
}
manifest.sort();
manifest.unshift("/");
hasher.update("|");

const version = "qz-" + hasher.digest("hex").slice(0, 10);
const template = fs.readFileSync(TEMPLATE, "utf8");
const sw = template
  .replace("__CACHE_NAME__", JSON.stringify(version))
  .replace("__PRECACHE_MANIFEST__", JSON.stringify(manifest));

const output = path.join(OUT, "sw.js");
fs.writeFileSync(output, sw);
const publicSw = path.resolve(__dirname, "..", "public", "sw.js");
if (path.resolve(OUT) !== path.dirname(publicSw) && !process.env.OUT_DIR) {
  fs.writeFileSync(publicSw, sw);
}
console.log(`sw.js generated: ${manifest.length} precache entries (version ${version}, out: ${OUT})`);