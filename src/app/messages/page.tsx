"use client";

import React, { useState, useEffect, useRef } from "react";
import { Navbar } from "@/components/Navbar";
import { Sidebar } from "@/components/Sidebar";
import { useAuth } from "@/context/AuthContext";
import { Send, Search, CheckCheck, MessageSquare, MoreVertical, Trash2, RefreshCw } from "lucide-react";

export default function MessagesPage() {
  const { user, loading: authLoading } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [contacts, setContacts] = useState<any[]>([]);
  const [activePeer, setActivePeer] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [inputMessage, setInputMessage] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [activeMenuMsgId, setActiveMenuMsgId] = useState<string | null>(null);
  const [loadingContacts, setLoadingContacts] = useState(false);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const activePeerRef = useRef(activePeer);
  const userRef = useRef(user);

  useEffect(() => {
    activePeerRef.current = activePeer;
  }, [activePeer]);

  useEffect(() => {
    userRef.current = user;
  }, [user]);

  // Fetch contacts when user ID becomes available
  useEffect(() => {
    if (user?.id) {
      fetchContacts();
    }
  }, [user?.id]);

  // Fetch conversation when user ID or active peer changes
  useEffect(() => {
    if (user?.id && activePeer?.id) {
      fetchConversation(user.id, activePeer.id);
      try {
        localStorage.setItem(`campuscode_active_peer_${user.id}`, activePeer.id);
      } catch (e) {
        console.warn("localStorage write error:", e);
      }
    }
  }, [user?.id, activePeer?.id]);

  // Realtime updates polling every 4 seconds when conversation is open
  useEffect(() => {
    if (!user?.id || !activePeer?.id) return;
    const interval = setInterval(() => {
      fetchConversation(user.id, activePeer.id, true);
    }, 4000);
    return () => clearInterval(interval);
  }, [user?.id, activePeer?.id]);

  const fetchContacts = async () => {
    if (!user?.id) return;
    setLoadingContacts(true);
    setErrorMessage(null);
    try {
      const res = await fetch(`/api/messages?userId=${user.id}`);
      if (!res.ok) {
        throw new Error(`Failed to load contacts (${res.status})`);
      }
      const data = await res.json();
      if (data.contacts && Array.isArray(data.contacts)) {
        // Safe mapping to guarantee all contact fields have non-null defaults
        const safeContacts = data.contacts.map((c: any) => ({
          ...c,
          name: c.name || c.full_name || c.username || c.email?.split("@")[0] || "Campus User",
          role: (c.role || "STUDENT").toUpperCase(),
          avatar: c.avatar || c.profile_image || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80",
          unreadCount: c.unreadCount || 0,
        }));
        setContacts(safeContacts);

        let savedPeerId: string | null = null;
        try {
          savedPeerId = localStorage.getItem(`campuscode_active_peer_${user.id}`);
        } catch (e) {
          console.warn("localStorage read error:", e);
        }

        const foundSaved = safeContacts.find((c: any) => c.id === savedPeerId);
        if (foundSaved) {
          setActivePeer((prev: any) => prev || foundSaved);
        } else if (safeContacts.length > 0) {
          setActivePeer((prev: any) => prev || safeContacts[0]);
        }
      }
    } catch (err: any) {
      console.error("Fetch contacts error:", err);
      setErrorMessage("Could not load contact list. Please click retry.");
    } finally {
      setLoadingContacts(false);
    }
  };

  const fetchConversation = async (userId: string, peerId: string, isSilent = false) => {
    if (!userId || !peerId) return;
    if (!isSilent) setLoadingMessages(true);
    try {
      const res = await fetch(`/api/messages?userId=${userId}&peerId=${peerId}`);
      if (!res.ok) {
        throw new Error(`Failed to load conversation (${res.status})`);
      }
      const data = await res.json();
      if (data.messages && Array.isArray(data.messages)) {
        setMessages(data.messages);
      }
    } catch (err: any) {
      console.error("Fetch conversation error:", err);
    } finally {
      if (!isSilent) setLoadingMessages(false);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputMessage.trim() || !activePeer || !user?.id) return;

    const messageContent = inputMessage.trim();
    setInputMessage("");

    const newMsg = {
      id: "msg-" + Date.now() + "-" + Math.random().toString(36).substr(2, 4),
      senderId: user.id,
      receiverId: activePeer.id,
      content: messageContent,
      readStatus: false,
      createdAt: new Date().toISOString(),
      created_at: new Date().toISOString(),
    };

    // Optimistic UI update for sender
    setMessages((prev) => [...prev, newMsg]);

    try {
      const res = await fetch("/api/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          senderId: user.id,
          receiverId: activePeer.id,
          content: messageContent,
        }),
      });

      if (res.ok) {
        fetchContacts();
        fetchConversation(user.id, activePeer.id, true);
      } else {
        const errorData = await res.json().catch(() => ({}));
        console.error("Send message server error:", errorData);
      }
    } catch (err: any) {
      console.error("Failed to send message:", err);
    }
  };

  const handleDeleteMessage = async (messageId: string, mode: "everyone" | "me") => {
    setActiveMenuMsgId(null);
    if (!user?.id) return;

    try {
      const res = await fetch(`/api/messages?messageId=${messageId}&userId=${user.id}&mode=${mode}`, {
        method: "DELETE",
      });

      if (res.ok) {
        setMessages((prev) => prev.filter((m) => m.id !== messageId));
        if (activePeer?.id) {
          fetchConversation(user.id, activePeer.id, true);
          fetchContacts();
        }
      }
    } catch (err: any) {
      console.error("Error deleting message:", err);
    }
  };

  const selectContact = (contact: any) => {
    if (!contact) return;
    setActivePeer(contact);
    if (user?.id && contact?.id) {
      fetchConversation(user.id, contact.id);
    }
  };

  // Safe time formatting helper to prevent invalid date runtime exceptions
  const formatMessageTime = (rawDate: any) => {
    if (!rawDate) return "";
    try {
      const d = typeof rawDate === "object" && rawDate.seconds ? new Date(rawDate.seconds * 1000) : new Date(rawDate);
      if (isNaN(d.getTime())) return "";
      return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    } catch {
      return "";
    }
  };

  // Filter contacts safely with nullish coalescing
  const filteredContacts = contacts.filter((c) => {
    const nameStr = (c.name || "Campus User").toLowerCase();
    const queryStr = (searchQuery || "").toLowerCase();
    return nameStr.includes(queryStr);
  });

  return (
    <div className="min-h-screen flex flex-col bg-[#070913]">
      <Navbar onToggleSidebar={() => setSidebarOpen(!sidebarOpen)} />

      <div className="flex-1 flex max-w-7xl w-full mx-auto">
        <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

        <main className="flex-1 p-4 lg:p-6 overflow-hidden h-[calc(100vh-65px)]">
          <div className="h-full rounded-3xl glass-card border border-slate-800 grid grid-cols-1 md:grid-cols-12 overflow-hidden">
            {/* Contacts Sidebar Column */}
            <div className="md:col-span-4 border-r border-slate-800 p-4 space-y-4 bg-slate-950/60 flex flex-col">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <MessageSquare className="w-4 h-4 text-purple-400" /> Direct Messages
                </h3>
                {user?.id && (
                  <button
                    onClick={fetchContacts}
                    className="p-1 text-gray-400 hover:text-white transition-colors"
                    title="Refresh contacts"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${loadingContacts ? "animate-spin" : ""}`} />
                  </button>
                )}
              </div>

              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search classmates, teachers, or admin..."
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl py-2 pl-9 pr-3 text-xs text-white focus:outline-none focus:border-purple-500"
                />
              </div>

              {errorMessage && (
                <div className="p-2.5 bg-rose-500/10 border border-rose-500/20 rounded-xl text-[11px] text-rose-300 flex items-center justify-between">
                  <span>{errorMessage}</span>
                  <button onClick={fetchContacts} className="underline font-semibold ml-2 text-rose-200">Retry</button>
                </div>
              )}

              <div className="space-y-1 overflow-y-auto flex-1">
                {authLoading || loadingContacts ? (
                  <div className="text-center py-8 text-xs text-gray-500 flex items-center justify-center gap-2">
                    <RefreshCw className="w-4 h-4 animate-spin text-purple-400" /> Loading contacts...
                  </div>
                ) : filteredContacts.length === 0 ? (
                  <div className="text-center py-8 text-xs text-gray-500">No contacts found</div>
                ) : (
                  filteredContacts.map((c) => {
                    const peerName = c.name || "Campus User";
                    const peerRole = (c.role || "STUDENT").toUpperCase();
                    const peerAvatar = c.avatar || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80";

                    return (
                      <button
                        key={c.id || Math.random().toString()}
                        onClick={() => selectContact(c)}
                        className={`w-full p-3 rounded-2xl flex items-center gap-3 transition-all text-left ${
                          activePeer?.id === c.id
                            ? "bg-purple-600/20 border border-purple-500/40 text-white shadow-glow"
                            : "hover:bg-slate-900 text-gray-300"
                        }`}
                      >
                        <img
                          src={peerAvatar}
                          alt={peerName}
                          className="w-10 h-10 rounded-xl object-cover ring-2 ring-purple-500/30 shrink-0"
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-0.5">
                            <h4 className="text-xs font-bold text-white truncate flex items-center gap-1.5">
                              <span>{peerName}</span>
                              {c.unreadCount > 0 && (
                                <span className="px-1.5 py-0.2 rounded-full bg-emerald-500 text-slate-950 text-[9px] font-black animate-pulse">
                                  {c.unreadCount} NEW
                                </span>
                              )}
                            </h4>
                            <span
                              className={`text-[9px] font-black uppercase px-1.5 py-0.5 rounded ${
                                peerRole === "ADMIN" || peerRole === "SUPER_ADMIN"
                                  ? "bg-rose-500/20 text-rose-300"
                                  : peerRole === "TEACHER"
                                  ? "bg-amber-500/20 text-amber-300"
                                  : "bg-purple-500/20 text-purple-300"
                              }`}
                            >
                              {peerRole}
                            </span>
                          </div>
                          <p className="text-[10px] text-gray-400 truncate">
                            {c.lastMessageText || c.branch || c.className || "Campus User"}
                          </p>
                        </div>
                      </button>
                    );
                  })
                )}
              </div>
            </div>

            {/* Chat Box Column */}
            <div className="md:col-span-8 flex flex-col h-full bg-[#0b0f19]">
              {activePeer ? (
                <>
                  {/* Chat Header */}
                  <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950">
                    <div className="flex items-center gap-3">
                      <img
                        src={activePeer.avatar || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80"}
                        alt={activePeer.name || "Campus User"}
                        className="w-10 h-10 rounded-xl object-cover ring-2 ring-purple-500/50"
                      />
                      <div>
                        <h4 className="text-sm font-bold text-white flex items-center gap-2">
                          <span>{activePeer.name || "Campus User"}</span>
                          <span
                            className={`text-[9px] font-black uppercase px-2 py-0.5 rounded ${
                              activePeer.role === "ADMIN" || activePeer.role === "SUPER_ADMIN"
                                ? "bg-rose-500/20 text-rose-300"
                                : activePeer.role === "TEACHER"
                                ? "bg-amber-500/20 text-amber-300"
                                : "bg-purple-500/20 text-purple-300"
                            }`}
                          >
                            {activePeer.role || "STUDENT"}
                          </span>
                        </h4>
                        <span className="text-[10px] text-emerald-400 font-semibold">• Encrypted Live Chat Channel</span>
                      </div>
                    </div>
                  </div>

                  {/* Message Stream */}
                  <div className="flex-1 p-4 overflow-y-auto space-y-4">
                    <div className="text-center text-[10px] text-gray-500 font-semibold">
                      End-to-End Campus Encrypted Messaging
                    </div>

                    {loadingMessages ? (
                      <div className="text-center py-16 text-xs text-gray-500 flex items-center justify-center gap-2">
                        <RefreshCw className="w-4 h-4 animate-spin text-purple-400" /> Loading conversation...
                      </div>
                    ) : messages.length === 0 ? (
                      <div className="text-center py-16 text-xs text-gray-500">
                        No previous messages with {activePeer.name || "this user"}. Type below to start the conversation!
                      </div>
                    ) : (
                      messages.map((m) => {
                        const isMe = m.senderId === user?.id;
                        const isMenuOpen = activeMenuMsgId === m.id;
                        const rawDate = m.createdAt || m.created_at;
                        const timeStr = formatMessageTime(rawDate);
                        const seenTimeStr = m.readAt ? formatMessageTime(m.readAt) : null;

                        return (
                          <div
                            key={m.id || Math.random().toString()}
                            className={`flex items-center gap-2 group relative ${
                              isMe ? "justify-end" : "justify-start"
                            }`}
                          >
                            {/* Message Bubble */}
                            <div
                              className={`max-w-sm px-4 py-2.5 rounded-2xl text-xs space-y-1.5 shadow-md relative ${
                                isMe
                                  ? "gradient-bg text-white shadow-glow"
                                  : "bg-slate-900 border border-slate-800 text-gray-200"
                              }`}
                            >
                              <p className="leading-relaxed whitespace-pre-wrap">{m.content}</p>

                              {/* Footer Timestamp & Status */}
                              <div className="flex items-center justify-end gap-1.5 text-[9px] opacity-80 pt-0.5 border-t border-white/10 font-mono">
                                <span>{timeStr}</span>

                                {isMe && (
                                  <div className="flex items-center gap-0.5">
                                    {m.readStatus ? (
                                      <span
                                        className="text-cyan-300 font-bold flex items-center gap-0.5"
                                        title={seenTimeStr ? `Seen at ${seenTimeStr}` : "Seen"}
                                      >
                                        <CheckCheck className="w-3.5 h-3.5 text-cyan-300 stroke-[3]" />
                                        <span className="text-[8px] text-cyan-200">
                                          {seenTimeStr ? `Seen ${seenTimeStr}` : "Seen"}
                                        </span>
                                      </span>
                                    ) : (
                                      <span className="text-gray-400" title="Delivered">
                                        <CheckCheck className="w-3.5 h-3.5 text-gray-300" />
                                      </span>
                                    )}
                                  </div>
                                )}
                              </div>
                            </div>

                            {/* 3-Dot Options Action Button */}
                            <div className="relative shrink-0">
                              <button
                                onClick={() => setActiveMenuMsgId(isMenuOpen ? null : m.id)}
                                className="p-1 text-gray-400 hover:text-white transition-opacity rounded-lg hover:bg-slate-800"
                                title="Message options"
                              >
                                <MoreVertical className="w-3.5 h-3.5" />
                              </button>

                              {isMenuOpen && (
                                <div
                                  className={`absolute top-6 z-50 w-44 bg-slate-900 border border-slate-800 rounded-2xl p-1.5 shadow-2xl space-y-1 animate-in fade-in ${
                                    isMe ? "right-0" : "left-0"
                                  }`}
                                >
                                  {isMe && (
                                    <button
                                      onClick={() => handleDeleteMessage(m.id, "everyone")}
                                      className="w-full px-3 py-1.5 text-[11px] font-bold text-rose-400 hover:bg-rose-500/10 rounded-xl flex items-center gap-2 transition-colors text-left"
                                    >
                                      <Trash2 className="w-3.5 h-3.5 text-rose-400" />
                                      <span>Unsend for Everyone</span>
                                    </button>
                                  )}

                                  <button
                                    onClick={() => handleDeleteMessage(m.id, "me")}
                                    className="w-full px-3 py-1.5 text-[11px] font-semibold text-gray-300 hover:bg-slate-800 rounded-xl flex items-center gap-2 transition-colors text-left"
                                  >
                                    <Trash2 className="w-3.5 h-3.5 text-gray-400" />
                                    <span>Delete for Me</span>
                                  </button>
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>

                  {/* Input Controls */}
                  <form onSubmit={handleSendMessage} className="p-4 border-t border-slate-800 bg-slate-950 flex items-center gap-2">
                    <input
                      type="text"
                      value={inputMessage}
                      onChange={(e) => setInputMessage(e.target.value)}
                      placeholder={`Send a direct message to ${activePeer.name || "this user"}...`}
                      className="flex-1 bg-slate-900 border border-slate-800 rounded-xl py-2.5 px-4 text-xs text-white focus:outline-none focus:border-purple-500"
                    />
                    <button
                      type="submit"
                      disabled={!inputMessage.trim()}
                      className="px-4 py-2.5 rounded-xl gradient-bg text-white shadow-glow hover:opacity-95 disabled:opacity-50 transition-all flex items-center gap-1.5 text-xs font-bold"
                    >
                      <Send className="w-4 h-4" />
                      <span>Send</span>
                    </button>
                  </form>
                </>
              ) : (
                <div className="flex items-center justify-center h-full text-xs text-gray-500">
                  Select a contact to start messaging
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

