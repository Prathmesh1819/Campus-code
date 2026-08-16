"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import {
  LayoutDashboard,
  Code2,
  Trophy,
  FolderGit2,
  MessageSquare,
  Users,
  Settings,
  GraduationCap,
  Sparkles,
  ShieldCheck,
  X,
  FileText,
  Building2,
} from "lucide-react";

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

const COLLEGE_LOGO =
  "https://play-lh.googleusercontent.com/wa7ffYAuxK3CPrBHmHPVXRgueD9m7kjWFNB0a4xaCHWqrzKdNumpq_mZN8iQb2bIowERDjYkBTOflnishysXpL8=w240-h480-rw";

export function Sidebar({ isOpen, onClose }: SidebarProps) {
  const pathname = usePathname();
  const { user } = useAuth();

  const mainNavigation = [
    { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { name: "Virtual Classrooms", href: "/classrooms", icon: GraduationCap, badge: "TY BSc CS" },
    { name: "Coding Problems", href: "/problems", icon: Code2 },
    { name: "Leaderboard", href: "/leaderboard", icon: Trophy },
    { name: "Project Showcase", href: "/projects", icon: FolderGit2 },
    { name: "Community Feed", href: "/feed", icon: Users },
    { name: "Peer Messages", href: "/messages", icon: MessageSquare },
  ];

  const roleNavigation = user?.role === "TEACHER"
    ? [{ name: "Teacher Portal", href: "/teacher", icon: GraduationCap, badge: "Faculty" }]
    : (user?.role === "ADMIN" || user?.role === "SUPER_ADMIN")
    ? [{ name: "Admin Console", href: "/admin", icon: ShieldCheck, badge: "Admin" }]
    : [];

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 z-40 bg-black/70 backdrop-blur-sm lg:hidden transition-opacity"
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed lg:static top-0 left-0 z-50 h-screen lg:h-auto w-64 glass-sidebar flex flex-col justify-between p-4 transition-transform duration-300 ${
          isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        }`}
      >
        <div className="space-y-6">
          {/* Header Mobile Close Button */}
          <div className="flex items-center justify-between lg:hidden px-2 pt-2">
            <div className="flex items-center gap-2">
              <img
                src={COLLEGE_LOGO}
                alt="Sarhad College Logo"
                className="w-8 h-8 rounded-xl object-cover bg-white p-0.5"
              />
              <span className="font-black text-white text-lg">CampusCode</span>
            </div>
            <button onClick={onClose} className="p-1 rounded-lg text-gray-400 hover:text-white">
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation Links */}
          <nav className="space-y-1">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-gray-500 px-3 block mb-2">
              Campus Navigation
            </span>

            {mainNavigation.map((item) => {
              const isActive = pathname === item.href;
              const Icon = item.icon;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={onClose}
                  className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all ${
                    isActive
                      ? "bg-purple-600/20 text-purple-300 border border-purple-500/40 shadow-glow"
                      : "text-gray-400 hover:text-white hover:bg-slate-900/60"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon className={`w-4 h-4 ${isActive ? "text-purple-400" : "text-gray-400"}`} />
                    <span>{item.name}</span>
                  </div>
                  {item.badge && (
                    <span className="px-2 py-0.5 rounded-full text-[9px] font-extrabold bg-purple-500/20 text-purple-300 border border-purple-500/30">
                      {item.badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>

          {/* Role Aware Special Navigation */}
          {roleNavigation.length > 0 && (
            <div className="pt-2 border-t border-slate-800">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-purple-400 px-3 block mb-2">
                Faculty Controls
              </span>
              {roleNavigation.map((item) => {
                const isActive = pathname === item.href;
                const Icon = item.icon;
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    onClick={onClose}
                    className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all ${
                      isActive
                        ? "bg-purple-600/20 text-purple-300 border border-purple-500/40 shadow-glow"
                        : "text-gray-400 hover:text-white hover:bg-slate-900/60"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Icon className="w-4 h-4 text-purple-400" />
                      <span>{item.name}</span>
                    </div>
                    {item.badge && (
                      <span className="px-2 py-0.5 rounded-full text-[9px] font-extrabold bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                        {item.badge}
                      </span>
                    )}
                  </Link>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer Profile Mini Widget & Team 18 Credit */}
        <div className="pt-4 border-t border-slate-800 space-y-3">
          <Link
            href="/settings"
            className="flex items-center gap-3 p-2.5 rounded-2xl bg-slate-900/80 border border-slate-800 hover:border-slate-700 transition-all group"
          >
            <img
              src={user?.avatar || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80"}
              alt={user?.name || "Student"}
              className="w-9 h-9 rounded-xl object-cover ring-2 ring-purple-500/40"
            />
            <div className="flex-1 min-w-0">
              <h4 className="text-xs font-bold text-white truncate group-hover:text-purple-300 transition-colors">
                {user?.name || "Aarav Sharma"}
              </h4>
              <p className="text-[10px] text-purple-400 font-semibold truncate">
                {(user?.role === "ADMIN" || user?.role === "SUPER_ADMIN") ? "Global Administrator" : user?.role === "TEACHER" ? "Faculty Member" : user?.className || "Campus Student"}
              </p>
            </div>
            <Settings className="w-4 h-4 text-gray-400 group-hover:text-white" />
          </Link>

          <div className="text-center pt-1 text-[10px] text-gray-500 font-normal">
            Designed and developed by Team 18
          </div>
        </div>
      </aside>
    </>
  );
}
