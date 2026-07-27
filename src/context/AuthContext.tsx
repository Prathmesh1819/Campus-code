"use client";

import React, { createContext, useContext, useState, useEffect } from "react";

export interface User {
  id: string;
  name: string;
  email: string;
  role: "STUDENT" | "TEACHER" | "ADMIN";
  rollNumber?: string;
  className?: string;
  branch?: string;
  avatar: string;
  xp: number;
  level: number;
  streakDays: number;
  coins: number;
  bio?: string;
  githubUrl?: string;
  linkedinUrl?: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  login: (userData: User, token: string) => void;
  logout: () => void;
  switchRole: (role: "STUDENT" | "TEACHER" | "ADMIN") => Promise<void>;
  updateUserAvatar: (newAvatarUrl: string) => void;
  updateUserProfile: (updatedFields: Partial<User>) => void;
  isAuthModalOpen: boolean;
  openAuthModal: (mode?: "login" | "register") => void;
  closeAuthModal: () => void;
  authMode: "login" | "register";
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState<"login" | "register">("login");

  useEffect(() => {
    const savedUser = localStorage.getItem("campuscode_user");
    const savedToken = localStorage.getItem("campuscode_token");

    if (savedUser && savedToken) {
      try {
        setUser(JSON.parse(savedUser));
        setToken(savedToken);
      } catch {
        setUser(null);
        setToken(null);
      }
    }
  }, []);

  const login = (userData: User, authToken: string) => {
    setUser(userData);
    setToken(authToken);
    localStorage.setItem("campuscode_user", JSON.stringify(userData));
    localStorage.setItem("campuscode_token", authToken);
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem("campuscode_user");
    localStorage.removeItem("campuscode_token");
  };

  const updateUserAvatar = (newAvatarUrl: string) => {
    if (!user) return;
    const updated = { ...user, avatar: newAvatarUrl };
    setUser(updated);
    localStorage.setItem("campuscode_user", JSON.stringify(updated));
  };

  const updateUserProfile = (updatedFields: Partial<User>) => {
    if (!user) return;
    const updated = { ...user, ...updatedFields };
    setUser(updated);
    localStorage.setItem("campuscode_user", JSON.stringify(updated));
  };

  const switchRole = async (role: "STUDENT" | "TEACHER" | "ADMIN") => {
    try {
      const res = await fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "demo_switch", role }),
      });
      const data = await res.json();
      if (data.user) {
        setUser(data.user);
        setToken(data.token || "token");
        localStorage.setItem("campuscode_user", JSON.stringify(data.user));
        localStorage.setItem("campuscode_token", data.token || "token");
      }
    } catch {
      // fallback
    }
  };

  const openAuthModal = (mode: "login" | "register" = "login") => {
    setAuthMode(mode);
    setIsAuthModalOpen(true);
  };

  const closeAuthModal = () => setIsAuthModalOpen(false);

  const isAuthenticated = Boolean(user && token);

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated,
        login,
        logout,
        switchRole,
        updateUserAvatar,
        updateUserProfile,
        isAuthModalOpen,
        openAuthModal,
        closeAuthModal,
        authMode,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within an AuthProvider");
  return context;
};
