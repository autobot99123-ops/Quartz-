import Link from "next/link";
import { Code2, FlaskConical, ArrowRight } from "lucide-react";

export default function Home() {
  const features = [
    {
      icon: Code2,
      title: "Code Editor",
      desc: "Full-featured Monaco editor with syntax highlighting, autocomplete, and multi-language support.",
    },
    {
      icon: FlaskConical,
      title: "Instant Judge",
      desc: "Submit your code and get instant verdicts — Accepted, Wrong Answer, TLE, RTE, or Compile Error.",
    },
  ];

  const problems = [
    { id: "1", title: "Two Sum", difficulty: "Easy" as const, acceptance: "52%", category: "Arrays" },
    { id: "2", title: "Valid Parentheses", difficulty: "Easy" as const, acceptance: "48%", category: "Stacks" },
    { id: "3", title: "Merge Intervals", difficulty: "Medium" as const, acceptance: "38%", category: "Sorting" },
    { id: "4", title: "Longest Increasing Subsequence", difficulty: "Medium" as const, acceptance: "32%", category: "DP" },
    { id: "5", title: "Word Ladder", difficulty: "Hard" as const, acceptance: "28%", category: "BFS" },
  ];

  return (
    <div className="grid-bg">
      {/* Hero */}
      <section className="relative overflow-hidden py-24 px-4 sm:px-6 lg:px-8">
        <div className="absolute inset-0 bg-gradient-to-b from-orange-500/5 via-transparent to-transparent pointer-events-none" />
        <div className="relative max-w-5xl mx-auto text-center fade-in">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-orange-500/10 border border-orange-500/20 text-orange-400 text-sm font-medium mb-8">
            <span className="w-2 h-2 rounded-full bg-orange-400 animate-pulse"></span>
            Now in Beta
          </div>
          <h1 className="text-5xl sm:text-7xl font-extrabold tracking-tight mb-6">
            Code. Judge.
            <br />
            <span className="gradient-text">Learn Faster.</span>
          </h1>
          <p className="text-lg text-gray-400 max-w-2xl mx-auto mb-10">
            A LeetCode-style competitive programming platform with in-browser code judging, instant verdicts, and real-time feedback.
          </p>
          <div className="flex items-center justify-center gap-4">
            <Link href="/problems" className="px-8 py-3.5 rounded-xl bg-gradient-to-r from-orange-500 to-cyan-500 text-white font-bold hover:opacity-90 transition-opacity">
              Start Solving →
            </Link>
            <Link href="/editor" className="px-8 py-3.5 rounded-xl border border-white/10 text-gray-300 font-semibold hover:border-orange-500/50 hover:text-white transition-colors">
              Open Editor
            </Link>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <h2 className="text-3xl font-bold text-center mb-12 gradient-text">Everything You Need</h2>
        <div className="grid md:grid-cols-3 gap-6">
          {features.map((f, i) => {
            const Icon = f.icon;
            return (
              <div key={i} className="bg-white/[0.03] border border-white/5 rounded-xl p-6 hover:border-orange-500/30 hover:bg-white/[0.06] transition-all duration-300">
                <div className="w-12 h-12 rounded-lg bg-orange-500/10 flex items-center justify-center mb-4">
                  <Icon className="w-6 h-6 text-orange-400" />
                </div>
                <h3 className="text-xl font-semibold mb-2">{f.title}</h3>
                <p className="text-sm text-gray-400">{f.desc}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* Problems Preview */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-3xl font-bold gradient-text">Featured Problems</h2>
          <Link href="/problems" className="text-orange-400 text-sm font-medium hover:text-orange-300 transition-colors flex items-center gap-1">
            View all <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {problems.map((p) => (
            <div key={p.id} className="bg-white/[0.03] border border-white/5 rounded-xl p-5 hover:border-orange-500/20 transition-all cursor-pointer">
              <div className="flex items-center justify-between mb-3">
                <span className={`px-2 py-0.5 rounded text-xs font-semibold border ${
                  p.difficulty === "Easy" ? "bg-green-500/10 text-green-400 border-green-500/20" :
                  p.difficulty === "Medium" ? "bg-orange-500/10 text-orange-400 border-orange-500/20" :
                  "bg-red-500/10 text-red-400 border-red-500/20"
                }`}>{p.difficulty}</span>
                <span className="text-xs text-gray-500">{p.category}</span>
              </div>
              <h3 className="font-semibold mb-2">{p.title}</h3>
              <div className="text-xs text-gray-500">{p.acceptance}% acceptance</div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center">
        <div className="bg-gradient-to-br from-orange-500/10 to-cyan-500/10 border border-orange-500/10 rounded-2xl p-12 pulse-glow">
          <h2 className="text-3xl font-bold mb-4">Ready to Level Up?</h2>
          <p className="text-gray-400 mb-8">Join developers sharpening their skills — one problem at a time.</p>
          <Link href="/problems" className="px-8 py-3.5 rounded-xl bg-gradient-to-r from-orange-500 to-cyan-500 text-white font-bold hover:opacity-90 transition-opacity">
            Get Started Free
          </Link>
        </div>
      </section>
    </div>
  );
}
