"use client";

import { useState } from "react";
import { Brain, Lightbulb, BookOpen, FileCode, Loader2, ChevronDown } from "lucide-react";

interface HintLevel {
  level: "nudge" | "concept" | "pseudo-code";
  icon: typeof Lightbulb;
  title: string;
}

const hintLevels: HintLevel[] = [
  { level: "nudge", icon: Lightbulb, title: "\ud83d\udca1 Nudge" },
  { level: "concept", icon: BookOpen, title: "\ud83d\udcd6 Concept" },
  { level: "pseudo-code", icon: FileCode, title: "\ud83d\udcdd Pseudo-Code" },
];

const mockHints: Record<string, string[]> = {
  "Two Sum": [
    "Think about what data structure lets you look up values in O(1) time.",
    "A hash map can store numbers you've seen and their indices. For each number, check if the complement (target - num) exists in the map.",
    "1. Create empty map\n2. For each num at index i:\n   a. complement = target - num\n   b. If complement in map, return [map[complement], i]\n   c. Else map[num] = i\n3. Return []",
  ],
};

const defaultHints = [
  "Look at the test cases and think about what patterns emerge.",
    "Consider the time complexity of your current approach. Can you do better than O(n\u00b2)?",
    "1. Think about what the problem is asking\n2. Consider edge cases\n3. Build a solution step by step",
];

export function AIAdviser({ problem, userCode, failingTest, error }: {
  problem: string;
  userCode: string;
  failingTest: string;
  error: string;
}) {
  const [hint, setHint] = useState<string | null>(null);
  const [level, setLevel] = useState(0);
  const [loading, setLoading] = useState(false);

  const hints = mockHints[problem] || defaultHints;

  const getHint = async () => {
    setLoading(true);
    await new Promise((r) => setTimeout(r, 400));
    setHint(hints[level] || hints[hints.length - 1]);
    setLevel((l) => Math.min(l + 1, 2));
    setLoading(false);
  };

  return (
    <div className="border rounded-xl overflow-hidden" style={{ background: "var(--card)", borderColor: "color-mix(in srgb, var(--accent) 10%, transparent)" }}>
      <div className="flex items-center gap-2 px-5 py-3 border-b" style={{ background: "color-mix(in srgb, var(--accent) 5%, transparent)", borderColor: "color-mix(in srgb, var(--accent) 10%, transparent)" }}>
        <Brain className="w-5 h-5" style={{ color: "var(--accent)" }} />
        <h3 className="font-semibold" style={{ color: "var(--accent)" }}>AI Tutor</h3>
      </div>

      <div className="p-5">
        <p className="text-sm mb-4" style={{ color: "var(--fg)", opacity: 0.6 }}>
          Stuck on: <span className="font-medium" style={{ color: "var(--accent)" }}>{problem}</span>
        </p>

        <div className="space-y-2 mb-4">
          {hintLevels.map((h, i) => {
            const Icon = h.icon;
            const isActive = i <= level;
            return (
              <button
                key={h.level}
                onClick={() => { setLevel(i); setHint(null); }}
                disabled={!isActive || loading}
                className={`w-full flex items-center gap-3 p-3 rounded-lg text-left transition-all ${
                  isActive
                    ? "border hover:opacity-80 cursor-pointer"
                    : "border opacity-50 cursor-not-allowed"
                }`}
                style={{
                  background: isActive ? "color-mix(in srgb, var(--accent) 5%, transparent)" : "var(--card)",
                  borderColor: isActive ? "color-mix(in srgb, var(--accent) 20%, transparent)" : "var(--border)",
                }}
              >
                <Icon className="w-4 h-4 flex-shrink-0" style={{ color: "var(--accent)" }} />
                <span className="text-sm font-medium">{h.title}</span>
                {loading && i === level && <Loader2 className="w-4 h-4 animate-spin ml-auto" style={{ color: "var(--accent)" }} />}
              </button>
            );
          })}
        </div>

        <button
          onClick={getHint}
          disabled={loading || level === 0 && hint !== null}
          className="w-full py-3 rounded-lg bg-gradient-to-r from-orange-500 to-cyan-500 text-white font-semibold text-sm hover:opacity-90 disabled:opacity-50 transition-opacity"
        >
          {loading ? "Thinking..." : "Get Hint"}
        </button>

        {hint && (
          <div className="mt-4 p-4 bg-green-500/5 border border-green-500/20 rounded-lg fade-in">
            <div className="flex items-start gap-2">
              <ChevronDown className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" />
              <p className="text-sm text-green-300 leading-relaxed whitespace-pre-wrap">{hint}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
