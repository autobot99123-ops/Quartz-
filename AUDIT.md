# Quartz Judge — Full Codebase Audit

Date: 2026-09-21

---

## PHASE 1 — AUDIT

### 1. Architecture & Stack

| Layer | Technology | Status |
|---|---|---|
| Framework | Next.js 16.3.5 (App Router) | Running (webpack mode) |
| Language | TypeScript (strict) | **BUILD FAILS** — `login/page.tsx` missing `"use client"` directive (uses `useState` in Server Component). Lint: 5 errors, 24 warnings. |
| Styling | Tailwind CSS v4 + PostCSS + custom CSS vars | Partially broken — config is v3-style, ignored by v4 |
| Editor | Monaco Editor (`@monaco-editor/react` v4.7) | Functional (client component) |
| State | Zustand v5 | Dead code — imported by zero files |
| Icons | lucide-react v0.400 | Functional, ~10 unused imports |
| Animations | framer-motion v11 | Dead code — imported by zero files |
| Validation | zod v3.23 | Dead code — imported by zero files |
| DB | Supabase (Postgres) | Client created (`lib/supabase.ts`) but never used |
| Auth | Supabase Auth | Stub only — `signInWithPassword`/`signUp` commented out |
| Code execution | Judge0 (Docker) | Not integrated — mock data only |
| Queue | Redis + BullMQ | Not integrated — comment references only |
| AI | LLM API (OpenAI/Anthropic) | Not integrated — hardcoded mock hints |

**Entry points:**
- `src/app/layout.tsx` — root layout (Navbar + Footer)
- `src/app/page.tsx` — landing page (117 lines, all hardcoded)
- `src/app/editor/page.tsx` — main coding workspace (client component, calls `POST /api/submit`)
- `src/app/problems/page.tsx` — problem catalog (server component, hardcoded data)
- `src/app/ai-tutor/page.tsx` — AI hints page (embeds `AIAdviser` client component)
- `src/app/admin/page.tsx` — admin dashboard (server component, mock data)
- `src/app/auth/login/page.tsx` — login form (client, Supabase calls commented out)
- `src/app/auth/signup/page.tsx` — signup form (client, Supabase calls commented out)
- `src/app/profile/page.tsx` — user profile (server component, hardcoded data)

**Source stats:** 24 files, ~1,232 lines TSX/TS/CSS

**Data flow (code submission):**
```
EditorPage → POST /api/submit → [mock setTimeout 1.5s] → hardcoded result → ResultPanel
```
No real code execution exists.

---

### 2. What Works vs Broken

#### Actually Works
- Next.js dev server starts (after fixes: webpack mode, postcss config, autoprefixer install)
- Landing page renders with correct styling
- Problem catalog page renders (static data only)
- Code editor (Monaco) opens and accepts typing
- Result panel renders mock results
- AI Adviser component renders and cycles through hint levels (mock data)
- Lint runs (29 issues: 5 errors, 24 warnings)
- Dark cinematic theme renders (CSS vars in `globals.css`)

#### Broken
- **Turbopack crashes on Windows** — must use `--webpack` flag
- **PostCSS config** was using `tailwindcss` directly instead of `@tailwindcss/postcss` (fixed during setup)
- **`autoprefixer` missing** from node_modules initially (fixed during setup)
- **`next.config.ts`** has deprecated `experimental.serverComponentsExternalPackages` (fixed to `serverExternalPackages`)
- **`tailwind.config.ts` is a v3 config file but project uses Tailwind v4** — all theme customizations (colors, fonts, animations) in it are **silently ignored**. Only the CSS vars in `globals.css` take effect.
- **Search/filter on problems page** — visual only, no filtering logic
- **ProblemCard links to `/problems/${id}`** but no `[id]` dynamic route exists → 404
- **Navbar Profile button** not wired to `/profile`
- **Auth** — login/signup are non-functional stubs (Supabase calls commented out)
- **Admin** — no auth/role check, all cards are visual-only
- **`lib/supabase.ts`** — never imported anywhere
- **`lib/types.ts`** — never imported anywhere (types redefined inline)
- **`store/useStore.ts`** — never imported anywhere

#### ESLint Results (5 errors, 24 warnings)
Errors:
- `login/page.tsx:67` — unescaped `'` in JSX
- `editor/page.tsx:12` — `any` type on editor ref
- `CodeEditor.tsx:41` — `any` type on `onRun` prop
- `useStore.ts:8,9` — `any` types on state fields

Warnings: 24 unused imports/variables across 11 files.

---

### 3. Dependencies Requiring API Keys, Servers, or Network

| Dependency | Required? | Status |
|---|---|---|
| Supabase (`@supabase/supabase-js`, `@supabase/ssr`) | Needs `SUPABASE_URL` + `SUPABASE_ANON_KEY` env vars | Client created but never used |
| Judge0 | Needs Docker server running | Not integrated |
| Redis / BullMQ | Needs Redis server running | Not integrated |
| LLM API (OpenAI/Anthropic) | Needs API key | Not integrated |
| Monaco Editor (`@monaco-editor/react`) | Loads from CDN at runtime | **Network dependency** — fails offline |
| `next/font/google` (Inter) | Google Fonts CDN | **Network dependency** — fails offline |

**Critical for target feature:** Monaco Editor and Google Fonts require network at runtime. The target feature requires full offline capability.

---

### 4. Security Issues

**Critical:**
1. **Admin page has no access control** — `src/app/admin/page.tsx` is publicly accessible, no auth gate
2. **API routes have no authentication** — `/api/submit`, `/api/problems`, `/api/ai-adviser` accept requests from anyone
3. **Auth is non-functional** — login/signup forms never actually call Supabase
4. **Missing RLS on 3 of 6 tables** — `hints`, `user_progress`, `problem_uploads` have no RLS policies
5. **No rate limiting** on any API endpoint
6. **Hardcoded fallback credentials** in `next.config.ts:8-9` and `lib/supabase.ts:3-4` (placeholder values, not real keys, but could mislead)

**Moderate:**
7. **No Content Security Policy headers** configured
8. **`server.log` not in `.gitignore`** — would be committed to version control
9. **No CSRF protection** on POST endpoints
10. **`submissions` table RLS allows INSERT but not UPDATE** — server-side judge can't update status

**For target feature (offline/local-only):**
- Removing network dependencies eliminates Supabase/Judge0/Redis security surface
- But we add: Web Worker code execution (sandboxing concern), Pyodide loading (WASM trust), DOMPurify for Markdown sanitization, IndexedDB storage (no server-side validation)

---

### 5. Tech Debt, Dead Code, Duplicated Logic

**Dead code (never imported/used):**
- `src/lib/supabase.ts` (6 lines) — Supabase client, zero imports
- `src/lib/types.ts` (47 lines) — TypeScript interfaces, zero imports (types redefined inline)
- `src/store/useStore.ts` (23 lines) — Zustand store, zero imports

**Dead dependencies (installed but never imported):**
- `framer-motion` — animation library, zero imports
- `tailwind-merge` — class merging, zero imports
- `zod` — validation, zero imports
- `clsx` — conditional classes, zero imports (template literals used instead)
- `@supabase/ssr` — SSR auth helpers, zero imports

**Duplicated logic:**
- Theme colors defined in 3 places: `globals.css` CSS vars, `tailwind.config.ts` tokens (ignored), and hardcoded Tailwind utilities throughout components
- `lightbulb` component defined as local function in `ai-tutor/page.tsx` but `Lightbulb` from lucide-react is imported (unused)
- Problem data hardcoded in 3+ places (home page, problems page, API route)

**Missing tests:** Zero test files in the entire project.

**Config issues:**
- `tailwind.config.ts` is Tailwind v3 format but project uses v4 — completely ignored
- `postcss.config.mjs` needed `@tailwindcss/postcss` instead of `tailwindcss` (fixed)
- `next.config.ts` had deprecated `experimental.serverComponentsExternalPackages` (fixed)

**DB schema debt:**
- `acceptance` column is TEXT instead of numeric
- Missing `ON DELETE` behavior on foreign keys
- No `updated_at` auto-update triggers
- Missing indexes on `hints` and `problem_uploads`

---

## PHASE 2 — GAP ANALYSIS

### Target Feature Requirements vs Existing Code

| Target Requirement | Classification | Evidence | Reason |
|---|---|---|---|
| **Fully offline / no API keys / no backend** | **REPLACE** | All current API routes call Supabase/Judge0/Redis (mocked). Editor uses Monaco from CDN. `next/font` loads Google Fonts. | Current architecture is server-dependent. Must replace with: self-contained PWA, local-first storage, offline-capable editor, embedded fonts. |
| **PWA (installable on mobile+desktop)** | **NEW** | No service worker, no manifest.json, no PWA config anywhere in codebase. README claims "PWA Ready" but it's aspirational. | Need: `manifest.json`, service worker (Workbox or custom), offline caching strategy, install prompt. |
| **Admin imports question packs (MD+frontmatter, JSON, CSV)** | **NEW** | Admin page is a mock UI with no functionality. No file import, no parsing, no validation. `zod` is installed but unused. | Need: file reader UI, parsers for 3 formats, validation schema (use existing `zod`), preview, reference-solution check. |
| **Versioned internal JSON schema** | **NEW** | No schema exists. `lib/types.ts` has basic interfaces but they don't match the target (no test modes, no comparison modes, no approach tags). | Need: define canonical pack schema, version field, migration support. |
| **Validation + preview + reference-solution check before publish** | **NEW** | Admin page has "Upload Problems" card but it's visual-only. No validation pipeline. | Need: validate pack → render preview → run reference solution → confirm pass → publish to IndexedDB. |
| **JS in Web Worker (killed on timeout)** | **NEW** | Current code execution is mock `setTimeout`. No Web Worker, no sandboxing. | Need: create Worker from Blob URL, message protocol for submit/run, timeout via `setTimeout` + `worker.terminate()`. |
| **Python via self-hosted Pyodide** | **NEW** | No Pyodide integration. No Python support at all currently. | Need: load Pyodide WASM, run Python code in Pyodide, handle stdout/stderr capture, timeout. |
| **Other languages as display-only** | **NEW** | No concept of display-only languages. | Need: language config that marks JS/Python as runnable, others as reference-only. |
| **Language-independent tests (io mode + function mode)** | **REFACTOR** | `lib/types.ts` has `TestCase` with `input`/`expectedOutput` (io-mode only). No function mode, no comparison modes. | Current type is a subset. Refactor to: `{ mode: "io"|"function", input?, expected?, comparison: "exact"|"whitespace"|"unordered"|"float"|"custom", ... }`. |
| **Comparison modes (exact, ignore-whitespace, unordered, float tolerance, custom checker)** | **NEW** | No comparison logic exists. Mock results just say "Accepted". | Need: comparison engine with 5 modes. Custom checker = user-provided worker function. |
| **Result = % tests passed, per-test verdict, expected-vs-actual diff** | **REFACTOR** | `ResultPanel.tsx` already shows passed/total/time/memory and per-test verdicts. But it's display-only with mock data. | Keep the UI component. Refactor data flow to receive real results from the judge engine. Add diff view for expected vs actual. |
| **Adviser (NO LLM): test-failure analysis + AST checks + tiered hints + approach tags** | **REFACTOR + NEW** | `AIAdviser.tsx` implements 3-tier hint progression (nudge→concept→pseudo-code). API route returns hardcoded hints. | **Reuse** the 3-tier UI pattern. **Replace** the LLM backend with: static test-failure analysis (pattern matching on error/output), JS AST checks (via `acorn` or similar), admin-written hints per problem, approach tags on reference solutions. |
| **Storage: IndexedDB** | **NEW** | No IndexedDB usage. Supabase was planned but not implemented. Zustand store is dead code. | Need: IndexedDB wrapper (Dexie.js or idb), stores for problems, submissions, user progress, packs. |
| **Sanitize admin Markdown (DOMPurify)** | **NEW** | No Markdown rendering, no sanitization anywhere. | Need: Markdown parser (marked/mdx) + DOMPurify sanitization for all admin-provided content. |
| **Editor: CodeMirror 6** | **REPLACE** | Currently uses Monaco Editor (`@monaco-editor/react`). | Monaco is heavier, CDN-dependent, harder to make offline. CodeMirror 6 is lighter, bundle-friendly, works offline. **Replace** Monaco with CM6. |
| **Dark cinematic theme + light theme + design tokens** | **REFACTOR** | Dark theme exists in `globals.css` (CSS vars) but is incomplete. No light theme. No design token system. No theme switching. | **Reuse** existing CSS vars as foundation. **Extend** with light theme variant, proper design token system, and `prefers-color-scheme` + toggle. |

### Foundation Assessment

**The existing codebase is a UI mockup, not a functional application.** Every data path returns hardcoded/mock data. No real backend integration exists. The DB schema exists but is unused. Auth is non-functional. Code execution is simulated.

**Recommended path: Build the target feature as a new, self-contained system within the same Next.js project shell, rather than trying to retrofit the mock backend into something real.**

The UI components (`ResultPanel`, `AIAdviser`, `Navbar`, `Footer`) are well-structured and can be reused/adapted. The CSS foundation (`globals.css`) provides a good dark theme base. Everything else is either dead code or mock data that should be replaced.

---

## PHASE 3 — MIGRATION PLAN

### Overview
Build in small, shippable steps. Each step produces a working state. Nothing breaks existing (mock) features — the new offline judge lives alongside them.

### Step 1: Foundation — PWA Shell + IndexedDB + Design Tokens
**Effort:** Medium (1-2 days)
**Risk:** Low — additive, doesn't touch existing pages
**What:**
- Add `manifest.json` with app metadata, icons, `display: standalone`
- Add service worker (Workbox via `next-pwa` or `serwist`) for offline caching of static assets
- Install `dexie` (IndexedDB wrapper), create `src/lib/db.ts` with database schema for: `packs`, `problems`, `submissions`, `userProgress`, `hints`
- Extract CSS vars into proper design tokens in `globals.css` (add light theme variant, `data-theme` attribute)
- Add theme toggle component to Navbar
- Fix `tailwind.config.ts` → remove it (use CSS-based config for v4) or migrate to v4 `@theme` syntax
- Add `.env.example` documenting all env vars
- Add `server.log` to `.gitignore`

**Test:** Dev server starts, PWA manifest loads, IndexedDB creates stores, theme toggle works, light/dark themes render.

### Step 2: Question Pack Schema + Validator + Admin Import UI
**Effort:** Medium (1-2 days)
**Risk:** Low — new feature, standalone
**What:**
- Define canonical pack JSON schema with Zod (use existing `zod` dependency):
  ```
  { version, packs: [{ id, name, problems: [{
    id, title, difficulty, tags, description (Markdown),
    languages: { js?: { starterCode, solution },
                 python?: { starterCode, solution }, ... },
    tests: { mode: "io"|"function", comparison: "exact"|"whitespace"|"unordered"|"float"|"custom",
             cases: [{ input?, expected?, ... }],
             checker?: { code, timeout } },
    hints: { nudge, concept, pseudoCode },
    approachTags: string[]
  }]}] }
  ```
- Build `src/lib/pack-schema.ts` — Zod schema + TypeScript types + validation + parse error reporting
- Build `src/lib/pack-parser.ts` — parse MD+frontmatter (gray-matter), JSON, CSV → normalized pack
- Build `src/app/admin/packs/page.tsx` — file drop zone, format detection, validation UI, error display, preview, reference-solution check button, publish button
- Build `src/lib/pack-publisher.ts` — run reference solutions, validate all test cases pass, write to IndexedDB
- Install `gray-matter` (frontmatter parser), `marked` (Markdown renderer), `dompurify`

**Test:** Import a sample JSON pack → validation passes → preview renders → reference solution runs → pack stored in IndexedDB.

### Step 3: Local Judge Engine — JS Web Worker
**Effort:** Medium (1-2 days)
**Risk:** Medium — Web Worker sandboxing needs careful testing
**What:**
- Build `src/lib/judge/engine.ts` — orchestrator: receives problem + user code + language → dispatches to runner
- Build `src/lib/judge/runners/js-worker.ts` — creates Worker from Blob, sends code + test cases, receives results, enforces timeout via `worker.terminate()`
- Build `src/lib/judge/compare.ts` — comparison engine: exact, ignore-whitespace, unordered-lines, float-tolerance, custom-checker (run user checker in Worker)
- Build `src/lib/judge/runner-types.ts` — `JudgeRequest`, `JudgeResult`, `TestResult`, `Verdict` types
- Wire into editor page: replace `POST /api/submit` with local judge call
- Update `ResultPanel` to accept new result format (per-test verdict + expected/actual diff)
- Add expected-vs-actual diff view (simple line-by-line, color-coded)

**Test:** Write Two Sum problem in JSON pack, solve it in JS, run judge → get correct %, per-test verdicts, diff view. Try wrong solution → get "Wrong Answer" with diff. Try infinite loop → get timeout. Try throwing code → get runtime error.

### Step 4: Python via Pyodide
**Effort:** Medium (1-2 days)
**Risk:** Medium — Pyodide WASM is ~20MB, loading strategy matters for offline
**What:**
- Install Pyodide as a local asset (not CDN) for offline use
- Build `src/lib/judge/runners/python-pyodide.ts` — load Pyodide, run Python code, capture stdout/stderr, enforce timeout
- Handle Pyodide initialization (async, can be slow on first load — show loading indicator)
- Wire into judge engine: if language is Python, dispatch to Pyodide runner
- Add language selector in editor (JS / Python / display-only languages)
- Display-only languages show reference solution in read-only editor with "This language is for reference only" notice

**Test:** Solve Two Sum in Python → get correct result offline (disable network in browser). Verify Pyodide loads from local assets.

### Step 5: Adviser (No LLM) + Approach Tags
**Effort:** Medium (1-2 days)
**Risk:** Low — replaces mock data with static analysis
**What:**
- Extend pack schema: `hints: { nudge, concept, pseudoCode }` per problem (admin-written, stored in pack)
- Extend pack schema: `approachTags: string[]` on reference solutions (e.g., "hash-map", "two-pointer", "DP")
- Build `src/lib/adviser/test-analyzer.ts` — pattern-matching on test failures: timeouts → "your solution may be O(n²), try O(n)", runtime errors → "check edge cases", wrong answer → "compare your output format"
- Build `src/lib/adviser/ast-checker.ts` — for JS: parse code with `acorn`, detect common patterns (nested loops = O(n²), recursion without memoization, etc.)
- Refactor `AIAdviser.tsx` to call local adviser functions instead of `POST /api/ai-adviser`
- Show approach tags on reference solutions in results panel

**Test:** Submit wrong Two Sum solution → adviser identifies the issue → shows appropriate hint tier → approach tags visible on reference solution.

### Step 6: Markdown Rendering + Sanitization
**Effort:** Low (0.5 day)
**Risk:** Low
**What:**
- Build `src/lib/sanitize.ts` — DOMPurify wrapper with safe defaults
- Build `src/components/MarkdownRenderer.tsx` — renders Markdown to safe HTML using `marked` + DOMPurify
- Use in: problem description display, admin preview, hint display
- Sanitize all admin-provided content before rendering

**Test:** Import pack with Markdown descriptions → renders correctly, no XSS via malicious Markdown.

### Step 7: CodeMirror 6 Editor (Replace Monaco)
**Effort:** Medium (1-2 days)
**Risk:** Medium — editor is core UX, must feel good
**What:**
- Install CodeMirror 6 packages: `@codemirror/state`, `@codemirror/view`, `@codemirror/lang-javascript`, `@codemirror/lang-python`, `@codemirror/theme-one-dark`
- Build `src/components/CodeEditor.tsx` — CM6 wrapper with:
  - Language mode switching (JS/Python)
  - Dark cinematic theme (match existing design tokens)
  - Light theme support
  - Read-only mode for display-only languages
  - Basic extensions: line numbers, bracket matching, auto-indent, search
- Remove Monaco dependency (`@monaco-editor/react`)
- Update editor page to use new CodeEditor

**Test:** Editor opens offline, syntax highlighting works for JS and Python, theme switching works, editor feels responsive.

### Step 8: Polish, Offline Testing, PWA Verification
**Effort:** Low-Medium (1 day)
**Risk:** Low
**What:**
- End-to-end offline test: load app, import pack, solve problem in JS, solve in Python, get results, get hints — all with network disabled
- PWA audit: Lighthouse PWA checks, install prompt on mobile + desktop
- Clean up dead code: remove `lib/supabase.ts`, `lib/types.ts` (replaced), `store/useStore.ts`, unused dependencies
- Remove mock API routes or mark them as legacy
- Update README with new architecture

**Test:** Full offline flow works. PWA installs on phone and desktop. Lighthouse score >90 for PWA.

---

### Total Estimated Effort: 8-14 days

### Risks & Mitigations

| Risk | Impact | Mitigation |
|---|---|---|
| Pyodide WASM too large for offline PWA | High | Lazy-load Pyodide only when Python is selected. Cache in IndexedDB after first load. |
| Web Worker sandboxing escapes | High | Use CSP headers, Blob URLs only, no `importScripts` from untrusted sources. |
| CodeMirror 6 feels worse than Monaco | Medium | CM6 is highly customizable. Invest in theme + extensions. Benchmark before committing. |
| IndexedDB storage limits on mobile | Medium | Monitor usage, implement pack import/export, compress old submissions. |
| Service worker caching stale assets | Low | Use Workbox with versioned caches and automatic invalidation. |
| Admin Markdown XSS | High | DOMPurify with strict config, no `eval`, no `innerHTML` of unsanitized content. |

---

### Assumptions

1. The target is a **single-user/local tool**, not a multi-user platform. No server sync.
2. "Fully free, no API keys" means no paid cloud services. Local compute (Web Worker, Pyodide) is acceptable.
3. "Works offline once loaded" means after initial PWA install, all assets (including Pyodide WASM) are cached locally.
4. Admin packs are imported from local files, not from a remote server.
5. The existing UI aesthetic (dark cinematic) is the design target. Light theme is secondary.
6. Next.js is retained as the build tool/framework but all runtime logic is client-side only.
7. The "other languages are display-only" means syntax highlighting + reference solution display, not execution.
