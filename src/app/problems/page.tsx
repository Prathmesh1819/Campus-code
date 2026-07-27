"use client";

import React, { useState, useEffect } from "react";
import { Navbar } from "@/components/Navbar";
import { Sidebar } from "@/components/Sidebar";
import Link from "next/link";
import {
  Code2,
  Search,
  CheckCircle2,
  ArrowRight,
  Flame,
  Zap,
  Building2,
  Sparkles,
  TrendingUp,
} from "lucide-react";

export default function ProblemsPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [problems, setProblems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedDifficulty, setSelectedDifficulty] = useState("ALL");
  const [selectedCategory, setSelectedCategory] = useState("ALL");
  const [selectedCompany, setSelectedCompany] = useState("ALL");

  useEffect(() => {
    fetchProblems();
  }, [selectedDifficulty, selectedCategory, selectedCompany, search]);

  const fetchProblems = async () => {
    setLoading(true);
    try {
      const query = new URLSearchParams();
      if (selectedDifficulty !== "ALL") query.append("difficulty", selectedDifficulty);
      if (selectedCategory !== "ALL") query.append("category", selectedCategory);
      if (selectedCompany !== "ALL") query.append("company", selectedCompany);
      if (search) query.append("search", search);

      const res = await fetch(`/api/problems?${query.toString()}`);
      const data = await res.json();
      if (data.problems) {
        setProblems(data.problems);
      }
    } catch (err: any) {
      console.error("Failed to fetch problems:", err);
    } finally {
      setLoading(false);
    }
  };

  const categories = [
    "ALL",
    "Arrays",
    "Strings",
    "Linked List",
    "Stack",
    "Trees",
    "Graphs",
    "Dynamic Programming",
    "Searching",
    "Math",
    "SQL",
  ];

  const topCompanies = [
    "ALL",
    "Google",
    "Meta",
    "Amazon",
    "Microsoft",
    "Apple",
    "Netflix",
    "Uber",
    "Adobe",
  ];

  return (
    <div className="min-h-screen flex flex-col bg-[#070913]">
      <Navbar onToggleSidebar={() => setSidebarOpen(!sidebarOpen)} />

      <div className="flex-1 flex max-w-7xl w-full mx-auto">
        <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

        <main className="flex-1 p-4 lg:p-8 space-y-6 overflow-y-auto">
          {/* Header Banner */}
          <div className="rounded-3xl glass-card border border-purple-500/30 p-6 sm:p-8 relative overflow-hidden">
            <div className="flex items-center gap-2 text-xs font-bold text-purple-400 mb-2">
              <Building2 className="w-4 h-4" />
              <span>COMPANY PAST INTERVIEW QUESTIONS & DSA MODULE</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              Company-Wise LeetCode Interview Questions ({problems.length} Problems Available)
            </h1>
            <p className="text-xs sm:text-sm text-gray-400 mt-1 max-w-2xl">
              Practice real technical interview questions asked at Google, Meta, Amazon, Microsoft, Apple, Netflix, Uber, and Adobe sorted by interview frequency.
            </p>
          </div>

          {/* Filter Bar */}
          <div className="rounded-2xl glass-card p-4 border border-slate-800 space-y-4">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              {/* Search Bar */}
              <div className="relative w-full sm:w-80">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search title, topic or company (e.g. Google)..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 focus:border-purple-500 rounded-xl py-2 pl-10 pr-4 text-xs text-white placeholder-gray-500 focus:outline-none"
                />
              </div>

              {/* Difficulty Tabs */}
              <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800 w-full sm:w-auto justify-center">
                {["ALL", "EASY", "MEDIUM", "HARD"].map((diff) => (
                  <button
                    key={diff}
                    onClick={() => setSelectedDifficulty(diff)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                      selectedDifficulty === diff
                        ? "bg-purple-600 text-white shadow-glow"
                        : "text-gray-400 hover:text-gray-200"
                    }`}
                  >
                    {diff}
                  </button>
                ))}
              </div>
            </div>

            {/* Company Filter Pills */}
            <div className="space-y-2 pt-2 border-t border-slate-800/80">
              <div className="flex items-center gap-2">
                <Building2 className="w-3.5 h-3.5 text-cyan-400" />
                <span className="text-xs font-bold text-gray-300">Target Tech Company:</span>
              </div>
              <div className="flex items-center gap-2 overflow-x-auto pb-1">
                {topCompanies.map((comp) => (
                  <button
                    key={comp}
                    onClick={() => setSelectedCompany(comp)}
                    className={`px-3 py-1 rounded-full text-xs font-bold whitespace-nowrap transition-all ${
                      selectedCompany === comp
                        ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/50 shadow-glow-cyan"
                        : "bg-slate-900 text-gray-400 border border-slate-800 hover:border-slate-700"
                    }`}
                  >
                    {comp}
                  </button>
                ))}
              </div>
            </div>

            {/* Category Filter Pills */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1 pt-1 border-t border-slate-800/60">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap transition-all ${
                    selectedCategory === cat
                      ? "bg-purple-500/20 text-purple-300 border border-purple-500/40"
                      : "bg-slate-900/60 text-gray-400 border border-slate-800 hover:border-slate-700"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Problem List Table */}
          <div className="rounded-3xl glass-card border border-slate-800 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-950/80 text-gray-400 border-b border-slate-800 uppercase tracking-wider font-bold">
                  <tr>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4">Title</th>
                    <th className="px-6 py-4">Target Companies</th>
                    <th className="px-6 py-4">Category</th>
                    <th className="px-6 py-4">Difficulty</th>
                    <th className="px-6 py-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {loading ? (
                    <tr>
                      <td colSpan={6} className="text-center py-12 text-gray-500 font-medium">
                        Loading company interview problems...
                      </td>
                    </tr>
                  ) : problems.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="text-center py-12 text-gray-500 font-medium">
                        No company problems found matching criteria.
                      </td>
                    </tr>
                  ) : (
                    problems.map((prob) => {
                      const companyList: string[] = typeof prob.companyTags === "string" ? JSON.parse(prob.companyTags) : prob.companyTags || [];
                      return (
                        <tr key={prob.id} className="hover:bg-slate-800/40 transition-colors group">
                          <td className="px-6 py-4">
                            <CheckCircle2 className="w-4 h-4 text-gray-600 group-hover:text-emerald-400 transition-colors" />
                          </td>
                          <td className="px-6 py-4 font-bold text-white group-hover:text-purple-300 transition-colors">
                            <Link href={`/problems/${prob.id}`}>{prob.title}</Link>
                            <span className="text-[10px] text-amber-400 font-bold ml-2">
                              🔥 {prob.frequency || 95}% Freq
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex flex-wrap gap-1">
                              {companyList.map((comp, i) => (
                                <span key={i} className="px-2 py-0.5 rounded bg-cyan-500/10 border border-cyan-500/20 text-cyan-300 text-[10px] font-bold">
                                  {comp}
                                </span>
                              ))}
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <span className="px-2.5 py-1 rounded-full bg-slate-900 border border-slate-800 text-gray-300 font-semibold text-[11px]">
                              {prob.category}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <span
                              className={`px-2.5 py-1 rounded-full text-[11px] font-extrabold ${
                                prob.difficulty === "EASY"
                                  ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                                  : prob.difficulty === "MEDIUM"
                                  ? "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                                  : "bg-rose-500/10 text-rose-400 border border-rose-500/20"
                              }`}
                            >
                              {prob.difficulty}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <Link
                              href={`/problems/${prob.id}`}
                              className="inline-flex items-center gap-1 px-3.5 py-1.5 rounded-xl gradient-bg text-white font-bold shadow-glow hover:opacity-95 transition-all text-xs"
                            >
                              <span>Solve</span>
                              <ArrowRight className="w-3.5 h-3.5" />
                            </Link>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
