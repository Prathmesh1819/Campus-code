import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";
export const revalidate = 0;

const TOP_COMPANIES = ["Google", "Meta", "Amazon", "Microsoft", "Apple", "Netflix", "Uber", "Adobe"];
const ALL_CATEGORIES = ["Arrays", "Strings", "Linked List", "Stack", "Trees", "Graphs", "Dynamic Programming", "Searching", "Math", "SQL"];

function deriveCategory(title: string, description: string, dbTags: string[], problemId: string): string {
  const text = (title + " " + description + " " + dbTags.join(" ")).toLowerCase();
  if (text.includes("sql") || text.includes("table") || text.includes("query")) return "SQL";
  if (text.includes("linked list") || text.includes("listnode")) return "Linked List";
  if (text.includes("stack") || text.includes("parenthes") || text.includes("reverse polish") || text.includes("borrow")) return "Stack";
  if (text.includes("tree") || text.includes("binary tree") || text.includes("seating")) return "Trees";
  if (text.includes("graph") || text.includes("dfs") || text.includes("bfs") || text.includes("route") || text.includes("shuttle")) return "Graphs";
  if (text.includes("dynamic programming") || text.includes("fibonacci") || text.includes("min coins") || text.includes("dp")) return "Dynamic Programming";
  if (text.includes("binary search") || text.includes("searching") || text.includes("locator")) return "Searching";
  if (text.includes("string") || text.includes("substring") || text.includes("anagram") || text.includes("palindrome")) return "Strings";
  if (text.includes("math") || text.includes("factorial") || text.includes("gcd") || text.includes("calculator") || text.includes("fine")) return "Math";
  if (text.includes("array") || text.includes("subarray") || text.includes("sliding window") || text.includes("sum") || text.includes("sort")) return "Arrays";

  const hash = Math.abs(problemId.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0));
  return ALL_CATEGORIES[hash % ALL_CATEGORIES.length];
}

function deriveCompanies(problemId: string, dbCompanies: string[]): string[] {
  if (dbCompanies && dbCompanies.length > 0) return dbCompanies;
  const hash = Math.abs(problemId.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0));
  const c1 = TOP_COMPANIES[hash % TOP_COMPANIES.length];
  const c2 = TOP_COMPANIES[(hash + 3) % TOP_COMPANIES.length];
  const c3 = TOP_COMPANIES[(hash + 5) % TOP_COMPANIES.length];
  return Array.from(new Set([c1, c2, c3]));
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const difficulty = searchParams.get("difficulty");
    const category = searchParams.get("category");
    const company = searchParams.get("company");
    const search = searchParams.get("search");

    const whereClause: any = {
      status: "published",
    };
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
        problem_tags: { include: { tags: true } },
        problem_companies: { include: { companies: true } },
        _count: {
          select: { submissions: true },
        },
      },
      orderBy: { created_at: "desc" },
    });

    let formattedProblems = rawProblems.map((p) => {
      const dbTagNames = p.problem_tags?.map((pt) => pt.tags.name) || [];
      const dbCompanyNames = p.problem_companies?.map((pc) => pc.companies.name) || [];

      const probCategory = deriveCategory(p.title, p.description, dbTagNames, p.id);
      const probCompanies = deriveCompanies(p.id, dbCompanyNames);

      const freqHash = Math.abs(p.id.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0));
      const frequency = 70 + (freqHash % 28);

      return {
        id: p.id,
        title: p.title,
        slug: p.slug,
        difficulty: p.difficulty,
        category: probCategory,
        description: p.description,
        constraints: p.constraints,
        acceptanceRate: p.acceptance_rate ? parseFloat(p.acceptance_rate.toString()) : 65.5,
        frequency,
        companyTags: probCompanies,
        submissionsCount: p._count.submissions,
        createdAt: p.created_at,
      };
    });

    if (category && category !== "ALL") {
      formattedProblems = formattedProblems.filter(
        (p) => p.category.toLowerCase() === category.toLowerCase()
      );
    }

    if (company && company !== "ALL") {
      formattedProblems = formattedProblems.filter(
        (p) => p.companyTags.some((c) => c.toLowerCase() === company.toLowerCase())
      );
    }

    return NextResponse.json({ problems: formattedProblems });
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
