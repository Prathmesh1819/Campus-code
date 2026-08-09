import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const problem = await prisma.problems.findFirst({
      where: {
        OR: [{ id: id }, { slug: id }],
      },
      include: {
        test_cases: true,
        starter_codes: {
          include: { languages: true },
        },
        examples: true,
        hints: true,
        editorials: true,
        submissions: {
          take: 10,
          orderBy: { created_at: "desc" },
          include: {
            users: {
              select: { full_name: true, username: true, profile_image: true },
            },
          },
        },
      },
    });

    if (!problem) {
      return NextResponse.json({ error: "Problem not found" }, { status: 404 });
    }

    const formattedProblem = {
      id: problem.id,
      title: problem.title,
      slug: problem.slug,
      difficulty: problem.difficulty,
      category: "Algorithms",
      description: problem.description,
      constraints: problem.constraints,
      hints: problem.hints ? JSON.stringify(problem.hints.map((h) => h.content)) : "[]",
      editorial: problem.editorials?.content || "Editorial solution coming soon.",
      examples: problem.examples && problem.examples.length > 0
        ? JSON.stringify(problem.examples.map((e) => ({ input: e.input, output: e.output, explanation: e.explanation })))
        : JSON.stringify([{ input: "Sample Input", output: "Sample Output", explanation: "Standard test case." }]),
      testCases: problem.test_cases.map((tc) => ({
        id: tc.id,
        input: tc.input,
        expectedOutput: tc.expected_output,
        isHidden: tc.is_hidden,
      })),
      starterCodes: problem.starter_codes.map((sc) => ({
        language: sc.languages?.slug || "java",
        code: sc.starter_code,
      })),
      companyTags: JSON.stringify(["Google", "Amazon", "Meta"]),
      acceptedLanguages: JSON.stringify(["c", "cpp", "java", "python", "javascript", "go", "rust", "kotlin"]),
      submissions: problem.submissions.map((s) => ({
        id: s.id,
        user: { name: s.users.full_name || s.users.username || "Student", avatar: s.users.profile_image },
        status: s.status || s.verdict,
        verdict: s.verdict || s.status,
        executionTimeMs: s.execution_time || s.runtime_ms || 0,
        createdAt: s.created_at || s.submitted_at,
      })),
    };

    return NextResponse.json({ problem: formattedProblem });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to fetch problem" }, { status: 500 });
  }
}
