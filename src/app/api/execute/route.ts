import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { executeJudge0Submission, resolveProblemMetadata } from "@/lib/code-runner";
import { calculateAndUpdateStreak } from "@/lib/streak";

export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";
export const revalidate = 0;

export async function POST(req: Request) {
  try {
    const { problemId, userId, code, language, isSubmit } = await req.json();

    if (!code || !language) {
      return NextResponse.json({ error: "Code and language are required" }, { status: 400 });
    }

    const problem = await prisma.problem.findUnique({
      where: { id: problemId },
      include: { testCases: true },
    });

    if (!problem) {
      return NextResponse.json({ error: "Problem not found" }, { status: 404 });
    }

    // Resolve exact metadata schema for problem
    const metadata = resolveProblemMetadata(problem.id, problem.title);

    // Execute code via Metadata-Driven Judge0 CE Execution Engine
    const result = await executeJudge0Submission(code, language, problem.testCases, metadata);

    let submissionRecord = null;

    if (isSubmit && userId) {
      submissionRecord = await prisma.submission.create({
        data: {
          userId,
          problemId,
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

        await prisma.user.update({
          where: { id: userId },
          data: {
            xp: { increment: xpGain },
            coins: { increment: 20 },
          },
        });

        await calculateAndUpdateStreak(userId);
      }
    }

    return NextResponse.json({
      result,
      submission: submissionRecord,
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
