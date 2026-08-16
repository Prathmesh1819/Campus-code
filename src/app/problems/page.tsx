"use client";

import React, { useState, useEffect } from "react";
import { Navbar } from "@/components/Navbar";
import { Sidebar } from "@/components/Sidebar";
import { useAuth } from "@/context/AuthContext";
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
  Plus,
  X,
  FileCode,
} from "lucide-react";

export default function ProblemsPage() {
  const { user } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [problems, setProblems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedDifficulty, setSelectedDifficulty] = useState("ALL");
  const [selectedCategory, setSelectedCategory] = useState("ALL");
  const [selectedCompany, setSelectedCompany] = useState("ALL");

  // Teacher / Admin Problem Creator Modal state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newDifficulty, setNewDifficulty] = useState("EASY");
  const [newCategory, setNewCategory] = useState("Arrays");
  const [newDescription, setNewDescription] = useState("");
  const [newConstraints, setNewConstraints] = useState("1 <= N <= 10^5");
  const [sampleInput, setSampleInput] = useState("[2, 7, 11, 15], 9");
  const [sampleOutput, setSampleOutput] = useState("[0, 1]");
  const [sampleExplanation, setSampleExplanation] = useState("Because nums[0] + nums[1] == 9, we return [0, 1].");
  const [targetCompaniesStr, setTargetCompaniesStr] = useState("Google, Meta, Amazon");

  const isTeacherOrAdmin = user?.role === "TEACHER" || user?.role === "ADMIN" || user?.role === "SUPER_ADMIN";

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

      const res = await fetch(`/api/problems?${query.toString()}&t=${Date.now()}`, { cache: "no-store" });
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

  const handleCreateProblem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newDescription.trim()) return;

    try {
      const companies = targetCompaniesStr.split(",").map((c) => c.trim()).filter(Boolean);
      const examplesArr = [
        {
          input: sampleInput,
          output: sampleOutput,
          explanation: sampleExplanation,
        },
      ];

      const testCasesArr = [
        {
          input: sampleInput,
          expectedOutput: sampleOutput,
          isHidden: false,
        },
      ];

      const res = await fetch("/api/problems", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: newTitle,
          difficulty: newDifficulty,
          category: newCategory,
          description: newDescription,
          constraints: newConstraints,
          examples: JSON.stringify(examplesArr),
          companyTags: JSON.stringify(companies),
          testCases: testCasesArr,
        }),
      });

      if (res.ok) {
        setShowCreateModal(false);
        setNewTitle("");
        setNewDescription("");
        fetchProblems();
        alert("New Coding Challenge created and published successfully!");
      }
    } catch (err: any) {
      alert("Error creating problem: " + err.message);
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
          <div className="rounded-3xl glass-card border border-purple-500/30 p-6 sm:p-8 relative overflow-hidden flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
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

            {/* Teacher / Admin Action Button */}
            {isTeacherOrAdmin && (
              <button
                onClick={() => setShowCreateModal(true)}
                className="px-5 py-3 rounded-2xl gradient-bg text-white text-xs font-bold shadow-glow hover:opacity-95 transition-all flex items-center gap-2 shrink-0"
              >
                <Plus className="w-4 h-4" />
                <span>Add New Coding Problem</span>
              </button>
            )}
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

      {/* Teacher / Admin Problem Creator Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="relative w-full max-w-2xl glass-card border border-purple-500/40 rounded-3xl p-6 sm:p-8 space-y-4 max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setShowCreateModal(false)}
              className="absolute top-4 right-4 p-2 rounded-xl text-gray-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-xl font-black text-white flex items-center gap-2">
              <FileCode className="w-6 h-6 text-purple-400" /> Post New Coding Problem
            </h3>
            <p className="text-xs text-gray-400">Add custom DSA or SQL questions with starter templates & test cases for students.</p>

            <form onSubmit={handleCreateProblem} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <label className="font-bold text-gray-300 block mb-1">Problem Title</label>
                  <input
                    type="text"
                    required
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    placeholder="e.g. Reverse Words in String"
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl py-2.5 px-3 text-white focus:outline-none focus:border-purple-500"
                  />
                </div>

                <div>
                  <label className="font-bold text-gray-300 block mb-1">Difficulty</label>
                  <select
                    value={newDifficulty}
                    onChange={(e) => setNewDifficulty(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl py-2.5 px-3 text-white focus:outline-none"
                  >
                    <option value="EASY">EASY (+50 XP)</option>
                    <option value="MEDIUM">MEDIUM (+100 XP)</option>
                    <option value="HARD">HARD (+150 XP)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-gray-300 block mb-1">Category / Topic</label>
                  <select
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl py-2.5 px-3 text-white focus:outline-none"
                  >
                    {categories.filter((c) => c !== "ALL").map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="font-bold text-gray-300 block mb-1">Target Companies (Comma-separated)</label>
                  <input
                    type="text"
                    value={targetCompaniesStr}
                    onChange={(e) => setTargetCompaniesStr(e.target.value)}
                    placeholder="Google, Meta, Amazon"
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl py-2.5 px-3 text-white focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-gray-300 block mb-1">Problem Description / Statement</label>
                <textarea
                  rows={4}
                  required
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  placeholder="Given an array of integers..."
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl py-2.5 px-3 text-white focus:outline-none focus:border-purple-500"
                />
              </div>

              <div>
                <label className="font-bold text-gray-300 block mb-1">Constraints</label>
                <input
                  type="text"
                  value={newConstraints}
                  onChange={(e) => setNewConstraints(e.target.value)}
                  placeholder="1 <= N <= 10^5"
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl py-2.5 px-3 text-white focus:outline-none"
                />
              </div>

              {/* Sample Test Case Inputs/Outputs */}
              <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
                <span className="font-bold text-purple-300 uppercase tracking-wider block">Sample Test Case #1</span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-gray-400 block mb-1">Input</label>
                    <input
                      type="text"
                      required
                      value={sampleInput}
                      onChange={(e) => setSampleInput(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2 px-3 text-white font-mono"
                    />
                  </div>
                  <div>
                    <label className="text-gray-400 block mb-1">Expected Output</label>
                    <input
                      type="text"
                      required
                      value={sampleOutput}
                      onChange={(e) => setSampleOutput(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2 px-3 text-white font-mono"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-gray-400 block mb-1">Explanation</label>
                  <input
                    type="text"
                    value={sampleExplanation}
                    onChange={(e) => setSampleExplanation(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2 px-3 text-white"
                  />
                </div>
              </div>

              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 py-3 rounded-xl bg-slate-900 border border-slate-800 text-gray-300 font-bold hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 rounded-xl gradient-bg text-white font-bold shadow-glow hover:opacity-95"
                >
                  Publish Problem
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
