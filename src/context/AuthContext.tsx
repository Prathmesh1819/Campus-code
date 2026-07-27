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
}

interface AuthContextType {
  user: User | null;
  token: string | null;
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

const DEFAULT_USER: User = {
  id: "student-1",
  name: "Aarav Sharma",
  email: "aarav@campus.edu",
  role: "STUDENT",
  rollNumber: "2024-CSE-001",
  className: "Final Year CSE",
  branch: "Computer Science & Engineering",
  avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80",
  xp: 2850,
  level: 12,
  streakDays: 14,
  coins: 450,
  bio: "Competitive programmer | Full-stack & AI Enthusiast",
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(DEFAULT_USER);
  const [token, setToken] = useState<string | null>("demo-token-active");
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState<"login" | "register">("login");

  useEffect(() => {
    const savedUser = localStorage.getItem("campuscode_user");
    if (savedUser) {
      try {
        setUser(JSON.parse(savedUser));
      } catch {
        setUser(DEFAULT_USER);
      }
    }
  }, []);

  const login = (userData: User, authToken: string) => {
    setUser(userData);
    setToken(authToken);
    localStorage.setItem("campuscode_user", JSON.stringify(userData));
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem("campuscode_user");
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
        localStorage.setItem("campuscode_user", JSON.stringify(data.user));
      }
    } catch {
      if (role === "TEACHER") {
        const teacherUser: User = {
          id: "teacher-1",
          name: "Dr. Vikramaditya Gupta",
          email: "teacher@campus.edu",
          role: "TEACHER",
          className: "Faculty of CSE & IT",
          branch: "Computer Science",
          avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&auto=format&fit=crop&q=80",
          xp: 8500,
          level: 25,
          streakDays: 45,
          coins: 1200,
        };
        setUser(teacherUser);
        localStorage.setItem("campuscode_user", JSON.stringify(teacherUser));
      } else if (role === "ADMIN") {
        const adminUser: User = {
          id: "admin-1",
          name: "CampusCode Super Admin",
          email: "admin@campus.edu",
          role: "ADMIN",
          avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&auto=format&fit=crop&q=80",
          xp: 15000,
          level: 50,
          streakDays: 100,
          coins: 5000,
        };
        setUser(adminUser);
        localStorage.setItem("campuscode_user", JSON.stringify(adminUser));
      } else {
        setUser(DEFAULT_USER);
        localStorage.setItem("campuscode_user", JSON.stringify(DEFAULT_USER));
      }
    }
  };

  const openAuthModal = (mode: "login" | "register" = "login") => {
    setAuthMode(mode);
    setIsAuthModalOpen(true);
  };

  const closeAuthModal = () => setIsAuthModalOpen(false);

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
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
