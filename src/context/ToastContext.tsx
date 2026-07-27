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

      {/* Floating UI Toast Container */}
      <div className="fixed top-5 right-5 z-[200] flex flex-col gap-3 max-w-sm w-full pointer-events-none px-4 sm:px-0">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`pointer-events-auto flex items-start gap-3.5 p-4 rounded-2xl shadow-2xl border backdrop-blur-xl animate-in slide-in-from-top-4 duration-300 fade-in transition-all ${
              toast.type === "logout"
                ? "bg-slate-900/95 border-amber-500/40 text-amber-300 shadow-glow"
                : toast.type === "error"
                ? "bg-slate-900/95 border-rose-500/40 text-rose-300 shadow-lg"
                : toast.type === "info"
                ? "bg-slate-900/95 border-cyan-500/40 text-cyan-300 shadow-glow-cyan"
                : "bg-slate-900/95 border-emerald-500/40 text-emerald-300 shadow-glow"
            }`}
          >
            {/* Icon */}
            <div className="shrink-0 mt-0.5">
              {toast.type === "logout" && <LogOut className="w-5 h-5 text-amber-400" />}
              {toast.type === "success" && <CheckCircle2 className="w-5 h-5 text-emerald-400" />}
              {toast.type === "info" && <Sparkles className="w-5 h-5 text-cyan-400" />}
              {toast.type === "error" && <AlertCircle className="w-5 h-5 text-rose-400" />}
            </div>

            {/* Text Content */}
            <div className="flex-1 space-y-0.5">
              <h4 className="text-xs font-black tracking-wide uppercase text-white">{toast.title}</h4>
              <p className="text-xs font-medium text-gray-300 leading-snug">{toast.message}</p>
            </div>

            {/* Close Button */}
            <button
              onClick={() => removeToast(toast.id)}
              className="text-gray-400 hover:text-white p-1 rounded-lg transition-colors"
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
