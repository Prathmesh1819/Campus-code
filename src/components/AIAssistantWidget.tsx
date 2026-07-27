"use client";

import React, { useState, useRef, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import {
  Sparkles,
  Bot,
  X,
  Send,
  Code2,
  Bug,
  Lightbulb,
  BookOpen,
  ChevronDown,
  Maximize2,
  Minimize2,
  Trash2,
  Copy,
  Check,
} from "lucide-react";

interface Message {
  id: string;
  sender: "user" | "ai";
  text: string;
  timestamp: string;
}

export function AIAssistantWidget() {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      sender: "ai",
      text: `Hello ${user?.name || "Student"}! 👋 I am **Sarhad AI**, your 24/7 Virtual Tutor & Academic Guide.\n\nHow can I help you with your coding, DSA problems, or coursework today?`,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen]);

  const quickPrompts = [
    { label: "💡 Explain Two Sum DSA", prompt: "Explain the optimal Hash Map approach for Two Sum Target Pair" },
    { label: "🐛 Debug My Code", prompt: "How do I debug array index out of bounds error in C++?" },
    { label: "🚀 Web Project Ideas", prompt: "Suggest high impact web development project ideas for my resume" },
    { label: "📚 Exam Prep Tips", prompt: "What are key topics for DSA & Operating Systems semester exams?" },
  ];

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
      const res = await fetch("/api/ai-assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: query,
          userRole: user?.role || "STUDENT",
          className: user?.className || "TY BSc CS",
        }),
      });

      const data = await res.json();
      const aiMsg: Message = {
        id: (Date.now() + 1).toString(),
        sender: "ai",
        text: data.reply || "I am processing your query. Please ask again!",
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };

      setMessages((prev) => [...prev, aiMsg]);
    } catch (err) {
      const errorMsg: Message = {
        id: (Date.now() + 1).toString(),
        sender: "ai",
        text: "I encountered a momentary connection error. Please try asking again!",
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
    // Simple markdown-style renderer for headers, bold, bullet points, and code blocks
    const lines = text.split("\n");
    let inCodeBlock = false;
    let codeContent = [];

    return lines.map((line, idx) => {
      if (line.startsWith("```")) {
        inCodeBlock = !inCodeBlock;
        return null;
      }

      if (line.startsWith("### ")) {
        return (
          <h4 key={idx} className="text-sm font-black text-white mt-2 mb-1 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-purple-400" /> {line.replace("### ", "")}
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

      // Bold text formatting
      const parts = line.split(/(\*\*.*?\*\*)/g);
      return (
        <p key={idx} className="text-xs leading-relaxed my-1">
          {parts.map((part, pIdx) => {
            if (part.startsWith("**") && part.endsWith("**")) {
              return (
                <strong key={pIdx} className="font-extrabold text-purple-300">
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
          className="fixed bottom-6 right-6 z-[999] p-3.5 rounded-3xl gradient-bg text-white shadow-glow hover:scale-110 transition-all flex items-center gap-2.5 group"
          title="Open Sarhad AI Student Guide"
        >
          <div className="relative">
            <Bot className="w-6 h-6 text-white group-hover:rotate-12 transition-transform" />
            <span className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-emerald-400 ring-2 ring-slate-950 animate-ping" />
            <span className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-emerald-400 ring-2 ring-slate-950" />
          </div>
          <span className="text-xs font-black tracking-wide pr-1 hidden sm:inline">Sarhad AI Assistant</span>
        </button>
      )}

      {/* Floating Chat Modal Box */}
      {isOpen && (
        <div className="fixed bottom-6 right-6 z-[999] w-full max-w-md h-[560px] glass-card border border-purple-500/40 rounded-3xl shadow-2xl flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-6 duration-300 bg-[#080b18]">
          {/* Top Header */}
          <div className="p-4 bg-slate-950/90 border-b border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-2xl gradient-bg flex items-center justify-center shadow-glow">
                <Bot className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="text-xs font-black text-white flex items-center gap-1.5">
                  <span>Sarhad AI Virtual Assistant</span>
                  <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[9px] font-bold">
                    ONLINE 🟢
                  </span>
                </h3>
                <p className="text-[10px] text-gray-400">24/7 Student Tutor & Coding Mentor</p>
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
                      : "bg-slate-900/90 border border-slate-800 text-gray-200 rounded-bl-none"
                  }`}
                >
                  <div className="flex items-center justify-between mb-1 text-[10px] text-gray-400 font-semibold border-b border-white/10 pb-1">
                    <span className="flex items-center gap-1">
                      {m.sender === "user" ? "You" : "🤖 Sarhad AI Guide"}
                    </span>
                    <div className="flex items-center gap-2">
                      <span>{m.timestamp}</span>
                      {m.sender === "ai" && (
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

                  {m.sender === "ai" ? renderFormattedText(m.text) : <p className="text-xs">{m.text}</p>}
                </div>
              </div>
            ))}

            {loading && (
              <div className="flex items-start gap-2">
                <div className="p-3.5 rounded-2xl bg-slate-900 border border-slate-800 text-xs text-purple-300 flex items-center gap-2 animate-pulse">
                  <Sparkles className="w-4 h-4 text-purple-400 animate-spin" />
                  <span>Sarhad AI is thinking...</span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick Suggestion Pills */}
          <div className="px-3 py-2 border-t border-slate-800/80 bg-slate-950/60 flex items-center gap-1.5 overflow-x-auto no-scrollbar">
            {quickPrompts.map((qp, idx) => (
              <button
                key={idx}
                onClick={() => handleSend(qp.prompt)}
                className="px-2.5 py-1 rounded-xl bg-slate-900 hover:bg-purple-600/20 border border-slate-800 hover:border-purple-500/40 text-purple-300 text-[10px] font-bold whitespace-nowrap transition-all"
              >
                {qp.label}
              </button>
            ))}
          </div>

          {/* Input Footer */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="p-3 bg-slate-950 border-t border-slate-800 flex items-center gap-2"
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask Sarhad AI about DSA, code errors, exams..."
              className="flex-1 bg-slate-900 border border-slate-800 rounded-xl py-2 px-3 text-xs text-white focus:outline-none focus:border-purple-500"
            />
            <button
              type="submit"
              disabled={!input.trim() || loading}
              className="px-3.5 py-2 rounded-xl gradient-bg text-white text-xs font-bold shadow-glow hover:opacity-95 disabled:opacity-50 transition-all flex items-center gap-1 shrink-0"
            >
              <Send className="w-3.5 h-3.5" />
            </button>
          </form>
        </div>
      )}
    </>
  );
}
