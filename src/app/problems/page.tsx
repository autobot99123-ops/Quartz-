import { ProblemCard } from "@/components/ProblemCard";
import { Search, Zap } from "lucide-react";

const problems = [
  { id: "1", title: "Two Sum", difficulty: "Easy" as const, acceptance: "52%", category: "Arrays", description: "Given an array of integers, return indices of the two numbers that add up to a specific target." },
  { id: "2", title: "Valid Parentheses", difficulty: "Easy" as const, acceptance: "48%", category: "Stacks", description: "Given a string containing just the characters (), {}, and [], determine if the input string is valid." },
  { id: "3", title: "Merge Intervals", difficulty: "Medium" as const, acceptance: "38%", category: "Sorting", description: "Given an array of intervals, merge all overlapping intervals and return an array of the non-overlapping intervals." },
  { id: "4", title: "Longest Increasing Subsequence", difficulty: "Medium" as const, acceptance: "32%", category: "DP", description: "Given an integer array, find the length of the longest strictly increasing subsequence." },
  { id: "5", title: "Word Ladder", difficulty: "Hard" as const, acceptance: "28%", category: "BFS", description: "A transformation sequence from beginWord to endWord uses words from a given dictionary." },
  { id: "6", title: "Median of Two Sorted Arrays", difficulty: "Hard" as const, acceptance: "25%", category: "Binary Search", description: "Given two sorted arrays, return the median of the two sorted arrays." },
];

const categories = ["All", "Arrays", "Stacks", "Sorting", "DP", "BFS", "Binary Search", "Graphs"];

export default function ProblemsPage() {
  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12 fade-in">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold gradient-text">Problems</h1>
          <p className="text-gray-400 mt-1">Practice, judge, improve — one problem at a time.</p>
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <Zap className="w-4 h-4 text-green-400" />
          <span>6 problems total</span>
        </div>
      </div>

      {/* Category filter */}
      <div className="flex flex-wrap gap-2 mb-6">
        {categories.map((cat) => (
          <button
            key={cat}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              cat === "All"
                ? "bg-orange-500/10 text-orange-400 border border-orange-500/20"
                : "bg-white/5 text-gray-400 border border-white/5 hover:border-white/20"
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Search bar */}
      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
        <input
          type="text"
          placeholder="Search problems..."
          className="w-full pl-10 pr-4 py-3 bg-white/5 border border-white/10 rounded-lg text-sm text-gray-200 placeholder-gray-500 focus:outline-none focus:border-orange-500/50 transition-colors"
        />
      </div>

      {/* Problem cards */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {problems.map((p) => (
          <ProblemCard key={p.id} {...p} />
        ))}
      </div>
    </div>
  );
}
