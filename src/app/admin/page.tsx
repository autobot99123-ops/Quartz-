"use client";

import { useEffect, useMemo, useState } from "react";
import { Shield, Copy, CheckCircle2, ClipboardPaste, FlaskConical, Download, RotateCcw, Loader2 } from "lucide-react";
import { judgeJavascript, judgePython } from "@/lib/judge/engine";
import {
  DIFFICULTY_LABEL,
  fetchCatalogIndex,
  toJudgeTestCases,
  type CatalogDifficulty,
  type CatalogEntry,
  type CatalogProblem,
} from "@/lib/catalog";
import { buildCuratorPrompt } from "@/lib/prompt-template";

const DIFF_RANK: Record<CatalogDifficulty, number> = { easy: 0, medium: 1, hard: 2 };

interface Draft {
  live: Record<string, boolean>;
  published: Record<string, CatalogProblem>;
}

const DRAFT_KEY = "quartz:admin:draft";

function loadDraft(): Draft {
  try {
    const raw = localStorage.getItem(DRAFT_KEY);
    if (!raw) return { live: {}, published: {} };
    const parsed = JSON.parse(raw) as Draft;
    return {
      live: parsed.live ?? {},
      published: parsed.published ?? {},
    };
  } catch {
    return { live: {}, published: {} };
  }
}

function downloadJson(filename: string, data: unknown) {
  const blob = new Blob([JSON.stringify(data, null, 2) + "\n"], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export default function AdminPage() {
  const [entries, setEntries] = useState<CatalogEntry[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pattern, setPattern] = useState("All");
  const [difficulty, setDifficulty] = useState<"All" | CatalogDifficulty>("All");
  const [draft, setDraft] = useState<Draft>(() =>
    typeof window === "undefined" ? { live: {}, published: {} } : loadDraft(),
  );
  const [dirty, setDirty] = useState(false);

  useEffect(() => {
    fetchCatalogIndex()
      .then(setEntries)
      .catch((err) => setError(err instanceof Error ? err.message : String(err)));
  }, []);

  const patterns = useMemo(() => {
    const set = new Set((entries ?? []).map((e) => e.pattern));
    return ["All", ...[...set].sort()];
  }, [entries]);

  const filtered = useMemo(() => {
    const list = (entries ?? [])
      .filter((e) => pattern === "All" || e.pattern === pattern)
      .filter((e) => difficulty === "All" || e.difficulty === difficulty)
      .map((e) => ({ ...e, live: draft.live[e.id] ?? e.live }));
    return list.sort(
      (a, b) => DIFF_RANK[a.difficulty] - DIFF_RANK[b.difficulty] || a.title.localeCompare(b.title),
    );
  }, [entries, pattern, difficulty, draft.live]);

  function saveDraft(next: Draft) {
    setDraft(next);
    setDirty(true);
    localStorage.setItem(DRAFT_KEY, JSON.stringify(next));
  }

  function toggleLive(id: string, current: boolean) {
    const next = { ...draft, live: { ...draft.live, [id]: !current } };
    saveDraft(next);
  }

  function publish(id: string, problem: CatalogProblem) {
    if (draft.published[id] || Object.keys(draft.published).includes(id)) return;
    const next = {
      ...draft,
      published: { ...draft.published, [id]: problem },
      live: { ...draft.live, [id]: true },
    };
    saveDraft(next);
  }

  function resetDraft() {
    localStorage.removeItem(DRAFT_KEY);
    setDraft({ live: {}, published: {} });
    setDirty(false);
  }

  function buildIndex(): CatalogEntry[] {
    const map = new Map<string, CatalogEntry>((entries ?? []).map((e) => [e.id, { ...e }]));
    for (const [id, p] of Object.entries(draft.published)) {
      map.set(id, {
        id,
        title: p.title,
        pattern: p.pattern,
        difficulty: p.difficulty,
        live: draft.live[id] ?? true,
      });
    }
    for (const [id, live] of Object.entries(draft.live)) {
      const entry = map.get(id);
      if (entry) entry.live = live;
    }
    return [...map.values()].sort(
      (a, b) => DIFF_RANK[a.difficulty] - DIFF_RANK[b.difficulty] || a.title.localeCompare(b.title),
    );
  }

  const publishedCount = Object.keys(draft.published).length;
  const liveCount = (entries ?? []).filter((e) => draft.live[e.id] ?? e.live).length;

  if (error && !entries) {
    return (
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-red-500/5 border border-red-500/20 rounded-xl p-6 text-sm text-red-400">
          Could not load catalog: {error}
        </div>
      </div>
    );
  }

  if (!entries) {
    return (
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex items-center justify-center py-16 text-gray-500">
          <Loader2 className="w-5 h-5 animate-spin mr-2" /> Loading catalog…
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12 fade-in">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-2">
        <div className="flex items-center gap-3">
          <Shield className="w-8 h-8 text-orange-400" />
          <h1 className="text-3xl font-bold gradient-text">Curator Workbench</h1>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <span className="px-3 py-1 rounded-lg bg-white/5 border border-white/10 text-gray-400">
            {entries.length} slots · {liveCount} live · {publishedCount} pending publish
          </span>
          <button
            onClick={resetDraft}
            className="px-3 py-1 rounded-lg bg-white/5 border border-white/10 text-gray-400 hover:text-white flex items-center gap-1.5"
          >
            <RotateCcw className="w-3.5 h-3.5" /> Reset draft
          </button>
        </div>
      </div>
      <p className="text-sm text-gray-500 mb-8">
        Students only see problems marked <span className="text-green-400">live</span>. Publish
        produces the files you commit (<code className="text-gray-400">public/catalog/*</code>) —
        each commit redeploys and bumps the installed PWA&apos;s cache. Draft changes stay local until
        you download and commit.
      </p>

      {/* Filters */}
      <div className="flex flex-wrap gap-2 mb-6">
        {patterns.map((p) => (
          <button
            key={p}
            onClick={() => setPattern(p)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              p === pattern
                ? "bg-orange-500/10 text-orange-400 border border-orange-500/20"
                : "bg-white/5 text-gray-400 border border-white/5 hover:border-white/20"
            }`}
          >
            {p}
          </button>
        ))}
        <div className="flex items-center gap-1 ml-auto">
          {(["All", "easy", "medium", "hard"] as const).map((d) => (
            <button
              key={d}
              onClick={() => setDifficulty(d)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                d === difficulty
                  ? "bg-white/10 text-white border border-white/20"
                  : "bg-white/5 text-gray-400 border border-white/5 hover:border-white/20"
              }`}
            >
              {d === "All" ? "All" : DIFFICULTY_LABEL[d]}
            </button>
          ))}
        </div>
      </div>

      {/* Catalog rows */}
      <div className="space-y-3 mb-8">
        {filtered.map((entry) => (
          <ProblemRow
            key={entry.id}
            entry={entry}
            published={draft.published[entry.id]}
            onToggleLive={() => toggleLive(entry.id, entry.live)}
            onPublish={publish}
            onDownloadIndex={() => downloadJson("index.json", buildIndex())}
            onDownloadProblem={(id) =>
              downloadJson(`problems/${id}.json`, draft.published[id])
            }
          />
        ))}
        {filtered.length === 0 && (
          <div className="text-center py-10 text-gray-500 text-sm">
            No catalog entries match these filters.
          </div>
        )}
      </div>

      {/* Export bar */}
      <div className="bg-white/[0.03] border border-white/5 rounded-xl p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="font-semibold text-sm flex items-center gap-2">
              <Download className="w-4 h-4 text-orange-400" /> Export for commit
              {dirty && (
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-orange-500/20 text-orange-400">
                  UNSAVED DRAFT
                </span>
              )}
            </h3>
            <p className="text-xs text-gray-500 mt-1">
              Download the updated files, commit them under <code>public/catalog/</code>, and push
              to redeploy. No API / server involved.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => downloadJson("index.json", buildIndex())}
              className="px-4 py-2 rounded-lg bg-orange-500 text-white text-sm font-semibold hover:opacity-90 flex items-center gap-1.5"
            >
              <Download className="w-4 h-4" /> index.json
            </button>
            {Object.keys(draft.published).length > 0 && (
              <button
                onClick={() => {
                  for (const [id, p] of Object.entries(draft.published)) {
                    downloadJson(`problems/${id}.json`, p);
                  }
                }}
                className="px-4 py-2 rounded-lg bg-white/10 text-white text-sm font-semibold hover:bg-white/20 flex items-center gap-1.5"
              >
                <Download className="w-4 h-4" /> {Object.keys(draft.published).length} problem
                file(s)
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function ProblemRow({
  entry,
  published,
  onToggleLive,
  onPublish,
  onDownloadIndex,
  onDownloadProblem,
}: {
  entry: CatalogEntry;
  published?: CatalogProblem;
  onToggleLive: () => void;
  onPublish: (id: string, problem: CatalogProblem) => void;
  onDownloadIndex: () => void;
  onDownloadProblem: (id: string) => void;
}) {
  const [panelOpen, setPanelOpen] = useState(false);
  const [text, setText] = useState("");
  const [parseError, setParseError] = useState<string | null>(null);
  const [validating, setValidating] = useState(false);
  const [report, setReport] = useState<{ ok: boolean; summary: string } | null>(null);
  const [copied, setCopied] = useState(false);

  async function copyPrompt() {
    try {
      await navigator.clipboard.writeText(
        buildCuratorPrompt({
          topic: `${entry.title} — ${entry.pattern}`,
          difficulty: entry.difficulty,
        }),
      );
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      try {
        const ta = document.createElement("textarea");
        ta.value = buildCuratorPrompt({
          topic: `${entry.title} — ${entry.pattern}`,
          difficulty: entry.difficulty,
        });
        document.body.appendChild(ta);
        ta.select();
        document.execCommand("copy");
        ta.remove();
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
      } catch {
        setParseError("Clipboard unavailable — copy the prompt manually.");
      }
    }
  }

  async function validate() {
    setParseError(null);
    setReport(null);
    let parsed: CatalogProblem;
    try {
      parsed = JSON.parse(text) as CatalogProblem;
    } catch {
      setParseError("Not valid JSON.");
      return;
    }
    const shapeErrors = validateShape(parsed);
    if (shapeErrors.length > 0) {
      setParseError(shapeErrors.join("; "));
      return;
    }
    setValidating(true);
    try {
      const tcs = toJudgeTestCases(parsed);
      const [jsRes, pyRes] = await Promise.all([
        judgeJavascript(parsed.reference.javascript!, tcs, { timeoutMs: 2000 }),
        judgePython(parsed.reference.python!, tcs, { timeoutMs: 2000 }),
      ]);
      const jsOk = jsRes.passed === jsRes.total;
      const pyOk = pyRes.passed === pyRes.total;
      setReport({
        ok: jsOk && pyOk,
        summary:
          `JavaScript ${jsRes.passed}/${jsRes.total}${jsOk ? " ✓" : " ✗"} · ` +
          `Python ${pyRes.passed}/${pyRes.total}${pyOk ? " ✓" : " ✗"} · ` +
          `${jsOk && pyOk ? "ready to publish" : "fix before publish"}.`,
      });
    } catch (err) {
      setParseError(`Judge error: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setValidating(false);
    }
  }

  function handlePublish() {
    if (!report?.ok) return;
    const parsed = JSON.parse(text) as CatalogProblem;
    onPublish(parsed.id, parsed);
  }

  return (
    <div className="bg-white/[0.03] border border-white/5 rounded-xl overflow-hidden">
      <div className="flex flex-wrap items-center gap-3 p-4">
        <div className="flex-1 min-w-[200px]">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-gray-100">{entry.title}</h3>
            <button
              onClick={onToggleLive}
              className={`px-2 py-0.5 rounded-full text-[10px] font-bold border transition-colors ${
                entry.live
                  ? "bg-green-500/10 text-green-400 border-green-500/20"
                  : "bg-white/5 text-gray-500 border-white/10"
              }`}
              title="Toggle live (students see live problems only)"
            >
              {entry.live ? "LIVE" : "NOT LIVE"}
            </button>
            {published && (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                PENDING PUBLISH
              </span>
            )}
          </div>
          <div className="text-xs text-gray-500 mt-1">
            <span className="mr-3">pattern: <code>{entry.pattern}</code></span>
            <span>difficulty: <code>{DIFFICULTY_LABEL[entry.difficulty]}</code></span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={copyPrompt}
            className="px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-xs font-semibold text-gray-300 hover:text-white flex items-center gap-1.5"
          >
            {copied ? <CheckCircle2 className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5" />}
            {copied ? "Copied" : "Copy Prompt"}
          </button>
          <button
            onClick={() => setPanelOpen(!panelOpen)}
            className="px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-xs font-semibold text-gray-300 hover:text-white flex items-center gap-1.5"
          >
            <ClipboardPaste className="w-3.5 h-3.5" /> Paste &amp; Validate
          </button>
          {published && (
            <button
              onClick={() => onDownloadProblem(entry.id)}
              className="px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-xs font-semibold text-gray-300 hover:text-white flex items-center gap-1.5"
            >
              <Download className="w-3.5 h-3.5" /> Download JSON
            </button>
          )}
        </div>
      </div>

      {panelOpen && (
        <div className="border-t border-white/5 p-4">
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder='Paste the AI output JSON here, e.g. { "title": ..., "pattern": ..., ... }'
            className="w-full h-40 bg-black/20 border border-white/10 rounded-lg p-3 text-xs text-gray-200 placeholder-gray-600 font-mono focus:outline-none focus:border-orange-500/50"
            spellCheck={false}
          />
          <div className="flex flex-wrap items-center gap-2 mt-3">
            <button
              onClick={validate}
              disabled={validating || !text.trim()}
              className="px-4 py-2 rounded-lg bg-cyan-500/20 text-cyan-300 text-xs font-semibold hover:bg-cyan-500/30 disabled:opacity-40 flex items-center gap-1.5"
            >
              {validating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <FlaskConical className="w-3.5 h-3.5" />}
              {validating ? "Running reference solutions…" : "Validate"}
            </button>
            <button
              onClick={handlePublish}
              disabled={!report?.ok}
              className="px-4 py-2 rounded-lg bg-orange-500 text-white text-xs font-semibold hover:opacity-90 disabled:opacity-40"
            >
              Publish
            </button>
            {published && (
              <button
                onClick={onDownloadIndex}
                className="px-4 py-2 rounded-lg bg-white/10 text-white text-xs font-semibold hover:bg-white/20"
              >
                Download updated index.json
              </button>
            )}
          </div>
          {parseError && (
            <div className="mt-3 text-xs text-red-400 bg-red-500/5 border border-red-500/20 rounded-lg p-3">
              {parseError}
            </div>
          )}
          {report && (
            <div
              className={`mt-3 text-xs rounded-lg p-3 ${
                report.ok
                  ? "text-green-400 bg-green-500/5 border border-green-500/20"
                  : "text-red-400 bg-red-500/5 border border-red-500/20"
              }`}
            >
              {report.summary}
            </div>
          )}
          {published && (
            <div className="mt-3 text-xs text-cyan-400">
              Validated at 100% — files staged in your local draft. Download them and commit under
              <code> public/catalog/</code> to ship to students.
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/** Structural checks before anything touches the judge. Returns human-readable
 *  problems; empty array means the object is well-formed. */
function validateShape(p: CatalogProblem): string[] {
  const errors: string[] = [];
  const need = [
    "title",
    "pattern",
    "statement_md",
    "concept_md",
    "starter",
    "reference",
    "tests",
    "hints",
  ];
  for (const key of need) if (!(key in p) || p[key as keyof CatalogProblem] === "") errors.push(`missing "${key}"`);
  if (!["easy", "medium", "hard"].includes(p.difficulty)) errors.push('difficulty must be easy|medium|hard');
  if (p.mode !== "function") errors.push('mode must be "function"');
  if (p.compare !== "exact") errors.push('compare must be "exact"');
  if (!p.starter?.javascript || !p.starter?.python) errors.push("starter.javascript and starter.python are required");
  if (!p.reference?.javascript || !p.reference?.python) errors.push("reference.javascript and reference.python are required");
  if (!Array.isArray(p.tests) || p.tests.length < 5) errors.push("tests must be an array of at least 5 cases");
  for (const [i, t] of (p.tests ?? []).entries()) {
    if (!Array.isArray(t.in)) errors.push(`tests[${i}].in must be an array`);
  }
  if (!Array.isArray(p.hints) || p.hints.length !== 3 || p.hints.some((h) => typeof h !== "string")) {
    errors.push("hints must be exactly 3 strings (nudge, concept, pseudocode)");
  }
  return errors;
}