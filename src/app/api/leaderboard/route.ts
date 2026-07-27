import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const scope = searchParams.get("scope") || "GLOBAL"; // GLOBAL, COLLEGE, DEPARTMENT, CLASS
    const period = searchParams.get("period") || "ALL_TIME"; // WEEKLY, MONTHLY, ALL_TIME

    const users = await prisma.user.findMany({
      where: { role: "STUDENT" },
      select: {
        id: true,
        name: true,
        email: true,
        rollNumber: true,
        className: true,
        branch: true,
        avatar: true,
        xp: true,
        level: true,
        streakDays: true,
        badges: {
          include: { badge: true },
        },
        _count: {
          select: { submissions: true, projects: true },
        },
      },
      orderBy: { xp: "desc" },
    });

    // Add mock rank shifts for animated movement
    const formattedRankings = users.map((user, idx) => ({
      ...user,
      rank: idx + 1,
      rankChange: idx === 0 ? 0 : idx % 2 === 0 ? 1 : -1, // +1 (up), -1 (down), 0 (stable)
    }));

    return NextResponse.json({ rankings: formattedRankings, total: users.length });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to fetch leaderboard" }, { status: 500 });
  }
}
