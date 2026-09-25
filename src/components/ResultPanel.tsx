import { useState } from "react";
import { Lightbulb } from "lucide-react";
import type { JudgeTestResult } from "@/lib/judge/types";

type TestCase = JudgeTestResult;

interface ResultPanelProps {
  passed: number;
  total: number;
  time: number;
  memory: number;
  testCases: TestCase[];
  isLoading: boolean;
  hints?: string[];
}

const HINT_LEVELS = ["Nudge", "Concept", "Pseudocode"];

export function ResultPanel({
  passed,
  total,
  time,
  memory,
  testCases,
  isLoading,
  hints,
}: ResultPanelProps) {
  const [revealed, setRevealed] = useState(0);
  const percentage = total > 0 ? Math.round((passed / total) * 100) : 0;

  if (isLoading) {
    return (
      <div className="bg-white/[0.03] border border-white/5 rounded-xl p-6 animate-pulse">
        <div className="h-4 bg-white/10 rounded w-1/3 mb-4"></div>
        <div className="h-32 bg-white/5 rounded"></div>
      </div>
    );
  }

  return (
    <div className="bg-white/[0.03] border border-white/5 rounded-xl p-6 fade-in">
      <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
        Results
        <span className="px-2 py-0.5 rounded text-xs font-bold bg-orange-500/20 text-orange-400">
          {percentage}%
        </span>
      </h3>

      {/* Score bar */}
      <div className="w-full h-3 bg-white/5 rounded-full overflow-hidden mb-4">
        <div
          className="h-full bg-gradient-to-r from-orange-500 to-cyan-500 rounded-full transition-all duration-500"
          style={{ width: `${percentage}%` }}
        />
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-4">
        <div className="text-center p-3 bg-white/5 rounded-lg">
          <div className="text-2xl font-bold text-green-400">{passed}/{total}</div>
          <div className="text-xs text-gray-500">Passed</div>
        </div>
        <div className="text-center p-3 bg-white/5 rounded-lg">
          <div className="text-2xl font-bold text-orange-400">{time}ms</div>
          <div className="text-xs text-gray-500">Time</div>
        </div>
        <div className="text-center p-3 bg-white/5 rounded-lg">
          <div className="text-2xl font-bold text-cyan-400">{memory}KB</div>
          <div className="text-xs text-gray-500">Memory</div>
        </div>
      </div>

      {/* Test cases */}
      <div className="space-y-2 max-h-60 overflow-y-auto mb-4">
        <h4 className="text-sm font-medium text-gray-400">Test Cases</h4>
        {testCases.map((tc) => (
          <div
            key={tc.id}
            className={`p-3 rounded-lg border text-sm ${
              tc.status === "Accepted"
                ? "bg-green-500/5 border-green-500/20"
                : "bg-red-500/5 border-red-500/20"
            }`}
          >
            <div className="flex items-center justify-between mb-1">
              <span className={`font-semibold text-xs ${
                tc.status === "Accepted" ? "text-green-400" : "text-red-400"
              }`}>
                {tc.status}
              </span>
              <span className="text-xs text-gray-500">Test #{tc.id}</span>
            </div>
            <div className="text-xs text-gray-400 space-y-1">
              <div><span className="text-gray-500">Input:</span> <code className="text-gray-300">{tc.input}</code></div>
              <div><span className="text-gray-500">Expected:</span> <code className="text-green-400">{tc.expected}</code></div>
              {tc.status !== "Accepted" && (
                <div><span className="text-gray-500">Got:</span> <code className="text-red-400">{tc.output}</code></div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Hints — one at a time, nudge -> concept -> pseudocode */}
      {hints && hints.length > 0 && (
        <div className="border-t border-white/5 pt-4">
          <h4 className="text-sm font-medium text-gray-400 flex items-center gap-1.5 mb-2">
            <Lightbulb className="w-4 h-4 text-yellow-400" /> Hints
          </h4>
          <div className="flex flex-wrap gap-2 mb-3">
            {HINT_LEVELS.slice(0, hints.length).map((label, idx) => (
              <button
                key={label}
                disabled={idx >= revealed}
                onClick={() => setRevealed(idx + 1)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                  idx < revealed
                    ? "bg-yellow-500/15 text-yellow-400 border border-yellow-500/20"
                    : "bg-white/5 text-gray-500 border border-white/5 disabled:opacity-40"
                }`}
              >
                {idx < revealed ? "✓ " : ""}{label}
              </button>
            ))}
          </div>
          {revealed > 0 && (
            <div className="space-y-2">
              {hints.slice(0, revealed).map((h, idx) => (
                <div
                  key={idx}
                  className="p-3 rounded-lg bg-yellow-500/5 border border-yellow-500/10 text-xs text-gray-300"
                >
                  <span className="text-yellow-400 font-semibold mr-1.5">
                    {HINT_LEVELS[idx]}:
                  </span>
                  {h}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}