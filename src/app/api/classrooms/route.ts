import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";
export const revalidate = 0;

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const className = searchParams.get("className") || "TY BSc CS";

    const classObj = await prisma.classes.findFirst({
      where: { name: { equals: className, mode: "insensitive" } },
    });

    const studentRole = await prisma.roles.findFirst({
      where: { name: { equals: "student", mode: "insensitive" } },
    });

    const whereUsers: any = {};
    if (studentRole) whereUsers.role_id = studentRole.id;
    if (classObj) {
      whereUsers.OR = [
        { class_id: classObj.id },
        { class_id: null },
      ];
    }

    const rawClassmates = await prisma.users.findMany({
      where: whereUsers,
      include: {
        classes: true,
        roles: true,
        daily_streaks: true,
      },
      orderBy: { xp: "desc" },
    });

    const classmates = rawClassmates.map((u) => ({
      id: u.id,
      name: u.full_name || u.username || u.email.split("@")[0],
      email: u.email,
      role: u.roles?.name ? u.roles.name.toUpperCase() : "STUDENT",
      rollNumber: u.roll_number,
      className: u.classes?.name || className,
      avatar: u.profile_image || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80",
      xp: u.xp || 0,
      level: u.level || 1,
      streakDays: u.daily_streaks?.current_streak || 0,
      bio: u.bio,
    }));

    const rawProjects = await prisma.projects.findMany({
      take: 10,
      include: {
        users: { select: { id: true, full_name: true, username: true, profile_image: true } },
      },
      orderBy: { created_at: "desc" },
    });

    const projects = rawProjects.map((p) => ({
      id: p.id,
      title: p.title,
      description: p.description,
      githubUrl: p.github_url,
      liveDemoUrl: p.live_demo_url,
      user: {
        id: p.users.id,
        name: p.users.full_name || p.users.username || "Student",
        avatar: p.users.profile_image,
      },
    }));

    const rawAnnouncements = await prisma.announcements.findMany({
      take: 10,
      include: {
        users: { select: { full_name: true, username: true, profile_image: true } },
      },
      orderBy: { created_at: "desc" },
    });

    const announcements = rawAnnouncements.map((a) => ({
      id: a.id,
      title: a.title,
      message: a.message,
      createdAt: a.created_at,
      author: a.users
        ? {
            name: a.users.full_name || a.users.username || "Faculty",
            avatar: a.users.profile_image,
          }
        : { name: "Dr. Vikramaditya Gupta" },
    }));

    return NextResponse.json({
      classroom: {
        name: classObj?.name || className,
        code: classObj?.code || "TY-BSC-CS-2025",
        branch: "Computer Science",
        academicYear: classObj?.year || "2025-26",
      },
      classmates,
      notes: [],
      projects,
      announcements,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to fetch classrooms" }, { status: 500 });
  }
}
