"use client";

import React, { useState, useEffect } from "react";
import { Navbar } from "@/components/Navbar";
import { Sidebar } from "@/components/Sidebar";
import { useAuth } from "@/context/AuthContext";
import { Send, Image as ImageIcon, Code2, Smile, Search, CheckCheck } from "lucide-react";

export default function MessagesPage() {
  const { user } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [contacts, setContacts] = useState<any[]>([]);
  const [activePeer, setActivePeer] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [inputMessage, setInputMessage] = useState("");

  useEffect(() => {
    fetchContacts();
  }, []);

  const fetchContacts = async () => {
    try {
      const res = await fetch(`/api/messages?userId=${user?.id}`);
      const data = await res.json();
      if (data.contacts) {
        setContacts(data.contacts);
        setActivePeer(data.contacts[0]);
      }
    } catch {
      const mockContacts = [
        { id: "student-2", name: "Ananya Roy", avatar: "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=400&auto=format&fit=crop&q=80", role: "STUDENT" },
        { id: "teacher-1", name: "Dr. Vikramaditya Gupta", avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&auto=format&fit=crop&q=80", role: "TEACHER" },
      ];
      setContacts(mockContacts);
      setActivePeer(mockContacts[0]);
    }
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputMessage.trim() || !activePeer) return;

    const newMsg = {
      id: Date.now().toString(),
      senderId: user?.id,
      receiverId: activePeer.id,
      content: inputMessage,
      createdAt: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, newMsg]);
    setInputMessage("");
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar onToggleSidebar={() => setSidebarOpen(!sidebarOpen)} />

      <div className="flex-1 flex max-w-7xl w-full mx-auto">
        <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

        <main className="flex-1 p-4 lg:p-6 overflow-hidden h-[calc(100vh-65px)]">
          <div className="h-full rounded-3xl glass-card border border-slate-800 grid grid-cols-1 md:grid-cols-12 overflow-hidden">
            {/* Contacts Sidebar Column */}
            <div className="md:col-span-4 border-r border-slate-800 p-4 space-y-4 bg-slate-950/60">
              <h3 className="text-base font-bold text-white">Direct Messages</h3>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search contacts..."
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl py-2 pl-9 pr-3 text-xs text-white focus:outline-none"
                />
              </div>

              <div className="space-y-1 overflow-y-auto max-h-[calc(100vh-220px)]">
                {contacts.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => setActivePeer(c)}
                    className={`w-full p-3 rounded-2xl flex items-center gap-3 transition-colors text-left ${
                      activePeer?.id === c.id ? "bg-purple-600/20 border border-purple-500/30" : "hover:bg-slate-900"
                    }`}
                  >
                    <img src={c.avatar} alt={c.name} className="w-10 h-10 rounded-xl object-cover ring-2 ring-purple-500/30" />
                    <div>
                      <h4 className="text-xs font-bold text-white">{c.name}</h4>
                      <p className="text-[10px] text-gray-400">{c.role}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Chat Box Column */}
            <div className="md:col-span-8 flex flex-col h-full bg-[#0b0f19]">
              {activePeer ? (
                <>
                  {/* Chat Header */}
                  <div className="p-4 border-b border-slate-800 flex items-center gap-3 bg-slate-950">
                    <img src={activePeer.avatar} alt={activePeer.name} className="w-10 h-10 rounded-xl object-cover" />
                    <div>
                      <h4 className="text-xs font-bold text-white">{activePeer.name}</h4>
                      <span className="text-[10px] text-emerald-400 font-semibold">• Online</span>
                    </div>
                  </div>

                  {/* Message Stream */}
                  <div className="flex-1 p-4 overflow-y-auto space-y-3">
                    <div className="text-center text-[10px] text-gray-500 font-semibold">Today</div>
                    {messages.map((m) => {
                      const isMe = m.senderId === user?.id;
                      return (
                        <div key={m.id} className={`flex ${isMe ? "justify-end" : "justify-start"}`}>
                          <div
                            className={`max-w-xs px-4 py-2.5 rounded-2xl text-xs ${
                              isMe ? "gradient-bg text-white shadow-glow" : "bg-slate-900 border border-slate-800 text-gray-200"
                            }`}
                          >
                            <p>{m.content}</p>
                            <span className="text-[9px] opacity-70 text-right block mt-1">
                              <CheckCheck className="w-3 h-3 inline ml-1" />
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Input Controls */}
                  <form onSubmit={handleSendMessage} className="p-4 border-t border-slate-800 bg-slate-950 flex items-center gap-2">
                    <input
                      type="text"
                      value={inputMessage}
                      onChange={(e) => setInputMessage(e.target.value)}
                      placeholder={`Message ${activePeer.name}...`}
                      className="flex-1 bg-slate-900 border border-slate-800 rounded-xl py-2.5 px-4 text-xs text-white focus:outline-none focus:border-purple-500"
                    />
                    <button type="submit" className="p-2.5 rounded-xl gradient-bg text-white shadow-glow hover:opacity-95">
                      <Send className="w-4 h-4" />
                    </button>
                  </form>
                </>
              ) : (
                <div className="flex items-center justify-center h-full text-xs text-gray-500">Select a chat contact</div>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
