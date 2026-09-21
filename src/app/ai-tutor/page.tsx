import { Brain, BookOpen, FileCode, MessageSquare } from "lucide-react";
import { AIAdviser } from "@/components/AIAdviser";

export default function AITutorPage() {
  const problem = "Two Sum";
  const code = `function solution(nums: number[], target: number): number[] {\n    return [];\n}`;

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12 fade-in">
      <div className="flex items-center gap-3 mb-2">
        <Brain className="w-8 h-8 text-orange-400" />
        <h1 className="text-3xl font-bold gradient-text">AI Tutor</h1>
      </div>
      <p className="text-gray-400 mb-8">
        Stuck on a problem? Our AI tutor gives you hints — not answers. Nudge → Concept → Pseudo-Code.
      </p>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white/[0.03] border border-white/5 rounded-xl p-6">
            <h3 className="font-semibold text-lg mb-3">How it works</h3>
            <div className="space-y-4">
              {[
                { icon: Lightbulb, title: "💡 Nudge", desc: "A subtle hint to get you thinking in the right direction." },
                { icon: BookOpen, title: "📖 Concept", desc: "The underlying algorithm or data structure you need." },
                { icon: FileCode, title: "📝 Pseudo-Code", desc: "A step-by-step outline to guide your implementation." },
              ].map((step, i) => {
                const Icon = step.icon;
                return (
                  <div key={i} className="flex gap-4 p-4 bg-white/[0.02] rounded-lg border border-white/5">
                    <div className="w-10 h-10 rounded-lg bg-orange-500/10 flex items-center justify-center flex-shrink-0">
                      <Icon className="w-5 h-5 text-orange-400" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-sm mb-1">{step.title}</h4>
                      <p className="text-sm text-gray-400">{step.desc}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <div>
          <div className="bg-white/[0.03] border border-white/5 rounded-xl p-6 mb-6">
            <h4 className="font-semibold mb-3">Quick Start</h4>
            <div className="space-y-3 text-sm">
              <div className="flex items-center gap-3 p-3 bg-white/5 rounded-lg">
                <div className="w-8 h-8 rounded bg-orange-500/10 flex items-center justify-center text-orange-400 font-bold text-xs">1</div>
                <span>Select a problem</span>
              </div>
              <div className="flex items-center gap-3 p-3 bg-white/5 rounded-lg">
                <div className="w-8 h-8 rounded bg-orange-500/10 flex items-center justify-center text-orange-400 font-bold text-xs">2</div>
                <span>Write your code</span>
              </div>
              <div className="flex items-center gap-3 p-3 bg-white/5 rounded-lg">
                <div className="w-8 h-8 rounded bg-orange-500/10 flex items-center justify-center text-orange-400 font-bold text-xs">3</div>
                <span>Ask for hints</span>
              </div>
            </div>
          </div>

          <div className="bg-white/[0.03] border border-white/5 rounded-xl p-6">
            <h4 className="font-semibold mb-3">Try Now</h4>
            <AIAdviser problem={problem} userCode={code} failingTest="" error="" />
          </div>
        </div>
      </div>
    </div>
  );
}

function Lightbulb({ className }: { className: string }) {
  return <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 18h6M10 22h4M12 2a7 7 0 00-4 12.7V17h8v-2.3A7 7 0 0012 2z"/></svg>;
}
