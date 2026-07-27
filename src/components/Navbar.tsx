"use client";

import React, { useState } from "react";
import Link from "next/link";
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
} from "lucide-react";

interface NavbarProps {
  onToggleSidebar?: () => void;
  collegeLogoUrl?: string; // Custom College Logo Image URL
}

const DEFAULT_COLLEGE_LOGO =
  "https://play-lh.googleusercontent.com/wa7ffYAuxK3CPrBHmHPVXRgueD9m7kjWFNB0a4xaCHWqrzKdNumpq_mZN8iQb2bIowERDjYkBTOflnishysXpL8=w240-h480-rw";

export function Navbar({ onToggleSidebar, collegeLogoUrl = DEFAULT_COLLEGE_LOGO }: NavbarProps) {
  const { user, isAuthenticated, logout } = useAuth();
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState<"login" | "register">("login");
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [logoError, setLogoError] = useState(false);

  const openAuth = (mode: "login" | "register") => {
    setAuthMode(mode);
    setAuthModalOpen(true);
  };

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
          {isAuthenticated ? (
            <>
              {/* Gamification Stats (Streak & XP) */}
              <div className="hidden sm:flex items-center gap-2">
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-bold">
                  <Flame className="w-4 h-4 fill-amber-400" />
                  <span>{user?.streakDays || 14}d Streak</span>
                </div>

                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-2xl bg-purple-500/10 border border-purple-500/20 text-purple-300 text-xs font-bold">
                  <Zap className="w-4 h-4 text-purple-400 fill-purple-400" />
                  <span>{user?.xp || 2850} XP</span>
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
                  className="flex items-center gap-2 p-1 rounded-2xl border border-slate-800 hover:border-purple-500/50 bg-slate-900/60 transition-all"
                >
                  <img
                    src={user?.avatar || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80"}
                    alt={user?.name || "User Avatar"}
                    className="w-8 h-8 rounded-xl object-cover"
                  />
                  <ChevronDown className="w-3.5 h-3.5 text-gray-400 pr-1" />
                </button>

                {profileDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-56 glass-card border border-slate-800 rounded-2xl p-2 shadow-2xl space-y-1 z-50 animate-in fade-in slide-in-from-top-2">
                    <div className="p-3 border-b border-slate-800 space-y-0.5">
                      <p className="text-xs font-bold text-white truncate">{user?.name}</p>
                      <p className="text-[10px] text-purple-400 truncate">{user?.email}</p>
                      <p className="text-[10px] text-gray-400 uppercase font-semibold">
                        Role: {user?.role}
                      </p>
                    </div>

                    <Link
                      href={`/profile/${user?.name?.toLowerCase().replace(/\s+/g, "") || "aaravsharma"}`}
                      onClick={() => setProfileDropdownOpen(false)}
                      className="flex items-center gap-2.5 px-3 py-2 text-xs font-bold text-gray-300 hover:text-white hover:bg-slate-800/80 rounded-xl transition-all"
                    >
                      <User className="w-4 h-4 text-purple-400" />
                      <span>My Profile</span>
                    </Link>

                    <Link
                      href="/settings"
                      onClick={() => setProfileDropdownOpen(false)}
                      className="flex items-center gap-2.5 px-3 py-2 text-xs font-bold text-gray-300 hover:text-white hover:bg-slate-800/80 rounded-xl transition-all"
                    >
                      <Settings className="w-4 h-4 text-cyan-400" />
                      <span>Settings</span>
                    </Link>

                    <button
                      onClick={() => {
                        setProfileDropdownOpen(false);
                        logout();
                      }}
                      className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-bold text-rose-400 hover:bg-rose-500/10 rounded-xl transition-all text-left"
                    >
                      <LogOut className="w-4 h-4" />
                      <span>Sign Out</span>
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
