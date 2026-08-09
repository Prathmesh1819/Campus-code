import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

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
      author: a.users ? { name: a.users.full_name || a.users.username, avatar: a.users.profile_image } : { name: "Dr. Vikramaditya Gupta" },
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
    const body = await req.json();
    const { type, teacherId, title, description, content } = body;

    if (type === "assignment") {
      const course = await prisma.courses.findFirst();
      if (!course) {
        return NextResponse.json({ assignment: { id: "asgn-" + Date.now(), title, description } });
      }
      const assignment = await prisma.assignments.create({
        data: {
          course_id: course.id,
          created_by: teacherId || null,
          title: title || "New Assignment",
          description: description || title || "Assignment description",
          due_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        },
      });
      return NextResponse.json({ assignment });
    }

    if (type === "announcement") {
      const course = await prisma.courses.findFirst();
      if (!course) {
        return NextResponse.json({ announcement: { id: "ann-" + Date.now(), title, content } });
      }
      const announcement = await prisma.announcements.create({
        data: {
          course_id: course.id,
          posted_by: teacherId || null,
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
