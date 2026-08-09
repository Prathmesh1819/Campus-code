import { prisma } from "./prisma";

function getISTDateStr(date: Date): string {
  return new Date(date).toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata" });
}

export async function calculateAndUpdateStreak(userId: string): Promise<number> {
  try {
    const submissions = await prisma.submissions.findMany({
      where: {
        user_id: userId,
        OR: [
          { status: "ACCEPTED" },
          { verdict: "ACCEPTED" },
        ],
      },
      select: {
        created_at: true,
        submitted_at: true,
      },
      orderBy: {
        created_at: "desc",
      },
    });

    if (!submissions || submissions.length === 0) {
      await prisma.daily_streaks.upsert({
        where: { user_id: userId },
        update: { current_streak: 0, updated_at: new Date() },
        create: { user_id: userId, current_streak: 0, longest_streak: 0 },
      });
      return 0;
    }

    const activeDates = new Set(
      submissions.map((s) => getISTDateStr(s.created_at || s.submitted_at))
    );

    const now = new Date();
    const todayStr = getISTDateStr(now);

    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = getISTDateStr(yesterday);

    if (!activeDates.has(todayStr) && !activeDates.has(yesterdayStr)) {
      const existingStreak = await prisma.daily_streaks.findUnique({
        where: { user_id: userId },
        select: { longest_streak: true },
      });
      await prisma.daily_streaks.upsert({
        where: { user_id: userId },
        update: { current_streak: 0, updated_at: new Date() },
        create: { user_id: userId, current_streak: 0, longest_streak: existingStreak?.longest_streak || 0 },
      });
      return 0;
    }

    let streak = 0;
    let curr = activeDates.has(todayStr) ? new Date(now) : yesterday;

    while (true) {
      const currStr = getISTDateStr(curr);
      if (activeDates.has(currStr)) {
        streak++;
        curr.setDate(curr.getDate() - 1);
      } else {
        break;
      }
    }

    const existingStreak = await prisma.daily_streaks.findUnique({
      where: { user_id: userId },
      select: { longest_streak: true },
    });
    const longest = Math.max(streak, existingStreak?.longest_streak || 0);

    await prisma.daily_streaks.upsert({
      where: { user_id: userId },
      update: {
        current_streak: streak,
        longest_streak: longest,
        last_submission_date: now,
        updated_at: now,
      },
      create: {
        user_id: userId,
        current_streak: streak,
        longest_streak: streak,
        last_submission_date: now,
        updated_at: now,
      },
    });

    return streak;
  } catch (error) {
    console.error("Error calculating streak:", error);
    return 0;
  }
}
