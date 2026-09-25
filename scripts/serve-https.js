/* eslint-disable @typescript-eslint/no-require-imports */
/* HTTPS static server for test harnessing (mkcert localhost certs, :8443).
 * Same serving logic + MIME table as serve-static.js, wrapped in TLS.
 * Never used in production: out/ is self-contained. */
const https = require("https");
const fs = require("fs");
const path = require("path");

const ROOT = process.argv[2]
  ? path.resolve(process.argv[2])
  : path.join(__dirname, "..", "out");
const PORT = Number(process.env.HTTPS_PORT || 8443);
const CERT = process.env.HTTPS_CERT || path.join(__dirname, ".certs", "localhost.pem");
const KEY = process.env.HTTPS_KEY || path.join(__dirname, ".certs", "localhost-key.pem");

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".ico": "image/x-icon",
  ".svg": "image/svg+xml",
  ".wasm": "application/wasm",
  ".zip": "application/zip",
  ".woff2": "font/woff2",
  ".txt": "text/plain; charset=utf-8",
};

https
  .createServer(
    { key: fs.readFileSync(KEY), cert: fs.readFileSync(CERT) },
    (req, res) => {
      let urlPath = decodeURIComponent((req.url || "/").split("?")[0]);
      if (urlPath === "/") urlPath = "/index.html";

      let file = path.normalize(path.join(ROOT, urlPath));
      if (!file.startsWith(ROOT)) {
        res.writeHead(403);
        res.end("Forbidden");
        return;
      }

      if (!fs.existsSync(file) || fs.statSync(file).isDirectory()) {
        file = path.join(ROOT, "index.html");
      }

      fs.readFile(file, (err, data) => {
        if (err) {
          res.writeHead(500);
          res.end("Server error");
          return;
        }
        res.writeHead(200, {
          "Content-Type": MIME[path.extname(file).toLowerCase()] || "application/octet-stream",
          "Cache-Control": "public, max-age=0, must-revalidate",
        });
        res.end(data);
      });
    },
  )
  .listen(PORT, () => {
    console.log(`HTTPS serving ${ROOT} at https://localhost:${PORT}`);
  });