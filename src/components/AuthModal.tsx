"use client";

import React, { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/context/ToastContext";
import { X, Lock, Mail, User, KeyRound, GraduationCap, Building2, ChevronDown, Send } from "lucide-react";

interface AuthModalProps {
  isOpen?: boolean;
  onClose?: () => void;
  defaultMode?: "login" | "register" | "forgot";
}

export const availableStreams = [
  "B.Sc Computer Science (BSc CS)",
  "Computer Science & Engineering (CSE)",
  "Information Technology (IT)",
  "Bachelor of Computer Applications (BCA)",
  "Data Science & AI",
  "Cyber Security",
  "Master of Computer Applications (MCA)",
];

export const availableClassrooms = [
  "TY BSc CS",
  "SY BSc CS",
  "FY BSc CS",
  "Final Year CSE",
  "Third Year CSE",
  "Second Year CSE",
  "Third Year IT",
  "BCA Final Year",
  "MCA Second Year",
];

export function AuthModal({ isOpen = false, onClose = () => {}, defaultMode = "login" }: AuthModalProps) {
  const { login } = useAuth();
  const { showToast } = useToast();
  const [mode, setMode] = useState<"login" | "register" | "forgot" | "otp">(defaultMode);

  // Form states
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [name, setName] = useState("");
  const [role, setRole] = useState<"STUDENT" | "TEACHER">("STUDENT");
  const [rollNumber, setRollNumber] = useState("");
  const [className, setClassName] = useState(availableClassrooms[0]);
  const [branch, setBranch] = useState(availableStreams[0]);
  const [academicYear, setAcademicYear] = useState("2025-26");

  // OTP Inputs start completely empty for manual user entry
  const [otp, setOtp] = useState(["", "", "", ""]);
  const [generatedOtpDisplay, setGeneratedOtpDisplay] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState("");
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    setLoading(true);

    try {
      if (mode === "login") {
        const res = await fetch("/api/auth", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "login", email, password }),
        });

        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.error || "Invalid login credentials.");
        }

        login(data.user, data.token);
        showToast("Welcome Back! 🎉", `Signed in successfully as ${data.user.name}`, "success");
        onClose();
      } else if (mode === "register") {
        const res = await fetch("/api/auth", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "register",
            name,
            email,
            password,
            role,
            rollNumber,
            className,
            branch,
            academicYear,
          }),
        });

        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.error || "Registration failed.");
        }

        login(data.user, data.token);
        showToast("Account Created! 🚀", `Welcome to CampusCode, ${data.user.name}`, "info");
        onClose();
      } else if (mode === "forgot") {
        const res = await fetch("/api/auth", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "forgot_password", email }),
        });

        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.error || "Email not registered.");
        }

        // Keep OTP inputs empty for manual entry
        setOtp(["", "", "", ""]);
        setGeneratedOtpDisplay(data.otp);
        showToast(
          "Email Sent! 📧",
          `OTP Code [ ${data.otp} ] sent to ${data.email}. Check email & enter code below.`,
          "info"
        );
        setMode("otp");
      } else if (mode === "otp") {
        const otpCodeStr = otp.join("");
        if (otpCodeStr.length < 4) {
          throw new Error("Please enter all 4 digits of the OTP code.");
        }

        const res = await fetch("/api/auth", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "verify_otp",
            email,
            otpCode: otpCodeStr,
            newPassword: newPassword || "password123",
          }),
        });

        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.error || "OTP verification failed.");
        }

        login(data.user, data.token);
        showToast("Password Reset Successful! 🎉", "Your password has been updated and you are now logged in.", "success");
        onClose();
      }
    } catch (err: any) {
      setErrorMsg(err.message || "An authentication error occurred.");
      showToast("Auth Notice", err.message || "Invalid credentials", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleOtpChange = (index: number, val: string) => {
    if (val.length > 1) return;
    const newOtp = [...otp];
    newOtp[index] = val;
    setOtp(newOtp);

    // Auto focus next input
    if (val && index < 3) {
      const nextInput = document.getElementById(`otp-input-${index + 1}`);
      nextInput?.focus();
    }
  };

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-lg max-h-[90vh] glass-card border border-purple-500/30 rounded-3xl p-6 sm:p-8 space-y-5 shadow-2xl overflow-y-auto"
      >
        {/* Top Header Close (X) Icon Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-xl text-gray-400 hover:text-white bg-slate-900/80 border border-slate-800 hover:border-purple-500/50 transition-all z-10"
          title="Cancel and close registration"
        >
          <X className="w-5 h-5 text-gray-300 hover:text-white" />
        </button>

        {/* Modal Header */}
        <div className="text-center space-y-1.5 pr-8">
          <div className="w-12 h-12 rounded-2xl gradient-bg mx-auto flex items-center justify-center shadow-glow mb-1">
            {mode === "login" && <User className="w-6 h-6 text-white" />}
            {mode === "register" && <GraduationCap className="w-6 h-6 text-white" />}
            {(mode === "forgot" || mode === "otp") && <KeyRound className="w-6 h-6 text-white" />}
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
            {mode === "login" && "Welcome Back to CampusCode"}
            {mode === "register" && "Create Student / Teacher Account"}
            {mode === "forgot" && "Reset Password"}
            {mode === "otp" && "Enter 4-Digit OTP Code"}
          </h2>
          <p className="text-xs text-gray-400">
            {mode === "login" && "Sign in to access your coding dashboard, leaderboards & projects"}
            {mode === "register" && "Select your Stream & Virtual Classroom for batch registration"}
            {mode === "forgot" && "Enter your registered college email to receive password reset OTP"}
            {mode === "otp" && `Verification code sent to ${email || "your email"}. Check code below & enter manually.`}
          </p>
        </div>

        {/* Simulated Email Inbox Notification Banner */}
        {mode === "otp" && generatedOtpDisplay && (
          <div className="p-3.5 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 text-xs space-y-1 animate-in fade-in">
            <div className="flex items-center justify-between font-bold">
              <span className="flex items-center gap-1.5 text-cyan-400">
                <Mail className="w-4 h-4" /> Incoming Mail Notification
              </span>
              <span className="text-[10px] text-gray-400 font-mono">Just Now</span>
            </div>
            <p className="text-[11px] text-gray-200">
              <b>Subject:</b> CampusCode Security — Your Password Reset Verification Code is:{" "}
              <span className="font-mono text-emerald-400 font-black px-2 py-0.5 rounded bg-slate-900 border border-emerald-500/40 text-xs">
                {generatedOtpDisplay}
              </span>
            </p>
          </div>
        )}

        {errorMsg && (
          <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-semibold text-center">
            {errorMsg}
          </div>
        )}

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          {mode === "register" && (
            <>
              {/* Account Role Switcher */}
              <div className="grid grid-cols-2 gap-2 bg-slate-950 p-1.5 rounded-2xl border border-slate-800">
                <button
                  type="button"
                  onClick={() => setRole("STUDENT")}
                  className={`py-2 rounded-xl font-bold transition-all ${
                    role === "STUDENT"
                      ? "bg-purple-600 text-white shadow-glow"
                      : "text-gray-400 hover:text-white"
                  }`}
                >
                  Student
                </button>
                <button
                  type="button"
                  onClick={() => setRole("TEACHER")}
                  className={`py-2 rounded-xl font-bold transition-all ${
                    role === "TEACHER"
                      ? "bg-purple-600 text-white shadow-glow"
                      : "text-gray-400 hover:text-white"
                  }`}
                >
                  Teacher / Faculty
                </button>
              </div>

              {/* 2-Column Grid for Name & Roll Number */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-gray-300 block mb-1">Full Name</label>
                  <div className="relative">
                    <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="text"
                      required
                      placeholder="e.g. Aarav Sharma"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 focus:border-purple-500 rounded-xl py-2.5 pl-10 pr-3 text-white focus:outline-none"
                    />
                  </div>
                </div>

                {role === "STUDENT" && (
                  <div>
                    <label className="font-bold text-gray-300 block mb-1">Roll Number</label>
                    <input
                      type="text"
                      placeholder="e.g. A-244001"
                      value={rollNumber}
                      onChange={(e) => setRollNumber(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 focus:border-purple-500 rounded-xl py-2.5 px-3 text-white focus:outline-none"
                    />
                  </div>
                )}
              </div>

              {/* Stream / Branch Dropdown */}
              <div>
                <label className="font-bold text-gray-300 block mb-1">Stream / Degree Branch</label>
                <div className="relative">
                  <Building2 className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <select
                    value={branch}
                    onChange={(e) => setBranch(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 focus:border-purple-500 rounded-xl py-2.5 pl-10 pr-3 text-white focus:outline-none appearance-none"
                  >
                    {availableStreams.map((st) => (
                      <option key={st} value={st}>
                        {st}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* 2-Column Grid for Classroom & Academic Year */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-gray-300 block mb-1">Classroom / Batch</label>
                  <select
                    value={className}
                    onChange={(e) => setClassName(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 focus:border-purple-500 rounded-xl py-2.5 px-3 text-white focus:outline-none"
                  >
                    {availableClassrooms.map((cls) => (
                      <option key={cls} value={cls}>
                        {cls}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="font-bold text-gray-300 block mb-1">Academic Year</label>
                  <select
                    value={academicYear}
                    onChange={(e) => setAcademicYear(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 focus:border-purple-500 rounded-xl py-2.5 px-3 text-white focus:outline-none"
                  >
                    <option value="2025-26">2025 - 2026 (2025-26)</option>
                    <option value="2026-27">2026 - 2027 (2026-27)</option>
                    <option value="2027-28">2027 - 2028 (2027-28)</option>
                  </select>
                </div>
              </div>
            </>
          )}

          {/* Email & Password */}
          {(mode === "login" || mode === "register" || mode === "forgot") && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="font-bold text-gray-300 block mb-1">Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="email"
                    required
                    placeholder="student@campus.edu"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 focus:border-purple-500 rounded-xl py-2.5 pl-10 pr-3 text-white focus:outline-none"
                  />
                </div>
              </div>

              {(mode === "login" || mode === "register") && (
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="font-bold text-gray-300">Password</label>
                    {mode === "login" && (
                      <button
                        type="button"
                        onClick={() => setMode("forgot")}
                        className="text-purple-400 hover:underline text-[11px]"
                      >
                        Forgot?
                      </button>
                    )}
                  </div>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="password"
                      required
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 focus:border-purple-500 rounded-xl py-2.5 pl-10 pr-3 text-white focus:outline-none"
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          {/* OTP Mode Input Fields */}
          {mode === "otp" && (
            <div className="space-y-4">
              <div>
                <label className="font-bold text-gray-300 block mb-1 text-center">
                  Type 4-Digit OTP Code Sent To Email
                </label>
                <div className="flex items-center justify-center gap-3 py-1">
                  {otp.map((digit, i) => (
                    <input
                      key={i}
                      id={`otp-input-${i}`}
                      type="text"
                      maxLength={1}
                      value={digit}
                      onChange={(e) => handleOtpChange(i, e.target.value)}
                      placeholder="•"
                      className="w-12 h-12 text-center text-xl font-black bg-slate-900 border border-slate-700 focus:border-purple-500 rounded-xl text-white focus:outline-none transition-all"
                    />
                  ))}
                </div>
              </div>

              <div>
                <label className="font-bold text-gray-300 block mb-1">Set New Password</label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="password"
                    required
                    placeholder="Enter new password (e.g. password123)"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 focus:border-purple-500 rounded-xl py-2.5 pl-10 pr-3 text-white focus:outline-none"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Explicit Submit & Cancel Button Actions */}
          <div className="flex items-center gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="w-1/3 py-3 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-gray-300 font-bold transition-all text-xs text-center"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={loading}
              className="w-2/3 py-3 rounded-xl gradient-bg text-white font-bold shadow-glow hover:opacity-95 transition-all text-xs flex items-center justify-center gap-2"
            >
              {loading ? (
                "Processing..."
              ) : mode === "login" ? (
                "Sign In"
              ) : mode === "register" ? (
                "Complete Registration"
              ) : mode === "forgot" ? (
                "Send OTP to Email"
              ) : (
                "Verify OTP & Update Password"
              )}
            </button>
          </div>
        </form>

        {/* Modal Footer Link */}
        <div className="text-center text-xs text-gray-400 pt-2 border-t border-slate-800">
          {mode === "login" ? (
            <p>
              Don't have an account?{" "}
              <button
                type="button"
                onClick={() => setMode("register")}
                className="text-purple-400 font-bold hover:underline"
              >
                Register here
              </button>
            </p>
          ) : (
            <p>
              Remember password?{" "}
              <button
                type="button"
                onClick={() => setMode("login")}
                className="text-purple-400 font-bold hover:underline"
              >
                Sign in
              </button>
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
