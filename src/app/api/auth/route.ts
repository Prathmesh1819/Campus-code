import { NextResponse } from "next/server";
import { FirebaseStoreService } from "@/lib/firebase/store";
import { verifyServerToken } from "@/lib/firebase/auth";
import { adminAuth } from "@/lib/firebase/admin";

export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";
export const revalidate = 0;

function formatUserObject(u: any) {
  if (!u) return null;
  const roleName = u.role ? u.role.toUpperCase() : "STUDENT";
  const className = u.className || u.class_name || null;
  return {
    id: u.id || u.uid,
    name: u.full_name || u.name || u.username || u.email?.split("@")[0] || "User",
    email: u.email,
    username: u.username || u.email?.split("@")[0],
    role: roleName,
    facultyType: u.faculty_type || u.facultyType || null,
    avatar: u.profile_image || u.avatar || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80",
    rollNumber: u.roll_number || u.rollNumber || null,
    className: className,
    branch: u.branch || null,
    academicYear: u.academicYear || u.academic_year || null,
    xp: u.xp || 0,
    level: u.level || 1,
    streakDays: u.streakDays || u.streak || 0,
    coins: u.coins || 0,
    bio: u.bio || null,
    githubUrl: u.github_url || u.githubUrl || null,
    linkedinUrl: u.linkedin_url || u.linkedinUrl || null,
    portfolioUrl: u.portfolio_url || u.portfolioUrl || null,
    resumeUrl: u.resume_url || u.resumeUrl || null,
  };
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId");
    const username = searchParams.get("username");
    const identifier = userId || username;

    if (!identifier) {
      return NextResponse.json({ error: "User ID or username required" }, { status: 400 });
    }

    const user = (await FirebaseStoreService.getUserById(identifier)) || (await FirebaseStoreService.getUserByEmail(identifier));
    if (!user) {
      return NextResponse.json({ error: "User profile not found" }, { status: 404 });
    }

    return NextResponse.json({ user: formatUserObject(user) });
  } catch (error: any) {
    console.error("GET /api/auth error:", error);
    return NextResponse.json({ error: error.message || "Auth GET error" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const authHeader = req.headers.get("Authorization");
    const token = authHeader?.startsWith("Bearer ") ? authHeader.substring(7) : "";
    const authUser = await verifyServerToken(token);

    if (!authUser || !authUser.userId) {
      return NextResponse.json({ error: "Unauthorized. Valid Firebase ID token is required." }, { status: 401 });
    }

    const targetUid = authUser.userId;
    const body = await req.json();
    const {
      action,
      email,
      name,
      facultyType,
      rollNumber,
      className,
      branch,
      academicYear,
      avatar,
      bio,
      githubUrl,
      linkedinUrl,
    } = body;

    // 1. REGISTER PROFILE (Authenticated via verified Firebase ID Token)
    if (action === "register_profile") {
      const userEmail = (email || authUser.email || "").trim().toLowerCase();
      const userName = (name || authUser.name || userEmail.split("@")[0] || "User").trim();

      if (!targetUid || !userEmail) {
        return NextResponse.json({ error: "UID and Email are required for profile creation" }, { status: 400 });
      }

      // Public registration ALWAYS forces role STUDENT to prevent privilege escalation
      const enforcedRole = "STUDENT";

      // Set custom user claim on Firebase Auth user account
      try {
        await adminAuth.setCustomUserClaims(targetUid, { role: enforcedRole });
      } catch (err) {
        console.warn("[Auth API] Could not set custom claims:", err);
      }

      const newUserObj: any = {
        id: targetUid,
        uid: targetUid,
        email: userEmail,
        full_name: userName,
        username: userName.toLowerCase().replace(/\s+/g, ""),
        roll_number: rollNumber ? rollNumber.trim().toUpperCase() : null,
        role: enforcedRole,
        faculty_type: facultyType || null,
        className: className || null,
        branch: branch || null,
        academicYear: academicYear || null,
        profile_image: avatar || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80",
        xp: 0,
        level: 1,
        coins: 0,
        streakDays: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      await FirebaseStoreService.saveUser(newUserObj);

      return NextResponse.json({
        message: "User profile registered successfully",
        user: formatUserObject(newUserObj),
      });
    }

    // 2. UPDATE PROFILE
    if (action === "update_profile") {
      const existing: any = await FirebaseStoreService.getUserById(targetUid);
      if (!existing) {
        return NextResponse.json({ error: "User profile not found" }, { status: 404 });
      }

      // Security: Prevent client from modifying sensitive fields (role, xp, coins, level, streakDays)
      const updatedUser = {
        ...existing,
        full_name: name ? name.trim() : existing.full_name,
        profile_image: avatar ? avatar.trim() : existing.profile_image,
        bio: bio !== undefined ? bio : existing.bio,
        branch: branch !== undefined ? branch : existing.branch,
        academicYear: academicYear !== undefined ? academicYear : existing.academicYear,
        github_url: githubUrl !== undefined ? githubUrl : existing.github_url,
        linkedin_url: linkedinUrl !== undefined ? linkedinUrl : existing.linkedin_url,
        updated_at: new Date().toISOString(),
      };

      await FirebaseStoreService.saveUser(updatedUser);

      return NextResponse.json({
        message: "Profile updated successfully",
        user: formatUserObject(updatedUser),
      });
    }

    return NextResponse.json({ error: "Invalid or unsupported action" }, { status: 400 });
  } catch (error: any) {
    console.error("POST /api/auth error:", error);
    return NextResponse.json({ error: error.message || "Authentication error" }, { status: 500 });
  }
}

