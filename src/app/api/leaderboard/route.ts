import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const scope = searchParams.get("scope") || "GLOBAL";
    const className = searchParams.get("className") || searchParams.get("class");
    const departmentId = searchParams.get("departmentId") || searchParams.get("department");

    const studentRole = await prisma.roles.findFirst({
      where: { name: { equals: "student", mode: "insensitive" } },
    });
    const teacherRole = await prisma.roles.findFirst({
      where: { name: { equals: "teacher", mode: "insensitive" } },
    });
    const adminRole = await prisma.roles.findFirst({
      where: { name: { equals: "admin", mode: "insensitive" } },
    });
    const superAdminRole = await prisma.roles.findFirst({
      where: { name: { equals: "super_admin", mode: "insensitive" } },
    });

    const nonStudentRoleIds = [teacherRole?.id, adminRole?.id, superAdminRole?.id].filter(Boolean) as string[];

    const whereClause: any = {
      AND: [
        studentRole ? { role_id: studentRole.id } : { roles: { name: { equals: "student", mode: "insensitive" } } },
        { role_id: { notIn: nonStudentRoleIds } },
        { roles: { name: { notIn: ["admin", "super_admin", "teacher", "faculty", "staff"] } } },
      ],
    };

    if (scope === "CLASS" || className) {
      const targetClass = className || "TY BSc CS";
      const classRecord = await prisma.classes.findFirst({
        where: { name: { equals: targetClass, mode: "insensitive" } },
      });
      if (classRecord) {
        whereClause.AND.push({ class_id: classRecord.id });
      }
    } else if (scope === "DEPARTMENT" || departmentId) {
      if (departmentId) {
        whereClause.AND.push({ department_id: departmentId });
      }
    }

    const rawUsers = await prisma.users.findMany({
      where: whereClause,
      include: {
        roles: true,
        classes: true,
        daily_streaks: true,
        user_statistics: true,
        _count: {
          select: { submissions: true, projects: true, solved_problems: true },
        },
      },
      orderBy: [
        { xp: "desc" },
        { created_at: "asc" },
      ],
    });

    const formattedRankings = rawUsers.map((u, idx) => ({
      id: u.id,
      name: u.full_name || u.username || u.email.split("@")[0],
      email: u.email,
      username: u.username,
      rollNumber: u.roll_number,
      className: u.classes?.name || "TY BSc CS",
      avatar: u.profile_image || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80",
      xp: u.xp || 0,
      level: u.level || 1,
      streakDays: u.daily_streaks?.current_streak || 0,
      coins: u.coins || 0,
      problemsSolved: u.user_statistics?.problems_solved || u._count.solved_problems || 0,
      submissionsCount: u.user_statistics?.submissions_count || u._count.submissions || 0,
      rank: idx + 1,
      rankChange: 0,
    }));

    return NextResponse.json({ rankings: formattedRankings, total: rawUsers.length });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to fetch leaderboard" }, { status: 500 });
  }
}
