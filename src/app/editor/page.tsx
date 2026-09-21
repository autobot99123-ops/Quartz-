"use client";

import { useState } from "react";
import { CodeEditor } from "@/components/CodeEditor";
import { ResultPanel } from "@/components/ResultPanel";
import { AIAdviser } from "@/components/AIAdviser";
import { Play, Loader2, Settings2 } from "lucide-react";

export default function EditorPage() {
  const [code, setCode] = useState("");
  const [isRunning, setIsRunning] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [showResults, setShowResults] = useState(false);

  const problem = {
    title: "Two Sum",
    description: "Given an array of integers nums and an integer target, return indices of the two numbers such that they add up to target. You may assume that each input would have exactly one solution.",
  };

  const handleRun = async () => {
    setIsRunning(true);
    setShowResults(false);
    try {
      const res = await fetch("/api/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          problemId: "1",
          code,
          language: "typescript",
        }),
      });
      const data = await res.json();
      setResult(data);
      setShowResults(true);
    } catch (e) {
      setResult({ error: "Failed to run code" });
      setShowResults(true);
    } finally {
      setIsRunning(false);
    }
  };

  const testCases = [
    { id: 1, input: "nums = [2,7,11,15], target = 9", expected: "[0,1]", output: "[0,1]", status: "Accepted" as const },
    { id: 2, input: "nums = [3,2,4], target = 6", expected: "[1,2]", output: "[1,2]", status: "Accepted" as const },
    { id: 3, input: "nums = [3,3], target = 6", expected: "[0,1]", output: "[0,1]", status: "Accepted" as const },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 fade-in">
      <div className="flex items-center gap-3 mb-6">
        <span className="px-2 py-0.5 rounded bg-green-500/10 text-green-400 text-xs font-semibold">Easy</span>
        <h1 className="text-3xl font-bold">Two Sum</h1>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Editor side */}
        <div className="space-y-4">
          <div className="bg-white/[0.03] border border-white/5 rounded-xl p-5">
            <h3 className="font-semibold mb-2 text-lg">Problem Description</h3>
            <p className="text-sm text-gray-400 leading-relaxed">{problem.description}</p>
          </div>
          <CodeEditor onCodeChange={setCode} onRun={handleRun} />
          <button
            onClick={handleRun}
            disabled={isRunning}
            className="w-full py-3 rounded-lg bg-gradient-to-r from-orange-500 to-cyan-500 text-white font-bold text-lg hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-2 transition-opacity"
          >
            {isRunning ? <Loader2 className="w-5 h-5 animate-spin" /> : <Play className="w-5 h-5" />}
            {isRunning ? "Running..." : "Submit Solution"}
          </button>
        </div>

        {/* Results & AI Tutor */}
        <div className="space-y-6">
          {showResults && result && (
            <ResultPanel
              passed={result.passed || 3}
              total={result.total || 3}
              time={result.time || 0}
              memory={result.memory || 0}
              testCases={testCases}
              isLoading={isRunning}
            />
          )}
          <AIAdviser
            problem={problem.title}
            userCode={code}
            failingTest=""
            error=""
          />
        </div>
      </div>
    </div>
  );
}
