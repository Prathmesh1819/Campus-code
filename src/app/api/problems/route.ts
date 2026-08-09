import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const difficulty = searchParams.get("difficulty");
    const search = searchParams.get("search");

    const whereClause: any = {};
    if (difficulty && difficulty !== "ALL") whereClause.difficulty = difficulty;
    if (search) {
      whereClause.OR = [
        { title: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
      ];
    }

    const rawProblems = await prisma.problems.findMany({
      where: whereClause,
      include: {
        _count: {
          select: { submissions: true },
        },
      },
      orderBy: { created_at: "desc" },
    });

    const problems = rawProblems.map((p) => ({
      id: p.id,
      title: p.title,
      slug: p.slug,
      difficulty: p.difficulty,
      category: "Algorithms",
      description: p.description,
      constraints: p.constraints,
      acceptanceRate: p.acceptance_rate ? parseFloat(p.acceptance_rate.toString()) : 0,
      frequency: 90,
      companyTags: ["Google", "Amazon", "Meta"],
      submissionsCount: p._count.submissions,
      createdAt: p.created_at,
    }));

    return NextResponse.json({ problems });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to fetch problems" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { title, slug, difficulty, description, constraints, testCases } = body;

    const newSlug = slug || title.toLowerCase().replace(/\s+/g, "-");
    const problem = await prisma.problems.create({
      data: {
        title,
        slug: newSlug,
        difficulty: difficulty || "EASY",
        description: description || title,
        constraints: constraints || "1 <= N <= 10^5",
        test_cases: {
          create: (testCases || []).map((tc: any) => ({
            input: tc.input || "",
            expected_output: tc.expectedOutput || tc.output || "",
            is_hidden: tc.isHidden || false,
          })),
        },
      },
      include: { test_cases: true },
    });

    return NextResponse.json({ message: "Problem created successfully", problem });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to create problem" }, { status: 500 });
  }
}
