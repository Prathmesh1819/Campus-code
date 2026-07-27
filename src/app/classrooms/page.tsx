"use client";

import React, { useState, useEffect } from "react";
import { Navbar } from "@/components/Navbar";
import { Sidebar } from "@/components/Sidebar";
import { useAuth } from "@/context/AuthContext";
import Link from "next/link";
import {
  GraduationCap,
  Users,
  FileText,
  FolderGit2,
  Bell,
  Download,
  Plus,
  Github,
  ExternalLink,
  ShieldCheck,
  Award,
  Sparkles,
  Search,
  BookOpen,
  X,
  Upload,
} from "lucide-react";

export default function ClassroomsPage() {
  const { user } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [selectedClass, setSelectedClass] = useState("TY BSc CS");
  const [activeTab, setActiveTab] = useState<"classmates" | "projects" | "notes" | "announcements">("classmates");

  const [classroomData, setClassroomData] = useState<any>({
    classroom: null,
    classmates: [],
    notes: [],
    projects: [],
    announcements: [],
  });
  const [loading, setLoading] = useState(true);

  // Upload Notes Modal state
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [noteTitle, setNoteTitle] = useState("");
  const [noteSubject, setNoteSubject] = useState("");
  const [noteDesc, setNoteDesc] = useState("");
  const [noteFileUrl, setNoteFileUrl] = useState("");
  const [noteFileType, setNoteFileType] = useState("PDF");

  useEffect(() => {
    fetchClassroomData(selectedClass);
  }, [selectedClass]);

  const fetchClassroomData = async (className: string) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/classrooms?className=${encodeURIComponent(className)}`);
      const data = await res.json();
      setClassroomData(data);
    } catch {
      setClassroomData({
        classroom: {
          name: "TY BSc CS",
          branch: "Computer Science",
          academicYear: "2024-2025",
          teacher: { name: "Dr. Vikramaditya Gupta", avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&auto=format&fit=crop&q=80" },
        },
        classmates: [],
        notes: [],
        projects: [],
        announcements: [],
      });
    } finally {
      setLoading(false);
    }
  };

  const handleUploadNote = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/notes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          teacherId: user?.id,
          title: noteTitle,
          description: noteDesc,
          fileUrl: noteFileUrl || "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf",
          fileType: noteFileType,
          subject: noteSubject || "Computer Science",
          className: selectedClass,
        }),
      });

      if (res.ok) {
        alert("Study Note shared successfully with " + selectedClass + "!");
        setShowUploadModal(false);
        setNoteTitle("");
        setNoteDesc("");
        setNoteFileUrl("");
        fetchClassroomData(selectedClass);
      }
    } catch (err: any) {
      alert("Error sharing note: " + err.message);
    }
  };

  const isTeacher = user?.role === "TEACHER" || user?.role === "ADMIN";

  return (
    <div className="min-h-screen flex flex-col bg-[#070913]">
      <Navbar onToggleSidebar={() => setSidebarOpen(!sidebarOpen)} />

      <div className="flex-1 flex max-w-7xl w-full mx-auto">
        <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

        <main className="flex-1 p-4 lg:p-8 space-y-6 overflow-y-auto">
          {/* Class Switcher Pills Header */}
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-2">
              <GraduationCap className="w-6 h-6 text-purple-400" />
              <h1 className="text-xl font-black text-white">Campus Virtual Classrooms</h1>
            </div>

            <div className="flex items-center gap-2 bg-slate-950 p-1.5 rounded-2xl border border-slate-800">
              {["TY BSc CS", "SY BSc CS", "FY BSc CS"].map((cName) => (
                <button
                  key={cName}
                  onClick={() => setSelectedClass(cName)}
                  className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all ${
                    selectedClass === cName
                      ? "bg-purple-600 text-white shadow-glow"
                      : "text-gray-400 hover:text-white"
                  }`}
                >
                  {cName}
                </button>
              ))}
            </div>
          </div>

          {/* Classroom Hero Card */}
          <div className="rounded-3xl glass-card border border-purple-500/30 p-6 sm:p-8 relative overflow-hidden space-y-6">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
              <div className="space-y-2">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/30 text-purple-300 text-xs font-bold">
                  <BookOpen className="w-3.5 h-3.5" />
                  <span>CLASSROOM HUB • {selectedClass}</span>
                </div>
                <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                  {selectedClass} Virtual Classroom & Notes Hub
                </h2>
                <p className="text-xs text-gray-400 max-w-xl">
                  Connect with classmates in your batch, explore peer software projects, and download lecture notes shared by your Class Teacher.
                </p>
              </div>

              {/* Class Teacher Card */}
              <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 flex items-center gap-4 shrink-0 shadow-2xl">
                <img
                  src={classroomData.classroom?.teacher?.avatar || "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&auto=format&fit=crop&q=80"}
                  alt="Class Teacher"
                  className="w-14 h-14 rounded-2xl object-cover ring-2 ring-purple-500/50"
                />
                <div>
                  <div className="flex items-center gap-1.5 text-[10px] font-extrabold text-amber-400 uppercase tracking-wider">
                    <ShieldCheck className="w-3.5 h-3.5" /> Class Teacher
                  </div>
                  <h4 className="text-sm font-bold text-white">
                    {classroomData.classroom?.teacher?.name || "Dr. Vikramaditya Gupta"}
                  </h4>
                  <p className="text-[11px] text-gray-400">Head of DSA & CS Faculty</p>
                </div>
              </div>
            </div>

            {/* Quick Stats Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
              <div className="p-3.5 rounded-2xl bg-slate-900/60 border border-slate-800">
                <span className="text-xs font-semibold text-gray-400 block">Classmates</span>
                <span className="text-lg font-black text-white">{classroomData.classmates?.length || 4} Students</span>
              </div>
              <div className="p-3.5 rounded-2xl bg-slate-900/60 border border-slate-800">
                <span className="text-xs font-semibold text-gray-400 block">Class Projects</span>
                <span className="text-lg font-black text-purple-300">{classroomData.projects?.length || 3} Projects</span>
              </div>
              <div className="p-3.5 rounded-2xl bg-slate-900/60 border border-slate-800">
                <span className="text-xs font-semibold text-gray-400 block">Shared Notes</span>
                <span className="text-lg font-black text-cyan-300">{classroomData.notes?.length || 3} Files</span>
              </div>
              <div className="p-3.5 rounded-2xl bg-slate-900/60 border border-slate-800">
                <span className="text-xs font-semibold text-gray-400 block">Academic Year</span>
                <span className="text-lg font-black text-emerald-300">2024-2025</span>
              </div>
            </div>
          </div>

          {/* Navigation Tab Bar */}
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <div className="flex items-center gap-2 overflow-x-auto">
              <button
                onClick={() => setActiveTab("classmates")}
                className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all ${
                  activeTab === "classmates"
                    ? "bg-purple-600 text-white shadow-glow"
                    : "bg-slate-900 text-gray-400 hover:text-white"
                }`}
              >
                <Users className="w-4 h-4" />
                <span>Classmates ({classroomData.classmates?.length || 0})</span>
              </button>

              <button
                onClick={() => setActiveTab("projects")}
                className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all ${
                  activeTab === "projects"
                    ? "bg-purple-600 text-white shadow-glow"
                    : "bg-slate-900 text-gray-400 hover:text-white"
                }`}
              >
                <FolderGit2 className="w-4 h-4 text-purple-400" />
                <span>Class Projects ({classroomData.projects?.length || 0})</span>
              </button>

              <button
                onClick={() => setActiveTab("notes")}
                className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all ${
                  activeTab === "notes"
                    ? "bg-purple-600 text-white shadow-glow"
                    : "bg-slate-900 text-gray-400 hover:text-white"
                }`}
              >
                <FileText className="w-4 h-4 text-cyan-400" />
                <span>Teacher Notes ({classroomData.notes?.length || 0})</span>
              </button>

              <button
                onClick={() => setActiveTab("announcements")}
                className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all ${
                  activeTab === "announcements"
                    ? "bg-purple-600 text-white shadow-glow"
                    : "bg-slate-900 text-gray-400 hover:text-white"
                }`}
              >
                <Bell className="w-4 h-4 text-amber-400" />
                <span>Notices</span>
              </button>
            </div>

            {/* Teacher Upload Notes Action */}
            {isTeacher && (
              <button
                onClick={() => setShowUploadModal(true)}
                className="px-4 py-2 rounded-xl gradient-bg text-white text-xs font-bold shadow-glow hover:opacity-95 flex items-center gap-1.5 shrink-0"
              >
                <Plus className="w-4 h-4" />
                <span>Share Notes / PDF</span>
              </button>
            )}
          </div>

          {/* TAB 1: CLASSMATES ROSTER */}
          {activeTab === "classmates" && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {classroomData.classmates?.map((mate: any) => (
                <div
                  key={mate.id}
                  className="rounded-3xl glass-card border border-slate-800 p-5 flex flex-col justify-between space-y-4 hover:border-purple-500/40 transition-all group"
                >
                  <div className="flex items-start gap-4">
                    <img
                      src={mate.avatar || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80"}
                      alt={mate.name}
                      className="w-14 h-14 rounded-2xl object-cover ring-2 ring-purple-500/30 group-hover:scale-105 transition-transform"
                    />
                    <div className="space-y-1">
                      <h4 className="text-sm font-bold text-white group-hover:text-purple-300 transition-colors">
                        {mate.name}
                      </h4>
                      <p className="text-[11px] font-mono text-purple-400">{mate.rollNumber || "2024-BSC-001"}</p>
                      <p className="text-xs text-gray-400 line-clamp-2">{mate.bio || "Student at CampusCode"}</p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-3 border-t border-slate-800/80">
                    <div className="text-xs font-mono">
                      <span className="text-emerald-400 font-bold">⚡ {mate.xp || 0} XP</span>
                      <span className="text-gray-400 text-[10px] block">Level {mate.level || 1}</span>
                    </div>

                    <Link
                      href={`/profile/${mate.name.toLowerCase().replace(/\s+/g, "")}`}
                      className="px-3 py-1.5 rounded-xl bg-purple-500/10 border border-purple-500/30 text-purple-300 text-xs font-bold hover:bg-purple-500/20 transition-all flex items-center gap-1"
                    >
                      <span>View Profile</span>
                      <ExternalLink className="w-3 h-3" />
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* TAB 2: CLASS PROJECTS SHOWCASE */}
          {activeTab === "projects" && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {classroomData.projects?.map((proj: any) => {
                const tags: string[] = typeof proj.tags === "string" ? JSON.parse(proj.tags) : proj.tags || [];
                return (
                  <div key={proj.id} className="rounded-3xl glass-card border border-slate-800 overflow-hidden flex flex-col justify-between">
                    <div className="h-44 w-full bg-slate-900 relative">
                      <img src={proj.imageUrl || "https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=600&auto=format&fit=crop&q=80"} alt={proj.title} className="w-full h-full object-cover" />
                      {proj.isHackathonWinner && (
                        <span className="absolute top-3 left-3 px-3 py-1 rounded-full bg-amber-500 text-slate-950 text-[10px] font-black uppercase tracking-wider flex items-center gap-1 shadow-lg">
                          <Award className="w-3 h-3" /> Hackathon Winner
                        </span>
                      )}
                    </div>

                    <div className="p-6 space-y-4">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <img src={proj.user?.avatar} alt={proj.user?.name} className="w-5 h-5 rounded-full object-cover" />
                          <span className="text-xs text-purple-300 font-bold">{proj.user?.name}</span>
                        </div>
                        <h3 className="text-base font-bold text-white">{proj.title}</h3>
                        <p className="text-xs text-gray-400 mt-1 line-clamp-2">{proj.description}</p>
                      </div>

                      <div className="flex flex-wrap gap-1.5">
                        {tags.map((t, idx) => (
                          <span key={idx} className="px-2.5 py-0.5 rounded-lg bg-slate-900 border border-slate-800 text-purple-300 text-[10px] font-semibold">
                            {t}
                          </span>
                        ))}
                      </div>

                      <div className="flex items-center justify-between pt-3 border-t border-slate-800 text-xs">
                        <div className="flex items-center gap-3">
                          {proj.githubUrl && (
                            <a href={proj.githubUrl} target="_blank" className="text-gray-400 hover:text-white flex items-center gap-1 font-bold">
                              <Github className="w-3.5 h-3.5" /> Source Code
                            </a>
                          )}
                          {proj.liveDemoUrl && (
                            <a href={proj.liveDemoUrl} target="_blank" className="text-cyan-400 hover:underline flex items-center gap-1 font-bold">
                              <ExternalLink className="w-3.5 h-3.5" /> Live Demo
                            </a>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* TAB 3: IMPORTANT NOTES & STUDY MATERIALS */}
          {activeTab === "notes" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <FileText className="w-4 h-4 text-cyan-400" />
                  <span>Important Study Notes Shared by Class Teacher</span>
                </h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {classroomData.notes?.map((note: any) => (
                  <div key={note.id} className="p-5 rounded-3xl glass-card border border-slate-800 flex items-start justify-between gap-4">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <span className="px-2.5 py-0.5 rounded bg-cyan-500/10 text-cyan-300 border border-cyan-500/30 text-[10px] font-black uppercase">
                          {note.fileType || "PDF"}
                        </span>
                        <span className="text-xs font-bold text-purple-400">{note.subject}</span>
                      </div>

                      <h4 className="text-sm font-bold text-white">{note.title}</h4>
                      <p className="text-xs text-gray-400 leading-relaxed">{note.description}</p>

                      <p className="text-[10px] text-gray-500">
                        Uploaded by: <b>{note.teacher?.name || "Dr. Vikramaditya Gupta"}</b> • {new Date(note.createdAt).toLocaleDateString()}
                      </p>
                    </div>

                    <a
                      href={note.fileUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="px-3.5 py-2 rounded-xl gradient-bg text-white text-xs font-bold shadow-glow hover:opacity-95 flex items-center gap-1.5 shrink-0"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Download</span>
                    </a>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 4: CLASS ANNOUNCEMENTS */}
          {activeTab === "announcements" && (
            <div className="space-y-4">
              {classroomData.announcements?.map((anc: any) => (
                <div key={anc.id} className="p-5 rounded-3xl glass-card border border-purple-500/30 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="px-2.5 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/30 text-[10px] font-black uppercase">
                      Class Announcement
                    </span>
                    <span className="text-xs text-gray-400">{new Date(anc.createdAt).toLocaleDateString()}</span>
                  </div>
                  <h3 className="text-base font-bold text-white">{anc.title}</h3>
                  <p className="text-xs text-gray-300 leading-relaxed">{anc.content}</p>
                </div>
              ))}
            </div>
          )}
        </main>
      </div>

      {/* Teacher Upload Notes Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="relative w-full max-w-lg glass-card border border-purple-500/30 rounded-3xl p-6 space-y-4">
            <button
              onClick={() => setShowUploadModal(false)}
              className="absolute top-4 right-4 p-2 rounded-xl text-gray-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <Upload className="w-5 h-5 text-purple-400" /> Share Study Notes for {selectedClass}
            </h3>

            <form onSubmit={handleUploadNote} className="space-y-4 text-xs">
              <div>
                <label className="font-bold text-gray-300 block mb-1">Note Title</label>
                <input
                  type="text"
                  required
                  value={noteTitle}
                  onChange={(e) => setNoteTitle(e.target.value)}
                  placeholder="e.g. DSA Lecture 5 - Graph Algorithms PDF"
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl py-2.5 px-3 text-white focus:outline-none focus:border-purple-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-gray-300 block mb-1">Subject Name</label>
                  <input
                    type="text"
                    required
                    value={noteSubject}
                    onChange={(e) => setNoteSubject(e.target.value)}
                    placeholder="e.g. Data Structures"
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl py-2.5 px-3 text-white focus:outline-none"
                  />
                </div>

                <div>
                  <label className="font-bold text-gray-300 block mb-1">File Type</label>
                  <select
                    value={noteFileType}
                    onChange={(e) => setNoteFileType(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl py-2.5 px-3 text-white focus:outline-none"
                  >
                    <option value="PDF">PDF Document</option>
                    <option value="PPT">PowerPoint (PPT)</option>
                    <option value="ZIP">Lab Code (ZIP)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="font-bold text-gray-300 block mb-1">File URL / Download Link</label>
                <input
                  type="url"
                  required
                  value={noteFileUrl}
                  onChange={(e) => setNoteFileUrl(e.target.value)}
                  placeholder="https://..."
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl py-2.5 px-3 text-white focus:outline-none focus:border-purple-500"
                />
              </div>

              <div>
                <label className="font-bold text-gray-300 block mb-1">Description / Exam Remarks</label>
                <textarea
                  rows={3}
                  value={noteDesc}
                  onChange={(e) => setNoteDesc(e.target.value)}
                  placeholder="Key topics covered for exams..."
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl py-2.5 px-3 text-white focus:outline-none"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 rounded-xl gradient-bg text-white font-bold shadow-glow hover:opacity-95 flex items-center justify-center gap-2"
              >
                <Upload className="w-4 h-4" />
                <span>Publish Notes to {selectedClass}</span>
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
