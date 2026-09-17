import { adminDb } from "./firebase/admin";
import { COLLECTIONS } from "./firebase/firestore";
import { getISTDateStr } from "./date-utils";

export async function calculateAndUpdateStreak(userId: string): Promise<number> {
  if (!userId) return 0;
  try {
    const snap = await adminDb
      .collection(COLLECTIONS.SUBMISSIONS)
      .where("user_id", "==", userId)
      .where("verdict", "==", "ACCEPTED")
      .get();

    const submissions = snap.empty ? [] : snap.docs.map((d) => d.data());

    const streakDocRef = adminDb.collection("streaks").doc(userId);
    const streakDoc = await streakDocRef.get();
    const existingStreakData = streakDoc.exists ? streakDoc.data() : null;

    if (submissions.length === 0) {
      await streakDocRef.set(
        {
          user_id: userId,
          current_streak: 0,
          longest_streak: existingStreakData?.longest_streak || 0,
          updated_at: new Date().toISOString(),
        },
        { merge: true }
      );
      // Also sync user document
      await adminDb.collection(COLLECTIONS.USERS).doc(userId).set({ streakDays: 0 }, { merge: true });
      return 0;
    }

    const activeDates = new Set(
      submissions
        .map((s) => getISTDateStr(s.submitted_at || s.created_at))
        .filter(Boolean)
    );

    const now = new Date();
    const todayStr = getISTDateStr(now);
    const yesterdayStr = getISTDateStr(new Date(now.getTime() - 86400000));

    if (!activeDates.has(todayStr) && !activeDates.has(yesterdayStr)) {
      await streakDocRef.set(
        {
          user_id: userId,
          current_streak: 0,
          longest_streak: existingStreakData?.longest_streak || 0,
          updated_at: new Date().toISOString(),
        },
        { merge: true }
      );
      await adminDb.collection(COLLECTIONS.USERS).doc(userId).set({ streakDays: 0 }, { merge: true });
      return 0;
    }

    let streak = 0;
    let dayOffset = activeDates.has(todayStr) ? 0 : 1;

    while (true) {
      const checkDate = new Date(now.getTime() - dayOffset * 86400000);
      const checkStr = getISTDateStr(checkDate);
      if (activeDates.has(checkStr)) {
        streak++;
        dayOffset++;
      } else {
        break;
      }
    }

    const longest = Math.max(streak, existingStreakData?.longest_streak || 0);

    await streakDocRef.set(
      {
        user_id: userId,
        current_streak: streak,
        longest_streak: longest,
        last_submission_date: now.toISOString(),
        updated_at: now.toISOString(),
      },
      { merge: true }
    );

    await adminDb.collection(COLLECTIONS.USERS).doc(userId).set({ streakDays: streak }, { merge: true });

    return streak;
  } catch (error) {
    console.error("Error calculating streak via Firestore:", error);
    return 0;
  }
}
