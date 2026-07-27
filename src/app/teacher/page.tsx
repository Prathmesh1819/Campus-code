"use client";

import React, { useState, useEffect } from "react";
import { Navbar } from "@/components/Navbar";
import { Sidebar } from "@/components/Sidebar";
import { useAuth } from "@/context/AuthContext";
import {
  GraduationCap,
  Plus,
  Bell,
  Users,
  BookOpen,
  Calendar,
  CheckCircle2,
  FileText,
  Clock,
  Send,
  Upload,
  ShieldAlert,
} from "lucide-react";
import Link from "next/link";

export default function TeacherPage() {
  const { user } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"assignments" | "announcements" | "notes" | "students">("assignments");

  // Role Access Guard: Only TEACHER or ADMIN can access Teacher Panel
  if (user?.role === "STUDENT") {
    return (
      <div className="min-h-screen flex flex-col bg-[#070913] text-white">
        <Navbar />
        <div className="flex-1 flex items-center justify-center p-6">
          <div className="max-w-md w-full glass-card border border-rose-500/30 rounded-3xl p-8 text-center space-y-4">
            <div className="w-16 h-16 rounded-3xl bg-rose-500/10 border border-rose-500/30 text-rose-400 mx-auto flex items-center justify-center">
              <ShieldAlert className="w-8 h-8" />
            </div>
            <h2 className="text-xl font-black">Teacher Portal Access Denied</h2>
            <p className="text-xs text-gray-400">
              Your account is registered under <b>STUDENT</b> role. Only verified Faculty & Teachers can access this portal. To change roles, please sign out first.
            </p>
            <Link
              href="/dashboard"
              className="inline-block w-full py-3 rounded-xl gradient-bg text-white font-bold text-xs shadow-glow"
            >
              Return to Student Dashboard
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#070913]">
      <Navbar onToggleSidebar={() => setSidebarOpen(!sidebarOpen)} />

      <div className="flex-1 flex max-w-7xl w-full mx-auto">
        <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

        <main className="flex-1 p-4 lg:p-8 space-y-6 overflow-y-auto">
          {/* Header Banner */}
          <div className="rounded-3xl glass-card border border-purple-500/30 p-6 sm:p-8 relative overflow-hidden">
            <div className="flex items-center gap-2 text-xs font-bold text-amber-400 mb-2">
              <GraduationCap className="w-4 h-4" />
              <span>VERIFIED FACULTY & TEACHER PORTAL</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              Classroom Management & Assignments
            </h1>
            <p className="text-xs sm:text-sm text-gray-400 mt-1 max-w-2xl">
              Create assignments, post class notices, upload lecture notes, and track student coding progress across batches.
            </p>
          </div>

          {/* Quick Stats Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="p-4 rounded-3xl glass-card border border-slate-800 space-y-1">
              <span className="text-xs font-semibold text-gray-400">Active Batches</span>
              <span className="text-xl font-black text-white block">TY BSc CS</span>
            </div>
            <div className="p-4 rounded-3xl glass-card border border-slate-800 space-y-1">
              <span className="text-xs font-semibold text-gray-400">Enrolled Students</span>
              <span className="text-xl font-black text-purple-300 block">42 Students</span>
            </div>
            <div className="p-4 rounded-3xl glass-card border border-slate-800 space-y-1">
              <span className="text-xs font-semibold text-gray-400">Assignments Posted</span>
              <span className="text-xl font-black text-cyan-300 block">4 Active</span>
            </div>
            <div className="p-4 rounded-3xl glass-card border border-slate-800 space-y-1">
              <span className="text-xs font-semibold text-gray-400">Notes Uploaded</span>
              <span className="text-xl font-black text-emerald-300 block">6 Files</span>
            </div>
          </div>

          {/* Controls & Classroom Hub Redirect */}
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-white">Faculty Management Controls</h2>
            <Link
              href="/classrooms"
              className="px-4 py-2 rounded-xl gradient-bg text-white text-xs font-bold shadow-glow hover:opacity-95 flex items-center gap-1.5"
            >
              <BookOpen className="w-4 h-4" />
              <span>Go to TY BSc CS Classroom Hub</span>
            </Link>
          </div>
        </main>
      </div>
    </div>
  );
}
