import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { executeJudge0Submission } from "@/lib/code-runner";
import { calculateAndUpdateStreak } from "@/lib/streak";
import { verifyAccessToken } from "@/lib/auth";
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

    const problem = await prisma.problems.findFirst({
      where: { OR: [{ id: problemId }, { slug: problemId }] },
      include: { test_cases: true },
    });

    if (!problem) {
      return NextResponse.json({ error: "Problem not found" }, { status: 404 });
    }

    const mappedTestCases = (problem.test_cases || []).map((tc) => ({
      input: tc.input,
      expectedOutput: tc.expected_output,
    }));

    // Execute code via pure Judge0 CE API Engine
    const result = await executeJudge0Submission(code, language, mappedTestCases);

    let submissionRecord = null;
    let updatedUserRecord = null;

    // Resolve authenticated user ID from JWT token (cookie / Authorization header) or body userId
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
      const existingUser = await prisma.users.findUnique({
        where: { id: effectiveUserId },
        select: { id: true },
      });
      if (!existingUser) {
        effectiveUserId = null;
      }
    }

    if (isSubmit && effectiveUserId) {
      const langSlug = language.toLowerCase();
      let languageRecord = await prisma.languages.findFirst({
        where: { OR: [{ slug: langSlug }, { name: { equals: language, mode: "insensitive" } }] },
      });

      if (!languageRecord) {
        languageRecord = await prisma.languages.findFirst({ where: { slug: "java" } });
      }

      if (languageRecord) {
        submissionRecord = await prisma.submissions.create({
          data: {
            user_id: effectiveUserId,
            problem_id: problem.id,
            language_id: languageRecord.id,
            source_code: code,
            status: result.status,
            verdict: result.status,
            execution_time: result.executionTimeMs || 0,
            memory_kb: result.memoryUsageKb || 0,
            passed_test_cases: result.testCasesPassed || 0,
            total_test_cases: result.totalTestCases || 0,
            failed_test_cases: (result.totalTestCases || 0) - (result.testCasesPassed || 0),
            submitted_at: new Date(),
          },
        });

        // Update user XP, Level & Coins if Accepted, and Recalculate Dynamic Streak & Solved Problems
        if (result.status === "ACCEPTED") {
          const xpGain = problem.difficulty === "HARD" ? 150 : problem.difficulty === "MEDIUM" ? 100 : 50;

          // Check if this problem was already solved by the user
          const existingSolved = await prisma.solved_problems.findUnique({
            where: {
              user_id_problem_id: {
                user_id: effectiveUserId,
                problem_id: problem.id,
              },
            },
          });

          if (!existingSolved) {
            // First time solving this problem! Record first solved submission & award XP/coins
            await prisma.solved_problems.create({
              data: {
                user_id: effectiveUserId,
                problem_id: problem.id,
                first_solved_submission_id: submissionRecord.id,
                solved_at: new Date(),
              },
            });

            await prisma.users.update({
              where: { id: effectiveUserId },
              data: {
                xp: { increment: xpGain },
                coins: { increment: 20 },
              },
            });
          }

          const streakDays = await calculateAndUpdateStreak(effectiveUserId);
          const updatedUser = await prisma.users.findUnique({
            where: { id: effectiveUserId },
            select: { id: true, xp: true, level: true, coins: true },
          });

          // Update user_statistics
          const totalSolved = await prisma.solved_problems.count({ where: { user_id: effectiveUserId } });
          const totalSubs = await prisma.submissions.count({ where: { user_id: effectiveUserId } });

          await prisma.user_statistics.upsert({
            where: { user_id: effectiveUserId },
            update: {
              problems_solved: totalSolved,
              submissions_count: totalSubs,
              total_xp: updatedUser?.xp || 0,
              updated_at: new Date(),
            },
            create: {
              user_id: effectiveUserId,
              problems_solved: totalSolved,
              submissions_count: totalSubs,
              total_xp: updatedUser?.xp || 0,
            },
          });

          updatedUserRecord = {
            id: updatedUser?.id,
            xp: updatedUser?.xp,
            level: updatedUser?.level,
            coins: updatedUser?.coins,
            streakDays,
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
          Expires: "0",
        },
      }
    );
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Code execution failed" }, { status: 500 });
  }
}
