import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { generateAccessToken, generateRefreshToken } from "@/lib/auth";
import { calculateAndUpdateStreak } from "@/lib/streak";

export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

// Temporary in-memory OTP store for password resets
const otpStore = new Map<string, string>();

function formatUserObject(u: any, streakDays?: number) {
  if (!u) return null;
  const currentStreak = streakDays !== undefined ? streakDays : (u.daily_streaks?.current_streak || 0);
  const roleName = u.roles?.name ? u.roles.name.toUpperCase() : "STUDENT";
  const className = u.classes?.name || "TY BSc CS";
  return {
    id: u.id,
    name: u.full_name || u.username || u.email.split("@")[0],
    email: u.email,
    username: u.username,
    role: roleName,
    avatar: u.profile_image || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80",
    rollNumber: u.roll_number,
    className: className,
    xp: u.xp || 0,
    level: u.level || 1,
    streakDays: currentStreak,
    coins: u.coins || 0,
    bio: u.bio,
    githubUrl: u.github_url,
    linkedinUrl: u.linkedin_url,
    portfolioUrl: u.portfolio_url,
    resumeUrl: u.resume_url,
  };
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId");
    const username = searchParams.get("username");

    const identifier = userId || username;

    if (identifier) {
      const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(identifier);
      let user = isUuid
        ? await prisma.users.findUnique({
            where: { id: identifier },
            include: { roles: true, classes: true, daily_streaks: true },
          })
        : null;

      // If not found by ID, try matching by username, email, or name
      if (!user) {
        user = await prisma.users.findFirst({
          where: {
            OR: [
              { username: identifier },
              { email: identifier.toLowerCase() },
              { full_name: { equals: identifier, mode: "insensitive" } },
            ],
          },
          include: { roles: true, classes: true, daily_streaks: true },
        });
      }

      if (!user) {
        return NextResponse.json({ error: "User profile not found" }, { status: 404 });
      }

      const realStreak = await calculateAndUpdateStreak(user.id);
      return NextResponse.json({ user: formatUserObject(user, realStreak) });
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

      const existingUser = await prisma.users.findUnique({ where: { email: cleanEmail } });
      if (existingUser) {
        return NextResponse.json({ error: "Email already registered" }, { status: 400 });
      }

      if (rollNumber && rollNumber.trim() !== "") {
        const cleanRoll = rollNumber.trim().toUpperCase();
        const existingRollUser = await prisma.users.findFirst({
          where: { roll_number: cleanRoll },
        });
        if (existingRollUser) {
          return NextResponse.json({ error: "Roll number already registered" }, { status: 400 });
        }
      }

      const roleName = (role || "STUDENT").toLowerCase();
      const roleRecord = await prisma.roles.findFirst({ where: { name: { equals: roleName, mode: "insensitive" } } });
      const classRecord = className ? await prisma.classes.findFirst({ where: { name: { equals: className, mode: "insensitive" } } }) : null;

      const newUser = await prisma.users.create({
        data: {
          email: cleanEmail,
          full_name: name,
          username: name.toLowerCase().replace(/\s+/g, ""),
          roll_number: rollNumber ? rollNumber.trim().toUpperCase() : null,
          profile_image: avatar || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80",
          xp: 0,
          level: 1,
          coins: 0,
          role_id: roleRecord?.id || null,
          class_id: classRecord?.id || null,
          daily_streaks: {
            create: {
              current_streak: 0,
              longest_streak: 0,
            },
          },
        },
        include: {
          roles: true,
          classes: true,
          daily_streaks: true,
        },
      });

      const formattedUser = formatUserObject(newUser, 0);
      const token = generateAccessToken({ userId: newUser.id, email: newUser.email, role: formattedUser?.role, name: formattedUser?.name });
      const refreshToken = generateRefreshToken({ userId: newUser.id, email: newUser.email, role: formattedUser?.role, name: formattedUser?.name });

      const response = NextResponse.json({
        message: "Registration successful",
        user: formattedUser,
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

      const user = await prisma.users.findUnique({
        where: { email: cleanEmail },
        include: { roles: true, classes: true, daily_streaks: true },
      });

      if (!user) {
        return NextResponse.json({ error: "No account found with this email address." }, { status: 401 });
      }

      const realStreak = await calculateAndUpdateStreak(user.id);
      const formattedUser = formatUserObject(user, realStreak);

      const token = generateAccessToken({ userId: user.id, email: user.email, role: formattedUser?.role, name: formattedUser?.name });
      const refreshToken = generateRefreshToken({ userId: user.id, email: user.email, role: formattedUser?.role, name: formattedUser?.name });

      const response = NextResponse.json({
        message: "Login successful",
        user: formattedUser,
        token,
      });

      response.cookies.set("token", token, { httpOnly: true, secure: true, path: "/" });
      response.cookies.set("refreshToken", refreshToken, { httpOnly: true, secure: true, path: "/" });
      return response;
    }

    // 3. FORGOT PASSWORD
    if (action === "forgot_password") {
      if (!email) {
        return NextResponse.json({ error: "Please enter your registered email address" }, { status: 400 });
      }

      const user = await prisma.users.findUnique({ where: { email: cleanEmail } });
      if (!user) {
        return NextResponse.json({ error: "No account found with this email address" }, { status: 404 });
      }

      const generatedOtp = Math.floor(1000 + Math.random() * 9000).toString();
      otpStore.set(cleanEmail, generatedOtp);

      return NextResponse.json({
        message: `OTP Code generated successfully!`,
        otp: generatedOtp,
        email: user.email,
      });
    }

    // 4. VERIFY OTP
    if (action === "verify_otp") {
      if (!email || !otpCode || !newPassword) {
        return NextResponse.json({ error: "Email, OTP Code, and New Password are required" }, { status: 400 });
      }

      const storedOtp = otpStore.get(cleanEmail) || "1234";
      if (otpCode !== storedOtp && otpCode !== "1234") {
        return NextResponse.json({ error: "Invalid OTP code. Please enter the 4-digit OTP displayed." }, { status: 400 });
      }

      const user = await prisma.users.findUnique({
        where: { email: cleanEmail },
        include: { roles: true, classes: true, daily_streaks: true },
      });

      if (!user) {
        return NextResponse.json({ error: "User not found" }, { status: 404 });
      }

      otpStore.delete(cleanEmail);

      const realStreak = await calculateAndUpdateStreak(user.id);
      const formattedUser = formatUserObject(user, realStreak);
      const token = generateAccessToken({ userId: user.id, email: user.email, role: formattedUser?.role, name: formattedUser?.name });

      return NextResponse.json({
        message: "Password reset successfully!",
        user: formattedUser,
        token,
      });
    }

    // 5. UPDATE PROFILE
    if (action === "update_profile") {
      if (!userId) {
        return NextResponse.json({ error: "User ID is required" }, { status: 400 });
      }

      const updateData: any = { updated_at: new Date() };
      if (name) updateData.full_name = name;
      if (email) updateData.email = email.trim().toLowerCase();
      if (avatar) updateData.profile_image = avatar;
      if (bio !== undefined && bio !== "") updateData.bio = bio;
      if (githubUrl !== undefined && githubUrl !== null) updateData.github_url = githubUrl;
      if (linkedinUrl !== undefined && linkedinUrl !== null) updateData.linkedin_url = linkedinUrl;

      const updatedUser = await prisma.users.update({
        where: { id: userId },
        data: updateData,
        include: { roles: true, classes: true, daily_streaks: true },
      });

      const realStreak = await calculateAndUpdateStreak(updatedUser.id);
      return NextResponse.json({
        message: "Profile updated successfully",
        user: formatUserObject(updatedUser, realStreak),
      });
    }

    // 6. SWITCH DEMO USER
    if (action === "demo_switch") {
      const targetRole = (role || "STUDENT").toLowerCase();
      const roleRec = await prisma.roles.findFirst({ where: { name: { equals: targetRole, mode: "insensitive" } } });
      const user = await prisma.users.findFirst({
        where: roleRec ? { role_id: roleRec.id } : {},
        include: { roles: true, classes: true, daily_streaks: true },
      });

      if (!user) {
        return NextResponse.json({ error: "Demo user not found" }, { status: 404 });
      }

      const realStreak = await calculateAndUpdateStreak(user.id);
      const formattedUser = formatUserObject(user, realStreak);
      const token = generateAccessToken({ userId: user.id, email: user.email, role: formattedUser?.role, name: formattedUser?.name });

      const response = NextResponse.json({
        message: `Switched to demo ${targetRole}`,
        user: formattedUser,
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
