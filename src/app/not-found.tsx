import Link from "next/link";
import { Code2 } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0a0a0f] px-4">
      <div className="text-center fade-in">
        <Code2 className="w-16 h-16 text-orange-500/30 mx-auto mb-4" />
        <h1 className="text-6xl font-bold gradient-text mb-2">404</h1>
        <p className="text-gray-400 mb-6">Page not found</p>
        <Link href="/" className="px-6 py-3 rounded-lg bg-gradient-to-r from-orange-500 to-cyan-500 text-white font-bold hover:opacity-90 transition-opacity">
          Go Home
        </Link>
      </div>
    </div>
  );
}
