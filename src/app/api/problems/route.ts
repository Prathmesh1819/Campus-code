import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const difficulty = searchParams.get("difficulty");
    const category = searchParams.get("category");
    const company = searchParams.get("company");
    const search = searchParams.get("search");

    const whereClause: any = {};
    if (difficulty && difficulty !== "ALL") whereClause.difficulty = difficulty;
    if (category && category !== "ALL") whereClause.category = category;
    if (company && company !== "ALL") {
      whereClause.companyTags = { contains: company };
    }
    if (search) {
      whereClause.OR = [
        { title: { contains: search } },
        { category: { contains: search } },
        { description: { contains: search } },
        { companyTags: { contains: search } },
      ];
    }

    const problems = await prisma.problem.findMany({
      where: whereClause,
      include: {
        _count: {
          select: { submissions: true },
        },
      },
      orderBy: { frequency: "desc" },
    });

    return NextResponse.json({ problems });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to fetch problems" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { title, slug, difficulty, category, description, examples, constraints, hints, editorial, testCases, companyTags, frequency } = body;

    const problem = await prisma.problem.create({
      data: {
        title,
        slug: slug || title.toLowerCase().replace(/\s+/g, "-"),
        difficulty,
        category,
        description,
        examples: typeof examples === "string" ? examples : JSON.stringify(examples || []),
        constraints: constraints || "1 <= N <= 10^5",
        hints: typeof hints === "string" ? hints : JSON.stringify(hints || []),
        editorial: editorial || "Editorial explanation coming soon.",
        acceptedLanguages: JSON.stringify(["c", "cpp", "java", "python", "javascript", "go", "rust", "kotlin"]),
        companyTags: typeof companyTags === "string" ? companyTags : JSON.stringify(companyTags || ["Google", "Meta"]),
        frequency: frequency || 85,
        testCases: {
          create: testCases || [
            { input: "sample_input", expectedOutput: "sample_output", isHidden: false },
          ],
        },
      },
      include: { testCases: true },
    });

    return NextResponse.json({ message: "Problem created successfully", problem });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to create problem" }, { status: 500 });
  }
}
