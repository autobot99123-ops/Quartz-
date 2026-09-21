import { User, BookOpen, Trophy, Clock, Calendar } from "lucide-react";

export default function ProfilePage() {
  const stats = [
    { label: "Problems Solved", value: "5", icon: BookOpen, color: "text-green-400" },
    { label: "Contest Rating", value: "1420", icon: Trophy, color: "text-orange-400" },
    { label: "Total Submissions", value: "23", icon: Clock, color: "text-cyan-400" },
    { label: "Member Since", value: "Jan 2025", icon: Calendar, color: "text-purple-400" },
  ];

  const recentSubmissions = [
    { problem: "Two Sum", status: "Accepted", time: "2ms", date: "2025-01-20" },
    { problem: "Valid Parentheses", status: "Wrong Answer", time: "5ms", date: "2025-01-19" },
    { problem: "Merge Intervals", status: "Accepted", time: "3ms", date: "2025-01-18" },
  ];

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12 fade-in">
      <div className="flex items-center gap-3 mb-8">
        <User className="w-8 h-8 text-orange-400" />
        <h1 className="text-3xl font-bold gradient-text">Profile</h1>
      </div>

      {/* Profile header */}
      <div className="bg-gradient-to-r from-orange-500/10 to-cyan-500/10 border border-orange-500/10 rounded-xl p-8 mb-8">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-orange-500 to-cyan-500 flex items-center justify-center text-white text-2xl font-bold">
            P
          </div>
          <div>
            <h2 className="text-2xl font-bold">Pavan NRI Clg</h2>
            <p className="text-gray-400 text-sm">autobot99123@gmwil.com</p>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {stats.map((s, i) => {
          const Icon = s.icon;
          return (
            <div key={i} className="bg-white/[0.03] border border-white/5 rounded-xl p-5 text-center">
              <Icon className={`w-6 h-6 ${s.color} mx-auto mb-2`} />
              <div className="text-2xl font-bold">{s.value}</div>
              <div className="text-xs text-gray-500">{s.label}</div>
            </div>
          );
        })}
      </div>

      {/* Recent */}
      <div className="bg-white/[0.03] border border-white/5 rounded-xl p-6">
        <h3 className="font-semibold mb-4">Recent Submissions</h3>
        <div className="space-y-3">
          {recentSubmissions.map((sub, i) => (
            <div key={i} className="flex items-center justify-between p-3 bg-white/[0.02] rounded-lg">
              <div>
                <span className="font-medium">{sub.problem}</span>
                <span className="text-xs text-gray-500 ml-2">{sub.date}</span>
              </div>
              <div className="flex items-center gap-3">
                <span className={`px-2 py-0.5 rounded text-xs ${
                  sub.status === "Accepted" ? "bg-green-500/10 text-green-400" : "bg-red-500/10 text-red-400"
                }`}>
                  {sub.status}
                </span>
                <span className="text-xs text-gray-500">{sub.time}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
