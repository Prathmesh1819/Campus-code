import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { executeCodeSimulation } from "@/lib/code-runner";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { problemId, userId, code, language, isSubmit } = body;

    const problem = await prisma.problem.findUnique({
      where: { id: problemId },
      include: { testCases: true },
    });

    if (!problem) {
      return NextResponse.json({ error: "Problem not found" }, { status: 404 });
    }

    const testCasesToRun = problem.testCases.map((tc) => ({
      input: tc.input,
      expectedOutput: tc.expectedOutput,
    }));

    const result = executeCodeSimulation(code, language, testCasesToRun);

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

      // Update user XP, Level, Coins & Streak if Accepted
      if (result.status === "ACCEPTED") {
        const currentUser = await prisma.user.findUnique({ where: { id: userId } });
        const xpGain = problem.difficulty === "HARD" ? 150 : problem.difficulty === "MEDIUM" ? 100 : 50;
        const newStreak = (currentUser?.streakDays || 0) === 0 ? 1 : (currentUser?.streakDays || 1) + 1;

        await prisma.user.update({
          where: { id: userId },
          data: {
            xp: { increment: xpGain },
            coins: { increment: 20 },
            streakDays: newStreak,
          },
        });
      }
    }

    return NextResponse.json({
      result,
      submission: submissionRecord,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Code execution failed" }, { status: 500 });
  }
}
