export function Footer() {
  return (
    <footer className="border-t border-white/5 bg-[#0a0a0f] py-8 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded bg-gradient-to-br from-orange-500 to-cyan-500 flex items-center justify-center">
              <span className="text-white text-xs font-bold">Q</span>
            </div>
            <span className="text-sm text-gray-500">© 2025 Quartz Judge</span>
          </div>
          <div className="flex items-center gap-4 text-sm text-gray-500">
            <a href="#" className="hover:text-orange-400 transition-colors">Docs</a>
            <a href="#" className="hover:text-orange-400 transition-colors">GitHub</a>
            <a href="#" className="hover:text-orange-400 transition-colors">Discord</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
