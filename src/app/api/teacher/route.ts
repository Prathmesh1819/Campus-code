import { NextResponse } from "next/server";
import { FirebaseStoreService } from "@/lib/firebase/store";
import { verifyServerToken } from "@/lib/firebase/auth";
import { adminDb } from "@/lib/firebase/admin";
import { COLLECTIONS } from "@/lib/firebase/firestore";

export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

export async function GET(req: Request) {
  try {
    const authHeader = req.headers.get("Authorization");
    const token = authHeader?.startsWith("Bearer ") ? authHeader.substring(7) : "";
    const authUser = await verifyServerToken(token);

    const users = await FirebaseStoreService.getUsers();
    const rawStudents = users.filter((u: any) => u.role === "STUDENT");

    const students = rawStudents.map((u: any) => ({
      id: u.id || u.uid,
      name: u.full_name || u.name || u.username || u.email?.split("@")[0],
      email: u.email,
      rollNumber: u.roll_number || u.rollNumber || null,
      className: u.className || u.class_name || "Unassigned",
      branch: u.branch || "Unassigned",
      xp: u.xp || 0,
      level: u.level || 1,
      streakDays: u.streakDays || 0,
      submissionsCount: 0,
    }));

    let announcements: any[] = [];
    let assignments: any[] = [];

    try {
      const annSnap = await adminDb.collection(COLLECTIONS.ANNOUNCEMENTS).get();
      if (!annSnap.empty) {
        announcements = annSnap.docs.map((d) => ({ id: d.id, ...d.data() }));
      }

      const assignSnap = await adminDb.collection("assignments").get();
      if (!assignSnap.empty) {
        assignments = assignSnap.docs.map((d) => ({ id: d.id, ...d.data() }));
      }
    } catch (err) {
      console.warn("Firestore fetch error in teacher route:", err);
    }

    return NextResponse.json({
      assignments,
      announcements,
      students,
      studentsCount: students.length,
      assignmentsCount: assignments.length,
      notesCount: 0,
    });
  } catch (error: any) {
    console.error("GET /api/teacher error:", error);
    return NextResponse.json({ error: error.message || "Failed to fetch teacher portal data" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const authHeader = req.headers.get("Authorization");
    const token = authHeader?.startsWith("Bearer ") ? authHeader.substring(7) : "";
    const authUser = await verifyServerToken(token);

    if (!authUser || (authUser.role !== "TEACHER" && authUser.role !== "ADMIN" && authUser.role !== "SUPER_ADMIN" && authUser.role !== "FACULTY")) {
      return NextResponse.json({ error: "Unauthorized. Only Faculty & Teachers can perform this action." }, { status: 403 });
    }

    const body = await req.json();
    const { action, title, content, description, deadline } = body;

    if (action === "announcement") {
      const annId = `ann-${Date.now()}`;
      const ann = {
        id: annId,
        title: title || "Class Notice",
        content: content || title,
        posted_by: authUser.userId,
        author: { name: authUser.name, email: authUser.email },
        createdAt: new Date().toISOString(),
      };
      await adminDb.collection(COLLECTIONS.ANNOUNCEMENTS).doc(annId).set(ann);
      return NextResponse.json({ message: "Announcement created successfully", announcement: ann });
    }

    if (action === "assignment") {
      const assignId = `assign-${Date.now()}`;
      const assign = {
        id: assignId,
        title: title || "Course Assignment",
        description: description || title,
        deadline: deadline || new Date(Date.now() + 7 * 86400000).toISOString(),
        teacher_id: authUser.userId,
        createdAt: new Date().toISOString(),
      };
      await adminDb.collection("assignments").doc(assignId).set(assign);
      return NextResponse.json({ message: "Assignment created successfully", assignment: assign });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error: any) {
    console.error("POST /api/teacher error:", error);
    return NextResponse.json({ error: error.message || "Action failed" }, { status: 500 });
  }
}
