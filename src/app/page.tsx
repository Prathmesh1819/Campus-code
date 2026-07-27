"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { AuthModal } from "@/components/AuthModal";
import {
  Code2,
  Trophy,
  Users,
  FolderGit2,
  Sparkles,
  ArrowRight,
  Shield,
  Zap,
  Flame,
  CheckCircle2,
  Terminal,
  Cpu,
  Sun,
  Moon,
  User,
  Github,
  Linkedin,
  LogOut,
  ChevronDown,
  ExternalLink,
  Settings,
} from "lucide-react";

const SARHAD_COLLEGE_LOGO =
  "https://play-lh.googleusercontent.com/wa7ffYAuxK3CPrBHmHPVXRgueD9m7kjWFNB0a4xaCHWqrzKdNumpq_mZN8iQb2bIowERDjYkBTOflnishysXpL8=w240-h480-rw";

export default function HomePage() {
  const { user, isAuthenticated, logout, openAuthModal, closeAuthModal, isAuthModalOpen, authMode } = useAuth();
  const [theme, setTheme] = useState<"dark" | "light">("dark");
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);

  useEffect(() => {
    const savedTheme = localStorage.getItem("campuscode_theme") as "dark" | "light" | null;
    if (savedTheme) {
      setTheme(savedTheme);
      if (savedTheme === "light") {
        document.documentElement.classList.add("light");
      } else {
        document.documentElement.classList.remove("light");
      }
    }
  }, []);

  const toggleTheme = () => {
    const nextTheme = theme === "dark" ? "light" : "dark";
    setTheme(nextTheme);
    localStorage.setItem("campuscode_theme", nextTheme);
    if (nextTheme === "light") {
      document.documentElement.classList.add("light");
    } else {
      document.documentElement.classList.remove("light");
    }
  };

  const profileUsername = user?.name?.toLowerCase().replace(/\s+/g, "") || "aaravsharma";

  return (
    <div className="min-h-screen flex flex-col bg-[#070913] text-white selection:bg-purple-500 selection:text-white">
      {/* Hero Header Nav */}
      <header className="w-full glass-nav px-6 lg:px-12 py-4 flex items-center justify-between z-30 border-b border-slate-800/80">
        <Link href="/" className="flex items-center gap-3 group">
          <img
            src={SARHAD_COLLEGE_LOGO}
            alt="Sarhad College Logo"
            className="w-10 h-10 rounded-2xl object-cover ring-2 ring-purple-500/50 shadow-glow group-hover:scale-105 transition-transform bg-white p-0.5"
          />
          <div className="flex flex-col">
            <span className="text-2xl font-extrabold tracking-tight gradient-text leading-none">
              Campus<span className="text-white">Code</span>
            </span>
            <span className="text-[10px] font-semibold text-purple-400 tracking-wider uppercase mt-0.5">
              Sarhad College Portal
            </span>
          </div>
        </Link>

        <div className="flex items-center gap-3">
          {/* Light / Dark Mode Theme Switcher */}
          <button
            onClick={toggleTheme}
            className="px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 hover:border-purple-500/50 text-gray-300 hover:text-white transition-all text-xs font-bold flex items-center gap-1.5"
          >
            {theme === "dark" ? (
              <>
                <Sun className="w-4 h-4 text-amber-400" />
                <span>Light Mode</span>
              </>
            ) : (
              <>
                <Moon className="w-4 h-4 text-purple-400" />
                <span>Dark Mode</span>
              </>
            )}
          </button>

          {isAuthenticated ? (
            /* Logged In Profile Menu Component */
            <div className="relative">
              <button
                onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                className="flex items-center gap-2.5 p-1.5 rounded-2xl border border-purple-500/40 bg-slate-900 hover:bg-slate-800 transition-all shadow-glow"
              >
                <img
                  src={user?.avatar || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80"}
                  alt={user?.name || "User Avatar"}
                  className="w-8 h-8 rounded-xl object-cover ring-2 ring-purple-500/50"
                />
                <span className="text-xs font-bold text-white hidden sm:inline">{user?.name}</span>
                <ChevronDown className="w-3.5 h-3.5 text-gray-400 pr-1" />
              </button>

              {profileDropdownOpen && (
                <div className="absolute right-0 mt-2 w-64 bg-[#0a0c1a] border border-purple-500/40 rounded-3xl p-2.5 shadow-2xl space-y-1.5 z-[100] animate-in fade-in slide-in-from-top-2 text-left">
                  {/* User Info Header */}
                  <div className="p-3 bg-slate-950 rounded-2xl border border-slate-800 space-y-1">
                    <p className="text-xs font-black text-white truncate">{user?.name}</p>
                    <p className="text-[10px] text-purple-400 truncate font-mono">{user?.email}</p>
                    <div className="flex items-center justify-between text-[10px] text-gray-400 uppercase font-semibold pt-1 border-t border-slate-800/80">
                      <span>Role: {user?.role}</span>
                      <span>{user?.className || "TY BSc CS"}</span>
                    </div>
                  </div>

                  {/* View My Profile */}
                  <Link
                    href={`/profile/${profileUsername}`}
                    onClick={() => setProfileDropdownOpen(false)}
                    className="flex items-center justify-between px-3 py-2.5 text-xs font-bold text-gray-200 hover:text-white hover:bg-purple-600/20 rounded-xl transition-all border border-transparent hover:border-purple-500/30"
                  >
                    <div className="flex items-center gap-2.5">
                      <User className="w-4 h-4 text-purple-400" />
                      <span>View My Profile</span>
                    </div>
                    <ChevronDown className="w-3.5 h-3.5 -rotate-90 text-gray-500" />
                  </Link>

                  {/* GitHub Profile Link */}
                  <a
                    href="https://github.com"
                    target="_blank"
                    rel="noreferrer"
                    onClick={() => setProfileDropdownOpen(false)}
                    className="flex items-center justify-between px-3 py-2.5 text-xs font-bold text-gray-300 hover:text-white hover:bg-slate-800 rounded-xl transition-all"
                  >
                    <div className="flex items-center gap-2.5">
                      <Github className="w-4 h-4 text-gray-300" />
                      <span>GitHub Profile</span>
                    </div>
                    <ExternalLink className="w-3 h-3 text-gray-500" />
                  </a>

                  {/* LinkedIn Profile Link */}
                  <a
                    href="https://linkedin.com"
                    target="_blank"
                    rel="noreferrer"
                    onClick={() => setProfileDropdownOpen(false)}
                    className="flex items-center justify-between px-3 py-2.5 text-xs font-bold text-gray-300 hover:text-white hover:bg-slate-800 rounded-xl transition-all"
                  >
                    <div className="flex items-center gap-2.5">
                      <Linkedin className="w-4 h-4 text-cyan-400" />
                      <span>LinkedIn Profile</span>
                    </div>
                    <ExternalLink className="w-3 h-3 text-gray-500" />
                  </a>

                  {/* Settings */}
                  <Link
                    href="/settings"
                    onClick={() => setProfileDropdownOpen(false)}
                    className="flex items-center gap-2.5 px-3 py-2.5 text-xs font-bold text-gray-300 hover:text-white hover:bg-slate-800 rounded-xl transition-all"
                  >
                    <Settings className="w-4 h-4 text-cyan-400" />
                    <span>Account Settings</span>
                  </Link>

                  {/* Sign Out / Log Out */}
                  <button
                    onClick={() => {
                      setProfileDropdownOpen(false);
                      logout();
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2.5 text-xs font-bold text-rose-400 hover:bg-rose-500/10 rounded-xl transition-all text-left border-t border-slate-800 mt-1"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Sign Out / Log Out</span>
                  </button>
                </div>
              )}
            </div>
          ) : (
            <>
              <button
                onClick={() => openAuthModal("login")}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-gray-300 hover:text-white hover:bg-slate-800 transition-colors"
              >
                Sign In
              </button>
              <button
                onClick={() => openAuthModal("register")}
                className="px-5 py-2.5 rounded-xl text-xs font-bold text-white gradient-bg shadow-glow hover:opacity-95 transition-all"
              >
                Get Started Free
              </button>
            </>
          )}
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative pt-20 pb-16 px-6 lg:px-12 max-w-7xl mx-auto text-center flex flex-col items-center">
        {/* Glow Spheres Background */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-purple-600/20 rounded-full blur-[140px] pointer-events-none -z-10" />

        {/* Pulsating Glowing In/Out Tagline Pill Badge */}
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-purple-500/10 border border-purple-500/40 text-purple-700 dark:text-purple-300 text-xs font-black mb-6 glow-pill">
          <Sparkles className="w-4 h-4 text-purple-600 dark:text-purple-400 animate-spin" />
          <span>Official Sarhad College Platform for Student Programmers</span>
        </div>

        <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black tracking-tight max-w-4xl leading-[1.1]">
          Master Coding. Win Leaderboards. <span className="gradient-text">Launch Your Career.</span>
        </h1>

        <p className="text-gray-400 text-base sm:text-lg max-w-2xl mt-6 leading-relaxed">
          CampusCode transforms college programming at Sarhad College with real-time multi-tier leaderboards, Monaco online editor, project showcase feeds, teacher assignments, and direct peer collaboration.
        </p>

        <div className="flex flex-col sm:flex-row items-center gap-4 mt-8 w-full sm:w-auto">
          {isAuthenticated ? (
            <Link
              href="/dashboard"
              className="w-full sm:w-auto px-8 py-4 rounded-2xl text-sm font-bold text-white gradient-bg shadow-glow hover:scale-105 transition-all flex items-center justify-center gap-2"
            >
              <span>Go to My Dashboard</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          ) : (
            <button
              onClick={() => openAuthModal("register")}
              className="w-full sm:w-auto px-8 py-4 rounded-2xl text-sm font-bold text-white gradient-bg shadow-glow hover:scale-105 transition-all flex items-center justify-center gap-2"
            >
              <span>Join Your College Today</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          )}

          <Link
            href="/dashboard"
            className="w-full sm:w-auto px-8 py-4 rounded-2xl text-sm font-bold text-gray-300 bg-slate-900 border border-slate-800 hover:border-slate-700 transition-all flex items-center justify-center gap-2"
          >
            <Terminal className="w-4 h-4 text-purple-400" />
            <span>Explore Demo Dashboard</span>
          </Link>
        </div>
      </section>

      {/* Feature Highlights Grid */}
      <section className="py-16 px-6 lg:px-12 max-w-7xl mx-auto w-full">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="p-8 rounded-3xl glass-card border border-slate-800 hover:border-purple-500/40 transition-all space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-400">
              <Trophy className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold text-white">Live College Leaderboards</h3>
            <p className="text-sm text-gray-400 leading-relaxed">
              Compete with classmates in real time. Climb batch ranks, earn XP, and showcase your coding consistency.
            </p>
          </div>

          <div className="p-8 rounded-3xl glass-card border border-slate-800 hover:border-purple-500/40 transition-all space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
              <Code2 className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold text-white">Monaco In-Browser IDE</h3>
            <p className="text-sm text-gray-400 leading-relaxed">
              Solve LeetCode-style interview problems across 8 programming languages directly inside VS Code's editor engine.
            </p>
          </div>

          <div className="p-8 rounded-3xl glass-card border border-slate-800 hover:border-purple-500/40 transition-all space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <Users className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold text-white">Virtual Classrooms & Peer Messaging</h3>
            <p className="text-sm text-gray-400 leading-relaxed">
              Access lecture notes, submit course projects, and direct message faculty or classmates with WhatsApp-style read receipts.
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-auto border-t border-slate-800/80 py-8 px-6 text-center text-xs text-gray-500">
        <p>© 2026 Sarhad College of Arts, Commerce and Science • CampusCode Platform • Designed by Team 18</p>
      </footer>

      {/* Auth Modal */}
      <AuthModal isOpen={isAuthModalOpen} onClose={closeAuthModal} defaultMode={authMode} />
    </div>
  );
}
