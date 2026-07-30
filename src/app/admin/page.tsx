"use client";

import React, { useState, useEffect } from "react";
import { Navbar } from "@/components/Navbar";
import { Sidebar } from "@/components/Sidebar";
import { useAuth } from "@/context/AuthContext";
import {
  ShieldCheck,
  Users,
  Code2,
  CheckCircle2,
  Plus,
  TrendingUp,
  UserCheck,
  UserPlus,
  Trash2,
  Edit,
  MessageSquare,
  ShieldAlert,
  Save,
  Check,
  X,
  GraduationCap,
  Building2,
  KeyRound,
} from "lucide-react";
import Link from "next/link";
import { availableStreams, availableClassrooms } from "@/components/AuthModal";

export default function AdminPage() {
  const { user } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"users" | "posts" | "ai_assistant">("users");
  const [aiSettings, setAiSettings] = useState({
    aiName: "Ido",
    aiAvatar: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=400&auto=format&fit=crop&q=80",
    aiSubtitle: "Sarhad College Virtual Guide & Coding Assistant",
    aiBadge: "FEMALE AI MENTOR 💖",
    personaInstruction: "You are Ido 👩‍💻, an intelligent female AI coding mentor at Sarhad College.",
  });
  const [savingAiSettings, setSavingAiSettings] = useState(false);

  const [adminData, setAdminData] = useState<any>({
    stats: {
      totalUsers: 0,
      totalStudents: 0,
      totalTeachers: 0,
      totalAdmins: 0,
      totalProblems: 0,
      totalSubmissions: 0,
      totalPosts: 0,
    },
    users: [],
    posts: [],
  });
  const [loading, setLoading] = useState(true);
  const [userRolesState, setUserRolesState] = useState<Record<string, string>>({});
  const [updateMsg, setUpdateMsg] = useState("");

  // Add User Modal State
  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [newUserName, setNewUserName] = useState("");
  const [newUserEmail, setNewUserEmail] = useState("");
  const [newUserPassword, setNewUserPassword] = useState("");
  const [newUserRole, setNewUserRole] = useState<"STUDENT" | "TEACHER">("STUDENT");
  const [newUserClass, setNewUserClass] = useState(availableClassrooms[0]);
  const [newUserBranch, setNewUserBranch] = useState(availableStreams[0]);
  const [newUserRollNo, setNewUserRollNo] = useState("");

  // Edit User Modal State
  const [showEditUserModal, setShowEditUserModal] = useState(false);
  const [editingUserId, setEditingUserId] = useState("");
  const [editUserName, setEditUserName] = useState("");
  const [editUserEmail, setEditUserEmail] = useState("");
  const [editUserPassword, setEditUserPassword] = useState("");
  const [editUserRole, setEditUserRole] = useState<"STUDENT" | "TEACHER" | "ADMIN">("STUDENT");
  const [editUserClass, setEditUserClass] = useState(availableClassrooms[0]);
  const [editUserBranch, setEditUserBranch] = useState(availableStreams[0]);
  const [editUserRollNo, setEditUserRollNo] = useState("");
  const [editUserXp, setEditUserXp] = useState(0);
  const [editUserCoins, setEditUserCoins] = useState(0);

  useEffect(() => {
    fetchAdminData();
    fetchAiSettings();
  }, []);

  const fetchAiSettings = async () => {
    try {
      const res = await fetch("/api/admin/ai-settings");
      const data = await res.json();
      if (data.settings) {
        setAiSettings(data.settings);
      }
    } catch (err) {
      console.error("Error fetching AI Settings:", err);
    }
  };

  const handleSaveAiSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingAiSettings(true);
    try {
      const res = await fetch("/api/admin/ai-settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(aiSettings),
      });

      const data = await res.json();
      if (res.ok) {
        setUpdateMsg("AI Assistant profile & avatar updated successfully! 🎉");
        setTimeout(() => setUpdateMsg(""), 4000);
      } else {
        alert("Failed to save AI Settings: " + data.error);
      }
    } catch (err: any) {
      alert("Error saving AI Settings: " + err.message);
    } finally {
      setSavingAiSettings(false);
    }
  };

  const fetchAdminData = async () => {
    try {
      const res = await fetch(`/api/admin?t=${Date.now()}`, { cache: "no-store" });
      const data = await res.json();
      if (data.stats) {
        setAdminData(data);
        const rolesMap: Record<string, string> = {};
        data.users.forEach((u: any) => {
          rolesMap[u.id] = u.role;
        });
        setUserRolesState(rolesMap);
      }
    } catch (err) {
      console.error("Error loading admin dashboard data:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleRoleChange = async (userId: string, newRole: string) => {
    try {
      const res = await fetch("/api/admin", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, newRole }),
      });

      const data = await res.json();
      if (res.ok) {
        setUserRolesState((prev) => ({ ...prev, [userId]: newRole }));
        setUpdateMsg(data.message || "User role updated!");
        setTimeout(() => setUpdateMsg(""), 3000);
        fetchAdminData();
      } else {
        alert("Role update failed: " + data.error);
      }
    } catch (err: any) {
      alert("Error: " + err.message);
    }
  };

  const openEditUserModal = (u: any) => {
    setEditingUserId(u.id);
    setEditUserName(u.name || "");
    setEditUserEmail(u.email || "");
    setEditUserPassword("");
    setEditUserRole(u.role || "STUDENT");
    setEditUserClass(u.className || availableClassrooms[0]);
    setEditUserBranch(u.branch || availableStreams[0]);
    setEditUserRollNo(u.rollNumber || "");
    setEditUserXp(u.xp || 0);
    setEditUserCoins(u.coins || 0);
    setShowEditUserModal(true);
  };

  const handleEditUserSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/admin", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: editingUserId,
          name: editUserName,
          email: editUserEmail,
          password: editUserPassword,
          role: editUserRole,
          className: editUserClass,
          branch: editUserBranch,
          rollNumber: editUserRollNo,
          xp: editUserXp,
          coins: editUserCoins,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setShowEditUserModal(false);
        setUpdateMsg(data.message || "User details updated successfully!");
        setTimeout(() => setUpdateMsg(""), 3000);
        fetchAdminData();
      } else {
        alert("Failed to update user: " + data.error);
      }
    } catch (err: any) {
      alert("Error: " + err.message);
    }
  };

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/admin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newUserName,
          email: newUserEmail,
          password: newUserPassword,
          role: newUserRole,
          className: newUserClass,
          branch: newUserBranch,
          rollNumber: newUserRollNo,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setShowAddUserModal(false);
        setNewUserName("");
        setNewUserEmail("");
        setNewUserPassword("");
        setNewUserRollNo("");
        setUpdateMsg(data.message || "User created successfully!");
        setTimeout(() => setUpdateMsg(""), 3000);
        fetchAdminData();
      } else {
        alert("Failed to add user: " + data.error);
      }
    } catch (err: any) {
      alert("Error: " + err.message);
    }
  };

  const handleDeleteUser = async (userId: string, name: string) => {
    if (!confirm(`Are you sure you want to permanently delete user "${name}"?`)) return;

    try {
      const res = await fetch(`/api/admin?userId=${userId}`, { method: "DELETE" });
      const data = await res.json();
      if (res.ok) {
        setUpdateMsg(data.message || "User deleted.");
        setTimeout(() => setUpdateMsg(""), 3000);
        fetchAdminData();
      } else {
        alert("Deletion failed: " + data.error);
      }
    } catch (err: any) {
      alert("Error: " + err.message);
    }
  };

  const handleDeletePost = async (postId: string) => {
    if (!confirm("Are you sure you want to delete this community post?")) return;

    try {
      const res = await fetch(`/api/admin?postId=${postId}`, { method: "DELETE" });
      const data = await res.json();
      if (res.ok) {
        setUpdateMsg(data.message || "Post deleted.");
        setTimeout(() => setUpdateMsg(""), 3000);
        fetchAdminData();
      } else {
        alert("Failed to delete post: " + data.error);
      }
    } catch (err: any) {
      alert("Error: " + err.message);
    }
  };

  // Guard Access: Only ADMIN role can view the Super Admin Console
  if (user?.role !== "ADMIN") {
    return (
      <div className="min-h-screen flex flex-col bg-[#070913] text-white">
        <Navbar />
        <div className="flex-1 flex items-center justify-center p-6 text-center">
          <div className="max-w-md p-8 glass-card border border-rose-500/30 rounded-3xl space-y-4">
            <ShieldAlert className="w-12 h-12 text-rose-500 mx-auto" />
            <h2 className="text-2xl font-black">Restricted Access</h2>
            <p className="text-xs text-gray-400">
              The Super Admin Console is strictly reserved for Admin accounts. Please log in with admin privileges.
            </p>
            <Link
              href="/"
              className="inline-block px-6 py-2.5 rounded-xl gradient-bg text-white text-xs font-bold shadow-glow"
            >
              Return to Campus Home
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
          <div className="rounded-3xl glass-card border border-rose-500/30 p-6 sm:p-8 relative overflow-hidden">
            <div className="flex items-center gap-2 text-xs font-bold text-rose-400 mb-2">
              <ShieldCheck className="w-4 h-4" />
              <span>SUPER ADMIN PRIVILEGES ACTIVE</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              Campus<span className="text-gradient">Code</span> Super Admin Console
            </h1>
            <p className="text-xs text-gray-400 mt-1">
              Manage student & teacher rosters, edit details, assign role permissions, customize AI Assistant Ido, and moderate community posts.
            </p>
          </div>

          {/* Success Banner */}
          {updateMsg && (
            <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold flex items-center gap-2 animate-in fade-in">
              <Check className="w-4 h-4" />
              <span>{updateMsg}</span>
            </div>
          )}

          {/* Stats Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="p-4 rounded-3xl glass-card border border-slate-800 space-y-1">
              <span className="text-xs font-semibold text-gray-400">Total Users</span>
              <span className="text-xl font-black text-white block">{adminData.stats.totalUsers ?? 0}</span>
            </div>
            <div className="p-4 rounded-3xl glass-card border border-slate-800 space-y-1">
              <span className="text-xs font-semibold text-gray-400">Students</span>
              <span className="text-xl font-black text-purple-300 block">{adminData.stats.totalStudents ?? 0}</span>
            </div>
            <div className="p-4 rounded-3xl glass-card border border-slate-800 space-y-1">
              <span className="text-xs font-semibold text-gray-400">Faculty / Teachers</span>
              <span className="text-xl font-black text-amber-300 block">{adminData.stats.totalTeachers ?? 0}</span>
            </div>
            <div className="p-4 rounded-3xl glass-card border border-slate-800 space-y-1">
              <span className="text-xs font-semibold text-gray-400">Community Posts</span>
              <span className="text-xl font-black text-cyan-300 block">{adminData.stats.totalPosts ?? 0}</span>
            </div>
          </div>

          {/* Tab Navigation */}
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setActiveTab("users")}
                className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all ${
                  activeTab === "users"
                    ? "bg-rose-600 text-white shadow-glow"
                    : "bg-slate-900 text-gray-400 hover:text-white"
                }`}
              >
                <Users className="w-4 h-4" />
                <span>User Roster & Roles ({adminData.users?.length || 0})</span>
              </button>

              <button
                onClick={() => setActiveTab("posts")}
                className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all ${
                  activeTab === "posts"
                    ? "bg-rose-600 text-white shadow-glow"
                    : "bg-slate-900 text-gray-400 hover:text-white"
                }`}
              >
                <MessageSquare className="w-4 h-4" />
                <span>Moderate Community Posts ({adminData.posts?.length || 0})</span>
              </button>

              <button
                onClick={() => setActiveTab("ai_assistant")}
                className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all ${
                  activeTab === "ai_assistant"
                    ? "bg-rose-600 text-white shadow-glow"
                    : "bg-slate-900 text-gray-400 hover:text-white"
                }`}
              >
                <Code2 className="w-4 h-4 text-pink-400" />
                <span>AI Assistant Profile & Persona</span>
              </button>
            </div>

            {/* Admin Action: Add New Student / Teacher */}
            <button
              onClick={() => setShowAddUserModal(true)}
              className="px-4 py-2 rounded-xl gradient-bg text-white text-xs font-bold shadow-glow hover:opacity-95 flex items-center gap-1.5"
            >
              <UserPlus className="w-4 h-4" />
              <span>Add New User</span>
            </button>
          </div>

          {/* TAB 1: USER ROSTER & ROLE MANAGEMENT */}
          {activeTab === "users" && (
            <div className="rounded-3xl glass-card border border-slate-800 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-950/80 text-gray-400 border-b border-slate-800 uppercase tracking-wider font-bold">
                    <tr>
                      <th className="px-6 py-4">User Name</th>
                      <th className="px-6 py-4">Email</th>
                      <th className="px-6 py-4">Roll No</th>
                      <th className="px-6 py-4">Batch / Class</th>
                      <th className="px-6 py-4">Current Role</th>
                      <th className="px-6 py-4">Change Role</th>
                      <th className="px-6 py-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {loading ? (
                      <tr>
                        <td colSpan={7} className="text-center py-12 text-gray-500 font-medium">
                          Loading user roster...
                        </td>
                      </tr>
                    ) : (
                      adminData.users.map((u: any) => (
                        <tr key={u.id} className="hover:bg-slate-800/40 transition-colors">
                          <td className="px-6 py-4 font-bold text-white flex items-center gap-2">
                            <span>{u.name}</span>
                            {u.id === user?.id && (
                              <span className="px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 text-[9px] font-black uppercase">
                                (You)
                              </span>
                            )}
                          </td>
                          <td className="px-6 py-4 font-mono text-gray-300">{u.email}</td>
                          <td className="px-6 py-4 font-mono text-purple-300 font-bold">{u.rollNumber || "N/A"}</td>
                          <td className="px-6 py-4 text-gray-400">{u.className || u.branch || "General"}</td>
                          <td className="px-6 py-4">
                            <span
                              className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase ${
                                userRolesState[u.id] === "ADMIN"
                                  ? "bg-rose-500/10 text-rose-400 border border-rose-500/30"
                                  : userRolesState[u.id] === "TEACHER"
                                  ? "bg-amber-500/10 text-amber-400 border border-amber-500/30"
                                  : "bg-purple-500/10 text-purple-300 border border-purple-500/30"
                              }`}
                            >
                              {userRolesState[u.id] || u.role}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <select
                              value={userRolesState[u.id] || u.role}
                              onChange={(e) => handleRoleChange(u.id, e.target.value)}
                              className="bg-slate-900 border border-slate-700 text-xs font-bold text-white rounded-xl px-3 py-1.5 focus:outline-none focus:border-purple-500 cursor-pointer"
                            >
                              <option value="STUDENT">STUDENT</option>
                              <option value="TEACHER">TEACHER</option>
                              <option value="ADMIN">ADMIN</option>
                            </select>
                          </td>
                          <td className="px-6 py-4 text-right flex items-center justify-end gap-2">
                            <button
                              onClick={() => openEditUserModal(u)}
                              className="p-2 rounded-xl bg-purple-500/10 border border-purple-500/30 text-purple-300 hover:bg-purple-500/20 transition-all"
                              title="Edit user details"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            {u.id !== user?.id && (
                              <button
                                onClick={() => handleDeleteUser(u.id, u.name)}
                                className="p-2 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 hover:bg-rose-500/20 transition-all"
                                title="Delete user account"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 2: MODERATE COMMUNITY POSTS */}
          {activeTab === "posts" && (
            <div className="space-y-4">
              {adminData.posts?.length === 0 ? (
                <div className="text-center py-12 text-gray-500 glass-card rounded-3xl">
                  No community posts found to moderate.
                </div>
              ) : (
                adminData.posts.map((post: any) => (
                  <div key={post.id} className="p-5 rounded-3xl glass-card border border-slate-800 flex items-start justify-between gap-4">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <img src={post.user?.avatar} alt={post.user?.name} className="w-6 h-6 rounded-full object-cover" />
                        <span className="text-xs font-bold text-white">{post.user?.name}</span>
                        <span className="text-[10px] text-purple-400 font-semibold">({post.user?.role})</span>
                        <span className="text-[10px] text-gray-500">• {new Date(post.createdAt).toLocaleDateString()}</span>
                      </div>

                      <p className="text-xs text-gray-300">{post.content}</p>
                    </div>

                    <button
                      onClick={() => handleDeletePost(post.id)}
                      className="px-3.5 py-2 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 hover:bg-rose-500/20 text-xs font-bold flex items-center gap-1.5 shrink-0"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Delete Post</span>
                    </button>
                  </div>
                ))
              )}
            </div>
          )}

          {/* TAB 3: AI ASSISTANT CUSTOMIZATION */}
          {activeTab === "ai_assistant" && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Customization Form Column */}
              <form onSubmit={handleSaveAiSettings} className="lg:col-span-7 rounded-3xl glass-card border border-slate-800 p-6 space-y-5">
                <div className="border-b border-slate-800 pb-3">
                  <h3 className="text-base font-black text-white flex items-center gap-2">
                    <Code2 className="w-5 h-5 text-pink-400" /> Customize AI Virtual Assistant (Ido)
                  </h3>
                  <p className="text-xs text-gray-400 mt-1">
                    Super Admin settings to update the AI Assistant's avatar photo, displayed name, role subtitle, and system persona.
                  </p>
                </div>

                <div className="space-y-4 text-xs">
                  {/* AI Assistant Name */}
                  <div>
                    <label className="font-bold text-gray-300 block mb-1">AI Assistant Name</label>
                    <input
                      type="text"
                      required
                      value={aiSettings.aiName}
                      onChange={(e) => setAiSettings({ ...aiSettings, aiName: e.target.value })}
                      placeholder="e.g. Ido"
                      className="w-full bg-slate-900 border border-slate-800 focus:border-purple-500 rounded-xl py-2.5 px-3 text-white focus:outline-none"
                    />
                  </div>

                  {/* AI Assistant Avatar URL */}
                  <div>
                    <label className="font-bold text-gray-300 block mb-1">AI Profile Avatar Photo URL</label>
                    <input
                      type="text"
                      required
                      value={aiSettings.aiAvatar}
                      onChange={(e) => setAiSettings({ ...aiSettings, aiAvatar: e.target.value })}
                      placeholder="https://images.unsplash.com/..."
                      className="w-full bg-slate-900 border border-slate-800 focus:border-purple-500 rounded-xl py-2.5 px-3 text-white focus:outline-none font-mono"
                    />
                  </div>

                  {/* Preset Avatar Pickers */}
                  <div>
                    <label className="font-bold text-gray-300 block mb-2">Or Choose Preset AI Avatars</label>
                    <div className="flex items-center gap-3 overflow-x-auto pb-1">
                      {[
                        "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=400&auto=format&fit=crop&q=80",
                        "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=400&auto=format&fit=crop&q=80",
                        "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80",
                        "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400&auto=format&fit=crop&q=80",
                        "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&auto=format&fit=crop&q=80",
                      ].map((url, i) => (
                        <img
                          key={i}
                          src={url}
                          alt="Preset Avatar"
                          onClick={() => setAiSettings({ ...aiSettings, aiAvatar: url })}
                          className={`w-12 h-12 rounded-2xl object-cover cursor-pointer transition-all border-2 ${
                            aiSettings.aiAvatar === url ? "border-pink-500 scale-105 shadow-glow" : "border-slate-800 opacity-70 hover:opacity-100"
                          }`}
                        />
                      ))}
                    </div>
                  </div>

                  {/* Role Subtitle & Badge */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="font-bold text-gray-300 block mb-1">Role Subtitle</label>
                      <input
                        type="text"
                        value={aiSettings.aiSubtitle}
                        onChange={(e) => setAiSettings({ ...aiSettings, aiSubtitle: e.target.value })}
                        placeholder="e.g. Sarhad College Virtual Guide"
                        className="w-full bg-slate-900 border border-slate-800 focus:border-purple-500 rounded-xl py-2.5 px-3 text-white focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="font-bold text-gray-300 block mb-1">Header Badge</label>
                      <input
                        type="text"
                        value={aiSettings.aiBadge}
                        onChange={(e) => setAiSettings({ ...aiSettings, aiBadge: e.target.value })}
                        placeholder="e.g. FEMALE AI MENTOR 💖"
                        className="w-full bg-slate-900 border border-slate-800 focus:border-purple-500 rounded-xl py-2.5 px-3 text-white focus:outline-none"
                      />
                    </div>
                  </div>

                  {/* System Persona Prompt */}
                  <div>
                    <label className="font-bold text-gray-300 block mb-1">System Persona Instruction Prompt</label>
                    <textarea
                      rows={3}
                      value={aiSettings.personaInstruction}
                      onChange={(e) => setAiSettings({ ...aiSettings, personaInstruction: e.target.value })}
                      placeholder="You are Ido, an intelligent female AI coding mentor at Sarhad College..."
                      className="w-full bg-slate-900 border border-slate-800 focus:border-purple-500 rounded-xl p-3 text-white focus:outline-none"
                    />
                  </div>
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={savingAiSettings}
                    className="w-full py-3 rounded-xl gradient-bg text-white font-bold shadow-glow hover:opacity-95 transition-all text-xs flex items-center justify-center gap-2"
                  >
                    <Save className="w-4 h-4" />
                    <span>{savingAiSettings ? "Saving AI Settings..." : "Save AI Assistant Customizations"}</span>
                  </button>
                </div>
              </form>

              {/* Live Preview Column */}
              <div className="lg:col-span-5 space-y-4">
                <div className="rounded-3xl glass-card border border-pink-500/40 p-5 space-y-4 bg-[#0c0a1a]">
                  <div className="text-xs font-black text-pink-400 uppercase tracking-wider flex items-center gap-1.5 border-b border-slate-800 pb-2">
                    <CheckCircle2 className="w-4 h-4" /> Live AI Assistant Card Preview
                  </div>

                  <div className="p-4 bg-slate-950/90 rounded-2xl border border-slate-800 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <img
                        src={aiSettings.aiAvatar}
                        alt="AI Avatar Preview"
                        className="w-12 h-12 rounded-2xl object-cover ring-2 ring-pink-400 shadow-glow shrink-0"
                      />
                      <div className="min-w-0">
                        <h4 className="text-sm font-black text-white flex items-center gap-1.5 truncate">
                          <span>{aiSettings.aiName || "Ido"} 👩‍💻</span>
                          <span className="px-2 py-0.5 rounded-full bg-pink-500/20 text-pink-300 border border-pink-500/30 text-[9px] font-bold shrink-0">
                            {aiSettings.aiBadge || "FEMALE AI MENTOR 💖"}
                          </span>
                        </h4>
                        <p className="text-[10px] text-gray-400 truncate">{aiSettings.aiSubtitle || "Virtual Guide"}</p>
                      </div>
                    </div>
                  </div>

                  <div className="p-4 rounded-2xl bg-slate-900 border border-pink-500/30 text-xs text-gray-200 space-y-1">
                    <p className="font-bold text-pink-300 text-[11px]">🤖 {aiSettings.aiName || "Ido"} AI Chat Preview:</p>
                    <p className="text-[11px] text-gray-300 leading-relaxed">
                      "Hello Prathmesh! 👋 I'm <b>{aiSettings.aiName || "Ido"}</b>, your AI Virtual Assistant & Coding Mentor at Sarhad College. How can I help you today?"
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* Edit User Modal */}
      {showEditUserModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="relative w-full max-w-lg glass-card border border-purple-500/40 rounded-3xl p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setShowEditUserModal(false)}
              className="absolute top-4 right-4 p-2 rounded-xl text-gray-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-lg font-bold text-white flex items-center gap-2 border-b border-slate-800 pb-3">
              <Edit className="w-5 h-5 text-purple-400" /> Edit Student / Teacher Details
            </h3>

            <form onSubmit={handleEditUserSubmit} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-gray-300 block mb-1">Full Name</label>
                  <input
                    type="text"
                    required
                    value={editUserName}
                    onChange={(e) => setEditUserName(e.target.value)}
                    placeholder="User Name"
                    className="w-full bg-slate-900 border border-slate-800 focus:border-purple-500 rounded-xl py-2.5 px-3 text-white focus:outline-none"
                  />
                </div>
                <div>
                  <label className="font-bold text-gray-300 block mb-1">Email Address</label>
                  <input
                    type="email"
                    required
                    value={editUserEmail}
                    onChange={(e) => setEditUserEmail(e.target.value)}
                    placeholder="user@campus.edu"
                    className="w-full bg-slate-900 border border-slate-800 focus:border-purple-500 rounded-xl py-2.5 px-3 text-white focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-gray-300 block mb-1">Roll Number</label>
                  <input
                    type="text"
                    value={editUserRollNo}
                    onChange={(e) => setEditUserRollNo(e.target.value)}
                    placeholder="A-244001"
                    className="w-full bg-slate-900 border border-slate-800 focus:border-purple-500 rounded-xl py-2.5 px-3 text-white focus:outline-none font-mono"
                  />
                </div>
                <div>
                  <label className="font-bold text-gray-300 block mb-1">Account Role</label>
                  <select
                    value={editUserRole}
                    onChange={(e) => setEditUserRole(e.target.value as any)}
                    className="w-full bg-slate-900 border border-slate-800 focus:border-purple-500 rounded-xl py-2.5 px-3 text-white focus:outline-none"
                  >
                    <option value="STUDENT">STUDENT</option>
                    <option value="TEACHER">TEACHER</option>
                    <option value="ADMIN">ADMIN</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-gray-300 block mb-1">Classroom / Batch</label>
                  <select
                    value={editUserClass}
                    onChange={(e) => setEditUserClass(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 focus:border-purple-500 rounded-xl py-2.5 px-3 text-white focus:outline-none"
                  >
                    {availableClassrooms.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="font-bold text-gray-300 block mb-1">Stream / Branch</label>
                  <select
                    value={editUserBranch}
                    onChange={(e) => setEditUserBranch(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 focus:border-purple-500 rounded-xl py-2.5 px-3 text-white focus:outline-none"
                  >
                    {availableStreams.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-gray-300 block mb-1">XP Points</label>
                  <input
                    type="number"
                    value={editUserXp}
                    onChange={(e) => setEditUserXp(Number(e.target.value))}
                    className="w-full bg-slate-900 border border-slate-800 focus:border-purple-500 rounded-xl py-2.5 px-3 text-white focus:outline-none font-mono"
                  />
                </div>

                <div>
                  <label className="font-bold text-gray-300 block mb-1">Coins Balance</label>
                  <input
                    type="number"
                    value={editUserCoins}
                    onChange={(e) => setEditUserCoins(Number(e.target.value))}
                    className="w-full bg-slate-900 border border-slate-800 focus:border-purple-500 rounded-xl py-2.5 px-3 text-white focus:outline-none font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-gray-300 block mb-1 flex items-center gap-1">
                  <KeyRound className="w-3.5 h-3.5 text-amber-400" /> Reset Password (Optional)
                </label>
                <input
                  type="password"
                  value={editUserPassword}
                  onChange={(e) => setEditUserPassword(e.target.value)}
                  placeholder="Leave blank to keep existing password"
                  className="w-full bg-slate-900 border border-slate-800 focus:border-purple-500 rounded-xl py-2.5 px-3 text-white focus:outline-none"
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  className="w-full py-3 rounded-xl gradient-bg text-white font-bold shadow-glow hover:opacity-95 flex items-center justify-center gap-2 text-xs"
                >
                  <Save className="w-4 h-4" />
                  <span>Save User Changes</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add User Modal */}
      {showAddUserModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="relative w-full max-w-md glass-card border border-rose-500/30 rounded-3xl p-6 space-y-4">
            <button
              onClick={() => setShowAddUserModal(false)}
              className="absolute top-4 right-4 p-2 rounded-xl text-gray-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <UserPlus className="w-5 h-5 text-rose-400" /> Create New Student / Teacher Account
            </h3>

            <form onSubmit={handleAddUser} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-2 bg-slate-950 p-1.5 rounded-2xl border border-slate-800">
                <button
                  type="button"
                  onClick={() => setNewUserRole("STUDENT")}
                  className={`py-2 rounded-xl font-bold transition-all ${
                    newUserRole === "STUDENT" ? "bg-rose-600 text-white shadow-glow" : "text-gray-400 hover:text-white"
                  }`}
                >
                  Student Account
                </button>
                <button
                  type="button"
                  onClick={() => setNewUserRole("TEACHER")}
                  className={`py-2 rounded-xl font-bold transition-all ${
                    newUserRole === "TEACHER" ? "bg-rose-600 text-white shadow-glow" : "text-gray-400 hover:text-white"
                  }`}
                >
                  Teacher Account
                </button>
              </div>

              <div>
                <label className="font-bold text-gray-300 block mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  value={newUserName}
                  onChange={(e) => setNewUserName(e.target.value)}
                  placeholder="e.g. Student Name"
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl py-2.5 px-3 text-white focus:outline-none focus:border-rose-500"
                />
              </div>

              <div>
                <label className="font-bold text-gray-300 block mb-1">Email Address</label>
                <input
                  type="email"
                  required
                  value={newUserEmail}
                  onChange={(e) => setNewUserEmail(e.target.value)}
                  placeholder="user@campus.edu"
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl py-2.5 px-3 text-white focus:outline-none"
                />
              </div>

              <div>
                <label className="font-bold text-gray-300 block mb-1">Password</label>
                <input
                  type="password"
                  required
                  value={newUserPassword}
                  onChange={(e) => setNewUserPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl py-2.5 px-3 text-white focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-gray-300 block mb-1">Classroom</label>
                  <select
                    value={newUserClass}
                    onChange={(e) => setNewUserClass(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl py-2.5 px-3 text-white focus:outline-none"
                  >
                    {availableClassrooms.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="font-bold text-gray-300 block mb-1">Roll Number</label>
                  <input
                    type="text"
                    value={newUserRollNo}
                    onChange={(e) => setNewUserRollNo(e.target.value)}
                    placeholder="A-244001"
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl py-2.5 px-3 text-white focus:outline-none"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-3 rounded-xl gradient-bg text-white font-bold shadow-glow hover:opacity-95 flex items-center justify-center gap-2"
              >
                <UserPlus className="w-4 h-4" />
                <span>Create Account Now</span>
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
