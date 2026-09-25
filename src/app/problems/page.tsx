"use client";

import { useEffect, useMemo, useState } from "react";
import { ProblemCard } from "@/components/ProblemCard";
import { Search, Zap, Loader2 } from "lucide-react";
import {
  fetchCatalogIndex,
  DIFFICULTY_LABEL,
  type CatalogDifficulty,
  type CatalogEntry,
} from "@/lib/catalog";

const DIFF_RANK: Record<CatalogDifficulty, number> = {
  easy: 0,
  medium: 1,
  hard: 2,
};

export default function ProblemsPage() {
  const [entries, setEntries] = useState<CatalogEntry[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pattern, setPattern] = useState("All");
  const [difficulty, setDifficulty] = useState<"All" | CatalogDifficulty>("All");
  const [query, setQuery] = useState("");

  useEffect(() => {
    fetchCatalogIndex()
      .then((all) => setEntries(all.filter((e) => e.live)))
      .catch((err) => setError(err instanceof Error ? err.message : String(err)));
  }, []);

  const patterns = useMemo(() => {
    const set = new Set((entries ?? []).map((e) => e.pattern));
    return ["All", ...[...set].sort()];
  }, [entries]);

  const filtered = useMemo(() => {
    const list = (entries ?? []).filter((e) => {
      if (pattern !== "All" && e.pattern !== pattern) return false;
      if (difficulty !== "All" && e.difficulty !== difficulty) return false;
      const q = query.trim().toLowerCase();
      if (q && !`${e.title} ${e.pattern}`.toLowerCase().includes(q)) return false;
      return true;
    });
    return list.sort(
      (a, b) => DIFF_RANK[a.difficulty] - DIFF_RANK[b.difficulty] || a.title.localeCompare(b.title),
    );
  }, [entries, pattern, difficulty, query]);

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12 fade-in">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold gradient-text">Problems</h1>
          <p className="text-gray-400 mt-1">Practice, judge, improve — one problem at a time.</p>
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <Zap className="w-4 h-4 text-green-400" />
          <span>{entries ? `${entries.length} problems available` : ""}</span>
        </div>
      </div>

      {/* Pattern filter */}
      {entries && (
        <div className="flex flex-wrap gap-2 mb-4">
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
        </div>
      )}

      {/* Difficulty filter */}
      <div className="flex flex-wrap gap-2 mb-6">
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
            {d === "All" ? "All difficulties" : DIFFICULTY_LABEL[d]}
          </button>
        ))}
      </div>

      {/* Search bar */}
      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search problems..."
          className="w-full pl-10 pr-4 py-3 bg-white/5 border border-white/10 rounded-lg text-sm text-gray-200 placeholder-gray-500 focus:outline-none focus:border-orange-500/50 transition-colors"
        />
      </div>

      {error ? (
        <div className="text-sm text-red-400 bg-red-500/5 border border-red-500/20 rounded-xl p-6">
          Could not load the catalog: {error}
        </div>
      ) : !entries ? (
        <div className="flex items-center justify-center py-16 text-gray-500">
          <Loader2 className="w-5 h-5 animate-spin mr-2" /> Loading problems…
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-gray-500">No problems match the current filters.</div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((p) => (
            <ProblemCard
              key={p.id}
              id={p.id}
              title={p.title}
              difficulty={DIFFICULTY_LABEL[p.difficulty]}
              pattern={p.pattern}
            />
          ))}
        </div>
      )}
    </div>
  );
}