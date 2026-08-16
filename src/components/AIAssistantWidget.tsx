"use client";

import React, { useState, useRef, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import {
  Sparkles,
  X,
  Send,
  Trash2,
  Copy,
  Check,
} from "lucide-react";

interface Message {
  id: string;
  sender: "user" | "ido";
  text: string;
  timestamp: string;
  source?: "CAMPUS_DATABASE" | "AI_KNOWLEDGE" | "WEB_SEARCH" | "MIXED";
}

export function AIAssistantWidget() {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [aiSettings, setAiSettings] = useState({
    aiName: "Ido",
    aiAvatar: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=400&auto=format&fit=crop&q=80",
    aiSubtitle: "Sarhad College Virtual Guide & Coding Assistant",
    aiBadge: "FEMALE AI MENTOR 💖",
  });

  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      sender: "ido",
      text: `Hello ${user?.name || "Student"}! 👋 I'm **Ido** 👩‍💻, your AI Virtual Assistant & Coding Mentor at Sarhad College.\n\nAsk me anything! I can answer general knowledge questions, cricket & current news, coding & DSA problems, or campus assignments & leaderboards!`,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      source: "AI_KNOWLEDGE",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchAiSettings();
  }, []);

  const fetchAiSettings = async () => {
    try {
      const res = await fetch("/api/admin/ai-settings");
      const data = await res.json();
      if (data.settings) {
        setAiSettings(data.settings);
        // Update welcome message with dynamic AI name if first time
        setMessages((prev) => {
          if (prev.length === 1 && prev[0].id === "welcome") {
            return [
              {
                ...prev[0],
                text: `Hello ${user?.name || "Student"}! 👋 I'm **${data.settings.aiName || "Ido"}** 👩‍💻, your AI Virtual Assistant & Coding Mentor at Sarhad College.\n\nHow can I help you with your coding, DSA problems, or coursework today?`,
              },
            ];
          }
          return prev;
        });
      }
    } catch (err) {
      console.error("Error fetching AI Settings:", err);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen]);

  const handleSend = async (textToSend?: string) => {
    const query = textToSend || input;
    if (!query.trim() || loading) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      sender: "user",
      text: query,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    setMessages((prev) => [...prev, userMsg]);
    if (!textToSend) setInput("");
    setLoading(true);

    try {
      const activeProblemContext = typeof window !== "undefined" ? (window as any).__CAMPUSCODE_PROBLEM_CONTEXT__ : null;

      const res = await fetch("/api/ai-assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: query,
          history: messages.map((m) => ({ role: m.sender === "user" ? "user" : "assistant", content: m.text })),
          userRole: user?.role || "STUDENT",
          className: user?.className || "TY BSc CS",
          userName: user?.name || "Student",
          problemContext: activeProblemContext,
        }),
      });

      const data = await res.json();
      const aiMsg: Message = {
        id: (Date.now() + 1).toString(),
        sender: "ido",
        text: data.reply || "I am processing your query. Please ask again!",
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        source: data.source || "AI_KNOWLEDGE",
      };

      setMessages((prev) => [...prev, aiMsg]);
    } catch (err) {
      const errorMsg: Message = {
        id: (Date.now() + 1).toString(),
        sender: "ido",
        text: "I encountered a connection error. Please try asking me again!",
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setLoading(false);
    }
  };

  const handleCopyText = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const renderFormattedText = (text: string) => {
    const lines = text.split("\n");

    return lines.map((line, idx) => {
      if (line.startsWith("```")) {
        return null;
      }

      if (line.startsWith("### ")) {
        return (
          <h4 key={idx} className="text-sm font-black text-white mt-2 mb-1 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-pink-400" /> {line.replace("### ", "")}
          </h4>
        );
      }

      if (line.startsWith("- ")) {
        return (
          <li key={idx} className="text-xs text-gray-200 ml-4 list-disc my-0.5 leading-relaxed">
            {line.replace("- ", "")}
          </li>
        );
      }

      const parts = line.split(/(\*\*.*?\*\*)/g);
      return (
        <p key={idx} className="text-xs leading-relaxed my-1">
          {parts.map((part, pIdx) => {
            if (part.startsWith("**") && part.endsWith("**")) {
              return (
                <strong key={pIdx} className="font-extrabold text-pink-300">
                  {part.slice(2, -2)}
                </strong>
              );
            }
            return part;
          })}
        </p>
      );
    });
  };

  return (
    <>
      {/* Floating Launcher Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 z-[999] p-3 rounded-full bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-600 text-white shadow-glow hover:scale-110 transition-all flex items-center gap-3 group border-2 border-pink-400/40"
          title={`Open ${aiSettings.aiName} - AI Student Guide`}
        >
          <div className="relative">
            <img
              src={aiSettings.aiAvatar}
              alt={aiSettings.aiName}
              className="w-10 h-10 rounded-full object-cover ring-2 ring-pink-400 shadow-lg group-hover:scale-105 transition-transform"
            />
            <span className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-emerald-400 ring-2 ring-slate-950 animate-ping" />
            <span className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-emerald-400 ring-2 ring-slate-950" />
          </div>
          <div className="flex flex-col text-left pr-2 hidden sm:flex">
            <span className="text-xs font-black tracking-wide text-white flex items-center gap-1">
              Ask {aiSettings.aiName} AI 👩‍💻
            </span>
            <span className="text-[10px] text-pink-200 font-semibold">Virtual Mentor</span>
          </div>
        </button>
      )}

      {/* Floating Chat Modal Box */}
      {isOpen && (
        <div className="fixed bottom-6 right-6 z-[999] w-full max-w-md h-[580px] ido-chat-drawer glass-card border border-pink-500/40 rounded-3xl shadow-2xl flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-6 duration-300 bg-[#0c0a1a]">
          {/* Top Header */}
          <div className="p-4 ido-chat-header bg-slate-950/90 border-b border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="relative">
                <img
                  src={aiSettings.aiAvatar}
                  alt={aiSettings.aiName}
                  className="w-10 h-10 rounded-2xl object-cover ring-2 ring-pink-400 shadow-glow"
                />
                <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-emerald-400 ring-2 ring-slate-950" />
              </div>
              <div>
                <h3 className="text-xs font-black text-white flex items-center gap-1.5">
                  <span>{aiSettings.aiName} 👩‍💻</span>
                  <span className="px-2 py-0.5 rounded-full bg-pink-500/20 text-pink-300 border border-pink-500/30 text-[9px] font-bold">
                    {aiSettings.aiBadge}
                  </span>
                </h3>
                <p className="text-[10px] text-gray-400">{aiSettings.aiSubtitle}</p>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <button
                onClick={() => setMessages([messages[0]])}
                className="p-1.5 rounded-xl text-gray-400 hover:text-white hover:bg-slate-900 transition-colors"
                title="Clear Chat"
              >
                <Trash2 className="w-4 h-4" />
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 rounded-xl text-gray-400 hover:text-white hover:bg-slate-900 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Messages Body */}
          <div className="flex-1 p-4 overflow-y-auto space-y-4">
            {messages.map((m) => (
              <div
                key={m.id}
                className={`flex flex-col ${m.sender === "user" ? "items-end" : "items-start"}`}
              >
                <div
                  className={`max-w-[88%] p-3.5 rounded-2xl relative shadow-md ${
                    m.sender === "user"
                      ? "gradient-bg text-white rounded-br-none shadow-glow"
                      : "ido-chat-bubble bg-slate-900/90 border border-pink-500/30 text-gray-200 rounded-bl-none"
                  }`}
                >
                  <div className="flex items-center justify-between mb-1 text-[10px] text-gray-400 font-semibold border-b border-white/10 pb-1">
                    <span className="flex items-center gap-1.5">
                      {m.sender === "user" ? (
                        user?.name || "You"
                      ) : (
                        <>
                          <span className="text-pink-300 font-bold flex items-center gap-1">
                            <Sparkles className="w-3 h-3 text-pink-400" /> {aiSettings.aiName} AI
                          </span>
                          {m.source && (
                            <span className={`px-1.5 py-0.2 rounded text-[8px] font-bold uppercase tracking-wider ${
                              m.source === "CAMPUS_DATABASE"
                                ? "bg-purple-500/20 text-purple-300 border border-purple-500/30"
                                : m.source === "WEB_SEARCH"
                                ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/30"
                                : m.source === "MIXED"
                                ? "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                                : "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                            }`}>
                              {m.source === "CAMPUS_DATABASE"
                                ? "🏫 Campus DB"
                                : m.source === "WEB_SEARCH"
                                ? "🌐 Web Search"
                                : m.source === "MIXED"
                                ? "⚡ Campus + Web"
                                : "🧠 AI Knowledge"}
                            </span>
                          )}
                        </>
                      )}
                    </span>
                    <div className="flex items-center gap-2">
                      <span>{m.timestamp}</span>
                      {m.sender === "ido" && (
                        <button
                          onClick={() => handleCopyText(m.text, m.id)}
                          className="hover:text-white transition-colors"
                          title="Copy Answer"
                        >
                          {copiedId === m.id ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                        </button>
                      )}
                    </div>
                  </div>

                  {m.sender === "ido" ? renderFormattedText(m.text) : <p className="text-xs">{m.text}</p>}
                </div>
              </div>
            ))}

            {loading && (
              <div className="flex items-start gap-2">
                <div className="p-3.5 rounded-2xl ido-chat-bubble bg-slate-900 border border-pink-500/30 text-xs text-pink-300 flex items-center gap-2 animate-pulse">
                  <Sparkles className="w-4 h-4 text-pink-400 animate-spin" />
                  <span>{aiSettings.aiName} is typing a response...</span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Footer */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="p-3 bg-slate-950 border-t border-slate-800 ido-chat-footer flex items-center gap-2"
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={`Ask ${aiSettings.aiName} 👩‍💻 about DSA, code bugs, exams...`}
              className="flex-1 bg-slate-900 border border-slate-800 ido-chat-input rounded-xl py-2 px-3 text-xs text-white focus:outline-none focus:border-pink-500"
            />
            <button
              type="submit"
              disabled={!input.trim() || loading}
              className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-pink-500 to-purple-600 text-white text-xs font-bold shadow-glow hover:opacity-95 disabled:opacity-50 transition-all flex items-center gap-1 shrink-0"
            >
              <Send className="w-3.5 h-3.5" />
            </button>
          </form>
        </div>
      )}
    </>
  );
}
