# Quartz Judge — Step 3 (self-hosted Pyodide + offline PWA)

## Objective
Desktop-side Step 3 done: judge runs Python fully self-hosted via Pyodide in a module
worker; offline-first PWA verified over a **real HTTPS origin**. User then runs the
physical-phone install/offline checklist to gate Step 4.

## Important Details
- Windows 10/11; webpack only (`next build --webpack`); `output: "export"`.
- Pyodide 314.0.7 self-hosted `public/pyodide/` (no CDN refs in `out/`).
- **Module workers only** (Playwright Chromium rejects classic dedicated workers):
  Pyodide = real file `new Worker("/pyodide-worker.js", { type: "module" })`
  importing `/pyodide/pyodide.mjs`; JS judge = module blob worker.
- **Cache version** is now a content hash (`qz-<sha1>` of every precached payload) — any publish
  (catalog change) yields a new cache name so installed devices update on reconnect. Live catalog
  problems + `index.json` are precached; not-live problem files cache on first fetch. SW registered
  by `sw-register.tsx`.
- Fixes baked: bridged `browserWorkerFactory` onMsg/onErr, worker echoes `__runId`
  (+ route single-flight fallback), raw serialize glue (no JSON.stringify), `waitReady()`
  spawn+await before test loop, SW navigation candidate order
  `[path, path.html?, "/index.html", "/"]`, stale Serwist `public/sw.js` deleted,
  prod worker-count handles via `...scope.__quartzJudge`.
- Playwright gotchas: `insertText` for Python indent, direct `.click()` on Submit,
  target `/editor.html`, fresh context (cold-cache first submit IS the offline Pyodide load).
- **Process reaping**: `Start-Process` children die between bash calls on this box →
  sealed single-node runners spawn server+tunnel+test in one process.
- **HTTPS validation (this session)**: mkcert (1.4.4, scoop extras) CA installed to
  Windows trust store; leaf cert `scripts/.certs/` (gitignored) for localhost/127.0.0.1;
  `scripts/serve-https.js` serves `out/` over `https://localhost:8443`; sealed
  `scripts/https-local-smoke.js` runs the milestone against it.
- Earlier Cloudflare quick-tunnel failures (SW:null, caches empty, "Pyodide worker
  crashed during init") were **transient tunnel DNS/transport noise**, NOT the app:
  local HTTPS (identical protocol path, real cert) passes fully. New tunnels routinely
  get `ERR_NAME_NOT_RESOLVED` for 30–60s+ in this environment.
- `offline-milestone.js` now: nav re-try ×8 on goto failure; `HTTPS_TEST=1` enables
  `ignoreHTTPSErrors`; expects/validates SW activated + caches + offline submit 100%.
- One expected console line on offline flip: favicon fetch
  `net::ERR_INTERNET_DISCONNECTED` — Chromium artifact of toggling offline, harmless.
- Gates baseline: lint 0 errors / 0 warnings, tsc clean, vitest 18/18, build green (with the
  catalog pipeline), 0 CDN hits. `src/lib/types.ts` (incl. dead `AIHint`) deleted; screenshot.js
  ai-tutor entry removed.

## Work State
### Completed
- Local HTTPS-origin milestone passes in **both** modes:
  (a) `ignoreHTTPSErrors` on: SW activated | caches qz-… | offline 4/4 (100%)
  in 2910ms | active workers 1 | 0 CDN;
  (b) **pure OS-trust, no bypass** (phone-equivalent): SW activated | 4/4 in 2366ms |
  0 CDN. Both: offline reload serves editor shell, no app errors.
- HTTPS tooling: mkcert installed, `serve-https.js`, `https-local-smoke.js`,
  milestone nav-retry + HTTPS_TEST knob, `.certs` gitignored, `selfsigned` experiment
  removed (broken/empty under Node 24).
- Final gates re-run: 18/18 vitest, tsc clean, lint 0/3. `out/` unchanged (no source edit
  since last build) → no rebuild needed.

### Active
- None.

### Blocked
- Physical-phone test is a human step (agent has no phone): user installs PWA, checks
  full-screen standalone launch, icon, first offline load, second offline Python submit.
- Cloudflare quick tunnel is convenient but DNS-flaky; recommend a real static host
  (Netlify/Cloudflare Pages/GitHub Pages — `out/` is fully static) for the phone run.

## Next Move
1. (Optional) `npm run build` to refresh `out/` before shipping to a host.
2. Deploy `out/` to any static HTTPS host (or stable tunnel), open on phone, run the
   5-step checklist; approve Step 4.
3. STOP after user confirmation.

## Relevant Files
- `scripts/serve-https.js` — HTTPS static server (mkcert certs, same MIME/serve logic).
- `scripts/https-local-smoke.js` — sealed local HTTPS milestone runner.
- `scripts/https-tunnel-smoke.js` / `scripts/https-diag.js` — public-tunnel variants (DNS-flaky).
- `scripts/offline-milestone.js` — verification (nav-retry, HTTPS_TEST).
- `public/pyodide-worker.js`, `src/lib/judge/{pyodide-runner,js-worker,engine}.ts` — judge core.
- `scripts/sw.js.template`, `scripts/build-sw.js`, `src/app/sw-register.tsx` — SW.
- `src/app/layout.tsx` (viewportFit cover), `public/manifest.json`, `public/icons/`.
- `scripts/serve-static.js` — HTTP fallback for quick local checks.