"use client";

import React, { useState, useEffect } from "react";
import { Navbar } from "@/components/Navbar";
import { Sidebar } from "@/components/Sidebar";
import { useAuth } from "@/context/AuthContext";
import { subscribeToDiscussionsRealtime } from "@/lib/supabase/client";
import {
  MessageSquareShare,
  Heart,
  MessageSquare,
  Share2,
  Code2,
  Image as ImageIcon,
  Send,
  Sparkles,
  TrendingUp,
  Bookmark,
  UserCheck,
  Hash,
} from "lucide-react";

export default function FeedPage() {
  const { user } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // New Post state
  const [postContent, setPostContent] = useState("");
  const [codeSnippet, setCodeSnippet] = useState("");
  const [showCodeInput, setShowCodeInput] = useState(false);

  useEffect(() => {
    fetchPosts();

    // Realtime subscription for discussion feed updates
    const unsubscribe = subscribeToDiscussionsRealtime(() => {
      fetchPosts();
    });

    return () => {
      unsubscribe();
    };
  }, []);

  const fetchPosts = async () => {
    try {
      const res = await fetch("/api/discussions");
      const data = await res.json();
      if (data.data) setPosts(data.data);
    } catch {
      // Fallback posts
      setPosts([
        {
          id: "post-1",
          title: "Dynamic Programming Space Optimization",
          content: "🚀 Just solved 50 Hard Dynamic Programming problems on CampusCode! Here is my key takeaway on 2D DP table space reduction from O(N*M) to O(M):",
          codeSnippet: "// Space optimization example\nlet dp = new Array(m).fill(0);\nfor(let i = 0; i < n; i++) {\n  let nextDp = [...dp];\n  // ...\n}",
          tags: ["#DSA", "#DynamicProgramming", "#CampusCode"],
          likesCount: 38,
          commentsCount: 12,
          author_name: "Aarav Sharma",
          author_avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80",
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleCreatePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!postContent.trim()) return;

    try {
      await fetch("/api/discussions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: postContent.substring(0, 40) + "...",
          content: postContent,
          category: "General",
          tags: ["#CampusCode", "#DeveloperCommunity"],
        }),
      });

      setPostContent("");
      setCodeSnippet("");
      setShowCodeInput(false);
      fetchPosts();
    } catch (err: any) {
      alert("Failed to post: " + err.message);
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar onToggleSidebar={() => setSidebarOpen(!sidebarOpen)} />

      <div className="flex-1 flex max-w-7xl w-full mx-auto">
        <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

        <main className="flex-1 p-4 lg:p-8 space-y-6 overflow-y-auto">
          {/* Header Banner */}
          <div className="rounded-3xl glass-card border border-purple-500/30 p-6 sm:p-8 relative overflow-hidden">
            <div className="flex items-center gap-2 text-xs font-bold text-purple-400 mb-2">
              <MessageSquareShare className="w-4 h-4" />
              <span>COLLEGE COMMUNITY FEED</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              Connect, Share Knowledge & Collaborate
            </h1>
            <p className="text-xs sm:text-sm text-gray-400 mt-1 max-w-2xl">
              Post code snippets, ask technical questions, share hackathon team openings, and connect with fellow programmers.
            </p>
          </div>

          {/* Post Creation Box */}
          <div className="rounded-3xl glass-card border border-slate-800 p-5 space-y-4">
            <div className="flex items-start gap-3">
              <img
                src={user?.avatar || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80"}
                alt={user?.name}
                className="w-10 h-10 rounded-xl object-cover ring-2 ring-purple-500/30 shrink-0"
              />
              <div className="flex-1 space-y-3">
                <textarea
                  rows={3}
                  value={postContent}
                  onChange={(e) => setPostContent(e.target.value)}
                  placeholder="Share a coding tip, project update, or ask a question..."
                  className="w-full bg-slate-900 border border-slate-800 focus:border-purple-500/60 rounded-2xl p-3.5 text-xs text-white placeholder-gray-500 focus:outline-none"
                />

                {showCodeInput && (
                  <textarea
                    rows={4}
                    value={codeSnippet}
                    onChange={(e) => setCodeSnippet(e.target.value)}
                    placeholder="// Attach code snippet here..."
                    className="w-full bg-slate-950 border border-slate-800 font-mono text-xs text-purple-300 rounded-2xl p-3 focus:outline-none"
                  />
                )}

                <div className="flex items-center justify-between pt-1">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setShowCodeInput(!showCodeInput)}
                      className={`px-3 py-1.5 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition-all ${
                        showCodeInput
                          ? "bg-purple-500/20 text-purple-300 border-purple-500/40"
                          : "bg-slate-900 text-gray-400 border-slate-800 hover:text-white"
                      }`}
                    >
                      <Code2 className="w-3.5 h-3.5" />
                      <span>{showCodeInput ? "Remove Code" : "Attach Code"}</span>
                    </button>
                  </div>

                  <button
                    onClick={handleCreatePost}
                    className="px-5 py-2 rounded-xl gradient-bg text-white text-xs font-bold shadow-glow hover:opacity-95 transition-all flex items-center gap-1.5"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Post</span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Posts Feed Stream */}
          <div className="space-y-6 max-w-3xl mx-auto">
            {posts.map((post) => {
              const tagsList: string[] = Array.isArray(post.tags) ? post.tags : typeof post.tags === "string" ? JSON.parse(post.tags) : [];
              return (
                <div key={post.id || post.discussion_id} className="rounded-3xl glass-card border border-slate-800/80 p-6 space-y-4">
                  {/* Author Header */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <img
                        src={post.author_avatar || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80"}
                        alt={post.author_name}
                        className="w-10 h-10 rounded-xl object-cover ring-2 ring-purple-500/30"
                      />
                      <div>
                        <h4 className="text-sm font-bold text-white">{post.author_name || "Aarav Sharma"}</h4>
                        <p className="text-[10px] text-gray-400">CSE Department</p>
                      </div>
                    </div>

                    <button className="px-3 py-1 rounded-xl bg-purple-500/10 text-purple-300 border border-purple-500/20 text-xs font-bold hover:bg-purple-500/20 transition-all flex items-center gap-1">
                      <UserCheck className="w-3.5 h-3.5" /> Follow
                    </button>
                  </div>

                  {/* Content */}
                  <h3 className="text-sm font-bold text-white">{post.title}</h3>
                  <p className="text-xs text-gray-200 leading-relaxed whitespace-pre-line">{post.content}</p>

                  {/* Code Snippet Attachment */}
                  {post.codeSnippet && (
                    <div className="rounded-2xl bg-slate-950 border border-slate-800 p-4 font-mono text-xs text-purple-300 overflow-x-auto shadow-inner">
                      <pre>{post.codeSnippet}</pre>
                    </div>
                  )}

                  {/* Tags */}
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {tagsList.map((tag, i) => (
                      <span key={i} className="text-[11px] font-semibold text-purple-400">
                        {tag}
                      </span>
                    ))}
                  </div>

                  {/* Action Bar */}
                  <div className="pt-3 border-t border-slate-800/60 flex items-center justify-between text-xs font-bold text-gray-400">
                    <button className="flex items-center gap-1.5 hover:text-rose-400 transition-colors">
                      <Heart className="w-4 h-4 text-rose-500 fill-rose-500" />
                      <span>{post.net_votes || post.likesCount || 0} Votes</span>
                    </button>

                    <button className="flex items-center gap-1.5 hover:text-purple-400 transition-colors">
                      <MessageSquare className="w-4 h-4 text-purple-400" />
                      <span>{post.comments_count || post.commentsCount || 0} Comments</span>
                    </button>

                    <button className="flex items-center gap-1.5 hover:text-cyan-400 transition-colors">
                      <Share2 className="w-4 h-4 text-cyan-400" />
                      <span>Share</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </main>
      </div>
    </div>
  );
}
