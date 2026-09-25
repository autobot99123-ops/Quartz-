"use client";

import { useEffect, useRef, useState } from "react";
import { CodeEditor, type RunOutput } from "@/components/CodeEditor";
import { ResultPanel } from "@/components/ResultPanel";
import { Play, Loader2 } from "lucide-react";
import { judgeJavascript, judgePython, runSingle } from "@/lib/judge/engine";
import type { JudgeResult, JudgeTestResult } from "@/lib/judge/types";
import {
  DIFFICULTY_LABEL,
  fetchCatalogIndex,
  fetchCatalogProblem,
  inferLanguages,
  starterFor,
  toJudgeTestCases,
  type CatalogEntry,
  type CatalogLanguage,
  type CatalogProblem,
} from "@/lib/catalog";

const diffBadge = {
  easy: "bg-green-500/10 text-green-400",
  medium: "bg-yellow-500/10 text-yellow-400",
  hard: "bg-red-500/10 text-red-400",
} as const;

function tabLabel(id: string, title: string, langs?: CatalogLanguage[]) {
  if (langs && langs.length === 1 && langs[0] === "python") return "Python";
  return title;
}

export default function EditorPage() {
  const [entries, setEntries] = useState<CatalogEntry[] | null>(null);
  const [langs, setLangs] = useState<Record<string, CatalogLanguage[]>>({});
  const [problem, setProblem] = useState<CatalogProblem | null>(null);
  const [language, setLanguage] = useState<CatalogLanguage>("javascript");
  const [code, setCode] = useState("");
  const [isRunning, setIsRunning] = useState(false);
  const [result, setResult] = useState<JudgeResult | null>(null);
  const [showResults, setShowResults] = useState(false);
  const [runOutput, setRunOutput] = useState<RunOutput | null>(null);
  const [error, setError] = useState<string | null>(null);
  const loadToken = useRef(0);

  async function loadProblem(id: string) {
    const token = ++loadToken.current;
    const p = await fetchCatalogProblem(id);
    if (token !== loadToken.current) return;
    const available = inferLanguages(p);
    setProblem(p);
    setLangs((m) => ({ ...m, [id]: available }));
    setLanguage(available[0]);
    setCode(starterFor(p, available[0]));
    setResult(null);
    setShowResults(false);
    setRunOutput(null);
    setError(null);
  }

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const all = await fetchCatalogIndex();
        if (cancelled) return;
        const live = all.filter((e) => e.live);
        setEntries(live);
        const requested = new URLSearchParams(window.location.search).get("problem");
        const initial = requested && live.some((e) => e.id === requested) ? requested : (live[0]?.id ?? "");
        await loadProblem(initial);
        // Warm language labels for the tab bar (python-only problems render
        // as a "Python" tab, matching the offline milestone's click target).
        for (const e of live) {
          if (e.id === initial || langs[e.id]) continue;
          fetchCatalogProblem(e.id)
            .then((p) =>
              setLangs((m) => ({ ...m, [e.id]: inferLanguages(p) })),
            )
            .catch(() => {});
        }
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : String(err));
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function selectProblem(id: string) {
    setProblem(null);
    setError(null);
    try {
      await loadProblem(id);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    }
  }

  function switchLanguage(lang: CatalogLanguage) {
    if (!problem || lang === language) return;
    setLanguage(lang);
    setCode(starterFor(problem, lang));
    setResult(null);
    setShowResults(false);
    setRunOutput(null);
    setError(null);
  }

  function formatRunText(lang: string, sample: JudgeTestResult): RunOutput {
    const lines: string[] = [];
    lines.push(`$ ${lang} ${sample.input}`);
    if (sample.stdout && sample.stdout.trim()) {
      lines.push(sample.stdout.replace(/\s+$/, ""));
    }
    const isError =
      sample.status === "Compile Error" ||
      sample.status === "Runtime Error" ||
      sample.status === "Time Limit Exceeded";
    if (sample.status === "Accepted") {
      lines.push("result = " + sample.output);
    } else if (sample.status === "Wrong Answer") {
      lines.push("result = " + sample.output);
      lines.push("expected: " + sample.expected);
    } else if (sample.status === "Compile Error") {
      lines.push("compile error: " + sample.output);
    } else if (sample.status === "Time Limit Exceeded") {
      lines.push("time limit exceeded: " + sample.output);
    } else {
      lines.push("runtime error: " + sample.output);
    }
    return { text: lines.join("\n"), isError };
  }

  async function handleRun() {
    if (!problem) return;
    setIsRunning(true);
    setShowResults(false);
    setError(null);
    try {
      const sample = toJudgeTestCases(problem)[0];
      const lang = language === "python" ? "python" : "js";
      const r = await runSingle(language, code, sample, { timeoutMs: 2000 });
      setRunOutput(formatRunText(lang, r));
    } catch (err) {
      setRunOutput({
        text: "run error: " + (err instanceof Error ? err.message : String(err)),
        isError: true,
      });
    } finally {
      setIsRunning(false);
    }
  }

  async function handleSubmit() {
    if (!problem) return;
    setIsRunning(true);
    setShowResults(false);
    setError(null);
    try {
      const testCases = toJudgeTestCases(problem);
      const data =
        language === "python"
          ? await judgePython(code, testCases, { timeoutMs: 2000 })
          : await judgeJavascript(code, testCases, { timeoutMs: 2000 });
      setResult(data);
      setShowResults(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
      setShowResults(true);
    } finally {
      setIsRunning(false);
    }
  }

  if (error && !problem) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-red-500/5 border border-red-500/20 rounded-xl p-6 text-sm text-red-400">
          Judge error: {error}
        </div>
      </div>
    );
  }

  if (!entries || !problem) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-center py-16 text-gray-500">
          <Loader2 className="w-5 h-5 animate-spin mr-2" /> Loading problem…
        </div>
      </div>
    );
  }

  const langsForSelected = langs[problem.id] ?? [language];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 fade-in">
      <div className="flex flex-col gap-3 mb-6">
        <div className="flex flex-wrap items-center gap-3">
          {problem && (
            <span
              className={`px-2 py-0.5 rounded text-xs font-semibold ${diffBadge[problem.difficulty]}`}
            >
              {DIFFICULTY_LABEL[problem.difficulty]}
            </span>
          )}
          <h1 className="text-3xl font-bold">{problem.title}</h1>
          {langsForSelected.length > 1 && (
            <div className="flex items-center gap-1 rounded-lg border border-white/10 p-1">
              {(["javascript", "python"] as const).map((lang) => (
                <button
                  key={lang}
                  onClick={() => switchLanguage(lang)}
                  className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-colors ${
                    lang === language
                      ? "bg-cyan-500/20 text-cyan-300"
                      : "text-gray-400 hover:text-white"
                  }`}
                >
                  {lang === "python" ? "Python" : "JavaScript"}
                </button>
              ))}
            </div>
          )}
        </div>
        <div className="flex items-center gap-1 rounded-lg border border-white/10 p-1 overflow-x-auto whitespace-nowrap">
          {entries.map((entry) => (
            <button
              key={entry.id}
              onClick={() => (entry.id === problem.id ? undefined : selectProblem(entry.id))}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold whitespace-nowrap flex-shrink-0 transition-colors ${
                entry.id === problem.id
                  ? "bg-orange-500 text-white"
                  : "text-gray-400 hover:text-white"
              }`}
            >
              {tabLabel(entry.id, entry.title, langs[entry.id])}
            </button>
          ))}
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <div className="space-y-4">
          <div
            className="border rounded-xl p-5"
            style={{ background: "var(--card)", borderColor: "var(--border)" }}
          >
            <h3 className="font-semibold mb-2 text-lg">Problem Description</h3>
            <p
              className="text-sm leading-relaxed whitespace-pre-line"
              style={{ color: "var(--fg)", opacity: 0.7 }}
            >
              {problem.statement_md}
            </p>
          </div>
          <div
            className="border rounded-xl p-5"
            style={{ background: "var(--card)", borderColor: "var(--border)" }}
          >
            <h3 className="font-semibold mb-2">Concepts</h3>
            <p
              className="text-sm leading-relaxed"
              style={{ color: "var(--fg)", opacity: 0.6 }}
            >
              {problem.concept_md}
            </p>
          </div>
          <CodeEditor
            key={`${problem.id}-${language}`}
            initialCode={code}
            language={language}
            onCodeChange={setCode}
            onRun={handleRun}
            isRunning={isRunning}
            output={runOutput}
          />
          <button
            onClick={handleSubmit}
            disabled={isRunning}
            className="w-full py-3 rounded-lg bg-gradient-to-r from-orange-500 to-cyan-500 text-white font-bold text-lg hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-2 transition-opacity"
          >
            {isRunning ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Play className="w-5 h-5" />
            )}
            {isRunning ? "Running..." : "Submit Solution"}
          </button>
        </div>

        <div className="space-y-6">
          {language === "python" && (
            <div
              className="flex items-center gap-2 text-xs rounded-lg px-3 py-2"
              style={{
                background: "rgba(255,255,255,0.05)",
                border: "1px solid var(--border)",
              }}
            >
              <Loader2 className="w-3.5 h-3.5 animate-spin text-orange-400" />
              <span style={{ color: "var(--fg)", opacity: 0.7 }}>
                Python runs via self-hosted Pyodide (loaded on first Python
                submit, then cached). Works fully offline.
              </span>
            </div>
          )}
          {showResults &&
            (error ? (
              <div className="bg-red-500/5 border border-red-500/20 rounded-xl p-6 text-sm text-red-400">
                Judge error: {error}
              </div>
            ) : (
              result && (
                <ResultPanel
                  passed={result.passed}
                  total={result.total}
                  time={result.time}
                  memory={result.memory}
                  testCases={result.testCases}
                  isLoading={isRunning}
                  hints={problem.hints}
                />
              )
            ))}
        </div>
      </div>
    </div>
  );
}