# 🪨 Quartz Judge

An offline-first, LeetCode-style coding judge with a **curated problem catalog**, built as a
fully static Next.js export with **no backend**. Code runs 100% in the browser: JavaScript in
sandboxed workers, Python via self-hosted Pyodide.

## Why it exists

The judge is a learning playground: students pick a problem from the catalog, write one function,
submit, and get per-test-case verdicts plus three progressive hints (Nudge → Concept →
Pseudocode). The entire app — judge, Python runtime, and problem content — is served from a
service-worker cache, so it keeps working with no network once installed.

## Features

- ⚡ **In-browser judge** — JavaScript (isolated web workers) and Python (Pyodide, fully offline)
- 🗂️ **Curated catalog** — small `index.json` + per-problem JSON files committed to the repo;
  students only ever see problems marked `live`
- 🛠️ **Curator workbench** (`/admin`) — AI-assisted publishing with a strict prompt contract:
  paste-back the AI's JSON, **Validate** runs both reference solutions against every test through
  the real judge, and **Publish** is only enabled at 100% pass
- 📤 **Publish = commit** — the workbench exports the updated `index.json` + problem files; you
  commit them under `public/catalog/` and push. Deploys are not automated (1–2/day today, revisit
  only if that becomes friction)
- 🔄 **Update-on-reconnect** — the service-worker cache version is a content hash, so every publish
  reaches already-installed devices on their next online session
- 💡 **Progressive hints** — nudge → concept → pseudocode, revealed one at a time after submitting
- 📱 **PWA** — installable, standalone, works offline (CodeMirror editor, dark theme)

## Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 16 (App Router) + TypeScript, `output: "export"` — fully static |
| Styling | Tailwind CSS v4 |
| Editor | CodeMirror 6 |
| JS judge | Web Workers (module) |
| Python judge | Pyodide 314, self-hosted under `public/pyodide/` (no CDN) |
| Offline | Hand-rolled service worker generated at build time |

## Quick start

```bash
npm install
npm run dev      # dev server (http://localhost:3000)
npm run build    # build-catalog → next build → build-sw (writes out/sw.js)
npm start        # serve the static out/ locally
```

`npm run build` regenerates `public/catalog/` from the seed definitions, exports the static site
to `out/`, then emits `out/sw.js` whose cache name is derived from the hashed precache content.
`vercel.json` sets `buildCommand: "npm run build"` so Vercel runs the full pipeline (a plain
`next build` would not emit `sw.js`, breaking the PWA offline) and 308-redirects legacy
`page.html` URLs to their clean-route equivalents (`/editor`, `/problems`, …).

## Catalog & publishing (admin flow)

- `public/catalog/index.json` — `[{ id, title, pattern, difficulty, live }]`, changes on every publish.
- `public/catalog/problems/<id>.json` — full problem: statement, concept, starters/references in
  JS + Python, ≥5 test cases, and 3 hints.
- The curator copies a prompt ("Copy Prompt" on the problem row), pastes the AI's JSON back, and clicks **Validate** —
  both reference solutions must pass every test. **Publish** stages the files; the workbench lets
  you download the updated `index.json` and problem JSON to commit. Tooling may change if daily
  publishing becomes real friction; nothing is automated today.

## Verifying

```bash
npm test                                       # judge engine unit tests (vitest)
node scripts/https-local-smoke.js              # offline milestone over trusted local HTTPS
node scripts/catalog-publish-test.js           # publish → stale offline → update-on-reconnect
node scripts/problem-router-probe.js           # catalog links resolve to real judge problems
```

## Project structure

```
src/
├── app/
│   ├── editor/        # catalog-driven judge (languages + progressive hints)
│   ├── problems/      # student-visible live catalog, filters + search
│   ├── admin/         # curator workbench (validate/publish/live toggle)
│   └── layout.tsx     # PWA metadata + SW registration
├── components/        # CodeEditor, ResultPanel, ProblemCard, Navbar
└── lib/
    ├── catalog.ts     # catalog fetch + schema→judge adapter
    ├── prompt-template.ts
    └── judge/         # engine, JS/Pyodide runners, worker glue
public/
├── catalog/           # committed: index.json + problems/<id>.json
└── pyodide/           # self-hosted Pyodide (314)
scripts/
├── build-catalog.js   # seed generator (idempotent, preserves published files)
├── build-sw.js        # content-hash cache version + live-only precache
└── offline-milestone.js, https-local-smoke.js, catalog-publish-test.js, ...
```

## License

MIT © Quartz Judge