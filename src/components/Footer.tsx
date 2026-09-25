export function Footer() {
  return (
    <footer className="border-t py-8 mt-auto" style={{ background: "var(--bg)", borderColor: "var(--border)" }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded bg-gradient-to-br from-orange-500 to-cyan-500 flex items-center justify-center">
              <span className="text-white text-xs font-bold">Q</span>
            </div>
            <span className="text-sm" style={{ color: "var(--fg)", opacity: 0.4 }}>&copy; 2025 Quartz Judge</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
