import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { syncPersistentUsersToPrisma } from "@/lib/user-sync";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(req: Request) {
  try {
    await syncPersistentUsersToPrisma();
    const { searchParams } = new URL(req.url);
    const className = searchParams.get("className") || "TY BSc CS";

    const classroom = await prisma.classroom.findFirst({
      where: { name: className },
      include: { teacher: true },
    });

    const classmates = await prisma.user.findMany({
      where: {
        role: "STUDENT",
        OR: [
          { className: className },
          { className: null },
          { className: "" },
        ],
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        rollNumber: true,
        className: true,
        branch: true,
        avatar: true,
        xp: true,
        level: true,
        streakDays: true,
        bio: true,
      },
      orderBy: { xp: "desc" },
    });

    const notes = await prisma.note.findMany({
      where: { className },
      orderBy: { createdAt: "desc" },
    });

    const projects = await prisma.project.findMany({
      where: {
        user: { className },
      },
      include: { user: { select: { id: true, name: true, avatar: true } } },
      orderBy: { createdAt: "desc" },
    });

    const announcements = await prisma.announcement.findMany({
      where: {
        OR: [{ targetAudience: className }, { targetAudience: "ALL" }],
      },
      include: { author: { select: { name: true, avatar: true } } },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({
      classroom: classroom || {
        name: className,
        branch: "Computer Science",
        academicYear: "2025-26",
      },
      classmates,
      notes,
      projects,
      announcements,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to fetch classrooms" }, { status: 500 });
  }
}
