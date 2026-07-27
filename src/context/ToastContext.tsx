"use client";

import React, { createContext, useContext, useState, useCallback } from "react";
import { CheckCircle2, LogOut, Sparkles, AlertCircle, Info, X } from "lucide-react";

export type ToastType = "success" | "logout" | "info" | "error";

interface Toast {
  id: string;
  title: string;
  message: string;
  type: ToastType;
}

interface ToastContextType {
  showToast: (title: string, message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const ToastProvider = ({ children }: { children: React.ReactNode }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = useCallback((title: string, message: string, type: ToastType = "success") => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, title, message, type }]);

    setTimeout(() => {
      removeToast(id);
    }, 3500);
  }, []);

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}

      {/* Centered Top Floating UI Toast Container */}
      <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[9999] flex flex-col gap-3 max-w-md w-full pointer-events-none px-4">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`pointer-events-auto flex items-center justify-between gap-4 p-4 rounded-2xl shadow-2xl border backdrop-blur-2xl animate-in slide-in-from-top-6 duration-300 fade-in transition-all ${
              toast.type === "logout"
                ? "bg-[#0d111e] border-amber-500/50 text-amber-300 shadow-glow"
                : toast.type === "error"
                ? "bg-[#0d111e] border-rose-500/50 text-rose-300 shadow-lg"
                : toast.type === "info"
                ? "bg-[#0d111e] border-cyan-500/50 text-cyan-300 shadow-glow-cyan"
                : "bg-[#0d111e] border-emerald-500/50 text-emerald-300 shadow-glow"
            }`}
          >
            <div className="flex items-center gap-3">
              {/* Icon */}
              <div className="p-2 rounded-xl bg-slate-900 border border-slate-800 shrink-0">
                {toast.type === "logout" && <LogOut className="w-5 h-5 text-amber-400" />}
                {toast.type === "success" && <CheckCircle2 className="w-5 h-5 text-emerald-400" />}
                {toast.type === "info" && <Sparkles className="w-5 h-5 text-cyan-400" />}
                {toast.type === "error" && <AlertCircle className="w-5 h-5 text-rose-400" />}
              </div>

              {/* Text Content */}
              <div className="space-y-0.5">
                <h4 className="text-xs font-black tracking-wide uppercase text-white">{toast.title}</h4>
                <p className="text-xs font-medium text-gray-300 leading-snug">{toast.message}</p>
              </div>
            </div>

            {/* Close Button */}
            <button
              onClick={() => removeToast(toast.id)}
              className="text-gray-400 hover:text-white p-1 rounded-lg transition-colors shrink-0"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
};
