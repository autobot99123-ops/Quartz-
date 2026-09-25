"use client";

import { useEffect, useState } from "react";
import { CodeEditor } from "@/components/CodeEditor";
import { ResultPanel } from "@/components/ResultPanel";
import { Play, Loader2 } from "lucide-react";
import { judgeJavascript, judgePython } from "@/lib/judge/engine";
import {
  TWO_SUM_PROBLEM,
  VALID_PARENTHESES_PROBLEM,
  MERGE_INTERVALS_PROBLEM,
  LIS_PROBLEM,
  WORD_LADDER_PROBLEM,
  MEDIAN_PROBLEM,
  PYTHON_MAX_PROBLEM,
} from "@/lib/judge/problems";
import type { HardcodedProblem } from "@/lib/judge/problems";
import type { JudgeResult } from "@/lib/judge/types";

const PROBLEMS: { problem: HardcodedProblem; language: "javascript" | "python" }[] = [
  { problem: TWO_SUM_PROBLEM, language: "javascript" },
  { problem: VALID_PARENTHESES_PROBLEM, language: "javascript" },
  { problem: MERGE_INTERVALS_PROBLEM, language: "javascript" },
  { problem: LIS_PROBLEM, language: "javascript" },
  { problem: WORD_LADDER_PROBLEM, language: "javascript" },
  { problem: MEDIAN_PROBLEM, language: "javascript" },
  { problem: PYTHON_MAX_PROBLEM, language: "python" },
];

export default function EditorPage() {
  const [problemIndex, setProblemIndex] = useState(0);
  const { problem, language } = PROBLEMS[problemIndex];
  const [code, setCode] = useState(problem.starterCode);
  const [isRunning, setIsRunning] = useState(false);
  const [result, setResult] = useState<JudgeResult | null>(null);
  const [showResults, setShowResults] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Deep link /editor?problem=<id>: apply the initial selection on mount.
    // The set-state-in-effect ban is a false positive here (one-time initial
    // state derived from the URL, not a cascading render).
    const id = new URLSearchParams(window.location.search).get("problem");
    if (!id) return;
    const index = PROBLEMS.findIndex((entry) => entry.problem.id === id);
    if (index <= 0) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setProblemIndex(index);
    setCode(PROBLEMS[index].problem.starterCode);
    setResult(null);
    setShowResults(false);
    setError(null);
  }, []);

  const selectProblem = (index: number) => {
    setProblemIndex(index);
    setCode(PROBLEMS[index].problem.starterCode);
    setResult(null);
    setShowResults(false);
    setError(null);
  };

  const handleRun = async () => {
    setIsRunning(true);
    setShowResults(false);
    setError(null);
    try {
      const data =
        language === "python"
          ? await judgePython(code, problem.testCases, { timeoutMs: 2000 })
          : await judgeJavascript(code, problem.testCases, { timeoutMs: 2000 });
      setResult(data);
      setShowResults(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
      setShowResults(true);
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 fade-in">
      <div className="flex flex-wrap items-center gap-3 mb-6">
        <span
          className={`px-2 py-0.5 rounded text-xs font-semibold ${
            problem.difficulty === "Easy"
              ? "bg-green-500/10 text-green-400"
              : "bg-yellow-500/10 text-yellow-400"
          }`}
        >
          {problem.difficulty}
        </span>
        <h1 className="text-3xl font-bold">{problem.title}</h1>
        <div className="ml-auto flex items-center gap-1 rounded-lg border border-white/10 p-1 overflow-x-auto whitespace-nowrap">
          {PROBLEMS.map((entry, index) => (
            <button
              key={entry.problem.id}
              onClick={() => selectProblem(index)}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold whitespace-nowrap flex-shrink-0 transition-colors ${
                index === problemIndex
                  ? "bg-orange-500 text-white"
                  : "text-gray-400 hover:text-white"
              }`}
            >
              {entry.language === "python" ? "Python" : entry.problem.title}
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
              className="text-sm leading-relaxed"
              style={{ color: "var(--fg)", opacity: 0.6 }}
            >
              {problem.description}
            </p>
          </div>
          <CodeEditor
            key={problem.id}
            initialCode={problem.starterCode}
            language={language}
            onCodeChange={setCode}
            onRun={handleRun}
          />
          <button
            onClick={handleRun}
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
                />
              )
            ))}
        </div>
      </div>
    </div>
  );
}