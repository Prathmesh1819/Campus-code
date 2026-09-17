import { NextResponse } from "next/server";
import { executeJudge0Submission } from "@/lib/code-runner";
import { calculateAndUpdateStreak } from "@/lib/streak";
import { FirebaseStoreService } from "@/lib/firebase/store";
import { verifyServerToken } from "@/lib/firebase/auth";
import { adminDb } from "@/lib/firebase/admin";
import { COLLECTIONS } from "@/lib/firebase/firestore";

export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";
export const revalidate = 0;

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { problemId, code, language, isSubmit, token: bodyToken } = body;

    if (!code || !language) {
      return NextResponse.json({ error: "Code and language are required" }, { status: 400 });
    }

    // 1. Verify Authentication Token (Required for Submissions)
    const authHeader = req.headers.get("Authorization");
    let token = authHeader?.startsWith("Bearer ") ? authHeader.substring(7) : "";
    if (!token && typeof bodyToken === "string") {
      token = bodyToken;
    }

    const authUser = await verifyServerToken(token);

    if (isSubmit && (!authUser || !authUser.userId)) {
      return NextResponse.json(
        { error: "Unauthorized. Valid Firebase ID token is required to submit code for evaluation." },
        { status: 401 }
      );
    }

    const effectiveUserId = authUser?.userId || null;

    // 2. Retrieve Problem & Hidden Test Cases strictly on Server Side
    const problem: any = await FirebaseStoreService.getProblemByIdOrSlug(problemId);
    if (!problem) {
      return NextResponse.json({ error: "Problem not found" }, { status: 404 });
    }

    const rawTestCases = await FirebaseStoreService.getTestCases(problem.id, true);

    const mappedTestCases = rawTestCases.map((tc: any) => ({
      input: tc.input,
      expectedOutput: tc.expected_output || tc.output,
    }));

    // 3. Execute code via Judge0 CE API Engine
    const result = await executeJudge0Submission(code, language, mappedTestCases);

    let submissionRecord = null;
    let updatedUserRecord = null;

    // 4. Handle Official Submission Persistence & XP / Streak Calculation
    if (isSubmit && effectiveUserId) {
      const subId = `sub-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
      submissionRecord = {
        id: subId,
        user_id: effectiveUserId,
        problem_id: problem.id,
        problem_title: problem.title,
        language: language,
        source_code: code,
        status: result.status,
        verdict: result.status,
        execution_time: result.executionTimeMs || 0,
        memory_kb: result.memoryUsageKb || 0,
        passed_test_cases: result.testCasesPassed || 0,
        total_test_cases: result.totalTestCases || 0,
        submitted_at: new Date().toISOString(),
      };

      await adminDb.collection(COLLECTIONS.SUBMISSIONS).doc(subId).set(submissionRecord);

      if (result.status === "ACCEPTED") {
        // Check for First Solve to avoid duplicate XP farming
        const isFirstSolve = await FirebaseStoreService.checkProblemFirstSolve(effectiveUserId, problem.id);

        let newXp = 0;
        let newLevel = 1;

        const userDoc: any = await FirebaseStoreService.getUserById(effectiveUserId);
        if (userDoc) {
          const currentXp = userDoc.xp || 0;

          if (isFirstSolve) {
            const diff = (problem.difficulty || "MEDIUM").toUpperCase();
            const xpGain = diff === "HARD" ? 150 : diff === "MEDIUM" ? 100 : 50;
            newXp = currentXp + xpGain;
            newLevel = Math.floor(newXp / 100) + 1;

            // Record solved problem idempotently
            await FirebaseStoreService.recordSolvedProblem(effectiveUserId, problem.id);

            // Update user XP & Solved Count
            await FirebaseStoreService.saveUser({
              ...userDoc,
              id: effectiveUserId,
              xp: newXp,
              level: newLevel,
              solved_count: (userDoc.solved_count || 0) + 1,
              updated_at: new Date().toISOString(),
            });
          } else {
            newXp = currentXp;
            newLevel = Math.floor(newXp / 100) + 1;
          }

          // Calculate streak in Asia/Kolkata IST
          const streakDays = await calculateAndUpdateStreak(effectiveUserId);

          updatedUserRecord = {
            id: effectiveUserId,
            xp: newXp,
            level: newLevel,
            streakDays: streakDays,
            isFirstSolve: isFirstSolve,
          };
        }
      }
    }

    return NextResponse.json(
      {
        result,
        submission: submissionRecord,
        user: updatedUserRecord,
      },
      {
        headers: {
          "Cache-Control": "no-cache, no-store, must-revalidate, max-age=0",
          Pragma: "no-cache",
        },
      }
    );
  } catch (error: any) {
    console.error("POST /api/execute error:", error);
    return NextResponse.json({ error: error.message || "Code execution failed" }, { status: 500 });
  }
}
