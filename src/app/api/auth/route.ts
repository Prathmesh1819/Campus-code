import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hashPassword, comparePassword, generateAccessToken, generateRefreshToken } from "@/lib/auth";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId");
    const username = searchParams.get("username");

    if (userId) {
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

      return NextResponse.json({ user });
    }

    if (username) {
      // Find user by formatted username or ID or email prefix
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
    const { action, email, password, name, role, rollNumber, className, branch, academicYear, avatar } = body;

    // 1. REGISTER
    if (action === "register") {
      if (!email || !password || !name) {
        return NextResponse.json({ error: "Name, Email, and Password are required" }, { status: 400 });
      }

      const existingUser = await prisma.user.findUnique({ where: { email } });
      if (existingUser) {
        return NextResponse.json({ error: "User with this email already exists" }, { status: 400 });
      }

      const hashedPassword = await hashPassword(password);
      const user = await prisma.user.create({
        data: {
          name,
          email,
          password: hashedPassword,
          role: role || "STUDENT",
          rollNumber: rollNumber || null,
          className: className || null,
          branch: branch || null,
          academicYear: academicYear || null,
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
        },
        token,
      });

      response.cookies.set("token", token, { httpOnly: true, secure: true, path: "/" });
      response.cookies.set("refreshToken", refreshToken, { httpOnly: true, secure: true, path: "/" });
      return response;
    }

    // 2. LOGIN
    if (action === "login") {
      if (!email || !password) {
        return NextResponse.json({ error: "Email and password are required" }, { status: 400 });
      }

      const user = await prisma.user.findUnique({ where: { email } });
      if (!user) {
        return NextResponse.json({ error: "Invalid email or password" }, { status: 401 });
      }

      const isValidPassword = await comparePassword(password, user.password);
      if (!isValidPassword) {
        return NextResponse.json({ error: "Invalid email or password" }, { status: 401 });
      }

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
          streakDays: user.streakDays,
          coins: user.coins,
        },
        token,
      });

      response.cookies.set("token", token, { httpOnly: true, secure: true, path: "/" });
      response.cookies.set("refreshToken", refreshToken, { httpOnly: true, secure: true, path: "/" });
      return response;
    }

    // 3. SWITCH DEMO USER
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
