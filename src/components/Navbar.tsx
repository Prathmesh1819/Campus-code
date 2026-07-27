"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { AuthModal } from "@/components/AuthModal";
import {
  Code2,
  Search,
  Flame,
  Zap,
  Bell,
  User,
  LogOut,
  Settings,
  ChevronDown,
  Menu,
  ShieldCheck,
  GraduationCap,
  Sparkles,
  Sun,
  Moon,
  Github,
  Linkedin,
  ExternalLink,
} from "lucide-react";

interface NavbarProps {
  onToggleSidebar?: () => void;
  collegeLogoUrl?: string; // Custom College Logo Image URL
}

const DEFAULT_COLLEGE_LOGO =
  "https://play-lh.googleusercontent.com/wa7ffYAuxK3CPrBHmHPVXRgueD9m7kjWFNB0a4xaCHWqrzKdNumpq_mZN8iQb2bIowERDjYkBTOflnishysXpL8=w240-h480-rw";

export function Navbar({ onToggleSidebar, collegeLogoUrl = DEFAULT_COLLEGE_LOGO }: NavbarProps) {
  const { user, isAuthenticated, logout } = useAuth();
  const router = useRouter();
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState<"login" | "register">("login");
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [logoError, setLogoError] = useState(false);
  const [theme, setTheme] = useState<"dark" | "light">("dark");

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

  const openAuth = (mode: "login" | "register") => {
    setAuthMode(mode);
    setAuthModalOpen(true);
  };

  const handleSocialClick = (platform: "github" | "linkedin") => {
    setProfileDropdownOpen(false);
    const targetUrl = platform === "github" ? user?.githubUrl : user?.linkedinUrl;
    if (targetUrl) {
      window.open(targetUrl, "_blank");
    } else {
      alert(`You haven't linked your ${platform === "github" ? "GitHub" : "LinkedIn"} profile yet! Redirecting you to Account Settings to add your profile link.`);
      router.push("/settings");
    }
  };

  const profileUsername = user?.name?.toLowerCase().replace(/\s+/g, "") || "aaravsharma";

  return (
    <>
      <nav className="sticky top-0 z-40 w-full glass-header border-b border-slate-800/80 px-4 lg:px-8 py-3 flex items-center justify-between gap-4">
        {/* Brand Logo & Mobile Sidebar Toggle */}
        <div className="flex items-center gap-3">
          {onToggleSidebar && (
            <button
              onClick={onToggleSidebar}
              className="p-2 rounded-xl text-gray-400 hover:text-white hover:bg-slate-900 lg:hidden transition-colors"
            >
              <Menu className="w-5 h-5" />
            </button>
          )}

          <Link href="/" className="flex items-center gap-3 group">
            {/* Official College Logo */}
            {!logoError ? (
              <img
                src={collegeLogoUrl}
                alt="Sarhad College Logo"
                onError={() => setLogoError(true)}
                className="w-10 h-10 rounded-2xl object-cover ring-2 ring-purple-500/50 shadow-glow group-hover:scale-105 transition-transform bg-white p-0.5"
              />
            ) : (
              <div className="w-10 h-10 rounded-2xl gradient-bg flex items-center justify-center shadow-glow group-hover:scale-105 transition-transform">
                <Code2 className="w-5 h-5 text-white" />
              </div>
            )}

            <div className="flex flex-col">
              <span className="font-black text-lg text-white tracking-tight leading-none">
                Campus<span className="text-gradient">Code</span>
              </span>
              <span className="text-[10px] font-semibold text-purple-400 tracking-wider uppercase">
                Sarhad College Portal
              </span>
            </div>
          </Link>
        </div>

        {/* Global Search Bar */}
        <div className="hidden md:flex items-center flex-1 max-w-md mx-6">
          <div className="relative w-full">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search problems, topics, projects, or classmates..."
              className="w-full bg-slate-900/80 border border-slate-800 focus:border-purple-500 rounded-2xl py-2 pl-10 pr-4 text-xs text-white placeholder-gray-500 focus:outline-none transition-all shadow-inner"
            />
          </div>
        </div>

        {/* Action Controls & Profile Menu */}
        <div className="flex items-center gap-3">
          {/* Light / Dark Mode Theme Toggle Button */}
          <button
            onClick={toggleTheme}
            className="p-2 rounded-2xl bg-slate-900 border border-slate-800 hover:border-purple-500/50 text-gray-300 hover:text-white transition-all shadow-sm flex items-center gap-1.5 text-xs font-bold"
            title={`Switch to ${theme === "dark" ? "Light" : "Dark"} Mode`}
          >
            {theme === "dark" ? (
              <>
                <Sun className="w-4 h-4 text-amber-400" />
                <span className="hidden sm:inline">Light Mode</span>
              </>
            ) : (
              <>
                <Moon className="w-4 h-4 text-purple-400" />
                <span className="hidden sm:inline">Dark Mode</span>
              </>
            )}
          </button>

          {isAuthenticated ? (
            <>
              {/* Gamification Stats (Streak & XP) */}
              <div className="hidden sm:flex items-center gap-2">
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-bold">
                  <Flame className="w-4 h-4 fill-amber-400" />
                  <span>{user?.streakDays ?? 0}d Streak</span>
                </div>

                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-2xl bg-purple-500/10 border border-purple-500/20 text-purple-300 text-xs font-bold">
                  <Zap className="w-4 h-4 text-purple-400 fill-purple-400" />
                  <span>{user?.xp ?? 0} XP</span>
                </div>
              </div>

              {/* Verified Role Badge */}
              <div className="px-3 py-1.5 rounded-2xl bg-slate-900 border border-slate-800 text-xs font-bold flex items-center gap-1.5">
                {user?.role === "TEACHER" ? (
                  <span className="text-amber-400 flex items-center gap-1">
                    <GraduationCap className="w-3.5 h-3.5" /> TEACHER
                  </span>
                ) : user?.role === "ADMIN" ? (
                  <span className="text-rose-400 flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5" /> ADMIN
                  </span>
                ) : (
                  <span className="text-purple-300 flex items-center gap-1">
                    <Sparkles className="w-3.5 h-3.5" /> STUDENT
                  </span>
                )}
              </div>

              {/* Profile Dropdown */}
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
                  <div className="absolute right-0 mt-2 w-64 glass-card border border-purple-500/30 rounded-3xl p-2.5 shadow-2xl space-y-1.5 z-50 animate-in fade-in slide-in-from-top-2">
                    {/* User Info Header */}
                    <div className="p-3 bg-slate-950/80 rounded-2xl border border-slate-800 space-y-1">
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

                    {/* Dynamic GitHub Profile Action */}
                    <button
                      onClick={() => handleSocialClick("github")}
                      className="w-full flex items-center justify-between px-3 py-2.5 text-xs font-bold text-gray-300 hover:text-white hover:bg-slate-800 rounded-xl transition-all text-left"
                    >
                      <div className="flex items-center gap-2.5">
                        <Github className="w-4 h-4 text-gray-300" />
                        <span>GitHub Profile</span>
                      </div>
                      <ExternalLink className="w-3 h-3 text-gray-500" />
                    </button>

                    {/* Dynamic LinkedIn Profile Action */}
                    <button
                      onClick={() => handleSocialClick("linkedin")}
                      className="w-full flex items-center justify-between px-3 py-2.5 text-xs font-bold text-gray-300 hover:text-white hover:bg-slate-800 rounded-xl transition-all text-left"
                    >
                      <div className="flex items-center gap-2.5">
                        <Linkedin className="w-4 h-4 text-cyan-400" />
                        <span>LinkedIn Profile</span>
                      </div>
                      <ExternalLink className="w-3 h-3 text-gray-500" />
                    </button>

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
            </>
          ) : (
            <div className="flex items-center gap-2">
              <button
                onClick={() => openAuth("login")}
                className="px-4 py-2 rounded-xl bg-slate-900 border border-slate-800 text-gray-200 text-xs font-bold hover:text-white hover:bg-slate-800 transition-all"
              >
                Sign In
              </button>
              <button
                onClick={() => openAuth("register")}
                className="px-4 py-2 rounded-xl gradient-bg text-white text-xs font-bold shadow-glow hover:opacity-95 transition-all"
              >
                Get Started
              </button>
            </div>
          )}
        </div>
      </nav>

      {/* Authentication Modal */}
      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        defaultMode={authMode}
      />
    </>
  );
}
