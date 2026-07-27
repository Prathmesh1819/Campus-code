import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const teacherId = searchParams.get("teacherId");

    const assignments = await prisma.assignment.findMany({
      orderBy: { createdAt: "desc" },
    });

    const announcements = await prisma.announcement.findMany({
      include: { author: { select: { name: true, avatar: true } } },
      orderBy: { createdAt: "desc" },
    });

    const students = await prisma.user.findMany({
      where: { role: "STUDENT" },
      select: {
        id: true,
        name: true,
        email: true,
        rollNumber: true,
        className: true,
        branch: true,
        xp: true,
        level: true,
        streakDays: true,
        _count: { select: { submissions: true } },
      },
      orderBy: { xp: "desc" },
    });

    const notesCount = await prisma.note.count();

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
    const { type, teacherId, title, description, className, branch, deadline, content, targetAudience, isImportant } = body;

    if (type === "assignment") {
      const assignment = await prisma.assignment.create({
        data: {
          teacherId,
          title,
          description,
          className: className || "TY BSc CS",
          branch: branch || "Computer Science",
          deadline: deadline ? new Date(deadline) : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        },
      });
      return NextResponse.json({ assignment });
    }

    if (type === "announcement") {
      const announcement = await prisma.announcement.create({
        data: {
          authorId: teacherId,
          title,
          content,
          targetAudience: targetAudience || "ALL",
          isImportant: Boolean(isImportant),
        },
      });
      return NextResponse.json({ announcement });
    }

    return NextResponse.json({ error: "Invalid teacher portal action" }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Teacher portal action failed" }, { status: 500 });
  }
}
