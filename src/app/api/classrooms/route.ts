import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const className = searchParams.get("className");

    if (className) {
      const classroom = await prisma.classroom.findFirst({
        where: { name: className },
        include: { teacher: true },
      });

      const classmates = await prisma.user.findMany({
        where: { className, role: "STUDENT" },
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
        include: { user: true },
        orderBy: { createdAt: "desc" },
      });

      const announcements = await prisma.announcement.findMany({
        where: {
          OR: [{ targetAudience: className }, { targetAudience: "ALL" }],
        },
        include: { author: true },
        orderBy: { createdAt: "desc" },
      });

      return NextResponse.json({
        classroom,
        classmates,
        notes,
        projects,
        announcements,
      });
    }

    const classrooms = await prisma.classroom.findMany({
      include: {
        teacher: true,
      },
      orderBy: { createdAt: "asc" },
    });

    return NextResponse.json({ classrooms });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to fetch classrooms" }, { status: 500 });
  }
}
