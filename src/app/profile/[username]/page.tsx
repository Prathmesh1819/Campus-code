"use client";

import React, { useState, useEffect } from "react";
import { Navbar } from "@/components/Navbar";
import { Sidebar } from "@/components/Sidebar";
import { useAuth } from "@/context/AuthContext";
import {
  User,
  Github,
  Linkedin,
  Globe,
  FileText,
  QrCode,
  Flame,
  Zap,
  Award,
  Trophy,
  Code2,
  FolderGit2,
  Calendar,
  Sparkles,
  Share2,
  X,
  History,
  CheckCircle2,
  XCircle,
  Download,
  Camera,
  Upload,
} from "lucide-react";
import Link from "next/link";

const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export default function ProfilePage({ params }: { params: Promise<{ username: string }> }) {
  const { user: currentUser, updateUserAvatar } = useAuth();
  const [profileUser, setProfileUser] = useState<any>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showQrModal, setShowQrModal] = useState(false);
  const [showAvatarModal, setShowAvatarModal] = useState(false);
  const [customAvatarUrl, setCustomAvatarUrl] = useState("");
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [selectedYear, setSelectedYear] = useState<number>(2026);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProfileData();
  }, []);

  const fetchProfileData = async () => {
    setLoading(true);
    try {
      const resolvedParams = await params;
      const targetParam = resolvedParams.username;

      const res = await fetch(`/api/auth?username=${encodeURIComponent(targetParam)}`);
      const data = await res.json();
      if (data.user) {
        setProfileUser(data.user);
        setCustomAvatarUrl(data.user.avatar || "");
        fetchUserSubmissions(data.user.id);
      } else {
        setProfileUser(currentUser);
        if (currentUser?.id) fetchUserSubmissions(currentUser.id);
      }
    } catch {
      setProfileUser(currentUser);
      if (currentUser?.id) fetchUserSubmissions(currentUser.id);
    } finally {
      setLoading(false);
    }
  };

  const fetchUserSubmissions = async (userId: string) => {
    try {
      const res = await fetch(`/api/submissions?userId=${userId}`);
      const data = await res.json();
      if (data.submissions) setSubmissions(data.submissions);
    } catch {
      setSubmissions([]);
    }
  };

  const isSelfProfile = currentUser?.id === profileUser?.id;

  const handleDeviceFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (typeof reader.result === "string") {
          updateUserAvatar(reader.result);
          setProfileUser((prev: any) => ({ ...prev, avatar: reader.result }));
          setShowAvatarModal(false);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveAvatar = (newUrl: string) => {
    updateUserAvatar(newUrl);
    setProfileUser((prev: any) => ({ ...prev, avatar: newUrl }));
    setShowAvatarModal(false);
  };

  const handleExportHistory = () => {
    const csvContent =
      "data:text/csv;charset=utf-8," +
      ["Problem,Difficulty,Status,Language,ExecutionTimeMs,Date"]
        .concat(
          submissions.map(
            (s) =>
              `"${s.problem?.title || "Problem"}",${s.problem?.difficulty || "EASY"},${s.status},${s.language},${s.executionTimeMs},${new Date(s.createdAt).toLocaleDateString()}`
          )
        )
        .join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `CampusCode_History_${profileUser?.name || "Student"}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Filter submissions strictly for selected year
  const selectedYearSubmissions = submissions.filter((sub) => {
    if (!sub.createdAt) return false;
    const subYear = new Date(sub.createdAt).getFullYear();
    return subYear === selectedYear;
  });

  // Real-Time 365 Days Date Matrix starting from Jan 1st of selected year
  const generateRealCalendarData = () => {
    const countsByDate: Record<string, number> = {};
    selectedYearSubmissions.forEach((sub) => {
      if (sub.createdAt) {
        const dStr = new Date(sub.createdAt).toISOString().split("T")[0];
        countsByDate[dStr] = (countsByDate[dStr] || 0) + 1;
      }
    });

    // Start calendar from Jan 1st of selected year up to 52 weeks
    const startJan = new Date(selectedYear, 0, 1);
    const daysList: { dateStr: string; formattedDate: string; count: number }[] = [];

    for (let i = 0; i < 364; i++) {
      const d = new Date(startJan);
      d.setDate(d.getDate() + i);

      const dateStr = d.toISOString().split("T")[0];
      const formattedDate = d.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      });

      const count = countsByDate[dateStr] || 0;
      daysList.push({ dateStr, formattedDate, count });
    }

    const weeksMatrix: { dateStr: string; formattedDate: string; count: number }[][] = [];
    for (let w = 0; w < 52; w++) {
      const week = daysList.slice(w * 7, (w + 1) * 7);
      weeksMatrix.push(week);
    }

    return weeksMatrix;
  };

  const weeksMatrix = generateRealCalendarData();
  const displayUser = profileUser || currentUser;
  const totalYearContributions = selectedYearSubmissions.length;

  return (
    <div className="min-h-screen flex flex-col bg-[#070913]">
      <Navbar onToggleSidebar={() => setSidebarOpen(!sidebarOpen)} />

      <div className="flex-1 flex max-w-7xl w-full mx-auto">
        <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

        <main className="flex-1 p-4 lg:p-8 space-y-8 overflow-y-auto">
          {/* GitHub-style Profile Banner & Header */}
          <div className="rounded-3xl glass-card border border-purple-500/30 overflow-hidden relative">
            <div className="h-44 w-full bg-gradient-to-r from-purple-900 via-indigo-900 to-slate-950 relative overflow-hidden">
              <div className="absolute inset-0 bg-radial-glow opacity-40" />
            </div>

            <div className="px-6 sm:px-8 pb-6 flex flex-col sm:flex-row items-start sm:items-end justify-between gap-4 -mt-16 sm:-mt-12 relative z-10">
              <div className="flex flex-col sm:flex-row items-start sm:items-end gap-4">
                {/* Profile Picture */}
                <div
                  onClick={() => isSelfProfile && setShowAvatarModal(true)}
                  className={`relative group ${isSelfProfile ? "cursor-pointer" : ""}`}
                  title={isSelfProfile ? "Click to update profile photo" : displayUser?.name}
                >
                  <img
                    src={displayUser?.avatar || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80"}
                    alt={displayUser?.name}
                    className="w-24 h-24 sm:w-28 sm:h-28 rounded-3xl object-cover ring-4 ring-slate-950 shadow-2xl bg-slate-900"
                  />
                  {isSelfProfile && (
                    <div className="absolute inset-0 rounded-3xl bg-black/50 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center transition-opacity text-white text-[10px] font-bold">
                      <Camera className="w-6 h-6 mb-0.5" />
                      <span>Upload</span>
                    </div>
                  )}
                </div>

                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h1 className="text-2xl font-black text-white">{displayUser?.name || "Student Profile"}</h1>
                    <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30 uppercase">
                      {displayUser?.role || "STUDENT"}
                    </span>
                  </div>
                  <p className="text-xs font-semibold text-purple-400">
                    @{displayUser?.name?.toLowerCase().replace(/\s+/g, "")} • {displayUser?.className || "TY BSc CS"}
                  </p>
                  <p className="text-xs text-gray-400 max-w-md">{displayUser?.bio || "Student Programmer at CampusCode"}</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {isSelfProfile && (
                  <button
                    onClick={() => setShowAvatarModal(true)}
                    className="px-4 py-2 rounded-xl bg-purple-500/10 border border-purple-500/30 text-purple-300 text-xs font-bold hover:bg-purple-500/20 flex items-center gap-1.5 transition-all"
                  >
                    <Upload className="w-4 h-4" />
                    <span>Upload Photo</span>
                  </button>
                )}
                <button
                  onClick={() => setShowQrModal(true)}
                  className="px-4 py-2 rounded-xl bg-slate-900 border border-slate-800 text-gray-200 text-xs font-bold hover:text-white flex items-center gap-1.5 transition-all"
                >
                  <QrCode className="w-4 h-4 text-cyan-400" />
                  <span>Share QR</span>
                </button>
                <button
                  onClick={handleExportHistory}
                  className="px-4 py-2 rounded-xl gradient-bg text-white text-xs font-bold shadow-glow hover:opacity-95 flex items-center gap-1.5 transition-all"
                >
                  <Download className="w-4 h-4" />
                  <span>Export History</span>
                </button>
              </div>
            </div>
          </div>

          {/* GitHub-Style Month-Wise Real-Time Contribution Heatmap */}
          <div className="rounded-3xl glass-card border border-slate-800 p-6 space-y-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <h3 className="text-lg font-black text-white tracking-tight flex items-center gap-2">
                <Calendar className="w-5 h-5 text-purple-400" />
                <span>{totalYearContributions} {totalYearContributions === 1 ? "contribution" : "contributions"} in {selectedYear}</span>
              </h3>

              {/* Year Selectors */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setSelectedYear(2026)}
                  className={`px-4 py-2 rounded-xl text-xs font-extrabold transition-all ${
                    selectedYear === 2026
                      ? "gradient-bg text-white shadow-glow"
                      : "bg-slate-900 border border-slate-800 text-gray-400 hover:text-white"
                  }`}
                >
                  2026
                </button>
                <button
                  onClick={() => setSelectedYear(2025)}
                  className={`px-4 py-2 rounded-xl text-xs font-extrabold transition-all ${
                    selectedYear === 2025
                      ? "gradient-bg text-white shadow-glow"
                      : "bg-slate-900 border border-slate-800 text-gray-400 hover:text-white"
                  }`}
                >
                  2025
                </button>
              </div>
            </div>

            {/* Heatmap Main Container */}
            <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800/80 overflow-x-auto space-y-3">
              {/* Top Month Labels Header - Starts from Jan */}
              <div className="flex items-center text-[11px] font-semibold text-gray-400 pl-8 space-x-9 min-w-[700px]">
                {months.map((m, i) => (
                  <span key={i} className="w-8 text-center">{m}</span>
                ))}
              </div>

              {/* Day Labels + 52-Week Matrix Grid */}
              <div className="flex items-start gap-2 min-w-[700px]">
                {/* Left Day Labels */}
                <div className="flex flex-col justify-between text-[10px] font-bold text-gray-500 h-28 pt-1 pr-1 font-mono">
                  <span>Mon</span>
                  <span>Wed</span>
                  <span>Fri</span>
                </div>

                {/* 52-Week Columns */}
                <div className="flex-1 grid grid-flow-col grid-cols-52 gap-1">
                  {weeksMatrix.map((week, wIdx) => (
                    <div key={wIdx} className="flex flex-col gap-1">
                      {week.map((day, dIdx) => (
                        <div
                          key={dIdx}
                          title={
                            day.count > 0
                              ? `${day.count} ${day.count === 1 ? "submission" : "submissions"} on ${day.formattedDate}`
                              : `No submissions on ${day.formattedDate}`
                          }
                          className={`w-3 h-3 rounded-[3px] transition-all hover:scale-125 cursor-pointer ${
                            day.count === 0
                              ? "bg-slate-900/80 border border-slate-800/60"
                              : day.count === 1
                              ? "bg-purple-900/80 border border-purple-700/60"
                              : day.count === 2
                              ? "bg-purple-600 border border-purple-500 shadow-glow"
                              : "bg-cyan-400 border border-cyan-300 shadow-glow-cyan"
                          }`}
                        />
                      ))}
                    </div>
                  ))}
                </div>
              </div>

              {/* Heatmap Footer Legend */}
              <div className="flex items-center justify-between text-[11px] font-medium text-gray-400 pt-2 border-t border-slate-800/60">
                <span className="text-gray-500">Learn how CampusCode counts contributions</span>

                <div className="flex items-center gap-1.5 text-xs">
                  <span className="text-gray-500 text-[10px]">Less</span>
                  <span className="w-3 h-3 rounded-[3px] bg-slate-900/80 border border-slate-800/60" />
                  <span className="w-3 h-3 rounded-[3px] bg-purple-900/80 border border-purple-700/60" />
                  <span className="w-3 h-3 rounded-[3px] bg-purple-600" />
                  <span className="w-3 h-3 rounded-[3px] bg-cyan-400 shadow-glow-cyan" />
                  <span className="text-gray-500 text-[10px]">More</span>
                </div>
              </div>
            </div>
          </div>

          {/* Submissions Table */}
          <div className="rounded-3xl glass-card border border-slate-800 overflow-hidden">
            <div className="p-4 border-b border-slate-800 flex items-center justify-between">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <History className="w-4 h-4 text-purple-400" /> Recent Submissions & Coding History
              </h3>
              <button
                onClick={handleExportHistory}
                className="text-xs font-bold text-purple-400 hover:underline flex items-center gap-1"
              >
                <Download className="w-3.5 h-3.5" /> Export CSV
              </button>
            </div>

            {submissions.length === 0 ? (
              <div className="p-8 text-center text-xs text-gray-500 font-medium">
                No public submission history recorded for {displayUser?.name} yet.
              </div>
            ) : (
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-950/80 text-gray-400 border-b border-slate-800 uppercase tracking-wider font-bold">
                  <tr>
                    <th className="px-6 py-4">Problem</th>
                    <th className="px-6 py-4">Difficulty</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4">Language</th>
                    <th className="px-6 py-4">Runtime</th>
                    <th className="px-6 py-4 text-right">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {submissions.map((sub) => (
                    <tr key={sub.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="px-6 py-4 font-bold text-white">
                        <Link href="/problems" className="hover:text-purple-300">
                          {sub.problem?.title || "Coding Challenge"}
                        </Link>
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold ${
                            sub.problem?.difficulty === "EASY"
                              ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                              : "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                          }`}
                        >
                          {sub.problem?.difficulty || "EASY"}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        {sub.status === "ACCEPTED" ? (
                          <span className="text-emerald-400 font-bold flex items-center gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5" /> ACCEPTED
                          </span>
                        ) : (
                          <span className="text-rose-400 font-bold flex items-center gap-1">
                            <XCircle className="w-3.5 h-3.5" /> {sub.status}
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 font-mono text-purple-300 uppercase text-[11px]">
                        {sub.language}
                      </td>
                      <td className="px-6 py-4 font-mono text-gray-300">
                        {sub.executionTimeMs} ms
                      </td>
                      <td className="px-6 py-4 text-right text-gray-400 font-mono text-[11px]">
                        {new Date(sub.createdAt).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </main>
      </div>

      {/* Device File Upload Avatar Modal */}
      {showAvatarModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="relative w-full max-w-md glass-card border border-purple-500/30 rounded-3xl p-6 space-y-4">
            <button
              onClick={() => setShowAvatarModal(false)}
              className="absolute top-4 right-4 p-2 rounded-xl text-gray-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <Camera className="w-5 h-5 text-purple-400" /> Upload Profile Photo
            </h3>

            <div className="space-y-4 text-xs">
              <div>
                <label className="font-bold text-gray-200 block mb-1">Upload Photo From Device</label>
                <label
                  htmlFor="modal-device-upload"
                  className="w-full py-3 rounded-xl gradient-bg text-white font-bold shadow-glow hover:opacity-95 flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Upload className="w-4 h-4" />
                  <span>Choose File From Laptop / Phone</span>
                </label>
                <input
                  id="modal-device-upload"
                  type="file"
                  accept="image/*"
                  onChange={handleDeviceFileUpload}
                  className="hidden"
                />
              </div>

              <div className="relative flex py-1 items-center">
                <div className="flex-grow border-t border-slate-800" />
                <span className="flex-shrink mx-3 text-gray-500 text-[10px] uppercase font-bold">Or</span>
                <div className="flex-grow border-t border-slate-800" />
              </div>

              <div>
                <label className="font-bold text-gray-300 block mb-1">Paste Image URL</label>
                <input
                  type="url"
                  value={customAvatarUrl}
                  onChange={(e) => setCustomAvatarUrl(e.target.value)}
                  placeholder="Paste URL..."
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl py-2 px-3 text-white focus:outline-none focus:border-purple-500"
                />
              </div>

              <button
                onClick={() => handleSaveAvatar(customAvatarUrl)}
                className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold border border-slate-700"
              >
                Use Image URL
              </button>
            </div>
          </div>
        </div>
      )}

      {/* QR Code Share Modal */}
      {showQrModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="relative w-full max-w-sm glass-card border border-purple-500/30 rounded-3xl p-6 text-center space-y-4">
            <button
              onClick={() => setShowQrModal(false)}
              className="absolute top-4 right-4 p-2 rounded-xl text-gray-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-lg font-bold text-white">Share CampusCode Profile</h3>
            <div className="p-4 bg-white rounded-2xl w-48 h-48 mx-auto flex items-center justify-center shadow-2xl">
              <div className="w-40 h-40 bg-slate-950 rounded-xl p-2 font-mono text-[8px] text-purple-400 break-all overflow-hidden flex flex-col justify-center items-center">
                <QrCode className="w-28 h-28 text-slate-950 bg-white p-2 rounded-lg" />
                <span className="mt-1 text-slate-950 font-bold text-[10px]">@{displayUser?.name}</span>
              </div>
            </div>
            <p className="text-xs text-gray-400">Scan to view GitHub stats & project portfolio</p>
          </div>
        </div>
      )}
    </div>
  );
}
