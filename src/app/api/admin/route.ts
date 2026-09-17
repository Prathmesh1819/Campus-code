import { NextResponse } from "next/server";
import { FirebaseStoreService } from "@/lib/firebase/store";
import { verifyServerToken } from "@/lib/firebase/auth";
import { adminDb, adminAuth } from "@/lib/firebase/admin";
import { COLLECTIONS } from "@/lib/firebase/firestore";

export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";
export const revalidate = 0;

export async function GET(req: Request) {
  try {
    const authHeader = req.headers.get("Authorization");
    const token = authHeader?.startsWith("Bearer ") ? authHeader.substring(7) : "";
    const authUser = await verifyServerToken(token);

    if (!authUser || (authUser.role !== "ADMIN" && authUser.role !== "SUPER_ADMIN")) {
      return NextResponse.json({ error: "Unauthorized. Admin role required." }, { status: 403 });
    }

    const users = await FirebaseStoreService.getUsers();

    const formattedUsers = users.map((u: any) => ({
      id: u.id || u.uid,
      name: u.full_name || u.name || u.username || u.email?.split("@")[0],
      email: u.email,
      role: (u.role || "STUDENT").toUpperCase(),
      rollNumber: u.roll_number || u.rollNumber || null,
      className: u.className || u.class_name || null,
      branch: u.branch || null,
      academicYear: u.academicYear || u.academic_year || null,
      xp: u.xp || 0,
      coins: u.coins || 0,
      createdAt: u.created_at || new Date().toISOString(),
    }));

    const totalStudents = formattedUsers.filter((u: any) => u.role === "STUDENT").length;
    const totalTeachers = formattedUsers.filter((u: any) => u.role === "TEACHER").length;
    const totalAdmins = formattedUsers.filter((u: any) => u.role === "ADMIN" || u.role === "SUPER_ADMIN").length;

    const publishedProbs = await FirebaseStoreService.getProblems("published");

    let totalSubmissions = 0;
    try {
      const subSnap = await adminDb.collection(COLLECTIONS.SUBMISSIONS).get();
      totalSubmissions = subSnap.size;
    } catch {}

    let totalProjects = 0;
    try {
      const projSnap = await adminDb.collection(COLLECTIONS.PROJECTS).get();
      totalProjects = projSnap.size;
    } catch {}

    return NextResponse.json({
      stats: {
        totalUsers: formattedUsers.length,
        totalStudents,
        totalTeachers,
        totalAdmins,
        totalProblems: publishedProbs.length,
        totalSubmissions,
        totalProjects,
        totalPosts: 0,
      },
      users: formattedUsers,
      posts: [],
    });
  } catch (error: any) {
    console.error("GET /api/admin error:", error);
    return NextResponse.json({ error: error.message || "Admin API error" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const authHeader = req.headers.get("Authorization");
    const token = authHeader?.startsWith("Bearer ") ? authHeader.substring(7) : "";
    const authUser = await verifyServerToken(token);

    if (!authUser || (authUser.role !== "ADMIN" && authUser.role !== "SUPER_ADMIN")) {
      return NextResponse.json({ error: "Unauthorized. Admin role required." }, { status: 403 });
    }

    const body = await req.json();
    const { name, email, password, role, rollNumber, className, branch, academicYear } = body;

    if (!name || !email) {
      return NextResponse.json({ error: "Name and email are required" }, { status: 400 });
    }

    const cleanEmail = email.trim().toLowerCase();
    const existingUser = await FirebaseStoreService.getUserByEmail(cleanEmail);
    if (existingUser) {
      return NextResponse.json({ error: "User with this email already exists" }, { status: 400 });
    }

    const roleName = (role || "STUDENT").toUpperCase();
    const initialPassword = password || "CampusCode@2026";

    // 1. Create User in Firebase Auth
    let createdAuthUser: any = null;
    try {
      createdAuthUser = await adminAuth.createUser({
        email: cleanEmail,
        password: initialPassword,
        displayName: name.trim(),
      });
    } catch (authErr: any) {
      console.error("[Admin API] Firebase Auth user creation error:", authErr);
      return NextResponse.json(
        { error: authErr.message || "Failed to create Firebase Auth user account." },
        { status: 400 }
      );
    }

    const uid = createdAuthUser.uid;

    // 2. Set Custom Role Claim in Firebase Auth
    try {
      await adminAuth.setCustomUserClaims(uid, { role: roleName });
    } catch (claimErr) {
      console.warn("[Admin API] Failed setting custom user claims:", claimErr);
    }

    // 3. Write user document to Cloud Firestore using UID as Document ID
    const newUserObj = {
      id: uid,
      uid: uid,
      email: cleanEmail,
      full_name: name.trim(),
      username: name.trim().toLowerCase().replace(/\s+/g, ""),
      roll_number: rollNumber ? rollNumber.trim().toUpperCase() : null,
      role: roleName,
      className: className || null,
      branch: branch || null,
      academicYear: academicYear || null,
      profile_image: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80",
      xp: 0,
      level: 1,
      coins: 0,
      streakDays: 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    await FirebaseStoreService.saveUser(newUserObj);

    return NextResponse.json({
      message: "User created successfully with matching Firebase Auth UID and Firestore record.",
      user: newUserObj,
    });
  } catch (error: any) {
    console.error("POST /api/admin error:", error);
    return NextResponse.json({ error: error.message || "Failed to create user" }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const authHeader = req.headers.get("Authorization");
    const token = authHeader?.startsWith("Bearer ") ? authHeader.substring(7) : "";
    const authUser = await verifyServerToken(token);

    if (!authUser || (authUser.role !== "ADMIN" && authUser.role !== "SUPER_ADMIN")) {
      return NextResponse.json({ error: "Unauthorized. Admin role required." }, { status: 403 });
    }

    const body = await req.json();
    const { userId, name, email, role, rollNumber, className, branch, academicYear } = body;

    if (!userId) {
      return NextResponse.json({ error: "User ID is required" }, { status: 400 });
    }

    const existingUser: any = await FirebaseStoreService.getUserById(userId);
    if (!existingUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const newRole = role ? role.toUpperCase() : existingUser.role;

    // Update custom claim if role changed
    if (role && newRole !== existingUser.role) {
      try {
        await adminAuth.setCustomUserClaims(userId, { role: newRole });
      } catch (claimErr) {
        console.warn("[Admin API] Failed updating custom user claim:", claimErr);
      }
    }

    const updatedUser = {
      ...existingUser,
      full_name: name ? name.trim() : existingUser.full_name,
      email: email ? email.trim().toLowerCase() : existingUser.email,
      role: newRole,
      roll_number: rollNumber ? rollNumber.trim().toUpperCase() : existingUser.roll_number,
      className: className !== undefined ? className : existingUser.className,
      branch: branch !== undefined ? branch : existingUser.branch,
      academicYear: academicYear !== undefined ? academicYear : existingUser.academicYear,
      updated_at: new Date().toISOString(),
    };

    await FirebaseStoreService.saveUser(updatedUser);

    return NextResponse.json({
      message: "User updated successfully",
      user: updatedUser,
    });
  } catch (error: any) {
    console.error("PUT /api/admin error:", error);
    return NextResponse.json({ error: error.message || "Failed to update user" }, { status: 500 });
  }
}

