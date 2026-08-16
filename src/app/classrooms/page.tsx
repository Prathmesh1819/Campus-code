"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { Navbar } from "@/components/Navbar";
import { Sidebar } from "@/components/Sidebar";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/lib/supabase";
import Link from "next/link";
import {
  GraduationCap,
  FileText,
  Download,
  Plus,
  Github,
  ExternalLink,
  ShieldCheck,
  Award,
  BookOpen,
  X,
  Upload,
  Lock,
  Mail,
  Building2,
  RefreshCw,
} from "lucide-react";

export default function ClassroomsPage() {
  const { user } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [selectedClass, setSelectedClass] = useState<string>(user?.className || "TY BSc CS");
  const [activeTab, setActiveTab] = useState<"classmates" | "projects" | "notes" | "announcements">("classmates");

  const isTeacherOrAdmin = user?.role === "TEACHER" || user?.role === "ADMIN" || user?.role === "SUPER_ADMIN";
  const isClassTeacher = selectedClass === "TY BSc CS";

  const [classroomData, setClassroomData] = useState<any>({
    classroom: null,
    classmates: [],
    notes: [],
    projects: [],
    announcements: [],
  });

  const [loading, setLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);

  // Client-side Classroom Cache (key -> data)
  const classroomCacheRef = useRef<Map<string, any>>(new Map());
  // Race condition cancellation & sequence tracking
  const activeAbortControllerRef = useRef<AbortController | null>(null);
  const requestSeqRef = useRef<number>(0);

  // Upload Notes Modal state
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [noteTitle, setNoteTitle] = useState("");
  const [noteSubject, setNoteSubject] = useState("");
  const [noteDesc, setNoteDesc] = useState("");
  const [noteFileUrl, setNoteFileUrl] = useState("");
  const [noteFileType, setNoteFileType] = useState("PDF");

  const fetchClassroomData = useCallback(
    async (className: string, classId?: string) => {
      // Abort previous in-flight fetch to prevent race conditions
      if (activeAbortControllerRef.current) {
        activeAbortControllerRef.current.abort();
      }
      const controller = new AbortController();
      activeAbortControllerRef.current = controller;

      const currentSeq = ++requestSeqRef.current;
      const cacheKey = classId || className;
      const cached = classroomCacheRef.current.get(cacheKey) || classroomCacheRef.current.get(className);

      if (cached) {
        // Instant rendering from client-side cache
        setClassroomData(cached);
        setLoading(false);
        setIsSyncing(true);
      } else {
        // No cache yet: set localized loading state ONLY
        setLoading(true);
      }

      try {
        const url = classId
          ? `/api/classrooms?classId=${encodeURIComponent(classId)}&className=${encodeURIComponent(className)}`
          : `/api/classrooms?className=${encodeURIComponent(className)}`;

        const res = await fetch(url, { signal: controller.signal, cache: "no-store" });
        const data = await res.json();

        // Race-condition check: ignore stale completed request if user clicked another class
        if (currentSeq !== requestSeqRef.current) return;

        if (res.ok) {
          classroomCacheRef.current.set(className, data);
          if (data.classId) classroomCacheRef.current.set(data.classId, data);

          setClassroomData(data);
        }
      } catch (err: any) {
        if (err.name === "AbortError") return; // Normal request cancellation

        // Fallback state on error
        if (currentSeq === requestSeqRef.current && !cached) {
          setClassroomData({
            classroom: {
              name: className,
              branch: "Computer Science",
              academicYear: "2026-27",
              teacher: {
                name: "Department Faculty",
                email: "faculty@campuscode.com",
                avatar:
                  "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&auto=format&fit=crop&q=80",
              },
            },
            classmates: [],
            notes: [],
            projects: [],
            announcements: [],
          });
        }
      } finally {
        if (currentSeq === requestSeqRef.current) {
          setLoading(false);
          setIsSyncing(false);
        }
      }
    },
    []
  );

  const handleSelectClassroom = (className: string, classId?: string) => {
    setSelectedClass(className);

    // Instant UI switch if cached
    const cacheKey = classId || className;
    const cached = classroomCacheRef.current.get(cacheKey) || classroomCacheRef.current.get(className);
    if (cached) {
      setClassroomData(cached);
      setLoading(false);
    }

    fetchClassroomData(className, classId);
  };

  const handlePrefetchClassroom = (className: string, classId?: string) => {
    const cacheKey = classId || className;
    if (classroomCacheRef.current.has(cacheKey) || classroomCacheRef.current.has(className)) {
      return;
    }
    const url = classId
      ? `/api/classrooms?classId=${encodeURIComponent(classId)}&className=${encodeURIComponent(className)}`
      : `/api/classrooms?className=${encodeURIComponent(className)}`;

    fetch(url, { cache: "no-store" })
      .then((res) => res.json())
      .then((data) => {
        if (data && data.className) {
          classroomCacheRef.current.set(className, data);
          if (data.classId) classroomCacheRef.current.set(data.classId, data);
        }
      })
      .catch(() => {});
  };

  useEffect(() => {
    const targetClass = user?.className && user?.role === "STUDENT" ? user.className : selectedClass;
    if (user?.className && user?.role === "STUDENT") {
      setSelectedClass(user.className);
    }
    fetchClassroomData(targetClass);

    const channel = supabase
      .channel("classrooms-realtime-channel")
      .on("postgres_changes", { event: "*", schema: "public", table: "announcements" }, () => {
        fetchClassroomData(targetClass);
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "teacher_notes" }, () => {
        fetchClassroomData(targetClass);
      })
      .subscribe((status, err) => {
        if (err) {
          console.warn("[Realtime Classrooms] Subscription error:", err);
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.className, user?.role, fetchClassroomData]);

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

        // Invalidate cache for current classroom to force fresh fetch
        classroomCacheRef.current.delete(selectedClass);
        fetchClassroomData(selectedClass);
      }
    } catch (err: any) {
      alert("Error sharing note: " + err.message);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#070913]">
      <Navbar onToggleSidebar={() => setSidebarOpen(!sidebarOpen)} />

      <div className="flex-1 flex max-w-7xl w-full mx-auto">
        <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

        <main className="flex-1 p-4 lg:p-8 space-y-6 overflow-y-auto">
          {/* Header Bar */}
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-2">
              <GraduationCap className="w-6 h-6 text-purple-400" />
              <h1 className="text-xl font-black text-white">Campus Virtual Classrooms</h1>
            </div>

            {/* Class Switcher Pills: Only visible for Faculty & Admin */}
            {isTeacherOrAdmin ? (
              <div className="flex items-center gap-2 bg-slate-950 p-1.5 rounded-2xl border border-slate-800 flex-wrap">
                <span className="text-[10px] font-extrabold uppercase text-purple-400 px-2">Assigned Batches:</span>
                {classroomData.assignedClasses && classroomData.assignedClasses.length > 0 ? (
                  classroomData.assignedClasses.map((item: any) => (
                    <button
                      key={item.id + (item.courseId || item.name)}
                      onClick={() => handleSelectClassroom(item.name, item.id)}
                      onMouseEnter={() => handlePrefetchClassroom(item.name, item.id)}
                      onFocus={() => handlePrefetchClassroom(item.name, item.id)}
                      className={`px-3 py-1 rounded-xl text-xs font-bold transition-all flex items-center gap-1 ${
                        selectedClass === item.name
                          ? "bg-purple-600 text-white shadow-glow"
                          : "text-gray-400 hover:text-white"
                      }`}
                    >
                      <span>{item.name}</span>
                      {item.subjectTitle && (
                        <span className="text-[10px] opacity-75 font-normal">({item.subjectTitle})</span>
                      )}
                    </button>
                  ))
                ) : (
                  <span className="text-xs text-amber-400 font-semibold px-2">No active teaching assignments assigned by Admin yet</span>
                )}
              </div>
            ) : (
              <div className="px-3.5 py-1.5 rounded-2xl bg-purple-500/10 border border-purple-500/30 text-purple-300 text-xs font-bold flex items-center gap-2">
                <Lock className="w-3.5 h-3.5 text-purple-400" />
                <span>Enrolled Batch: <b>{user?.className || "TY BSc CS"}</b></span>
              </div>
            )}
          </div>

          {/* Classroom Hero Card */}
          <div className="rounded-3xl glass-card border border-purple-500/30 p-6 sm:p-8 relative overflow-hidden space-y-6">
            <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
              <div className="space-y-2 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/30 text-purple-300 text-xs font-bold">
                    <BookOpen className="w-3.5 h-3.5" />
                    <span>CLASSROOM HUB • {selectedClass}</span>
                  </div>

                  {isSyncing && (
                    <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 text-[10px] font-bold animate-pulse">
                      <RefreshCw className="w-3 h-3 animate-spin text-cyan-400" />
                      <span>Syncing...</span>
                    </div>
                  )}
                </div>

                <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                  {selectedClass} Virtual Classroom & Notes Hub
                </h2>
                <p className="text-xs text-gray-400 max-w-xl leading-relaxed">
                  {isTeacherOrAdmin
                    ? `Manage enrolled students in ${selectedClass}, review student software projects, and upload lecture notes.`
                    : `Connect with classmates in your batch, explore peer software projects, and download lecture notes shared by your Class Teacher.`}
                </p>
              </div>

              {/* Dynamic Faculty Card: Class Teacher vs Subject Teacher */}
              <div
                className={`p-5 rounded-3xl bg-slate-900 border flex items-center gap-4 shrink-0 shadow-2xl min-w-[320px] transition-all ${
                  isClassTeacher ? "border-amber-500/40" : "border-cyan-500/40"
                }`}
              >
                <img
                  src={classroomData.classroom?.teacher?.avatar || "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&auto=format&fit=crop&q=80"}
                  alt={isClassTeacher ? "Class Teacher" : "Subject Teacher"}
                  className={`w-16 h-16 rounded-2xl object-cover ring-4 shadow-glow ${
                    isClassTeacher ? "ring-amber-500/50" : "ring-cyan-500/50"
                  }`}
                />
                <div className="space-y-1">
                  <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-300 text-[10px] font-black uppercase tracking-wider border border-amber-500/40">
                    <ShieldCheck className="w-3 h-3 text-amber-400" /> Class Teacher
                  </div>

                  <h4 className="text-base font-black text-white tracking-tight">
                    {classroomData.classroom?.teacher?.name || "Class Teacher Yet to Be Announced"}
                  </h4>
                  {classroomData.classroom?.teacher?.email ? (
                    <p className="text-[11px] font-mono text-gray-400 flex items-center gap-1">
                      <Mail className="w-3 h-3 text-cyan-400" /> {classroomData.classroom.teacher.email}
                    </p>
                  ) : (
                    <p className="text-[11px] font-sans text-amber-400/80 italic flex items-center gap-1">
                      Class Teacher assignment pending for {selectedClass}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Quick Stats Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
              <div className="p-3.5 rounded-2xl bg-slate-900/60 border border-slate-800">
                <span className="text-xs font-semibold text-gray-400 block">
                  {isTeacherOrAdmin ? "Enrolled Students" : "Classmates"}
                </span>
                <span className="text-lg font-black text-white">
                  {user && user.role === "STUDENT" && !classroomData.classmates?.some((m: any) => m.email === user.email)
                    ? (classroomData.classmates?.length || 0) + 1
                    : classroomData.classmates?.length || 0} Students
                </span>
              </div>
              <div className="p-3.5 rounded-2xl bg-slate-900/60 border border-slate-800">
                <span className="text-xs font-semibold text-gray-400 block">Class Projects</span>
                <span className="text-lg font-black text-purple-300">{classroomData.projects?.length || 0} Projects</span>
              </div>
              <div className="p-3.5 rounded-2xl bg-slate-900/60 border border-slate-800">
                <span className="text-xs font-semibold text-gray-400 block">Shared Notes</span>
                <span className="text-lg font-black text-cyan-300">{classroomData.notes?.length || 0} Files</span>
              </div>
              <div className="p-3.5 rounded-2xl bg-slate-900/60 border border-slate-800">
                <span className="text-xs font-semibold text-gray-400 block">Academic Year</span>
                <span className="text-lg font-black text-emerald-300">{classroomData.classroom?.academicYear || "2026-27"}</span>
              </div>
            </div>
          </div>

          {/* Controls & Classroom Hub Redirect */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-2 border-b border-slate-800 pb-2">
              <button
                onClick={() => setActiveTab("classmates")}
                className={`px-4 py-2 text-xs font-bold rounded-xl transition-all ${
                  activeTab === "classmates" ? "bg-purple-600/20 text-purple-300 border border-purple-500/30" : "text-gray-400 hover:text-white"
                }`}
              >
                Classmates ({user && user.role === "STUDENT" && !classroomData.classmates?.some((m: any) => m.email === user.email) ? (classroomData.classmates?.length || 0) + 1 : classroomData.classmates?.length || 0})
              </button>
              <button
                onClick={() => setActiveTab("projects")}
                className={`px-4 py-2 text-xs font-bold rounded-xl transition-all ${
                  activeTab === "projects" ? "bg-purple-600/20 text-purple-300 border border-purple-500/30" : "text-gray-400 hover:text-white"
                }`}
              >
                Class Projects ({classroomData.projects?.length || 0})
              </button>
              <button
                onClick={() => setActiveTab("notes")}
                className={`px-4 py-2 text-xs font-bold rounded-xl transition-all ${
                  activeTab === "notes" ? "bg-purple-600/20 text-purple-300 border border-purple-500/30" : "text-gray-400 hover:text-white"
                }`}
              >
                Teacher Notes ({classroomData.notes?.length || 0})
              </button>
              <button
                onClick={() => setActiveTab("announcements")}
                className={`px-4 py-2 text-xs font-bold rounded-xl transition-all ${
                  activeTab === "announcements" ? "bg-purple-600/20 text-purple-300 border border-purple-500/30" : "text-gray-400 hover:text-white"
                }`}
              >
                Notices
              </button>
            </div>

            {isTeacherOrAdmin && (
              <button
                onClick={() => setShowUploadModal(true)}
                className="px-4 py-2 rounded-xl gradient-bg text-white text-xs font-bold shadow-glow hover:opacity-95 flex items-center gap-1.5 shrink-0"
              >
                <Plus className="w-4 h-4" />
                <span>Upload Lecture Notes</span>
              </button>
            )}
          </div>

          {/* LOCALIZED CONTENT SKELETON (Renders ONLY when loading for the first time without cached data) */}
          {loading && !classroomData.classroom ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="rounded-3xl glass-card border border-slate-800 p-5 space-y-4 animate-pulse">
                  <div className="flex items-start gap-4">
                    <div className="w-14 h-14 rounded-2xl bg-slate-800" />
                    <div className="space-y-2 flex-1">
                      <div className="h-4 bg-slate-800 rounded w-3/4" />
                      <div className="h-3 bg-slate-800/60 rounded w-1/2" />
                      <div className="h-3 bg-slate-800/40 rounded w-full" />
                    </div>
                  </div>
                  <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between">
                    <div className="h-4 bg-slate-800 rounded w-1/3" />
                    <div className="h-6 bg-slate-800 rounded w-1/4" />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <>
              {/* TAB 1: CLASSMATES / ENROLLED STUDENTS ROSTER */}
              {activeTab === "classmates" && (() => {
                const rawMates = classroomData.classmates || [];
                const mergedMates = [...rawMates];
                if (user && user.role === "STUDENT") {
                  const exists = mergedMates.some(
                    (m: any) => m.id === user.id || m.email === user.email || (m.name && m.name.toLowerCase() === user.name.toLowerCase())
                  );
                  if (!exists) {
                    mergedMates.push({
                      id: user.id || "current-user",
                      name: user.name,
                      email: user.email,
                      rollNumber: user.rollNumber || "A-244002",
                      className: user.className || selectedClass,
                      branch: user.branch || "Computer Science",
                      avatar: user.avatar || "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=400&auto=format&fit=crop&q=80",
                      xp: user.xp || 0,
                      level: user.level || 1,
                      streakDays: user.streakDays || 0,
                      bio: user.bio || "Student at Sarhad College",
                    });
                  }
                }

                return (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {mergedMates.length === 0 ? (
                      <div className="col-span-full text-center py-12 text-gray-500 glass-card rounded-3xl">
                        No registered students found in {selectedClass} yet.
                      </div>
                    ) : (
                      mergedMates.map((mate: any) => (
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
                              <h4 className="text-sm font-bold text-white group-hover:text-purple-300 transition-colors flex items-center gap-1.5">
                                <span>{mate.name}</span>
                                {user && (mate.email === user.email || mate.id === user.id) && (
                                  <span className="px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 text-[9px] font-black uppercase">
                                    (You)
                                  </span>
                                )}
                              </h4>
                              <p className="text-[11px] font-mono text-purple-400">{mate.rollNumber || "Registered Student"}</p>
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
                            </Link>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                );
              })()}

              {/* TAB 2: CLASS PROJECTS */}
              {activeTab === "projects" && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {classroomData.projects?.length === 0 ? (
                    <div className="col-span-full text-center py-12 text-gray-500 glass-card rounded-3xl">
                      No student projects published for {selectedClass} yet.
                    </div>
                  ) : (
                    classroomData.projects?.map((p: any) => (
                      <div key={p.id} className="rounded-3xl glass-card border border-slate-800 p-6 space-y-4 hover:border-purple-500/40 transition-all">
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <h4 className="text-base font-bold text-white mb-1">{p.title}</h4>
                            <p className="text-xs text-gray-400 leading-relaxed">{p.description}</p>
                          </div>
                        </div>

                        <div className="flex items-center justify-between pt-3 border-t border-slate-800/80">
                          <div className="flex items-center gap-2">
                            <img
                              src={p.user?.avatar || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80"}
                              alt={p.user?.name}
                              className="w-6 h-6 rounded-full object-cover"
                            />
                            <span className="text-xs font-semibold text-gray-300">{p.user?.name}</span>
                          </div>

                          <div className="flex items-center gap-2">
                            {p.githubUrl && (
                              <a
                                href={p.githubUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-gray-400 hover:text-white transition-all"
                              >
                                <Github className="w-3.5 h-3.5" />
                              </a>
                            )}
                            {p.liveDemoUrl && (
                              <a
                                href={p.liveDemoUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="p-2 rounded-xl bg-purple-500/10 border border-purple-500/30 text-purple-300 hover:text-white transition-all"
                              >
                                <ExternalLink className="w-3.5 h-3.5" />
                              </a>
                            )}
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}

              {/* TAB 3: TEACHER NOTES & STUDY MATERIALS */}
              {activeTab === "notes" && (
                <div className="space-y-3">
                  {classroomData.notes?.length === 0 ? (
                    <div className="text-center py-12 text-gray-500 glass-card rounded-3xl">
                      No study notes published by Class Teacher for {selectedClass} yet.
                    </div>
                  ) : (
                    classroomData.notes?.map((n: any) => (
                      <div key={n.id} className="rounded-2xl glass-card border border-slate-800 p-4 flex items-center justify-between gap-4 hover:border-purple-500/40 transition-all">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/30 text-purple-300 flex items-center justify-center font-bold">
                            <FileText className="w-5 h-5" />
                          </div>
                          <div>
                            <h4 className="text-sm font-bold text-white">{n.title}</h4>
                            <p className="text-xs text-gray-400">{n.description || "Course study material"}</p>
                            <span className="text-[10px] text-purple-400 font-mono">Subject: {n.subject || "Computer Science"}</span>
                          </div>
                        </div>

                        <a
                          href={n.fileUrl || "#"}
                          target="_blank"
                          rel="noreferrer"
                          className="px-3.5 py-2 rounded-xl bg-purple-600 text-white text-xs font-bold shadow-glow hover:opacity-95 transition-all flex items-center gap-1.5 shrink-0"
                        >
                          <Download className="w-3.5 h-3.5" />
                          <span>Download {n.fileType || "PDF"}</span>
                        </a>
                      </div>
                    ))
                  )}
                </div>
              )}

              {/* TAB 4: NOTICES & ANNOUNCEMENTS */}
              {activeTab === "announcements" && (
                <div className="space-y-3">
                  {classroomData.announcements?.length === 0 ? (
                    <div className="text-center py-12 text-gray-500 glass-card rounded-3xl">
                      No official notices posted for {selectedClass} yet.
                    </div>
                  ) : (
                    classroomData.announcements?.map((a: any) => (
                      <div key={a.id} className="rounded-2xl glass-card border border-slate-800 p-5 space-y-2">
                        <div className="flex items-center justify-between">
                          <h4 className="text-sm font-bold text-white flex items-center gap-2">
                            <Building2 className="w-4 h-4 text-purple-400" />
                            <span>{a.title}</span>
                          </h4>
                          <span className="text-[10px] text-gray-500 font-mono">
                            {a.createdAt ? new Date(a.createdAt).toLocaleDateString() : "Recent Notice"}
                          </span>
                        </div>
                        <p className="text-xs text-gray-300 leading-relaxed">{a.message}</p>
                      </div>
                    ))
                  )}
                </div>
              )}
            </>
          )}
        </main>
      </div>

      {/* UPLOAD NOTES MODAL */}
      {showUploadModal && (
        <div className="fixed inset-0 z-[999] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-lg glass-card border border-purple-500/40 rounded-3xl p-6 relative space-y-4 animate-in zoom-in-95 duration-200">
            <button
              onClick={() => setShowUploadModal(false)}
              className="absolute top-5 right-5 p-1 rounded-lg text-gray-400 hover:text-white"
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
