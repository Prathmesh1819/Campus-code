"use client";

import React, { useState, useEffect } from "react";
import { Navbar } from "@/components/Navbar";
import { Sidebar } from "@/components/Sidebar";
import Link from "next/link";
import { subscribeToLeaderboardRealtime } from "@/lib/supabase/client";
import {
  Trophy,
  Crown,
  Sparkles,
  Flame,
  Zap,
  TrendingUp,
  TrendingDown,
  Minus,
  Filter,
  Medal,
  Award,
  Search,
} from "lucide-react";

export default function LeaderboardPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [scope, setScope] = useState<"GLOBAL" | "COLLEGE" | "DEPARTMENT" | "CLASS">("GLOBAL");
  const [period, setPeriod] = useState<"WEEKLY" | "MONTHLY" | "ALL_TIME">("ALL_TIME");
  const [rankings, setRankings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLeaderboard();

    // Enable Supabase Realtime for Leaderboard
    const unsubscribe = subscribeToLeaderboardRealtime(() => {
      fetchLeaderboard();
    });

    return () => {
      unsubscribe();
    };
  }, [scope, period]);

  const fetchLeaderboard = async () => {
    try {
      const res = await fetch(`/api/leaderboard?scope=${scope}&period=${period}`);
      const data = await res.json();
      if (data.rankings) setRankings(data.rankings);
    } catch {
      setRankings([]);
    } finally {
      setLoading(false);
    }
  };

  const top3 = rankings.slice(0, 3);
  const remainingRankings = rankings.slice(3);

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar onToggleSidebar={() => setSidebarOpen(!sidebarOpen)} />

      <div className="flex-1 flex max-w-7xl w-full mx-auto">
        <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

        <main className="flex-1 p-4 lg:p-8 space-y-8 overflow-y-auto">
          {/* Header Banner */}
          <div className="rounded-3xl glass-card border border-purple-500/30 p-6 sm:p-8 relative overflow-hidden text-center sm:text-left">
            <div className="absolute top-0 right-0 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl -z-10" />
            <div className="flex items-center justify-center sm:justify-start gap-2 text-xs font-bold text-amber-400 mb-2">
              <Trophy className="w-4 h-4" />
              <span>COLLEGE CODING LEADERBOARD</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
              Campus Rankings & Top Coders
            </h1>
            <p className="text-xs sm:text-sm text-gray-400 mt-1 max-w-2xl">
              Earn XP by solving daily challenges, submitting clean solutions, and publishing projects to top your college leaderboard.
            </p>
          </div>

          {/* Scope & Period Filter Controls */}
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 glass-card p-4 rounded-2xl border border-slate-800">
            {/* Scope Filter Tabs */}
            <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800 w-full md:w-auto overflow-x-auto">
              {(["GLOBAL", "COLLEGE", "DEPARTMENT", "CLASS"] as const).map((s) => (
                <button
                  key={s}
                  onClick={() => setScope(s)}
                  className={`px-4 py-2 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
                    scope === s
                      ? "bg-purple-600 text-white shadow-glow"
                      : "text-gray-400 hover:text-gray-200"
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>

            {/* Period Filter Tabs */}
            <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800 w-full md:w-auto overflow-x-auto">
              {(["WEEKLY", "MONTHLY", "ALL_TIME"] as const).map((p) => (
                <button
                  key={p}
                  onClick={() => setPeriod(p)}
                  className={`px-4 py-2 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
                    period === p
                      ? "bg-cyan-600 text-white shadow-glow-cyan"
                      : "text-gray-400 hover:text-gray-200"
                  }`}
                >
                  {p.replace("_", " ")}
                </button>
              ))}
            </div>
          </div>

          {/* Top 3 Podium Cards */}
          {top3.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4">
              {/* Rank 2 - Silver */}
              {top3[1] && (
                <div className="rounded-3xl glass-card p-6 border border-slate-700/80 text-center relative overflow-hidden hover:border-slate-500 transition-all transform md:translate-y-4">
                  <div className="w-10 h-10 rounded-full bg-slate-700 text-slate-200 font-extrabold text-sm flex items-center justify-center mx-auto mb-3 shadow-lg">
                    2nd
                  </div>
                  <img
                    src={top3[1].avatar}
                    alt={top3[1].name}
                    className="w-20 h-20 rounded-2xl object-cover mx-auto ring-4 ring-slate-500/40 shadow-xl mb-3"
                  />
                  <h3 className="text-base font-bold text-white">{top3[1].name}</h3>
                  <p className="text-xs text-gray-400">{top3[1].branch || "Computer Science"}</p>
                  <div className="mt-4 flex items-center justify-center gap-2">
                    <span className="px-3 py-1 rounded-full bg-purple-500/10 text-purple-300 text-xs font-bold border border-purple-500/20">
                      ⚡ {top3[1].xp} XP
                    </span>
                  </div>
                </div>
              )}

              {/* Rank 1 - Gold Champion */}
              {top3[0] && (
                <div className="rounded-3xl glass-card p-6 border border-amber-500/50 text-center relative overflow-hidden shadow-glow hover:border-amber-400 transition-all bg-gradient-to-b from-amber-950/30 to-slate-900">
                  <div className="absolute top-2 right-2">
                    <Crown className="w-6 h-6 text-amber-400 fill-amber-400 animate-bounce" />
                  </div>
                  <div className="w-12 h-12 rounded-full bg-gradient-to-r from-amber-400 to-yellow-500 text-slate-950 font-black text-lg flex items-center justify-center mx-auto mb-3 shadow-glow">
                    1st
                  </div>
                  <img
                    src={top3[0].avatar}
                    alt={top3[0].name}
                    className="w-24 h-24 rounded-2xl object-cover mx-auto ring-4 ring-amber-400/60 shadow-2xl mb-3"
                  />
                  <h3 className="text-lg font-black text-white">{top3[0].name}</h3>
                  <p className="text-xs text-gray-400">{top3[0].branch || "Computer Science"}</p>
                  <div className="mt-4 flex items-center justify-center gap-2">
                    <span className="px-4 py-1.5 rounded-full bg-amber-500/20 text-amber-300 text-xs font-black border border-amber-500/40 shadow-glow">
                      ⚡ {top3[0].xp} XP
                    </span>
                  </div>
                </div>
              )}

              {/* Rank 3 - Bronze */}
              {top3[2] && (
                <div className="rounded-3xl glass-card p-6 border border-amber-900/50 text-center relative overflow-hidden hover:border-amber-700/80 transition-all transform md:translate-y-8">
                  <div className="w-10 h-10 rounded-full bg-amber-900/80 text-amber-200 font-extrabold text-sm flex items-center justify-center mx-auto mb-3 shadow-lg">
                    3rd
                  </div>
                  <img
                    src={top3[2].avatar}
                    alt={top3[2].name}
                    className="w-20 h-20 rounded-2xl object-cover mx-auto ring-4 ring-amber-800/40 shadow-xl mb-3"
                  />
                  <h3 className="text-base font-bold text-white">{top3[2].name}</h3>
                  <p className="text-xs text-gray-400">{top3[2].branch || "Electronics"}</p>
                  <div className="mt-4 flex items-center justify-center gap-2">
                    <span className="px-3 py-1 rounded-full bg-purple-500/10 text-purple-300 text-xs font-bold border border-purple-500/20">
                      ⚡ {top3[2].xp} XP
                    </span>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Full Leaderboard Rankings Table */}
          <div className="rounded-3xl glass-card border border-slate-800 overflow-hidden">
            <div className="p-4 border-b border-slate-800 flex items-center justify-between">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Medal className="w-4 h-4 text-purple-400" /> Complete Student Rankings
              </h3>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-950/80 text-gray-400 border-b border-slate-800 uppercase tracking-wider font-bold">
                  <tr>
                    <th className="px-6 py-4">Rank</th>
                    <th className="px-6 py-4">Student</th>
                    <th className="px-6 py-4">Class & Branch</th>
                    <th className="px-6 py-4">Streak</th>
                    <th className="px-6 py-4">XP Points</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {rankings.map((user) => (
                    <tr key={user.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2 font-bold text-white">
                          <span className="w-6 text-center">{user.rank}</span>
                          {user.rankChange > 0 ? (
                            <span className="text-emerald-400 flex items-center text-[10px]">
                              <TrendingUp className="w-3 h-3" /> +{user.rankChange}
                            </span>
                          ) : user.rankChange < 0 ? (
                            <span className="text-rose-400 flex items-center text-[10px]">
                              <TrendingDown className="w-3 h-3" /> {user.rankChange}
                            </span>
                          ) : (
                            <span className="text-gray-500 text-[10px]">
                              <Minus className="w-3 h-3" />
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <img
                            src={user.avatar}
                            alt={user.name}
                            className="w-9 h-9 rounded-xl object-cover ring-2 ring-purple-500/30"
                          />
                          <div>
                            <p className="font-bold text-white">{user.name}</p>
                            <p className="text-[10px] text-gray-400">{user.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-gray-300">
                        <p className="font-semibold">{user.className || "Final Year CSE"}</p>
                        <p className="text-[10px] text-gray-500">{user.branch || "Computer Science"}</p>
                      </td>
                      <td className="px-6 py-4">
                        <span className="px-2.5 py-1 rounded-full bg-amber-500/10 text-amber-400 font-bold text-[11px] border border-amber-500/20 flex items-center gap-1 w-fit">
                          <Flame className="w-3 h-3 fill-amber-500" /> {user.streakDays || 7} Days
                        </span>
                      </td>
                      <td className="px-6 py-4 font-black text-purple-300">
                        ⚡ {user.xp} XP
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
