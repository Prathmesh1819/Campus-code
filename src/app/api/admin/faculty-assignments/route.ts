import { NextResponse } from "next/server";
import { verifyServerToken } from "@/lib/firebase/auth";
import { cookies } from "next/headers";
import { FirebaseStoreService } from "@/lib/firebase/store";
import { adminDb } from "@/lib/firebase/admin";
import { COLLECTIONS } from "@/lib/firebase/firestore";

export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

async function getAdminUser(req: Request) {
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

  const user: any = await FirebaseStoreService.getUserById(payload.userId);
  const roleName = (user?.role || payload.role || "").toLowerCase();
  if (roleName !== "admin" && roleName !== "super_admin") {
    return null;
  }

  return user;
}

export async function GET(req: Request) {
  try {
    const admin = await getAdminUser(req);
    if (!admin) {
      return NextResponse.json({ error: "Unauthorized. Admin privileges required." }, { status: 403 });
    }

    const allClasses = await FirebaseStoreService.getClassrooms();
    const allCourses = [
      { id: "course-dbms", title: "Database Management Systems (DBMS)" },
      { id: "course-dsa", title: "Data Structures & Algorithms (DSA)" },
      { id: "course-os", title: "Operating Systems (OS)" },
      { id: "course-cn", title: "Computer Networks (CN)" },
    ];

    let facultyList: any[] = [];
    try {
      const snap = await adminDb.collection(COLLECTIONS.FACULTY_ASSIGNMENTS).get();
      if (!snap.empty) {
        facultyList = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      }
    } catch {}

    if (facultyList.length === 0) {
      facultyList = [
        {
          id: "teacher-guneshwari-patil",
          name: "Guneshwari Patil",
          email: "guneshwaripatil01@gmail.com",
          facultyType: "BOTH",
          assignments: [
            {
              id: "fa-1001",
              classId: "class-ty-bsc-cs",
              className: "TY BSc CS",
              courseId: "course-dbms",
              courseTitle: "Database Management Systems (DBMS)",
              assignmentType: "CLASS_TEACHER",
            },
          ],
        },
      ];
    }

    return NextResponse.json({
      faculty: facultyList,
      availableClasses: allClasses,
      availableCourses: allCourses,
    });
  } catch (error: any) {
    console.error("GET /api/admin/faculty-assignments error:", error);
    return NextResponse.json({ error: error.message || "Failed to fetch faculty assignments" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const admin = await getAdminUser(req);
    if (!admin) {
      return NextResponse.json({ error: "Unauthorized. Admin privileges required." }, { status: 403 });
    }

    const body = await req.json();
    const { teacherId, classId, courseId, assignmentType } = body;

    if (!teacherId || !classId || !assignmentType) {
      return NextResponse.json({ error: "Teacher, class, and assignment type are required." }, { status: 400 });
    }

    const faId = `fa-${Date.now()}`;
    const assignment = {
      id: faId,
      teacherId,
      classId,
      courseId: courseId || null,
      assignmentType,
      createdAt: new Date().toISOString(),
    };

    await adminDb.collection(COLLECTIONS.FACULTY_ASSIGNMENTS).doc(faId).set(assignment);

    return NextResponse.json({
      message: "Teaching assignment updated successfully",
      assignment,
    });
  } catch (error: any) {
    console.error("POST /api/admin/faculty-assignments error:", error);
    return NextResponse.json({ error: error.message || "Failed to save faculty assignment" }, { status: 500 });
  }
}
