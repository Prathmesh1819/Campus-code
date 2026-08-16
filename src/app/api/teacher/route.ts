import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyAccessToken } from "@/lib/auth";
import { cookies } from "next/headers";

export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

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
  const payload = verifyAccessToken(token);
  if (!payload?.userId) return null;

  return await prisma.users.findUnique({
    where: { id: payload.userId },
    include: { roles: true },
  });
}

export async function GET(_req: Request) {
  try {
    const studentRole = await prisma.roles.findFirst({ where: { name: { equals: "student", mode: "insensitive" } } });
    const rawStudents = await prisma.users.findMany({
      where: studentRole ? { role_id: studentRole.id } : {},
      include: {
        classes: true,
        daily_streaks: true,
        _count: { select: { submissions: true } },
      },
      orderBy: { xp: "desc" },
    });

    const students = rawStudents.map((u) => ({
      id: u.id,
      name: u.full_name || u.username || u.email.split("@")[0],
      email: u.email,
      rollNumber: u.roll_number,
      className: u.classes?.name || "TY BSc CS",
      branch: "Computer Science",
      xp: u.xp || 0,
      level: u.level || 1,
      streakDays: u.daily_streaks?.current_streak || 0,
      submissionsCount: u._count.submissions,
    }));

    const rawAnnouncements = await prisma.announcements.findMany({
      take: 10,
      include: { users: { select: { full_name: true, username: true, profile_image: true } } },
      orderBy: { created_at: "desc" },
    });

    const announcements = rawAnnouncements.map((a) => ({
      id: a.id,
      title: a.title,
      content: a.message,
      createdAt: a.created_at,
      author: a.users ? { name: a.users.full_name || a.users.username, avatar: a.users.profile_image } : { name: "Department Faculty" },
    }));

    const rawAssignments = await prisma.assignments.findMany({
      take: 10,
      orderBy: { created_at: "desc" },
    });

    const assignments = rawAssignments.map((a) => ({
      id: a.id,
      title: a.title,
      description: a.description,
      deadline: a.due_date,
      createdAt: a.created_at,
    }));

    const notesCount = await prisma.teacher_notes.count();

    return NextResponse.json({
      assignments,
      announcements,
      students,
      studentsCount: students.length,
      assignmentsCount: assignments.length,
      notesCount,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to fetch teacher portal data" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const authUser = await getAuthUser(req);
    const userRole = authUser?.roles?.name?.toLowerCase() || "";

    if (!authUser || (userRole !== "teacher" && userRole !== "admin" && userRole !== "super_admin")) {
      return NextResponse.json({ error: "Unauthorized. Only Faculty & Teachers can access teacher portal actions." }, { status: 403 });
    }

    const body = await req.json();
    const { type, courseId, title, description, content } = body;

    const course = courseId ? await prisma.courses.findUnique({ where: { id: courseId } }) : await prisma.courses.findFirst();

    if (!course) {
      return NextResponse.json({ assignment: { id: "asgn-" + Date.now(), title, description } });
    }

    // Teacher authorization check: Must have active teaching assignment if not Admin
    if (userRole === "teacher") {
      const assignmentCount = await prisma.faculty_teaching_assignments.count({
        where: {
          teacher_id: authUser.id,
          OR: [{ course_id: course.id }, { course_id: null }],
        },
      });

      if (assignmentCount === 0) {
        return NextResponse.json(
          { error: "Access Denied. You do not have an active teaching assignment for this course/class." },
          { status: 403 }
        );
      }
    }

    if (type === "assignment") {
      const assignment = await prisma.assignments.create({
        data: {
          course_id: course.id,
          created_by: authUser.id,
          title: title || "New Assignment",
          description: description || title || "Assignment description",
          due_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        },
      });
      return NextResponse.json({ assignment });
    }

    if (type === "announcement") {
      const announcement = await prisma.announcements.create({
        data: {
          course_id: course.id,
          posted_by: authUser.id,
          title: title || "Class Announcement",
          message: content || title || "Announcement details",
        },
      });
      return NextResponse.json({ announcement });
    }

    return NextResponse.json({ error: "Invalid teacher portal action" }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Teacher portal action failed" }, { status: 500 });
  }
}
