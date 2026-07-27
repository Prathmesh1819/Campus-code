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
  MessageSquare,
  ShieldAlert,
  Save,
  Check,
  X,
  GraduationCap,
  Building2,
} from "lucide-react";
import Link from "next/link";
import { availableStreams, availableClassrooms } from "@/components/AuthModal";

export default function AdminPage() {
  const { user } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"users" | "posts" | "stats">("users");

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

  useEffect(() => {
    fetchAdminData();
  }, []);

  const fetchAdminData = async () => {
    try {
      const res = await fetch("/api/admin");
      const data = await res.json();
      if (data.users) {
        setAdminData(data);
        const rolesMap: Record<string, string> = {};
        data.users.forEach((u: any) => {
          rolesMap[u.id] = u.role;
        });
        setUserRolesState(rolesMap);
      }
    } catch (err: any) {
      console.error("Admin fetch error:", err);
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
        setUpdateMsg(`Created new ${newUserRole} account for ${newUserName}`);
        setTimeout(() => setUpdateMsg(""), 3000);
        setShowAddUserModal(false);
        setNewUserName("");
        setNewUserEmail("");
        setNewUserPassword("");
        fetchAdminData();
      } else {
        alert("User creation error: " + data.error);
      }
    } catch (err: any) {
      alert("Error creating user: " + err.message);
    }
  };

  const handleDeleteUser = async (userId: string, userName: string) => {
    if (!confirm(`Are you sure you want to permanently delete user "${userName}"?`)) return;

    try {
      const res = await fetch(`/api/admin?userId=${userId}`, { method: "DELETE" });
      const data = await res.json();
      if (res.ok) {
        setUpdateMsg(`User "${userName}" deleted successfully.`);
        setTimeout(() => setUpdateMsg(""), 3000);
        fetchAdminData();
      } else {
        alert("Delete failed: " + data.error);
      }
    } catch (err: any) {
      alert("Error deleting user: " + err.message);
    }
  };

  const handleDeletePost = async (postId: string) => {
    if (!confirm("Are you sure you want to delete this community post?")) return;

    try {
      const res = await fetch(`/api/admin?postId=${postId}`, { method: "DELETE" });
      const data = await res.json();
      if (res.ok) {
        setUpdateMsg("Post deleted successfully.");
        setTimeout(() => setUpdateMsg(""), 3000);
        fetchAdminData();
      }
    } catch (err: any) {
      alert("Error deleting post: " + err.message);
    }
  };

  // Role Access Guard: Only ADMIN can access Admin Portal
  if (user?.role !== "ADMIN") {
    return (
      <div className="min-h-screen flex flex-col bg-[#070913] text-white">
        <Navbar />
        <div className="flex-1 flex items-center justify-center p-6">
          <div className="max-w-md w-full glass-card border border-rose-500/30 rounded-3xl p-8 text-center space-y-4">
            <div className="w-16 h-16 rounded-3xl bg-rose-500/10 border border-rose-500/30 text-rose-400 mx-auto flex items-center justify-center">
              <ShieldAlert className="w-8 h-8" />
            </div>
            <h2 className="text-xl font-black">Admin Console Access Denied</h2>
            <p className="text-xs text-gray-400">
              Only Super Administrators have permission to add, delete, or manage users and posts.
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
          <div className="rounded-3xl glass-card border border-rose-500/30 p-6 sm:p-8 relative overflow-hidden">
            <div className="flex items-center gap-2 text-xs font-bold text-rose-400 mb-2">
              <ShieldCheck className="w-4 h-4" />
              <span>SUPER ADMIN CONSOLE</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              User & Content Management Center
            </h1>
            <p className="text-xs sm:text-sm text-gray-400 mt-1 max-w-2xl">
              Add or delete student/teacher accounts, assign roles, and moderate community posts across CampusCode.
            </p>
          </div>

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
              <span className="text-xl font-black text-white block">{adminData.stats.totalUsers || 4}</span>
            </div>
            <div className="p-4 rounded-3xl glass-card border border-slate-800 space-y-1">
              <span className="text-xs font-semibold text-gray-400">Students</span>
              <span className="text-xl font-black text-purple-300 block">{adminData.stats.totalStudents || 3}</span>
            </div>
            <div className="p-4 rounded-3xl glass-card border border-slate-800 space-y-1">
              <span className="text-xs font-semibold text-gray-400">Faculty / Teachers</span>
              <span className="text-xl font-black text-amber-300 block">{adminData.stats.totalTeachers || 1}</span>
            </div>
            <div className="p-4 rounded-3xl glass-card border border-slate-800 space-y-1">
              <span className="text-xs font-semibold text-gray-400">Community Posts</span>
              <span className="text-xl font-black text-cyan-300 block">{adminData.stats.totalPosts || 0}</span>
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
                      <th className="px-6 py-4">Batch / Class</th>
                      <th className="px-6 py-4">Current Role</th>
                      <th className="px-6 py-4">Change Role</th>
                      <th className="px-6 py-4 text-right">Delete User</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {loading ? (
                      <tr>
                        <td colSpan={6} className="text-center py-12 text-gray-500 font-medium">
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
                          <td className="px-6 py-4 text-right">
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
        </main>
      </div>

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
                  Student
                </button>
                <button
                  type="button"
                  onClick={() => setNewUserRole("TEACHER")}
                  className={`py-2 rounded-xl font-bold transition-all ${
                    newUserRole === "TEACHER" ? "bg-rose-600 text-white shadow-glow" : "text-gray-400 hover:text-white"
                  }`}
                >
                  Teacher / Faculty
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
                    placeholder="2024-BSC-010"
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl py-2.5 px-3 text-white focus:outline-none"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-3 rounded-xl gradient-bg text-white font-bold shadow-glow hover:opacity-95 flex items-center justify-center gap-2"
              >
                <UserPlus className="w-4 h-4" />
                <span>Create User Account</span>
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
