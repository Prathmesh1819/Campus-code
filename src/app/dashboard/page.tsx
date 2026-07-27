"use client";

import React, { useState } from "react";
import { Navbar } from "@/components/Navbar";
import { Sidebar } from "@/components/Sidebar";
import { useAuth } from "@/context/AuthContext";
import Link from "next/link";
import {
  Code2,
  Trophy,
  Flame,
  Zap,
  FolderGit2,
  Users,
  Award,
  Calendar,
  Megaphone,
  ArrowRight,
  CheckCircle2,
  Clock,
  Sparkles,
  TrendingUp,
  ChevronRight,
  Shield,
  BookOpen,
} from "lucide-react";

export default function DashboardPage() {
  const { user } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const stats = [
    { label: "Solved Problems", value: "48 / 150", sub: "12 Easy • 26 Medium • 10 Hard", icon: Code2, color: "from-purple-500 to-indigo-600" },
    { label: "College Rank", value: "#3 in CSE", sub: "Top 1.5% percentile", icon: Trophy, color: "from-amber-400 to-orange-500" },
    { label: "Coding Streak", value: `${user?.streakDays || 14} Days`, sub: "Personal Best: 21 Days", icon: Flame, color: "from-rose-500 to-amber-500" },
    { label: "Projects Uploaded", value: "4 Projects", sub: "1 Hackathon Winner 🏆", icon: FolderGit2, color: "from-cyan-500 to-blue-600" },
  ];

  const dailyChallenges = [
    { title: "Longest Substring Without Repeating Characters", diff: "MEDIUM", cat: "Strings", xp: "+100 XP", id: "longest-substring-without-repeating-characters" },
    { title: "Two Sum Target Pair", diff: "EASY", cat: "Arrays", xp: "+50 XP", id: "two-sum-target-pair" },
  ];

  const upcomingEvents = [
    { title: "National Inter-College Hackathon 2026", date: "Aug 02, 2026", type: "Hackathon", prizes: "$5,000" },
    { title: "Google Cloud & Rust Systems Workshop", date: "Aug 05, 2026", type: "Workshop", host: "CodingClub" },
  ];

  const announcements = [
    { title: "📢 Mid-Term DSA Coding Practical Examination", author: "Dr. Vikramaditya Gupta", date: "Today at 10:00 AM", urgent: true },
    { title: "🎉 CampusCode Hackathon Registrations Now Live!", author: "Admin", date: "Yesterday", urgent: false },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-[#070913] text-gray-100 animated-bg">
      <Navbar onToggleSidebar={() => setSidebarOpen(!sidebarOpen)} />

      <div className="flex-1 flex max-w-7xl w-full mx-auto">
        <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

        <main className="flex-1 p-4 lg:p-8 space-y-8 overflow-y-auto">
          {/* Welcome Card Header */}
          <div className="relative rounded-3xl glass-card border border-purple-500/30 p-6 sm:p-8 overflow-hidden shadow-2xl">
            <div className="absolute top-0 right-0 w-96 h-96 bg-purple-600/10 rounded-full blur-3xl -z-10 pointer-events-none" />
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
              <div className="flex items-center gap-4">
                <img
                  src={user?.avatar || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80"}
                  alt={user?.name || "Student Avatar"}
                  className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl object-cover ring-4 ring-purple-500/30 shadow-glow"
                />
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30">
                      LEVEL {user?.level || 12} CODER
                    </span>
                    <span className="text-xs font-medium text-gray-400">• {user?.className || "Final Year CSE"}</span>
                  </div>
                  <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight mt-1">
                    Welcome back, <span className="gradient-text">{user?.name || "Aarav Sharma"}</span>! 👋
                  </h1>
                  <p className="text-xs sm:text-sm text-gray-400 mt-1">
                    {user?.role === "STUDENT"
                      ? "You have 2 pending daily challenges and 1 upcoming assignment due."
                      : user?.role === "TEACHER"
                      ? "Teacher Portal active. Review student submissions and post assignments."
                      : "Admin Control Center active. Platform metrics operating normally."}
                  </p>
                </div>
              </div>

              {/* Quick Action Button */}
              <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
                <Link
                  href="/problems"
                  className="flex-1 md:flex-initial px-5 py-3 rounded-2xl gradient-bg text-white text-xs font-bold shadow-glow hover:opacity-95 transition-all flex items-center justify-center gap-2"
                >
                  <Code2 className="w-4 h-4" />
                  <span>Start Coding</span>
                </Link>
                <Link
                  href="/projects"
                  className="flex-1 md:flex-initial px-5 py-3 rounded-2xl bg-slate-900 border border-slate-700 text-gray-200 hover:text-white text-xs font-bold transition-all flex items-center justify-center gap-2"
                >
                  <FolderGit2 className="w-4 h-4 text-cyan-400" />
                  <span>Post Project</span>
                </Link>
              </div>
            </div>

            {/* XP & Level Progress Bar */}
            <div className="mt-6 pt-6 border-t border-slate-800/80">
              <div className="flex items-center justify-between text-xs font-semibold mb-2">
                <span className="text-gray-300 flex items-center gap-1.5">
                  <Zap className="w-4 h-4 text-purple-400 fill-purple-400" /> XP Progress: 2,850 / 3,000 XP
                </span>
                <span className="text-purple-400 font-bold">95% to Level 13</span>
              </div>
              <div className="w-full bg-slate-950 h-3 rounded-full overflow-hidden p-0.5 border border-slate-800">
                <div className="bg-gradient-to-r from-purple-500 via-blue-500 to-cyan-400 h-full rounded-full w-[95%] transition-all duration-1000 shadow-glow" />
              </div>
            </div>
          </div>

          {/* Quick Metrics Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {stats.map((item, idx) => {
              const Icon = item.icon;
              return (
                <div
                  key={idx}
                  className="rounded-2xl glass-card glass-card-hover p-5 flex flex-col justify-between border border-slate-800/80"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-gray-400">{item.label}</span>
                    <div className={`p-2.5 rounded-xl bg-gradient-to-br ${item.color} text-white shadow-lg`}>
                      <Icon className="w-4 h-4" />
                    </div>
                  </div>
                  <div className="mt-4">
                    <p className="text-2xl font-black text-white tracking-tight">{item.value}</p>
                    <p className="text-[11px] font-medium text-gray-400 mt-0.5">{item.sub}</p>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Main Dashboard Grid: Daily Challenges & Announcements */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Daily Challenges Column (2 Cols) */}
            <div className="lg:col-span-2 space-y-6">
              {/* Daily Challenges */}
              <div className="rounded-3xl glass-card p-6 border border-slate-800">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-bold text-white flex items-center gap-2">
                      <Sparkles className="w-5 h-5 text-purple-400" /> Today's Daily Challenges
                    </h3>
                    <p className="text-xs text-gray-400">Solve daily problems to boost your campus ranking</p>
                  </div>
                  <Link href="/problems" className="text-xs font-bold text-purple-400 hover:underline flex items-center gap-1">
                    View All <ChevronRight className="w-3.5 h-3.5" />
                  </Link>
                </div>

                <div className="space-y-3">
                  {dailyChallenges.map((prob) => (
                    <div
                      key={prob.id}
                      className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800/80 hover:border-purple-500/40 flex items-center justify-between gap-4 transition-all"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span
                            className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${
                              prob.diff === "EASY"
                                ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                                : "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                            }`}
                          >
                            {prob.diff}
                          </span>
                          <span className="text-[11px] font-medium text-gray-400">• {prob.cat}</span>
                          <span className="text-[10px] font-bold text-purple-300 bg-purple-500/10 px-2 py-0.5 rounded-full">
                            {prob.xp}
                          </span>
                        </div>
                        <h4 className="text-sm font-bold text-white hover:text-purple-300 transition-colors">
                          {prob.title}
                        </h4>
                      </div>

                      <Link
                        href={`/problems/${prob.id}`}
                        className="px-4 py-2 rounded-xl gradient-bg text-white text-xs font-bold shadow-glow hover:opacity-95 transition-all flex items-center gap-1 shrink-0"
                      >
                        <span>Solve</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </Link>
                    </div>
                  ))}
                </div>
              </div>

              {/* Badges Grid Showcase */}
              <div className="rounded-3xl glass-card p-6 border border-slate-800">
                <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                  <Award className="w-5 h-5 text-amber-400" /> Unlocked Badges & Achievements
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  {[
                    { name: "100 Problems", icon: "🏆", desc: "Mastered 100 coding challenges", unlocked: true },
                    { name: "7-Day Streak", icon: "🔥", desc: "Coded 7 days in a row", unlocked: true },
                    { name: "Top Ranker", icon: "⚡", desc: "Top 3 Leaderboard Position", unlocked: true },
                    { name: "Project Creator", icon: "🚀", desc: "Published featured showcase project", unlocked: true },
                  ].map((badge, idx) => (
                    <div
                      key={idx}
                      className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 text-center hover:border-amber-500/30 transition-all group"
                    >
                      <div className="text-3xl mb-2 group-hover:scale-110 transition-transform">{badge.icon}</div>
                      <h4 className="text-xs font-bold text-white">{badge.name}</h4>
                      <p className="text-[10px] text-gray-400 mt-1">{badge.desc}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Sidebar Column: Announcements & Campus Events */}
            <div className="space-y-6">
              {/* Teacher Announcements */}
              <div className="rounded-3xl glass-card p-6 border border-slate-800">
                <h3 className="text-base font-bold text-white mb-4 flex items-center gap-2">
                  <Megaphone className="w-4 h-4 text-purple-400" /> Teacher Announcements
                </h3>
                <div className="space-y-3">
                  {announcements.map((anc, i) => (
                    <div key={i} className="p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800/80 space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-semibold text-purple-400">{anc.author}</span>
                        <span className="text-[10px] text-gray-500">{anc.date}</span>
                      </div>
                      <p className="text-xs font-bold text-gray-200 leading-snug">{anc.title}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Upcoming Events */}
              <div className="rounded-3xl glass-card p-6 border border-slate-800">
                <h3 className="text-base font-bold text-white mb-4 flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-cyan-400" /> Upcoming Campus Events
                </h3>
                <div className="space-y-3">
                  {upcomingEvents.map((ev, i) => (
                    <div key={i} className="p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800/80 space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-300">
                          {ev.type}
                        </span>
                        <span className="text-[10px] font-medium text-gray-400">{ev.date}</span>
                      </div>
                      <p className="text-xs font-bold text-white">{ev.title}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
