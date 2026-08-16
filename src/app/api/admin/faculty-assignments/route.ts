import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyAccessToken } from "@/lib/auth";
import { cookies } from "next/headers";

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
  const payload = verifyAccessToken(token);
  if (!payload?.userId) return null;

  const user = await prisma.users.findUnique({
    where: { id: payload.userId },
    include: { roles: true },
  });

  const roleName = user?.roles?.name?.toLowerCase() || "";
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

    const teacherRole = await prisma.roles.findFirst({
      where: { name: { equals: "teacher", mode: "insensitive" } },
    });

    const facultyUsers = await prisma.users.findMany({
      where: teacherRole ? { role_id: teacherRole.id } : {},
      include: {
        roles: true,
        departments: true,
        classes: true,
        faculty_teaching_assignments_faculty_teaching_assignments_teacher_idTousers: {
          include: {
            classes: true,
            courses: true,
            semesters: true,
          },
          orderBy: { created_at: "desc" },
        },
      },
      orderBy: { full_name: "asc" },
    });

    let allClasses = await prisma.classes.findMany({
      orderBy: { name: "asc" },
    });

    if (allClasses.length === 0) {
      const defaultClasses = [
        { name: "TY BSc CS", code: "TY-BSC-CS", year: "2026-27" },
        { name: "SY BSc CS", code: "SY-BSC-CS", year: "2026-27" },
        { name: "FY BSc CS", code: "FY-BSC-CS", year: "2026-27" },
        { name: "MSc CS Part 1", code: "MSC-CS-1", year: "2026-27" },
        { name: "MSc CS Part 2", code: "MSC-CS-2", year: "2026-27" },
      ];
      for (const cls of defaultClasses) {
        await prisma.classes.upsert({
          where: { code: cls.code },
          update: {},
          create: cls,
        });
      }
      allClasses = await prisma.classes.findMany({ orderBy: { name: "asc" } });
    }

    let allCourses = await prisma.courses.findMany({
      orderBy: { title: "asc" },
    });

    if (allCourses.length === 0) {
      const defaultCourses = [
        { title: "Database Management Systems (DBMS)", description: "Relational databases, SQL queries, normalization" },
        { title: "Data Structures & Algorithms (DSA)", description: "Arrays, trees, graphs, sorting, searching" },
        { title: "Operating Systems (OS)", description: "Process management, memory allocation, file systems" },
        { title: "Computer Networks (CN)", description: "TCP/IP stack, routing protocols, HTTP, network sockets" },
        { title: "Object Oriented Programming (Java/C++)", description: "Classes, inheritance, polymorphism, design patterns" },
        { title: "Web Development & Frameworks", description: "HTML, CSS, JS, React, Next.js, full-stack web applications" },
      ];
      for (const cr of defaultCourses) {
        await prisma.courses.upsert({
          where: { id: cr.title },
          update: {},
          create: {
            title: cr.title,
            description: cr.description,
            teacher_id: admin.id,
          },
        }).catch(() => {});
      }
      allCourses = await prisma.courses.findMany({ orderBy: { title: "asc" } });
    }

    let allSemesters = await prisma.semesters.findMany({
      orderBy: { number: "asc" },
    });

    if (allSemesters.length === 0) {
      for (const num of [1, 2, 3, 4, 5, 6]) {
        await prisma.semesters.upsert({
          where: { number_academic_year: { number: num, academic_year: "2026-27" } },
          update: {},
          create: { number: num, academic_year: "2026-27" },
        }).catch(() => {});
      }
      allSemesters = await prisma.semesters.findMany({ orderBy: { number: "asc" } });
    }

    console.log("[Faculty Assignments API] Classes returned:", allClasses.length);
    console.log("[Faculty Assignments API] Courses returned:", allCourses.length);
    console.log("[Faculty Assignments API] Semesters returned:", allSemesters.length);

    const formattedFaculty = facultyUsers.map((f) => ({
      id: f.id,
      name: f.full_name || f.username || f.email,
      email: f.email,
      facultyType: f.faculty_type || "BOTH",
      department: f.departments?.name || "Computer Science",
      assignedClass: f.classes?.name || null,
      assignments: f.faculty_teaching_assignments_faculty_teaching_assignments_teacher_idTousers.map((a) => ({
        id: a.id,
        assignmentType: a.assignment_type,
        classId: a.class_id,
        className: a.classes?.name || "Unknown Class",
        courseId: a.course_id,
        courseTitle: a.courses?.title || null,
        semesterId: a.semester_id,
        semesterName: a.semesters ? `Semester ${a.semesters.number}` : null,
        createdAt: a.created_at,
      })),
    }));

    return NextResponse.json({
      faculty: formattedFaculty,
      classes: allClasses,
      courses: allCourses,
      semesters: allSemesters,
    });
  } catch (error: any) {
    console.error("Error fetching faculty assignments:", error);
    return NextResponse.json({ error: error.message || "Failed to fetch faculty assignments" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const admin = await getAdminUser(req);
    if (!admin) {
      return NextResponse.json({ error: "Unauthorized. Only ADMIN users can assign faculty teaching assignments." }, { status: 403 });
    }

    const body = await req.json();
    const { teacherId, classId, courseId, semesterId, assignmentType } = body;

    if (!teacherId || !classId) {
      return NextResponse.json({ error: "Teacher ID and Target Class ID are required." }, { status: 400 });
    }

    // Verify Target Class exists in DB
    const targetClass = await prisma.classes.findUnique({ where: { id: classId } });
    if (!targetClass) {
      return NextResponse.json({ error: "Invalid Target Class selected." }, { status: 400 });
    }

    const targetUser = await prisma.users.findUnique({
      where: { id: teacherId },
      include: { roles: true },
    });

    if (!targetUser) {
      return NextResponse.json({ error: "Faculty member not found." }, { status: 404 });
    }

    const roleName = targetUser.roles?.name?.toLowerCase() || "";
    if (roleName === "student") {
      return NextResponse.json({ error: "Students cannot be assigned to teaching assignments." }, { status: 400 });
    }

    const type = assignmentType === "SUBJECT_TEACHER" ? "SUBJECT_TEACHER" : "CLASS_TEACHER";

    if (type === "SUBJECT_TEACHER") {
      if (!courseId) {
        return NextResponse.json({ error: "Course / Subject ID is required for Subject Teacher assignment." }, { status: 400 });
      }
      const targetCourse = await prisma.courses.findUnique({ where: { id: courseId } });
      if (!targetCourse) {
        return NextResponse.json({ error: "Invalid Subject / Course selected." }, { status: 400 });
      }
    }

    // Check for duplicate active assignment
    const existing = await prisma.faculty_teaching_assignments.findFirst({
      where: {
        teacher_id: teacherId,
        class_id: classId,
        course_id: type === "SUBJECT_TEACHER" ? courseId : null,
        assignment_type: type,
      },
    });

    if (existing) {
      return NextResponse.json({ error: "This faculty member already has an identical teaching assignment." }, { status: 409 });
    }

    const assignment = await prisma.faculty_teaching_assignments.create({
      data: {
        teacher_id: teacherId,
        class_id: classId,
        course_id: type === "SUBJECT_TEACHER" ? courseId : null,
        semester_id: semesterId || null,
        assignment_type: type,
        created_by: admin.id,
      },
      include: {
        classes: true,
        courses: true,
        semesters: true,
      },
    });

    return NextResponse.json({
      message: "Faculty teaching assignment created successfully!",
      assignment: {
        id: assignment.id,
        assignmentType: assignment.assignment_type,
        className: assignment.classes?.name,
        courseTitle: assignment.courses?.title || null,
      },
    });
  } catch (error: any) {
    console.error("Error creating faculty assignment:", error);
    return NextResponse.json({ error: error.message || "Failed to create teaching assignment" }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const admin = await getAdminUser(req);
    if (!admin) {
      return NextResponse.json({ error: "Unauthorized. Only ADMIN users can remove teaching assignments." }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const assignmentId = searchParams.get("assignmentId");

    if (!assignmentId) {
      return NextResponse.json({ error: "Assignment ID is required." }, { status: 400 });
    }

    await prisma.faculty_teaching_assignments.delete({
      where: { id: assignmentId },
    });

    return NextResponse.json({ message: "Teaching assignment revoked successfully." });
  } catch (error: any) {
    console.error("Error removing faculty assignment:", error);
    return NextResponse.json({ error: error.message || "Failed to remove teaching assignment" }, { status: 500 });
  }
}
