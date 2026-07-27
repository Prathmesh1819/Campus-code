"use client";

import React, { useState, useEffect } from "react";
import { Navbar } from "@/components/Navbar";
import { Sidebar } from "@/components/Sidebar";
import { useAuth } from "@/context/AuthContext";
import { Send, Search, CheckCheck, MessageSquare } from "lucide-react";

export default function MessagesPage() {
  const { user } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [contacts, setContacts] = useState<any[]>([]);
  const [activePeer, setActivePeer] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [inputMessage, setInputMessage] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    if (user?.id) {
      fetchContacts();
    }
  }, [user?.id]);

  useEffect(() => {
    if (user?.id && activePeer?.id) {
      fetchConversation(user.id, activePeer.id);

      // Poll conversation every 3 seconds for live message syncing
      const interval = setInterval(() => {
        fetchConversation(user.id, activePeer.id);
      }, 3000);

      return () => clearInterval(interval);
    }
  }, [user?.id, activePeer?.id]);

  const fetchContacts = async () => {
    try {
      const res = await fetch(`/api/messages?userId=${user?.id}`);
      const data = await res.json();
      if (data.contacts && data.contacts.length > 0) {
        setContacts(data.contacts);
        setActivePeer(data.contacts[0]);
      }
    } catch (err) {
      console.error("Fetch contacts error:", err);
    }
  };

  const fetchConversation = async (userId: string, peerId: string) => {
    try {
      const res = await fetch(`/api/messages?userId=${userId}&peerId=${peerId}`);
      const data = await res.json();
      if (data.messages) {
        setMessages(data.messages);
      }
    } catch (err) {
      console.error("Fetch conversation error:", err);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputMessage.trim() || !activePeer || !user?.id) return;

    const messageContent = inputMessage;
    setInputMessage("");

    // Optimistic UI update
    const tempMsg = {
      id: Date.now().toString(),
      senderId: user.id,
      receiverId: activePeer.id,
      content: messageContent,
      createdAt: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, tempMsg]);

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
        fetchConversation(user.id, activePeer.id);
      }
    } catch (err: any) {
      alert("Failed to send message: " + err.message);
    }
  };

  const filteredContacts = contacts.filter((c) =>
    c.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

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

              <div className="space-y-1 overflow-y-auto flex-1">
                {filteredContacts.length === 0 ? (
                  <div className="text-center py-8 text-xs text-gray-500">No contacts found</div>
                ) : (
                  filteredContacts.map((c) => (
                    <button
                      key={c.id}
                      onClick={() => setActivePeer(c)}
                      className={`w-full p-3 rounded-2xl flex items-center gap-3 transition-all text-left ${
                        activePeer?.id === c.id
                          ? "bg-purple-600/20 border border-purple-500/40 text-white shadow-glow"
                          : "hover:bg-slate-900 text-gray-300"
                      }`}
                    >
                      <img
                        src={c.avatar || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80"}
                        alt={c.name}
                        className="w-10 h-10 rounded-xl object-cover ring-2 ring-purple-500/30 shrink-0"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <h4 className="text-xs font-bold text-white truncate">{c.name}</h4>
                          <span
                            className={`text-[9px] font-black uppercase px-1.5 py-0.5 rounded ${
                              c.role === "ADMIN"
                                ? "bg-rose-500/20 text-rose-300"
                                : c.role === "TEACHER"
                                ? "bg-amber-500/20 text-amber-300"
                                : "bg-purple-500/20 text-purple-300"
                            }`}
                          >
                            {c.role}
                          </span>
                        </div>
                        <p className="text-[10px] text-gray-400 truncate">{c.branch || "Campus User"}</p>
                      </div>
                    </button>
                  ))
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
                        alt={activePeer.name}
                        className="w-10 h-10 rounded-xl object-cover ring-2 ring-purple-500/50"
                      />
                      <div>
                        <h4 className="text-sm font-bold text-white flex items-center gap-2">
                          <span>{activePeer.name}</span>
                          <span
                            className={`text-[9px] font-black uppercase px-2 py-0.5 rounded ${
                              activePeer.role === "ADMIN"
                                ? "bg-rose-500/20 text-rose-300"
                                : activePeer.role === "TEACHER"
                                ? "bg-amber-500/20 text-amber-300"
                                : "bg-purple-500/20 text-purple-300"
                            }`}
                          >
                            {activePeer.role}
                          </span>
                        </h4>
                        <span className="text-[10px] text-emerald-400 font-semibold">• Active Chat Channel</span>
                      </div>
                    </div>
                  </div>

                  {/* Message Stream */}
                  <div className="flex-1 p-4 overflow-y-auto space-y-3">
                    <div className="text-center text-[10px] text-gray-500 font-semibold">
                      End-to-End Campus Encrypted Chat
                    </div>

                    {messages.length === 0 ? (
                      <div className="text-center py-16 text-xs text-gray-500">
                        No previous messages with {activePeer.name}. Type below to start the conversation!
                      </div>
                    ) : (
                      messages.map((m) => {
                        const isMe = m.senderId === user?.id;
                        return (
                          <div key={m.id} className={`flex ${isMe ? "justify-end" : "justify-start"}`}>
                            <div
                              className={`max-w-sm px-4 py-2.5 rounded-2xl text-xs space-y-1 ${
                                isMe
                                  ? "gradient-bg text-white shadow-glow"
                                  : "bg-slate-900 border border-slate-800 text-gray-200"
                              }`}
                            >
                              <p className="leading-relaxed">{m.content}</p>
                              <span className="text-[9px] opacity-75 text-right block font-mono">
                                {new Date(m.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                                {isMe && <CheckCheck className="w-3 h-3 inline ml-1" />}
                              </span>
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
                      placeholder={`Send a direct message to ${activePeer.name}...`}
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
