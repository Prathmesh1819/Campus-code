"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
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
  GraduationCap,
  FileText,
  Plus,
  ExternalLink,
} from "lucide-react";

export default function DashboardPage() {
  const { user, isAuthenticated } = useAuth();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [solvedCount, setSolvedCount] = useState(0);
  const [projectsCount, setProjectsCount] = useState(0);
  const [userRank, setUserRank] = useState<number | null>(null);
  const [topRankers, setTopRankers] = useState<any[]>([]);
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [teacherStats, setTeacherStats] = useState({ students: 1, assignments: 0, notes: 0, projects: 0 });

  const isTeacherOrAdmin = user?.role === "TEACHER" || user?.role === "ADMIN";

  useEffect(() => {
    const savedUser = localStorage.getItem("campuscode_user");
    if (!user && !savedUser) {
      router.push("/");
      return;
    }
    if (user?.id) {
      fetchUserDashboardStats();
    }
    fetchLeaderboardPreview();
    fetchRealAnnouncements();
  }, [user?.id, user?.role, user?.className]);

  const fetchUserDashboardStats = async () => {
    if (user?.role === "ADMIN") {
      try {
        const aRes = await fetch("/api/admin");
        const aData = await aRes.json();
        if (aData.stats) {
          setTeacherStats({
            students: aData.stats.totalStudents || 0,
            assignments: aData.stats.totalProblems || 0,
            notes: aData.stats.totalUsers || 0,
            projects: aData.stats.totalProjects || 0,
          });
        }
      } catch {
        setTeacherStats({ students: 0, assignments: 0, notes: 0, projects: 0 });
      }
      return;
    }

    if (user?.role === "TEACHER") {
      try {
        const tRes = await fetch("/api/teacher");
        const tData = await tRes.json();
        if (tData.stats) {
          setTeacherStats({
            students: tData.stats.enrolledStudents || 0,
            assignments: tData.stats.assignmentsPosted || 0,
            notes: tData.stats.notesUploaded || 0,
            projects: tData.stats.classProjects || 0,
          });
        }
      } catch {
        setTeacherStats({ students: 0, assignments: 0, notes: 0, projects: 0 });
      }
      return;
    }

    try {
      const res = await fetch(`/api/submissions?userId=${user?.id}`);
      const data = await res.json();
      if (data.submissions) {
        const accepted = data.submissions.filter((s: any) => s.status === "ACCEPTED");
        setSolvedCount(accepted.length);
      }
    } catch {
      setSolvedCount(user?.xp ? Math.floor(user.xp / 50) : 0);
    }

    try {
      const pRes = await fetch("/api/projects");
      const pData = await pRes.json();
      if (pData.projects) {
        const myProjects = pData.projects.filter((p: any) => p.userId === user?.id);
        setProjectsCount(myProjects.length);
      }
    } catch {
      setProjectsCount(0);
    }
  };

  const fetchLeaderboardPreview = async () => {
    try {
      const res = await fetch("/api/leaderboard");
      const data = await res.json();
      if (data.rankings) {
        setTopRankers(data.rankings.slice(0, 3));
        const myEntry = data.rankings.find((r: any) => r.id === user?.id);
        if (myEntry) setUserRank(myEntry.rank);
      }
    } catch {
      setTopRankers([]);
    }
  };

  const fetchRealAnnouncements = async () => {
    try {
      const cName = user?.className || "TY BSc CS";
      const res = await fetch(`/api/classrooms?className=${encodeURIComponent(cName)}`);
      const data = await res.json();
      if (data.announcements) setAnnouncements(data.announcements);
    } catch {
      setAnnouncements([]);
    }
  };

  const currentXp = user?.xp || 0;
  const currentLevel = user?.level || 1;
  const currentStreak = user?.streakDays || 0;
  const targetXpForNextLevel = currentLevel * 1000;
  const currentLevelXpProgress = currentXp % 1000;
  const xpPercentage = Math.min(100, Math.round((currentLevelXpProgress / 1000) * 100));

  // Dynamic 4 Metrics Cards Grid depending on Student vs Teacher/Admin
  const stats = (user?.role === "ADMIN")
    ? [
        {
          label: "Enrolled Students",
          value: `${teacherStats.students} Students`,
          sub: "Total registered students across CampusCode",
          icon: Users,
          color: "from-purple-500 to-indigo-600",
        },
        {
          label: "Coding Problems",
          value: `${teacherStats.assignments} Active`,
          sub: "Global practice problems pool",
          icon: FileText,
          color: "from-amber-400 to-orange-500",
        },
        {
          label: "Class Projects",
          value: `${teacherStats.projects} Projects`,
          sub: "Global student project submissions",
          icon: FolderGit2,
          color: "from-cyan-500 to-blue-600",
        },
        {
          label: "Platform Users",
          value: `${teacherStats.notes} Accounts`,
          sub: "Registered students, faculty & admins",
          icon: BookOpen,
          color: "from-emerald-500 to-teal-600",
        },
      ]
    : user?.role === "TEACHER"
    ? [
        {
          label: "Enrolled Students",
          value: `${teacherStats.students} Students`,
          sub: "Assigned classroom students",
          icon: Users,
          color: "from-purple-500 to-indigo-600",
        },
        {
          label: "Assignments Posted",
          value: `${teacherStats.assignments} Active`,
          sub: teacherStats.assignments > 0 ? `${teacherStats.assignments} Course Assignments` : "No active assignments",
          icon: FileText,
          color: "from-amber-400 to-orange-500",
        },
        {
          label: "Class Projects",
          value: `${teacherStats.projects} Projects`,
          sub: "Student showcase submissions",
          icon: FolderGit2,
          color: "from-cyan-500 to-blue-600",
        },
        {
          label: "Shared Notes",
          value: `${teacherStats.notes} Files`,
          sub: "Lecture slides & lab notes",
          icon: BookOpen,
          color: "from-emerald-500 to-teal-600",
        },
      ]
    : [
        {
          label: "Solved Problems",
          value: `${solvedCount} / 35`,
          sub: solvedCount > 0 ? `${solvedCount} Problems Mastered` : "No problems solved yet",
          icon: Code2,
          color: "from-purple-500 to-indigo-600",
        },
        {
          label: "College Rank",
          value: userRank ? `#${userRank} in Class` : solvedCount > 0 ? "#1 in Class" : "Unranked",
          sub: userRank === 1 ? "Top 1 Campus Ranker 🏆" : userRank ? `Rank #${userRank} Competitor` : "Solve 1 problem to rank",
          icon: Trophy,
          color: "from-amber-400 to-orange-500",
        },
        {
          label: "Coding Streak",
          value: `${currentStreak} Days`,
          sub: currentStreak > 0 ? `Active ${currentStreak}d Streak` : "Start coding today!",
          icon: Flame,
          color: "from-rose-500 to-amber-500",
        },
        {
          label: "Projects Uploaded",
          value: `${projectsCount} Projects`,
          sub: projectsCount > 0 ? `${projectsCount} Live Applications` : "Upload your first project",
          icon: FolderGit2,
          color: "from-cyan-500 to-blue-600",
        },
      ];

  const dailyChallenges = [
    { title: "Longest Substring Without Repeating Characters", diff: "MEDIUM", cat: "Strings", xp: "+100 XP", id: "longest-substring-without-repeating-characters" },
    { title: "Two Sum Target Pair", diff: "EASY", cat: "Arrays", xp: "+50 XP", id: "two-sum-target-pair" },
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
                  alt={user?.name || "Avatar"}
                  className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl object-cover ring-4 ring-purple-500/30 shadow-glow"
                />
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30 uppercase">
                      {user?.role === "TEACHER"
                        ? "CLASS TEACHER"
                        : user?.role === "ADMIN"
                        ? "SUPER ADMIN"
                        : `LEVEL ${currentLevel} CODER`}
                    </span>
                    {user?.role === "ADMIN" ? (
                      <span className="text-xs font-medium text-purple-300">• Global Administrator</span>
                    ) : (
                      <span className="text-xs font-medium text-gray-400">• {user?.className || "Classroom"}</span>
                    )}
                  </div>
                  <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight mt-1">
                    Welcome back, <span className="gradient-text">{user?.name || "User"}</span>! 👋
                  </h1>
                  <p className="text-xs sm:text-sm text-gray-400 mt-1">
                    {user?.role === "STUDENT"
                      ? "Complete daily coding challenges to earn XP and level up your ranking."
                      : user?.role === "TEACHER"
                      ? "Teacher Portal active. Review student submissions and post assignments."
                      : "Admin Control Center active. Platform metrics operating normally."}
                  </p>
                </div>
              </div>

              {/* Quick Action Buttons */}
              <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
                {isTeacherOrAdmin ? (
                  <>
                    <Link
                      href="/classrooms"
                      className="flex-1 md:flex-initial px-5 py-3 rounded-2xl gradient-bg text-white text-xs font-bold shadow-glow hover:opacity-95 transition-all flex items-center justify-center gap-2"
                    >
                      <BookOpen className="w-4 h-4" />
                      <span>View Classrooms</span>
                    </Link>
                    <Link
                      href="/teacher"
                      className="flex-1 md:flex-initial px-5 py-3 rounded-2xl bg-slate-900 border border-slate-700 text-gray-200 hover:text-white text-xs font-bold transition-all flex items-center justify-center gap-2"
                    >
                      <GraduationCap className="w-4 h-4 text-cyan-400" />
                      <span>Teacher Portal</span>
                    </Link>
                  </>
                ) : (
                  <>
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
                  </>
                )}
              </div>
            </div>

            {/* Real XP & Level Progress Bar - RENDER ONLY FOR STUDENTS */}
            {!isTeacherOrAdmin && (
              <div className="mt-6 pt-6 border-t border-slate-800/80">
                <div className="flex items-center justify-between text-xs font-semibold mb-2">
                  <span className="text-gray-300 flex items-center gap-1.5">
                    <Zap className="w-4 h-4 text-purple-400 fill-purple-400" /> XP Progress: {currentXp} / {targetXpForNextLevel} XP
                  </span>
                  <span className="text-purple-400 font-bold">{xpPercentage}% to Level {currentLevel + 1}</span>
                </div>
                <div className="w-full bg-slate-950 h-3 rounded-full overflow-hidden p-0.5 border border-slate-800">
                  <div
                    style={{ width: `${Math.max(5, xpPercentage)}%` }}
                    className="bg-gradient-to-r from-purple-500 via-blue-500 to-cyan-400 h-full rounded-full transition-all duration-1000 shadow-glow"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Real Quick Metrics Grid */}
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

          {/* Main Dashboard Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Daily Challenges & Top Leaderboard Preview Column (2 Cols) */}
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

              {/* REPLACED BADGES WITH: Top Campus Leaderboard Roster */}
              <div className="rounded-3xl glass-card p-6 border border-slate-800 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-bold text-white flex items-center gap-2">
                      <Trophy className="w-5 h-5 text-amber-400" /> Top Campus Coders Leaderboard
                    </h3>
                    <p className="text-xs text-gray-400">Live student rankings based on solved problems & XP</p>
                  </div>
                  <Link
                    href="/leaderboard"
                    className="text-xs font-bold text-purple-400 hover:underline flex items-center gap-1"
                  >
                    Full Leaderboard <ChevronRight className="w-3.5 h-3.5" />
                  </Link>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {topRankers.length === 0 ? (
                    <div className="col-span-full py-6 text-center text-xs text-gray-500">
                      No active rankers yet. Be the first to solve a problem!
                    </div>
                  ) : (
                    topRankers.map((ranker, i) => (
                      <div
                        key={ranker.id}
                        className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 flex items-center gap-3 relative overflow-hidden group hover:border-purple-500/40 transition-all"
                      >
                        <span
                          className={`w-7 h-7 rounded-xl flex items-center justify-center font-black text-xs shrink-0 ${
                            i === 0
                              ? "bg-amber-500 text-slate-950 shadow-glow"
                              : i === 1
                              ? "bg-slate-300 text-slate-950"
                              : "bg-amber-700/60 text-amber-200"
                          }`}
                        >
                          #{i + 1}
                        </span>

                        <img
                          src={ranker.avatar || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80"}
                          alt={ranker.name}
                          className="w-10 h-10 rounded-xl object-cover ring-2 ring-purple-500/30"
                        />

                        <div className="space-y-0.5 overflow-hidden">
                          <h4 className="text-xs font-bold text-white truncate group-hover:text-purple-300 transition-colors">
                            {ranker.name}
                          </h4>
                          <p className="text-[10px] font-mono text-emerald-400 font-bold">⚡ {ranker.xp} XP</p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>

            {/* Sidebar Column: Real Announcements & Class Operations */}
            <div className="space-y-6">
              {/* Class Announcements */}
              <div className="rounded-3xl glass-card p-6 border border-slate-800 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    <Megaphone className="w-4 h-4 text-purple-400" /> Class Announcements
                  </h3>
                  {isTeacherOrAdmin && (
                    <Link
                      href="/classrooms"
                      className="text-[10px] font-bold text-purple-400 hover:underline flex items-center gap-1"
                    >
                      <Plus className="w-3 h-3" /> Post Notice
                    </Link>
                  )}
                </div>

                <div className="space-y-3">
                  {announcements.length === 0 ? (
                    <div className="p-6 text-center text-xs text-gray-500 font-medium bg-slate-950/60 rounded-2xl border border-slate-800/80">
                      No announcements posted for {user?.className || "TY BSc CS"} yet.
                    </div>
                  ) : (
                    announcements.map((anc, i) => (
                      <div key={i} className="p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800/80 space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-semibold text-purple-400">Class Announcement</span>
                          <span className="text-[10px] text-gray-500">{new Date(anc.createdAt).toLocaleDateString()}</span>
                        </div>
                        <p className="text-xs font-bold text-gray-200 leading-snug">{anc.title}</p>
                        <p className="text-[11px] text-gray-400 leading-relaxed line-clamp-2">{anc.content}</p>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Upcoming Events / Classroom Quick Access */}
              <div className="rounded-3xl glass-card p-6 border border-slate-800 space-y-4">
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-cyan-400" /> Campus Schedule & Events
                </h3>

                <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-2 text-xs">
                  <span className="px-2.5 py-0.5 rounded bg-cyan-500/10 text-cyan-300 border border-cyan-500/20 text-[10px] font-bold uppercase">
                    Academic Term
                  </span>
                  <h4 className="font-bold text-white">Academic Term 2026–27 Active</h4>
                  <p className="text-gray-400 text-[11px] leading-relaxed">
                    Check your virtual classroom for lecture notes, practical code submissions, and class projects.
                  </p>
                  <Link
                    href="/classrooms"
                    className="inline-flex items-center gap-1.5 text-purple-400 font-bold text-xs hover:underline pt-1"
                  >
                    <span>Go to Virtual Classroom</span>
                    <ExternalLink className="w-3 h-3" />
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
