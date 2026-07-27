"use client";

import React, { useState } from "react";
import { Navbar } from "@/components/Navbar";
import { Sidebar } from "@/components/Sidebar";
import { useAuth } from "@/context/AuthContext";
import { Settings as SettingsIcon, User, Lock, Save, Camera, Upload, Check, Github, Linkedin } from "lucide-react";

const presetAvatars = [
  "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=400&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=400&auto=format&fit=crop&q=80",
];

export default function SettingsPage() {
  const { user, updateUserAvatar, updateUserProfile } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [name, setName] = useState(user?.name || "Student Name");
  const [email, setEmail] = useState(user?.email || "student@campus.edu");
  const [bio, setBio] = useState(user?.bio || "Student Programmer at CampusCode");
  const [githubUrl, setGithubUrl] = useState(user?.githubUrl || "");
  const [linkedinUrl, setLinkedinUrl] = useState(user?.linkedinUrl || "");
  const [avatarUrl, setAvatarUrl] = useState(user?.avatar || presetAvatars[0]);
  const [successMsg, setSuccessMsg] = useState("");

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (typeof reader.result === "string") {
          setAvatarUrl(reader.result);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    updateUserAvatar(avatarUrl);
    updateUserProfile({ name, email, bio, githubUrl, linkedinUrl });
    setSuccessMsg("Profile, social links, and avatar updated successfully!");
    setTimeout(() => setSuccessMsg(""), 3000);
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#070913]">
      <Navbar onToggleSidebar={() => setSidebarOpen(!sidebarOpen)} />

      <div className="flex-1 flex max-w-7xl w-full mx-auto">
        <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

        <main className="flex-1 p-4 lg:p-8 space-y-6 overflow-y-auto">
          <div className="rounded-3xl glass-card border border-purple-500/30 p-6 sm:p-8 relative overflow-hidden">
            <div className="flex items-center gap-2 text-xs font-bold text-purple-400 mb-2">
              <SettingsIcon className="w-4 h-4" />
              <span>STUDENT ACCOUNT SETTINGS</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              Profile Customization & Social Links
            </h1>
            <p className="text-xs text-gray-400 mt-1">Upload profile photo from device, link your GitHub & LinkedIn accounts, or update bio.</p>
          </div>

          {successMsg && (
            <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold flex items-center gap-2 animate-in fade-in">
              <Check className="w-4 h-4" />
              <span>{successMsg}</span>
            </div>
          )}

          <div className="rounded-3xl glass-card border border-slate-800 p-6 sm:p-8 max-w-2xl space-y-6">
            <form onSubmit={handleSave} className="space-y-6 text-xs">
              {/* Profile Picture Upload Section */}
              <div className="space-y-4">
                <label className="font-bold text-gray-200 block text-xs uppercase tracking-wider">
                  Profile Picture / Avatar
                </label>

                <div className="flex flex-col sm:flex-row items-center gap-6 p-4 rounded-2xl bg-slate-900 border border-slate-800">
                  <div className="relative group shrink-0">
                    <img
                      src={avatarUrl}
                      alt="Avatar Preview"
                      className="w-24 h-24 rounded-2xl object-cover ring-4 ring-purple-500/40 shadow-glow"
                    />
                    <label htmlFor="device-file-upload" className="absolute inset-0 rounded-2xl bg-black/50 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center transition-opacity cursor-pointer text-white text-[10px] font-bold">
                      <Camera className="w-6 h-6 mb-0.5" />
                      <span>Change</span>
                    </label>
                  </div>

                  <div className="space-y-3 flex-1 w-full">
                    {/* Device Upload Button */}
                    <div>
                      <span className="text-[11px] font-semibold text-gray-300 block mb-1">Upload From Device</span>
                      <label
                        htmlFor="device-file-upload"
                        className="w-full px-4 py-2.5 rounded-xl bg-purple-600/20 border border-purple-500/40 text-purple-300 font-bold hover:bg-purple-600/30 transition-all flex items-center justify-center gap-2 cursor-pointer"
                      >
                        <Upload className="w-4 h-4 text-purple-400" />
                        <span>Choose Image File From Device</span>
                      </label>
                      <input
                        id="device-file-upload"
                        type="file"
                        accept="image/*"
                        onChange={handleFileUpload}
                        className="hidden"
                      />
                    </div>

                    {/* Image URL Input */}
                    <div>
                      <span className="text-[11px] font-semibold text-gray-400 block mb-1">Or Paste Image URL</span>
                      <input
                        type="url"
                        value={avatarUrl}
                        onChange={(e) => setAvatarUrl(e.target.value)}
                        placeholder="Paste image URL..."
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2 px-3 text-white text-xs focus:outline-none focus:border-purple-500"
                      />
                    </div>
                  </div>
                </div>

                {/* Preset Avatars Gallery */}
                <div className="space-y-2 pt-1">
                  <span className="text-[11px] font-semibold text-gray-400 block">Or Select Preset Avatar:</span>
                  <div className="flex items-center gap-3 overflow-x-auto pb-2">
                    {presetAvatars.map((av, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setAvatarUrl(av)}
                        className={`relative rounded-xl overflow-hidden shrink-0 border-2 transition-all ${
                          avatarUrl === av ? "border-purple-500 scale-105 shadow-glow" : "border-slate-800 hover:border-slate-700"
                        }`}
                      >
                        <img src={av} alt={`Avatar ${idx}`} className="w-12 h-12 object-cover" />
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Personal Information */}
              <div className="space-y-4 pt-4 border-t border-slate-800">
                <div>
                  <label className="font-bold text-gray-300 block mb-1">Full Name</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl py-2.5 px-3 text-white focus:outline-none focus:border-purple-500"
                  />
                </div>

                <div>
                  <label className="font-bold text-gray-300 block mb-1">Email Address</label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl py-2.5 px-3 text-white focus:outline-none"
                  />
                </div>

                {/* GitHub & LinkedIn Social Link Settings */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="font-bold text-gray-300 block mb-1 flex items-center gap-1.5">
                      <Github className="w-3.5 h-3.5 text-purple-400" />
                      <span>GitHub Profile URL</span>
                    </label>
                    <input
                      type="url"
                      value={githubUrl}
                      onChange={(e) => setGithubUrl(e.target.value)}
                      placeholder="https://github.com/username"
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl py-2.5 px-3 text-white focus:outline-none focus:border-purple-500"
                    />
                  </div>

                  <div>
                    <label className="font-bold text-gray-300 block mb-1 flex items-center gap-1.5">
                      <Linkedin className="w-3.5 h-3.5 text-cyan-400" />
                      <span>LinkedIn Profile URL</span>
                    </label>
                    <input
                      type="url"
                      value={linkedinUrl}
                      onChange={(e) => setLinkedinUrl(e.target.value)}
                      placeholder="https://linkedin.com/in/username"
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl py-2.5 px-3 text-white focus:outline-none focus:border-purple-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="font-bold text-gray-300 block mb-1">Profile Bio</label>
                  <textarea
                    rows={3}
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    placeholder="Short bio about your coding stack..."
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl py-2.5 px-3 text-white focus:outline-none focus:border-purple-500"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-3 rounded-xl gradient-bg text-white font-bold shadow-glow hover:opacity-95 flex items-center justify-center gap-2 transition-all"
              >
                <Save className="w-4 h-4" />
                <span>Save Profile, Social Links & Avatar Changes</span>
              </button>
            </form>
          </div>
        </main>
      </div>
    </div>
  );
}
