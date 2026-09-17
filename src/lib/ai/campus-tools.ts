import { FirebaseStoreService } from "@/lib/firebase/store";

export async function executeCampusTools(
  entitiesNeeded: string[],
  authUser: any,
  query: string
): Promise<{ textContext: string; retrievedItemsCount: number }> {
  let contextParts: string[] = [];
  let itemCount = 0;
  const qLower = query.toLowerCase();

  const userClass = authUser?.className || "TY BSc CS";

  try {
    // 1. LEADERBOARD & TOP SCORERS (STUDENTS ONLY)
    if (
      entitiesNeeded.includes("LEADERBOARD") ||
      qLower.includes("leaderboard") ||
      qLower.includes("topper") ||
      qLower.includes("highest scorer")
    ) {
      const topUsers = await FirebaseStoreService.getStudentLeaderboard();

      if (topUsers.length > 0) {
        itemCount += topUsers.length;
        const formatted = topUsers
          .slice(0, 5)
          .map(
            (u: any, idx: number) =>
              `${idx + 1}. ${u.name || u.username} (${u.className || "Student"}) - ${u.xp || 0} XP, Streak: ${u.streakDays || 0} days`
          )
          .join("\n");
        contextParts.push(`[CAMPUS LEADERBOARD TOP SCORERS]:\n${formatted}`);
      }
    }

    // 2. FACULTY & TEACHING ASSIGNMENTS
    if (
      entitiesNeeded.includes("USERS") ||
      entitiesNeeded.includes("CLASSES") ||
      entitiesNeeded.includes("COURSES") ||
      qLower.includes("teaches") ||
      qLower.includes("faculty") ||
      qLower.includes("teacher")
    ) {
      itemCount += 2;
      contextParts.push(`[CAMPUS FACULTY & TEACHING ASSIGNMENTS]:\n- Guneshwari Patil: Class Teacher & Subject Teacher for TY BSc CS (Database Management Systems, DSA)`);
    }

    // 3. ANNOUNCEMENTS & NOTICES
    if (entitiesNeeded.includes("ANNOUNCEMENTS") || qLower.includes("announcement") || qLower.includes("notice")) {
      itemCount += 1;
      contextParts.push(`[CAMPUS ANNOUNCEMENTS]:\n- "Semester Practical Exam Schedule & Guidelines": Practical examinations for TY BSc CS start next Monday. Submitted by Guneshwari Patil.`);
    }

    // 4. PROBLEMS & CHALLENGES (EXCLUDE HIDDEN TEST CASES ALWAYS)
    if (entitiesNeeded.includes("PROBLEMS") || qLower.includes("problem") || qLower.includes("dsa") || qLower.includes("question")) {
      const problems = await FirebaseStoreService.getProblems("published");
      if (problems.length > 0) {
        itemCount += problems.length;
        const formattedProbs = problems
          .slice(0, 5)
          .map((p: any) => `- ${p.title} (${p.difficulty}): ${p.category || "DSA"}`)
          .join("\n");
        contextParts.push(`[AVAILABLE CANONICAL PROBLEMS]:\n${formattedProbs}`);
      }
    }
  } catch (error) {
    console.error("Error executing campus tools:", error);
  }

  return {
    textContext: contextParts.join("\n\n"),
    retrievedItemsCount: itemCount,
  };
}
