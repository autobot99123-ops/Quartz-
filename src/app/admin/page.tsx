import { Shield, Upload, Database, Settings, UserPlus, List } from "lucide-react";

export default function AdminPage() {
  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12 fade-in">
      <div className="flex items-center gap-3 mb-8">
        <Shield className="w-8 h-8 text-orange-400" />
        <h1 className="text-3xl font-bold gradient-text">Admin Panel</h1>
      </div>

      <div className="grid md:grid-cols-2 gap-6 mb-8">
        {[
          { icon: Upload, title: "Upload Problems", desc: "Add new problems via JSON/CSV. Define statements, starter code, test cases, and limits." },
          { icon: Database, title: "Test Cases", desc: "Manage test case databases. Ensure reference solutions pass all tests before publishing." },
          { icon: UserPlus, title: "Manage Users", desc: "View registered users, toggle roles, and manage access levels." },
          { icon: Settings, title: "Judge Config", desc: "Configure Judge0, Redis queues, time/memory limits, and language runtimes." },
        ].map((item, i) => {
          const Icon = item.icon;
          return (
            <div key={i} className="bg-white/[0.03] border border-white/5 rounded-xl p-6 hover:border-orange-500/20 transition-all cursor-pointer">
              <div className="w-12 h-12 rounded-lg bg-orange-500/10 flex items-center justify-center mb-4">
                <Icon className="w-6 h-6 text-orange-400" />
              </div>
              <h3 className="font-semibold mb-2">{item.title}</h3>
              <p className="text-sm text-gray-400">{item.desc}</p>
            </div>
          );
        })}
      </div>

      <div className="bg-white/[0.03] border border-white/5 rounded-xl p-6">
        <h3 className="font-semibold mb-4 flex items-center gap-2">
          <List className="w-5 h-5" /> Recent Submissions
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/5">
                <th className="text-left py-3 px-4 text-gray-400 font-medium">User</th>
                <th className="text-left py-3 px-4 text-gray-400 font-medium">Problem</th>
                <th className="text-left py-3 px-4 text-gray-400 font-medium">Status</th>
                <th className="text-left py-3 px-4 text-gray-400 font-medium">Score</th>
                <th className="text-left py-3 px-4 text-gray-400 font-medium">Time</th>
              </tr>
            </thead>
            <tbody>
              {[
                { user: "alice", problem: "Two Sum", status: "Accepted", score: "100%", time: "2ms" },
                { user: "bob", problem: "Valid Parentheses", status: "Wrong Answer", score: "66%", time: "5ms" },
                { user: "carol", problem: "Merge Intervals", status: "Accepted", score: "100%", time: "3ms" },
              ].map((row, i) => (
                <tr key={i} className="border-b border-white/5 hover:bg-white/[0.02]">
                  <td className="py-3 px-4">{row.user}</td>
                  <td className="py-3 px-4">{row.problem}</td>
                  <td className="py-3 px-4">
                    <span className={`px-2 py-0.5 rounded text-xs ${
                      row.status === "Accepted" ? "bg-green-500/10 text-green-400" : "bg-red-500/10 text-red-400"
                    }`}>
                      {row.status}
                    </span>
                  </td>
                  <td className="py-3 px-4">{row.score}</td>
                  <td className="py-3 px-4">{row.time}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
