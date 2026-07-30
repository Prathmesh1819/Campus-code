import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function calculateAndUpdateStreak(userId: string): Promise<number> {
  try {
    const submissions = await prisma.submission.findMany({
      where: {
        userId,
        status: "ACCEPTED",
      },
      select: {
        createdAt: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    if (!submissions || submissions.length === 0) {
      await prisma.user.update({
        where: { id: userId },
        data: { streakDays: 0 },
      });
      return 0;
    }

    // Extract unique active dates in YYYY-MM-DD
    const activeDates = new Set(
      submissions.map((s) => new Date(s.createdAt).toISOString().split("T")[0])
    );

    const now = new Date();
    const todayStr = now.toISOString().split("T")[0];

    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split("T")[0];

    // If user has NO submission today AND NO submission yesterday, streak is 0!
    if (!activeDates.has(todayStr) && !activeDates.has(yesterdayStr)) {
      await prisma.user.update({
        where: { id: userId },
        data: { streakDays: 0 },
      });
      return 0;
    }

    // Calculate consecutive active days going backwards
    let streak = 0;
    let curr = activeDates.has(todayStr) ? new Date(now) : yesterday;

    while (true) {
      const currStr = curr.toISOString().split("T")[0];
      if (activeDates.has(currStr)) {
        streak++;
        curr.setDate(curr.getDate() - 1);
      } else {
        break;
      }
    }

    await prisma.user.update({
      where: { id: userId },
      data: { streakDays: streak },
    });

    return streak;
  } catch (error) {
    console.error("Error calculating streak:", error);
    return 0;
  }
}
