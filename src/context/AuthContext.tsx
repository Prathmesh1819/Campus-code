"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { onAuthStateChanged, signOut as fbSignOut } from "firebase/auth";
import { firebaseAuth } from "@/lib/firebase/client";
import { useToast } from "@/context/ToastContext";

export interface User {
  id: string;
  name: string;
  email: string;
  username?: string;
  role: "STUDENT" | "TEACHER" | "ADMIN" | "SUPER_ADMIN";
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
  refreshUserData: (updatedFields?: Partial<User>) => Promise<void>;
  switchRole: (role: "STUDENT" | "TEACHER" | "ADMIN" | "SUPER_ADMIN") => Promise<void>;
  updateUserAvatar: (newAvatarUrl: string) => Promise<void>;
  updateUserProfile: (updatedFields: Partial<User>) => Promise<void>;
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
  const { showToast } = useToast();

  useEffect(() => {
    // Single centralized Auth Listener via Firebase Auth Client SDK
    const unsubscribe = onAuthStateChanged(firebaseAuth, async (fbUser) => {
      if (fbUser) {
        try {
          const idToken = await fbUser.getIdToken();
          setToken(idToken);
          await fetchLatestUserStats(fbUser.uid, idToken);
        } catch (err) {
          console.error("Error fetching Firebase Auth token:", err);
        }
      } else {
        setUser(null);
        setToken(null);
        localStorage.removeItem("campuscode_user");
        localStorage.removeItem("campuscode_token");
      }
    });

    return () => unsubscribe();
  }, []);

  const fetchLatestUserStats = async (userId: string, idToken?: string) => {
    try {
      const activeToken = idToken || token;
      const headers: Record<string, string> = {
        "Cache-Control": "no-cache, no-store, must-revalidate",
        Pragma: "no-cache",
      };
      if (activeToken) {
        headers["Authorization"] = `Bearer ${activeToken}`;
      }

      const res = await fetch(`/api/auth?userId=${userId}&t=${Date.now()}`, {
        cache: "no-store",
        headers,
      });
      const data = await res.json();
      if (data.user) {
        setUser((prev) => {
          const updated = { ...(prev || {}), ...data.user };
          localStorage.setItem("campuscode_user", JSON.stringify(updated));
          return updated;
        });
      }
    } catch (err) {
      console.error("Error fetching latest user stats:", err);
    }
  };

  const refreshUserData = async (updatedFields?: Partial<User>) => {
    let activeId = updatedFields?.id || user?.id;
    if (updatedFields) {
      setUser((prev) => {
        const base = prev || (updatedFields.id ? (updatedFields as User) : null);
        if (!base) return null;
        const updated = { ...base, ...updatedFields };
        activeId = updated.id;
        localStorage.setItem("campuscode_user", JSON.stringify(updated));
        return updated;
      });
    }
    const targetId = updatedFields?.id || activeId || user?.id;
    if (targetId) {
      await fetchLatestUserStats(targetId);
    }
  };

  const login = (userData: User, authToken: string) => {
    setUser(userData);
    setToken(authToken);
    localStorage.setItem("campuscode_user", JSON.stringify(userData));
    localStorage.setItem("campuscode_token", authToken);
  };

  const logout = async () => {
    showToast("Signed Out 👋", "You have been logged out of CampusCode.", "logout");
    try {
      await fbSignOut(firebaseAuth);
    } catch (err) {
      console.error("Error signing out from Firebase Auth:", err);
    }
    setUser(null);
    setToken(null);
    localStorage.removeItem("campuscode_user");
    localStorage.removeItem("campuscode_token");
  };

  const updateUserAvatar = async (newAvatarUrl: string) => {
    if (!user?.id) return;
    const updated = { ...user, avatar: newAvatarUrl };
    setUser(updated);
    localStorage.setItem("campuscode_user", JSON.stringify(updated));

    try {
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (token) headers["Authorization"] = `Bearer ${token}`;

      await fetch("/api/auth", {
        method: "POST",
        headers,
        body: JSON.stringify({ action: "update_profile", userId: user.id, avatar: newAvatarUrl }),
      });
    } catch (err) {
      console.error("Error persisting avatar update:", err);
    }
  };

  const updateUserProfile = async (updatedFields: Partial<User>) => {
    if (!user?.id) return;

    const payload: any = { action: "update_profile", userId: user.id };
    const updatedUserObject: any = { ...user };

    Object.entries(updatedFields).forEach(([key, val]) => {
      if (val !== undefined && val !== null && val !== "") {
        payload[key] = val;
        updatedUserObject[key] = val;
      }
    });

    setUser(updatedUserObject);
    localStorage.setItem("campuscode_user", JSON.stringify(updatedUserObject));

    try {
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (token) headers["Authorization"] = `Bearer ${token}`;

      const res = await fetch("/api/auth", {
        method: "POST",
        headers,
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (data.user) {
        setUser(data.user);
        localStorage.setItem("campuscode_user", JSON.stringify(data.user));
      }
    } catch (err) {
      console.error("Error persisting profile update:", err);
    }
  };

  const switchRole = async (_role: "STUDENT" | "TEACHER" | "ADMIN" | "SUPER_ADMIN") => {
    showToast("Role Security 🛡️", "User roles are managed securely via Firebase Admin.", "info");
  };

  const openAuthModal = (mode: "login" | "register" = "login") => {
    setAuthMode(mode);
    setIsAuthModalOpen(true);
  };

  const closeAuthModal = () => setIsAuthModalOpen(false);

  const isAuthenticated = Boolean(user && token);

  const contextValue = React.useMemo(
    () => ({
      user,
      token,
      isAuthenticated,
      login,
      logout,
      refreshUserData,
      switchRole,
      updateUserAvatar,
      updateUserProfile,
      isAuthModalOpen,
      openAuthModal,
      closeAuthModal,
      authMode,
    }),
    [user, token, isAuthenticated, isAuthModalOpen, authMode]
  );

  return <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within an AuthProvider");
  return context;
};
