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
  Sparkles,
  Megaphone,
} from "lucide-react";
import Link from "next/link";

export default function TeacherPage() {
  const { user } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"assignments" | "announcements" | "notes" | "students">("assignments");

  // Live database data
  const [studentsCount, setStudentsCount] = useState(0);
  const [assignmentsCount, setAssignmentsCount] = useState(0);
  const [notesCount, setNotesCount] = useState(0);
  const [assignments, setAssignments] = useState<any[]>([]);
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>([]);

  // Post forms
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [postType, setPostType] = useState<"assignment" | "announcement">("assignment");

  useEffect(() => {
    if (user?.id) {
      fetchTeacherData();
    }
  }, [user?.id]);

  const fetchTeacherData = async () => {
    try {
      const res = await fetch(`/api/teacher?teacherId=${user?.id}`);
      const data = await res.json();
      if (data) {
        setStudentsCount(data.studentsCount || 0);
        setAssignmentsCount(data.assignmentsCount || 0);
        setNotesCount(data.notesCount || 0);
        setAssignments(data.assignments || []);
        setAnnouncements(data.announcements || []);
        setStudents(data.students || []);
      }
    } catch (err) {
      console.error("Fetch teacher data error:", err);
    }
  };

  const handleCreatePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !user?.id) return;

    try {
      const res = await fetch("/api/teacher", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: postType,
          teacherId: user.id,
          title,
          description,
          content: description,
          className: "TY BSc CS",
        }),
      });

      if (res.ok) {
        setTitle("");
        setDescription("");
        setShowCreateModal(false);
        fetchTeacherData();
      }
    } catch (err: any) {
      alert("Failed to post: " + err.message);
    }
  };

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
          <div className="rounded-3xl glass-card border border-purple-500/30 p-6 sm:p-8 relative overflow-hidden flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
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

            <button
              onClick={() => setShowCreateModal(true)}
              className="px-5 py-3 rounded-2xl gradient-bg text-white text-xs font-bold shadow-glow hover:opacity-95 transition-all flex items-center gap-2 shrink-0"
            >
              <Plus className="w-4 h-4" />
              <span>Post New Item</span>
            </button>
          </div>

          {/* Real Live Quick Stats Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="p-4 rounded-3xl glass-card border border-slate-800 space-y-1">
              <span className="text-xs font-semibold text-gray-400">Active Batches</span>
              <span className="text-xl font-black text-white block">TY BSc CS</span>
            </div>
            <div className="p-4 rounded-3xl glass-card border border-slate-800 space-y-1">
              <span className="text-xs font-semibold text-gray-400">Enrolled Students</span>
              <span className="text-xl font-black text-purple-300 block">{studentsCount} Students</span>
            </div>
            <div className="p-4 rounded-3xl glass-card border border-slate-800 space-y-1">
              <span className="text-xs font-semibold text-gray-400">Assignments Posted</span>
              <span className="text-xl font-black text-cyan-300 block">{assignmentsCount} Active</span>
            </div>
            <div className="p-4 rounded-3xl glass-card border border-slate-800 space-y-1">
              <span className="text-xs font-semibold text-gray-400">Notes Uploaded</span>
              <span className="text-xl font-black text-emerald-300 block">{notesCount} Files</span>
            </div>
          </div>

          {/* Controls & Classroom Hub Redirect */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-2 border-b border-slate-800 pb-2">
              <button
                onClick={() => setActiveTab("assignments")}
                className={`px-4 py-2 text-xs font-bold rounded-xl transition-all ${
                  activeTab === "assignments" ? "bg-purple-600/20 text-purple-300 border border-purple-500/30" : "text-gray-400 hover:text-white"
                }`}
              >
                Assignments ({assignments.length})
              </button>
              <button
                onClick={() => setActiveTab("announcements")}
                className={`px-4 py-2 text-xs font-bold rounded-xl transition-all ${
                  activeTab === "announcements" ? "bg-purple-600/20 text-purple-300 border border-purple-500/30" : "text-gray-400 hover:text-white"
                }`}
              >
                Announcements ({announcements.length})
              </button>
              <button
                onClick={() => setActiveTab("students")}
                className={`px-4 py-2 text-xs font-bold rounded-xl transition-all ${
                  activeTab === "students" ? "bg-purple-600/20 text-purple-300 border border-purple-500/30" : "text-gray-400 hover:text-white"
                }`}
              >
                Class Students ({students.length})
              </button>
            </div>

            <Link
              href="/classrooms"
              className="px-4 py-2 rounded-xl bg-slate-900 border border-slate-800 text-gray-200 text-xs font-bold hover:text-white transition-all flex items-center gap-1.5"
            >
              <BookOpen className="w-4 h-4 text-purple-400" />
              <span>Go to TY BSc CS Classroom Hub</span>
            </Link>
          </div>

          {/* Content Views */}
          <div className="space-y-4">
            {activeTab === "assignments" && (
              <div className="rounded-3xl glass-card border border-slate-800 p-6 space-y-4">
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <FileText className="w-4 h-4 text-cyan-400" /> Active Class Assignments
                </h3>

                {assignments.length === 0 ? (
                  <div className="p-8 text-center text-xs text-gray-500 font-medium">
                    No active assignments posted yet. Click "Post New Item" to issue assignments to students.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {assignments.map((asg) => (
                      <div key={asg.id} className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-purple-500/10 text-purple-300">
                            {asg.className}
                          </span>
                          <span className="text-[10px] text-gray-500">
                            Deadline: {new Date(asg.deadline).toLocaleDateString()}
                          </span>
                        </div>
                        <h4 className="text-sm font-bold text-white">{asg.title}</h4>
                        <p className="text-xs text-gray-400 leading-relaxed">{asg.description}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeTab === "announcements" && (
              <div className="rounded-3xl glass-card border border-slate-800 p-6 space-y-4">
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Megaphone className="w-4 h-4 text-purple-400" /> Published Announcements
                </h3>

                {announcements.length === 0 ? (
                  <div className="p-8 text-center text-xs text-gray-500 font-medium">
                    No announcements published yet.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {announcements.map((anc) => (
                      <div key={anc.id} className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-purple-400">{anc.author?.name || "Teacher"}</span>
                          <span className="text-[10px] text-gray-500">{new Date(anc.createdAt).toLocaleDateString()}</span>
                        </div>
                        <h4 className="text-sm font-bold text-white">{anc.title}</h4>
                        <p className="text-xs text-gray-400">{anc.content}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeTab === "students" && (
              <div className="rounded-3xl glass-card border border-slate-800 p-6 space-y-4">
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Users className="w-4 h-4 text-purple-400" /> Enrolled Class Roster ({students.length})
                </h3>

                <div className="space-y-2">
                  {students.map((st, idx) => (
                    <div key={st.id} className="p-3.5 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-between text-xs">
                      <div className="flex items-center gap-3">
                        <span className="font-bold text-gray-500 w-6">#{idx + 1}</span>
                        <div>
                          <p className="font-bold text-white">{st.name}</p>
                          <p className="text-[10px] text-gray-400">{st.email} • {st.className || "TY BSc CS"}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="font-mono text-purple-300 font-bold">{st.xp} XP</span>
                        <p className="text-[10px] text-gray-500">{st._count?.submissions || 0} submissions</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </main>
      </div>

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="max-w-md w-full glass-card border border-purple-500/40 rounded-3xl p-6 space-y-4 animate-in zoom-in-95">
            <h3 className="text-lg font-black text-white">Create New Post</h3>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setPostType("assignment")}
                className={`flex-1 py-2 rounded-xl text-xs font-bold border transition-all ${
                  postType === "assignment" ? "bg-purple-600/20 border-purple-500 text-purple-300" : "bg-slate-900 border-slate-800 text-gray-400"
                }`}
              >
                Assignment
              </button>
              <button
                type="button"
                onClick={() => setPostType("announcement")}
                className={`flex-1 py-2 rounded-xl text-xs font-bold border transition-all ${
                  postType === "announcement" ? "bg-purple-600/20 border-purple-500 text-purple-300" : "bg-slate-900 border-slate-800 text-gray-400"
                }`}
              >
                Announcement
              </button>
            </div>

            <form onSubmit={handleCreatePost} className="space-y-4 text-xs">
              <div>
                <label className="font-bold text-gray-300 block mb-1">Title</label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Enter title..."
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl py-2.5 px-3 text-white focus:outline-none focus:border-purple-500"
                />
              </div>

              <div>
                <label className="font-bold text-gray-300 block mb-1">Description / Content</label>
                <textarea
                  rows={4}
                  required
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Write details..."
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl py-2.5 px-3 text-white focus:outline-none focus:border-purple-500"
                />
              </div>

              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-gray-300 font-bold hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl gradient-bg text-white font-bold shadow-glow hover:opacity-95"
                >
                  Publish Post
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
