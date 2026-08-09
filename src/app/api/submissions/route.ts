import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId");
    const problemId = searchParams.get("problemId");

    const whereClause: any = {};
    if (userId) whereClause.user_id = userId;

    if (problemId) {
      const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(problemId);
      const p = await prisma.problems.findFirst({
        where: isUuid ? { OR: [{ id: problemId }, { slug: problemId }] } : { slug: problemId },
        select: { id: true },
      });
      if (p) {
        whereClause.problem_id = p.id;
      } else if (isUuid) {
        whereClause.problem_id = problemId;
      }
    }

    const submissions = await prisma.submissions.findMany({
      where: whereClause,
      include: {
        problems: { select: { id: true, title: true, slug: true, difficulty: true } },
        languages: { select: { name: true, slug: true } },
      },
      orderBy: { created_at: "desc" },
    });

    const formattedSubmissions = submissions.map((s) => ({
      id: s.id,
      userId: s.user_id,
      problemId: s.problem_id,
      code: s.source_code,
      language: s.languages?.slug || s.languages?.name || "java",
      status: s.status || s.verdict,
      verdict: s.verdict || s.status,
      executionTimeMs: s.execution_time || s.runtime_ms || 0,
      memoryUsageKb: s.memory_kb || 0,
      testCasesPassed: s.passed_test_cases || 0,
      totalTestCases: s.total_test_cases || 0,
      createdAt: s.created_at || s.submitted_at,
      problem: s.problems
        ? {
            id: s.problems.id,
            title: s.problems.title,
            slug: s.problems.slug,
            difficulty: s.problems.difficulty,
          }
        : undefined,
    }));

    return NextResponse.json({ submissions: formattedSubmissions });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to fetch submissions" }, { status: 500 });
  }
}
