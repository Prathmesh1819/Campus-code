import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { executeJudge0Submission } from "@/lib/code-runner";
import { calculateAndUpdateStreak } from "@/lib/streak";
import { verifyAccessToken } from "@/lib/auth";
import { syncSubmissionToPersistentStore } from "@/lib/user-sync";
import { cookies } from "next/headers";

export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";
export const revalidate = 0;

export async function POST(req: Request) {
  try {
    const { problemId, userId, code, language, isSubmit } = await req.json();

    if (!code || !language) {
      return NextResponse.json({ error: "Code and language are required" }, { status: 400 });
    }

    const problem = await prisma.problem.findFirst({
      where: { OR: [{ id: problemId }, { slug: problemId }] },
      include: { testCases: true },
    });

    if (!problem) {
      return NextResponse.json({ error: "Problem not found" }, { status: 404 });
    }

    // Execute code via pure Judge0 CE API Engine
    const result = await executeJudge0Submission(code, language, problem.testCases);

    let submissionRecord = null;
    let updatedUserRecord = null;

    // Resolve authenticated user ID from JWT token (cookie / Authorization header) or validated body userId
    let effectiveUserId = userId;
    try {
      const cookieStore = await cookies();
      const token = cookieStore.get("token")?.value;
      const authHeader = req.headers.get("Authorization");
      const bearerToken = authHeader?.startsWith("Bearer ") ? authHeader.substring(7) : null;
      const activeToken = token || bearerToken;

      if (activeToken) {
        const decoded = verifyAccessToken(activeToken);
        if (decoded?.userId) {
          effectiveUserId = decoded.userId;
        }
      }
    } catch {}

    if (effectiveUserId) {
      const existingUser = await prisma.user.findUnique({
        where: { id: effectiveUserId },
        select: { id: true },
      });
      if (!existingUser) {
        effectiveUserId = null;
      }
    }

    if (isSubmit && effectiveUserId) {
      submissionRecord = await prisma.submission.create({
        data: {
          userId: effectiveUserId,
          problemId: problem.id,
          code,
          language,
          status: result.status,
          executionTimeMs: result.executionTimeMs,
          memoryUsageKb: result.memoryUsageKb,
          testCasesPassed: result.testCasesPassed,
          totalTestCases: result.totalTestCases,
        },
      });

      // Update user XP, Level & Coins if Accepted, and Recalculate Dynamic Streak
      if (result.status === "ACCEPTED") {
        const xpGain = problem.difficulty === "HARD" ? 150 : problem.difficulty === "MEDIUM" ? 100 : 50;

        const userBefore = await prisma.user.findUnique({
          where: { id: effectiveUserId },
          select: { xp: true, streakDays: true },
        });

        console.log(`[EXECUTE API] DB Write Attempted - UserID: ${effectiveUserId}, ProblemID: ${problem.id}, SubmissionID: ${submissionRecord.id}, XP Before: ${userBefore?.xp || 0}, Streak Before: ${userBefore?.streakDays || 0}`);

        const updatedUser = await prisma.user.update({
          where: { id: effectiveUserId },
          data: {
            xp: { increment: xpGain },
            coins: { increment: 20 },
          },
          select: {
            id: true,
            xp: true,
            level: true,
            coins: true,
            streakDays: true,
          },
        });

        const streakDays = await calculateAndUpdateStreak(effectiveUserId);
        updatedUserRecord = { ...updatedUser, streakDays };

        console.log(`[EXECUTE API] DB Write Success - UserID: ${effectiveUserId}, XP After: ${updatedUserRecord.xp}, Streak After: ${updatedUserRecord.streakDays}`);
      }

      await syncSubmissionToPersistentStore(submissionRecord, updatedUserRecord || { id: effectiveUserId });
    }

    return NextResponse.json({
      result,
      submission: submissionRecord,
      user: updatedUserRecord,
    }, {
      headers: {
        "Cache-Control": "no-cache, no-store, must-revalidate, max-age=0",
        "Pragma": "no-cache",
        "Expires": "0"
      }
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Code execution failed" }, { status: 500 });
  }
}
