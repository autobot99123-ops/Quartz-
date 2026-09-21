"use client";

import { useState } from "react";
import { Brain, Lightbulb, BookOpen, FileCode, Loader2, ChevronDown } from "lucide-react";

interface HintLevel {
  level: "nudge" | "concept" | "pseudo-code";
  icon: typeof Lightbulb;
  title: string;
}

const hintLevels: HintLevel[] = [
  { level: "nudge", icon: Lightbulb, title: "💡 Nudge" },
  { level: "concept", icon: BookOpen, title: "📖 Concept" },
  { level: "pseudo-code", icon: FileCode, title: "📝 Pseudo-Code" },
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

  const getHint = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/ai-adviser", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ problem, userCode, failingTest, error, level }),
      });
      const data = await res.json();
      setHint(data.hint);
      setLevel((l) => Math.min(l + 1, 2));
    } catch (e) {
      setHint("Unable to fetch hint. Try again later.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white/[0.03] border border-orange-500/10 rounded-xl overflow-hidden">
      <div className="flex items-center gap-2 px-5 py-3 bg-orange-500/5 border-b border-orange-500/10">
        <Brain className="w-5 h-5 text-orange-400" />
        <h3 className="font-semibold text-orange-400">AI Tutor</h3>
      </div>

      <div className="p-5">
        <p className="text-sm text-gray-400 mb-4">
          Stuck on: <span className="text-orange-300 font-medium">{problem}</span>
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
                    ? "bg-orange-500/5 border border-orange-500/20 hover:bg-orange-500/10 cursor-pointer"
                    : "bg-white/[0.02] border border-white/5 opacity-50 cursor-not-allowed"
                }`}
              >
                <Icon className="w-4 h-4 text-orange-400 flex-shrink-0" />
                <span className="text-sm font-medium">{h.title}</span>
                {loading && i === level && <Loader2 className="w-4 h-4 animate-spin ml-auto text-orange-400" />}
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
              <p className="text-sm text-green-300 leading-relaxed">{hint}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
