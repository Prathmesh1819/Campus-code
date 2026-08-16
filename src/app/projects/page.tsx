"use client";

import React, { useState, useEffect } from "react";
import { Navbar } from "@/components/Navbar";
import { Sidebar } from "@/components/Sidebar";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/lib/supabase";
import {
  FolderGit2,
  Heart,
  ExternalLink,
  Github,
  Plus,
  Search,
  Trophy,
  Eye,
  X,
} from "lucide-react";

export default function ProjectsPage() {
  const { user } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState("ALL");
  const [search, setSearch] = useState("");
  const [showUploadModal, setShowUploadModal] = useState(false);

  // New Project Form state
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("Web App");
  const [tags, setTags] = useState("Next.js 15, TypeScript, Tailwind");
  const [githubUrl, setGithubUrl] = useState("");
  const [liveDemoUrl, setLiveDemoUrl] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [isHackathonWinner, setIsHackathonWinner] = useState(false);

  const fetchProjects = async () => {
    try {
      const query = new URLSearchParams();
      if (selectedCategory !== "ALL") query.append("category", selectedCategory);
      if (search) query.append("search", search);

      const res = await fetch(`/api/projects?${query.toString()}`);
      const data = await res.json();
      if (data.projects) setProjects(data.projects);
    } catch {
      // Fallback mock projects
      setProjects([
        {
          id: "proj-1",
          title: "CampusCode - Real-time AI Code Reviewer",
          description: "Automated AST code analysis and runtime optimizations for college student submissions.",
          category: "AI/ML",
          tags: '["Next.js 15", "TypeScript", "Prisma", "Tailwind CSS"]',
          githubUrl: "https://github.com/aaravsharma/campuscode",
          liveDemoUrl: "https://campuscode.demo",
          imageUrl: "https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=800&auto=format&fit=crop&q=80",
          likesCount: 42,
          viewsCount: 280,
          isHackathonWinner: true,
          user: { name: "Aarav Sharma", avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80", branch: "CSE" },
        },
        {
          id: "proj-2",
          title: "PulseGuard - Smart Campus Health Monitor",
          description: "IoT and React Native mobile application for tracking campus emergency alerts.",
          category: "Mobile App",
          tags: '["React Native", "Node.js", "Socket.io", "PostgreSQL"]',
          githubUrl: "https://github.com/ananyaroy/pulseguard",
          liveDemoUrl: "https://pulseguard.io",
          imageUrl: "https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=800&auto=format&fit=crop&q=80",
          likesCount: 29,
          viewsCount: 195,
          isHackathonWinner: false,
          user: { name: "Ananya Roy", avatar: "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=400&auto=format&fit=crop&q=80", branch: "IT" },
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();

    const channel = supabase
      .channel("projects-realtime-channel")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "projects" },
        () => {
          fetchProjects();
        }
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "project_likes" },
        () => {
          fetchProjects();
        }
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "project_comments" },
        () => {
          fetchProjects();
        }
      )
      .subscribe((status, err) => {
        if (err) {
          console.warn("[Realtime Projects] Subscription error:", err);
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [selectedCategory, search]);

  const handleLike = async (projectId: string) => {
    try {
      await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "like", userId: user?.id, projectId }),
      });
      fetchProjects();
    } catch {
      // Local optimistic update
      setProjects((prev) =>
        prev.map((p) => (p.id === projectId ? { ...p, likesCount: p.likesCount + 1 } : p))
      );
    }
  };

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user?.id,
          title,
          description,
          category,
          tags: tags.split(",").map((t) => t.trim()),
          githubUrl,
          liveDemoUrl,
          imageUrl,
          isHackathonWinner,
        }),
      });
      setShowUploadModal(false);
      fetchProjects();
    } catch (err: any) {
      alert("Failed to submit project: " + err.message);
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar onToggleSidebar={() => setSidebarOpen(!sidebarOpen)} />

      <div className="flex-1 flex max-w-7xl w-full mx-auto">
        <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

        <main className="flex-1 p-4 lg:p-8 space-y-6 overflow-y-auto">
          {/* Header Banner & Submit Action */}
          <div className="rounded-3xl glass-card border border-purple-500/30 p-6 sm:p-8 relative overflow-hidden flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-xs font-bold text-cyan-400">
                <FolderGit2 className="w-4 h-4" />
                <span>STUDENT PORTFOLIO & SHOWCASE</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                Showcase Your College Projects & Achievements
              </h1>
              <p className="text-xs sm:text-sm text-gray-400 max-w-xl">
                Upload your hackathon wins, open source repos, and web apps to gain peer recognition, likes, and feedback.
              </p>
            </div>

            <button
              onClick={() => setShowUploadModal(true)}
              className="px-6 py-3 rounded-2xl gradient-bg text-white text-xs font-bold shadow-glow hover:opacity-95 transition-all flex items-center gap-2 shrink-0"
            >
              <Plus className="w-4 h-4" />
              <span>Publish Project</span>
            </button>
          </div>

          {/* Search & Category Pills */}
          <div className="glass-card p-4 rounded-2xl border border-slate-800 space-y-3">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="relative w-full sm:w-80">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search project title or tech tag..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl py-2 pl-10 pr-4 text-xs text-white placeholder-gray-500 focus:outline-none"
                />
              </div>

              <div className="flex items-center gap-2 overflow-x-auto w-full sm:w-auto">
                {["ALL", "Web App", "Mobile App", "AI/ML", "Blockchain", "Open Source"].map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                      selectedCategory === cat
                        ? "bg-purple-600 text-white shadow-glow"
                        : "bg-slate-900 text-gray-400 hover:text-gray-200"
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Projects Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {projects.map((proj) => {
              const tagList: string[] = typeof proj.tags === "string" ? JSON.parse(proj.tags) : proj.tags || [];
              return (
                <div
                  key={proj.id}
                  className="rounded-3xl glass-card border border-slate-800/80 overflow-hidden hover:border-purple-500/30 transition-all group flex flex-col justify-between"
                >
                  <div>
                    {/* Cover Image */}
                    <div className="relative h-48 w-full bg-slate-950 overflow-hidden">
                      <img
                        src={proj.imageUrl || "https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=800&auto=format&fit=crop&q=80"}
                        alt={proj.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                      {proj.isHackathonWinner && (
                        <div className="absolute top-3 left-3 px-3 py-1 rounded-full bg-amber-500 text-slate-950 font-black text-[10px] shadow-lg flex items-center gap-1">
                          <Trophy className="w-3 h-3 fill-slate-950" /> Hackathon Winner
                        </div>
                      )}
                      <span className="absolute top-3 right-3 px-3 py-1 rounded-full bg-slate-950/80 backdrop-blur-md border border-slate-700 text-purple-300 text-[10px] font-bold">
                        {proj.category}
                      </span>
                    </div>

                    {/* Card Content */}
                    <div className="p-6 space-y-4">
                      {/* Author Header */}
                      <div className="flex items-center gap-3">
                        <img
                          src={proj.user?.avatar || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80"}
                          alt={proj.user?.name}
                          className="w-8 h-8 rounded-xl object-cover ring-2 ring-purple-500/30"
                        />
                        <div>
                          <p className="text-xs font-bold text-white">{proj.user?.name || "Aarav Sharma"}</p>
                          <p className="text-[10px] text-gray-400">{proj.user?.branch || "CSE Department"}</p>
                        </div>
                      </div>

                      <div>
                        <h3 className="text-lg font-bold text-white group-hover:text-purple-300 transition-colors">
                          {proj.title}
                        </h3>
                        <p className="text-xs text-gray-400 line-clamp-2 mt-1 leading-relaxed">
                          {proj.description}
                        </p>
                      </div>

                      {/* Tech Tags */}
                      <div className="flex flex-wrap gap-1.5">
                        {tagList.map((tag, i) => (
                          <span key={i} className="px-2.5 py-0.5 rounded-md bg-slate-900 border border-slate-800 text-[10px] font-mono text-purple-300">
                            #{tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Card Footer Actions */}
                  <div className="px-6 py-4 border-t border-slate-800/60 bg-slate-950/40 flex items-center justify-between">
                    <div className="flex items-center gap-4 text-xs font-bold text-gray-400">
                      <button
                        onClick={() => handleLike(proj.id)}
                        className="flex items-center gap-1.5 hover:text-rose-400 transition-colors"
                      >
                        <Heart className="w-4 h-4 text-rose-500 fill-rose-500" />
                        <span>{proj.likesCount || 0}</span>
                      </button>
                      <span className="flex items-center gap-1.5">
                        <Eye className="w-4 h-4 text-gray-500" />
                        <span>{proj.viewsCount || 0}</span>
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      {proj.githubUrl && (
                        <a
                          href={proj.githubUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-gray-400 hover:text-white hover:border-slate-700 transition-all"
                        >
                          <Github className="w-4 h-4" />
                        </a>
                      )}
                      {proj.liveDemoUrl && (
                        <a
                          href={proj.liveDemoUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="px-3 py-1.5 rounded-xl gradient-bg text-white text-xs font-bold shadow-glow hover:opacity-95 transition-all flex items-center gap-1"
                        >
                          <span>Demo</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </main>
      </div>

      {/* Upload Project Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="relative w-full max-w-lg glass-card border border-purple-500/30 rounded-3xl p-6 sm:p-8 shadow-2xl">
            <button
              onClick={() => setShowUploadModal(false)}
              className="absolute top-4 right-4 p-2 rounded-xl text-gray-400 hover:text-white hover:bg-slate-800"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-xl font-extrabold text-white mb-4">Publish Student Project</h3>
            <form onSubmit={handleCreateProject} className="space-y-4 text-xs">
              <div>
                <label className="font-bold text-gray-300 block mb-1">Project Title</label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Real-time AI Code Reviewer"
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl py-2.5 px-3 text-white focus:outline-none focus:border-purple-500"
                />
              </div>

              <div>
                <label className="font-bold text-gray-300 block mb-1">Description</label>
                <textarea
                  required
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Explain what your project solves..."
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl py-2.5 px-3 text-white focus:outline-none focus:border-purple-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-gray-300 block mb-1">Category</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl py-2.5 px-3 text-white focus:outline-none"
                  >
                    <option value="Web App">Web App</option>
                    <option value="Mobile App">Mobile App</option>
                    <option value="AI/ML">AI / ML</option>
                    <option value="Blockchain">Blockchain</option>
                    <option value="Open Source">Open Source</option>
                  </select>
                </div>

                <div>
                  <label className="font-bold text-gray-300 block mb-1">Tech Tags (comma separated)</label>
                  <input
                    type="text"
                    value={tags}
                    onChange={(e) => setTags(e.target.value)}
                    placeholder="Next.js, Python, OpenCV"
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl py-2.5 px-3 text-white focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-gray-300 block mb-1">GitHub Repo Link</label>
                  <input
                    type="url"
                    value={githubUrl}
                    onChange={(e) => setGithubUrl(e.target.value)}
                    placeholder="https://github.com/user/repo"
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl py-2.5 px-3 text-white focus:outline-none"
                  />
                </div>
                <div>
                  <label className="font-bold text-gray-300 block mb-1">Live Demo URL</label>
                  <input
                    type="url"
                    value={liveDemoUrl}
                    onChange={(e) => setLiveDemoUrl(e.target.value)}
                    placeholder="https://myproject.vercel.app"
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl py-2.5 px-3 text-white focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="hackathonWin"
                  checked={isHackathonWinner}
                  onChange={(e) => setIsHackathonWinner(e.target.checked)}
                  className="rounded border-slate-800 text-purple-600 focus:ring-purple-500"
                />
                <label htmlFor="hackathonWin" className="font-semibold text-gray-300">
                  This project won a Hackathon 🏆
                </label>
              </div>

              <button
                type="submit"
                className="w-full py-3 rounded-xl gradient-bg text-white text-xs font-bold shadow-glow hover:opacity-95 transition-all mt-2"
              >
                Submit Project (+200 XP)
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
