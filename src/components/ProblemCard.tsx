import Link from "next/link";
import { Clock, Tag, ArrowRight } from "lucide-react";

interface ProblemCardProps {
  id: string;
  title: string;
  difficulty: "Easy" | "Medium" | "Hard";
  acceptance: string;
  category: string;
  description: string;
}

const diffColors = {
  Easy: "bg-green-500/10 text-green-400 border-green-500/20",
  Medium: "bg-orange-500/10 text-orange-400 border-orange-500/20",
  Hard: "bg-red-500/10 text-red-400 border-red-500/20",
};

export function ProblemCard({ id, title, difficulty, acceptance, category, description }: ProblemCardProps) {
  return (
    <Link href={`/problems/${id}`}>
      <div className="group bg-white/[0.03] border border-white/5 rounded-xl p-5 hover:border-orange-500/30 hover:bg-white/[0.06] transition-all duration-300 cursor-pointer">
        <div className="flex items-start justify-between mb-3">
          <span className={`px-2 py-0.5 rounded text-xs font-semibold border ${diffColors[difficulty]}`}>
            {difficulty}
          </span>
          <span className="text-xs text-gray-500 flex items-center gap-1">
            <Tag className="w-3 h-3" /> {category}
          </span>
        </div>
        <h3 className="text-lg font-semibold text-gray-100 group-hover:text-orange-400 transition-colors mb-2">
          {title}
        </h3>
        <p className="text-sm text-gray-400 line-clamp-2 mb-3">{description}</p>
        <div className="flex items-center justify-between text-xs text-gray-500">
          <span className="flex items-center gap-1">
            <Clock className="w-3 h-3" /> {acceptance}% acceptance
          </span>
          <ArrowRight className="w-4 h-4 text-orange-400 group-hover:translate-x-1 transition-transform" />
        </div>
      </div>
    </Link>
  );
}
