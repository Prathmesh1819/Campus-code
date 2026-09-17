import { NextResponse } from "next/server";
import { FirebaseStoreService } from "@/lib/firebase/store";
import { verifyServerToken } from "@/lib/firebase/auth";
import { cookies } from "next/headers";
import { adminDb } from "@/lib/firebase/admin";
import { COLLECTIONS } from "@/lib/firebase/firestore";

export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";
export const revalidate = 0;

async function getAuthUser(req: Request) {
  let token = "";
  const authHeader = req.headers.get("authorization");
  if (authHeader && authHeader.startsWith("Bearer ")) {
    token = authHeader.substring(7);
  } else {
    const cookieStore = await cookies();
    token = cookieStore.get("token")?.value || "";
  }

  if (!token) return null;
  const payload = await verifyServerToken(token);
  if (!payload?.userId) return null;

  return await FirebaseStoreService.getUserById(payload.userId);
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const requestedClassId = searchParams.get("classId");
    const requestedClassName = searchParams.get("className");

    const authUser: any = await getAuthUser(req);
    const userRole = (authUser?.role || "STUDENT").toLowerCase();

    const allCls: any[] = await FirebaseStoreService.getClassrooms();

    let availableAssignedClasses: any[] = [];

    if (userRole === "admin" || userRole === "super_admin") {
      availableAssignedClasses = allCls.map((c: any) => ({
        id: c.id,
        name: c.name,
        code: c.code,
        type: "ALL_ACCESS",
        subjectTitle: null,
      }));
    } else if (userRole === "teacher") {
      availableAssignedClasses = allCls.map((c: any) => ({
        id: c.id,
        name: c.name,
        code: c.code,
        type: "FACULTY_ASSIGNMENT",
        subjectTitle: "Computer Science",
      }));
    } else {
      const studentClassName = authUser?.className || authUser?.class_name || null;
      if (studentClassName) {
        availableAssignedClasses = [
          {
            id: authUser?.class_id || `class-${studentClassName.toLowerCase().replace(/\s+/g, "-")}`,
            name: studentClassName,
            type: "STUDENT_CLASS",
            subjectTitle: null,
          },
        ];
      } else {
        availableAssignedClasses = [];
      }
    }

    const defaultTarget = availableAssignedClasses[0]?.name || allCls[0]?.name || null;
    const targetClassName = requestedClassId || requestedClassName || defaultTarget;

    if (!targetClassName) {
      return NextResponse.json({
        classId: null,
        className: "No classroom assigned",
        classroom: null,
        assignedClasses: [],
        classmates: [],
        notes: [],
        projects: [],
        announcements: [],
      });
    }

    const classObj: any = await FirebaseStoreService.getClassroomByNameOrCode(targetClassName);

    // Fetch Enrolled classmates from Firestore
    const rawClassmates = await FirebaseStoreService.getEnrolledStudents(targetClassName);

    const classmates = rawClassmates.map((u: any) => ({
      id: u.id,
      name: u.full_name || u.name || u.username || u.email?.split("@")[0],
      email: u.email,
      role: u.role || "STUDENT",
      rollNumber: u.roll_number || u.rollNumber,
      className: u.className || targetClassName,
      avatar: u.profile_image || u.avatar || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80",
      xp: u.xp || 0,
      level: u.level || 1,
      streakDays: u.streakDays || 0,
      bio: u.bio,
    }));

    // Fetch notes and announcements from Firestore
    let notes: any[] = [];
    let announcements: any[] = [];

    try {
      const notesSnap = await adminDb.collection(COLLECTIONS.NOTES).get();
      if (!notesSnap.empty) {
        notes = notesSnap.docs.map((d) => ({ id: d.id, ...d.data() }));
      }

      const annSnap = await adminDb.collection(COLLECTIONS.ANNOUNCEMENTS).get();
      if (!annSnap.empty) {
        announcements = annSnap.docs.map((d) => ({ id: d.id, ...d.data() }));
      }
    } catch (err) {
      console.warn("Firestore secondary fetch error in classrooms route:", err);
    }

    const teacherInfo = {
      name: "Guneshwari Patil",
      email: "guneshwaripatil01@gmail.com",
      avatar: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=400&auto=format&fit=crop&q=80",
      isAssigned: true,
    };

    return NextResponse.json({
      classId: classObj?.id || `class-${targetClassName.toLowerCase().replace(/\s+/g, "-")}`,
      className: classObj?.name || targetClassName,
      classroom: {
        id: classObj?.id || `class-${targetClassName.toLowerCase().replace(/\s+/g, "-")}`,
        name: classObj?.name || targetClassName,
        code: classObj?.code || targetClassName.toUpperCase().replace(/\s+/g, "-"),
        branch: classObj?.branch || "Computer Science",
        academicYear: classObj?.year || "2026-27",
        teacher: teacherInfo,
      },
      assignedClasses: availableAssignedClasses,
      classmates,
      notes,
      projects: [],
      announcements,
    });
  } catch (error: any) {
    console.error("GET /api/classrooms error:", error);
    return NextResponse.json({ error: error.message || "Failed to fetch classrooms" }, { status: 500 });
  }
}
