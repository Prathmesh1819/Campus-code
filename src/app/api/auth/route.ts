import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hashPassword, comparePassword, generateAccessToken, generateRefreshToken } from "@/lib/auth";
import { calculateAndUpdateStreak } from "@/lib/streak";

export const dynamic = "force-dynamic";
export const revalidate = 0;

// Temporary in-memory OTP store for password resets
const otpStore = new Map<string, string>();

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId");
    const username = searchParams.get("username");

    if (userId) {
      const realStreak = await calculateAndUpdateStreak(userId);

      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          avatar: true,
          rollNumber: true,
          className: true,
          branch: true,
          xp: true,
          level: true,
          streakDays: true,
          coins: true,
          bio: true,
          githubUrl: true,
          linkedinUrl: true,
        },
      });

      if (!user) {
        return NextResponse.json({ error: "User not found" }, { status: 404 });
      }

      return NextResponse.json({ user: { ...user, streakDays: realStreak } });
    }

    if (username) {
      const users = await prisma.user.findMany({
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          avatar: true,
          rollNumber: true,
          className: true,
          branch: true,
          xp: true,
          level: true,
          streakDays: true,
          coins: true,
          bio: true,
          githubUrl: true,
          linkedinUrl: true,
        },
      });

      const matched = users.find(
        (u) =>
          u.id === username ||
          u.name.toLowerCase().replace(/\s+/g, "") === username.toLowerCase() ||
          u.email.split("@")[0].toLowerCase() === username.toLowerCase()
      );

      if (matched) {
        return NextResponse.json({ user: matched });
      } else if (users.length > 0) {
        return NextResponse.json({ user: users[0] });
      }
    }

    return NextResponse.json({ error: "User ID or username required" }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Auth GET error" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      action,
      email,
      password,
      newPassword,
      otpCode,
      name,
      role,
      rollNumber,
      className,
      branch,
      academicYear,
      avatar,
      userId,
      bio,
      githubUrl,
      linkedinUrl,
    } = body;

    const cleanEmail = email ? email.trim().toLowerCase() : "";

    // 1. REGISTER
    if (action === "register") {
      if (!email || !password || !name) {
        return NextResponse.json({ error: "Name, Email, and Password are required" }, { status: 400 });
      }

      const existingUsers = await prisma.user.findMany();
      const existingUser = existingUsers.find((u) => u.email.toLowerCase() === cleanEmail);
      if (existingUser) {
        return NextResponse.json({ error: "Email already registered" }, { status: 400 });
      }

      if (rollNumber && rollNumber.trim() !== "") {
        const cleanRoll = rollNumber.trim().toUpperCase();
        const existingRollUser = existingUsers.find(
          (u) => u.rollNumber && u.rollNumber.trim().toUpperCase() === cleanRoll
        );
        if (existingRollUser) {
          return NextResponse.json({ error: "Roll number already registered" }, { status: 400 });
        }
      }

      const hashedPassword = await hashPassword(password);
      const user = await prisma.user.create({
        data: {
          name,
          email: cleanEmail,
          password: hashedPassword,
          role: role || "STUDENT",
          rollNumber: rollNumber || null,
          className: className || null,
          branch: branch || null,
          academicYear: academicYear || "2025-26",
          avatar: avatar || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80",
        },
      });

      const token = generateAccessToken({ userId: user.id, email: user.email, role: user.role, name: user.name });
      const refreshToken = generateRefreshToken({ userId: user.id, email: user.email, role: user.role, name: user.name });

      const response = NextResponse.json({
        message: "Registration successful",
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          avatar: user.avatar,
          rollNumber: user.rollNumber,
          branch: user.branch,
          className: user.className,
          xp: user.xp,
          level: user.level,
          streakDays: user.streakDays,
          coins: user.coins,
          bio: user.bio,
          githubUrl: user.githubUrl,
          linkedinUrl: user.linkedinUrl,
        },
        token,
      });

      response.cookies.set("token", token, { httpOnly: true, secure: true, path: "/" });
      response.cookies.set("refreshToken", refreshToken, { httpOnly: true, secure: true, path: "/" });
      return response;
    }

    // 2. LOGIN (Case-Insensitive Match)
    if (action === "login") {
      if (!email || !password) {
        return NextResponse.json({ error: "Email and password are required" }, { status: 400 });
      }

      const users = await prisma.user.findMany();
      const user = users.find((u) => u.email.toLowerCase() === cleanEmail);

      if (!user) {
        return NextResponse.json({ error: "No account found with this email address." }, { status: 401 });
      }

      const isValidPassword = await comparePassword(password, user.password);
      if (!isValidPassword) {
        return NextResponse.json({ error: "Incorrect password. Please try again or click Forgot Password." }, { status: 401 });
      }

      const realStreak = await calculateAndUpdateStreak(user.id);
      const token = generateAccessToken({ userId: user.id, email: user.email, role: user.role, name: user.name });
      const refreshToken = generateRefreshToken({ userId: user.id, email: user.email, role: user.role, name: user.name });

      const response = NextResponse.json({
        message: "Login successful",
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          avatar: user.avatar,
          rollNumber: user.rollNumber,
          branch: user.branch,
          className: user.className,
          xp: user.xp,
          level: user.level,
          streakDays: realStreak,
          coins: user.coins,
          bio: user.bio,
          githubUrl: user.githubUrl,
          linkedinUrl: user.linkedinUrl,
        },
        token,
      });

      response.cookies.set("token", token, { httpOnly: true, secure: true, path: "/" });
      response.cookies.set("refreshToken", refreshToken, { httpOnly: true, secure: true, path: "/" });
      return response;
    }

    // 3. FORGOT PASSWORD (Generate OTP)
    if (action === "forgot_password") {
      if (!email) {
        return NextResponse.json({ error: "Please enter your registered email address" }, { status: 400 });
      }

      const users = await prisma.user.findMany();
      const user = users.find((u) => u.email.toLowerCase() === cleanEmail);

      if (!user) {
        return NextResponse.json({ error: "No account found with this email address" }, { status: 404 });
      }

      // Generate 4-digit OTP code (e.g. 1234 or random)
      const generatedOtp = Math.floor(1000 + Math.random() * 9000).toString();
      otpStore.set(cleanEmail, generatedOtp);

      return NextResponse.json({
        message: `OTP Code generated successfully!`,
        otp: generatedOtp,
        email: user.email,
      });
    }

    // 4. VERIFY OTP & RESET PASSWORD
    if (action === "verify_otp") {
      if (!email || !otpCode || !newPassword) {
        return NextResponse.json({ error: "Email, OTP Code, and New Password are required" }, { status: 400 });
      }

      const storedOtp = otpStore.get(cleanEmail) || "1234"; // Default 1234 fallback for convenience
      if (otpCode !== storedOtp && otpCode !== "1234") {
        return NextResponse.json({ error: "Invalid OTP code. Please enter the 4-digit OTP displayed." }, { status: 400 });
      }

      const users = await prisma.user.findMany();
      const user = users.find((u) => u.email.toLowerCase() === cleanEmail);

      if (!user) {
        return NextResponse.json({ error: "User not found" }, { status: 404 });
      }

      const newHashedPassword = await hashPassword(newPassword);
      const updatedUser = await prisma.user.update({
        where: { id: user.id },
        data: { password: newHashedPassword },
      });

      otpStore.delete(cleanEmail);

      const token = generateAccessToken({ userId: updatedUser.id, email: updatedUser.email, role: updatedUser.role, name: updatedUser.name });

      return NextResponse.json({
        message: "Password reset successfully!",
        user: {
          id: updatedUser.id,
          name: updatedUser.name,
          email: updatedUser.email,
          role: updatedUser.role,
          avatar: updatedUser.avatar,
          rollNumber: updatedUser.rollNumber,
          branch: updatedUser.branch,
          className: updatedUser.className,
          xp: updatedUser.xp,
          level: updatedUser.level,
          streakDays: updatedUser.streakDays,
          coins: updatedUser.coins,
          bio: updatedUser.bio,
          githubUrl: updatedUser.githubUrl,
          linkedinUrl: updatedUser.linkedinUrl,
        },
        token,
      });
    }

    // 5. UPDATE PROFILE PERSISTENCE
    if (action === "update_profile") {
      if (!userId) {
        return NextResponse.json({ error: "User ID is required" }, { status: 400 });
      }

      const updateData: any = {};
      if (name) updateData.name = name;
      if (email) updateData.email = email;
      if (avatar) updateData.avatar = avatar;
      if (bio !== undefined && bio !== "") updateData.bio = bio;
      if (githubUrl !== undefined && githubUrl !== null && githubUrl !== "") updateData.githubUrl = githubUrl;
      if (linkedinUrl !== undefined && linkedinUrl !== null && linkedinUrl !== "") updateData.linkedinUrl = linkedinUrl;

      const updatedUser = await prisma.user.update({
        where: { id: userId },
        data: updateData,
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          avatar: true,
          rollNumber: true,
          className: true,
          branch: true,
          xp: true,
          level: true,
          streakDays: true,
          coins: true,
          bio: true,
          githubUrl: true,
          linkedinUrl: true,
        },
      });

      return NextResponse.json({
        message: "Profile updated successfully",
        user: updatedUser,
      });
    }

    // 6. SWITCH DEMO USER
    if (action === "demo_switch") {
      const targetRole = role || "STUDENT";
      const user = await prisma.user.findFirst({ where: { role: targetRole } });
      if (!user) {
        return NextResponse.json({ error: "Demo user not found" }, { status: 404 });
      }

      const token = generateAccessToken({ userId: user.id, email: user.email, role: user.role, name: user.name });
      const response = NextResponse.json({
        message: `Switched to demo ${targetRole}`,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          avatar: user.avatar,
          rollNumber: user.rollNumber,
          branch: user.branch,
          className: user.className,
          xp: user.xp,
          level: user.level,
          streakDays: user.streakDays,
          coins: user.coins,
          bio: user.bio,
          githubUrl: user.githubUrl,
          linkedinUrl: user.linkedinUrl,
        },
        token,
      });
      response.cookies.set("token", token, { httpOnly: true, secure: true, path: "/" });
      return response;
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Authentication error" }, { status: 500 });
  }
}
