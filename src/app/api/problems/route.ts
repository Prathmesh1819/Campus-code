import { NextResponse } from "next/server";
import { FirebaseStoreService } from "@/lib/firebase/store";
import { verifyServerToken } from "@/lib/firebase/auth";
import { adminDb } from "@/lib/firebase/admin";
import { COLLECTIONS } from "@/lib/firebase/firestore";

export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";
export const revalidate = 0;

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const difficulty = searchParams.get("difficulty");
    const category = searchParams.get("category");
    const search = searchParams.get("search");

    let rawProblems = await FirebaseStoreService.getProblems("published");

    if (difficulty && difficulty !== "ALL") {
      rawProblems = rawProblems.filter(
        (p: any) => p.difficulty?.toUpperCase() === difficulty.toUpperCase()
      );
    }

    if (category && category !== "ALL") {
      rawProblems = rawProblems.filter(
        (p: any) => p.category?.toLowerCase() === category.toLowerCase()
      );
    }

    if (search) {
      const q = search.toLowerCase();
      rawProblems = rawProblems.filter(
        (p: any) =>
          p.title?.toLowerCase().includes(q) ||
          p.description?.toLowerCase().includes(q) ||
          p.category?.toLowerCase().includes(q)
      );
    }

    const formattedProblems = rawProblems.map((p: any) => ({
      id: p.id,
      title: p.title,
      slug: p.slug,
      difficulty: p.difficulty,
      category: p.category || "General",
      description: p.description,
      constraints: p.constraints,
      acceptanceRate: p.acceptance_rate || 65.5,
      status: p.status || "published",
      examples: p.examples || [],
      starterCodes: p.starter_codes || [],
      companyTags: p.companyTags || ["Google", "Amazon", "Meta"],
    }));

    return NextResponse.json({ problems: formattedProblems });
  } catch (error: any) {
    console.error("GET /api/problems error:", error);
    return NextResponse.json({ error: error.message || "Failed to fetch problems" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const authHeader = req.headers.get("Authorization");
    const token = authHeader?.startsWith("Bearer ") ? authHeader.substring(7) : "";
    const authUser = await verifyServerToken(token);

    if (!authUser || (authUser.role !== "ADMIN" && authUser.role !== "SUPER_ADMIN")) {
      return NextResponse.json({ error: "Unauthorized. Admin role required." }, { status: 403 });
    }

    const body = await req.json();
    const { title, slug, difficulty, category, description, constraints, starterCodes, testCases } = body;

    if (!title || !description) {
      return NextResponse.json({ error: "Title and description are required" }, { status: 400 });
    }

    const problemId = slug || title.toLowerCase().replace(/[^a-z0-9]+/g, "-");
    const problemObj = {
      id: problemId,
      title,
      slug: problemId,
      difficulty: difficulty || "Medium",
      category: category || "DSA",
      description,
      constraints: constraints || "Standard constraints",
      acceptance_rate: 100.0,
      status: "published",
      starter_codes: starterCodes || [],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    await adminDb.collection(COLLECTIONS.PROBLEMS).doc(problemId).set(problemObj);

    if (Array.isArray(testCases)) {
      for (let i = 0; i < testCases.length; i++) {
        const tc = testCases[i];
        const tcId = `tc-${problemId}-${i + 1}`;
        await adminDb.collection(COLLECTIONS.TEST_CASES).doc(tcId).set({
          id: tcId,
          problem_id: problemId,
          input: String(tc.input),
          expected_output: String(tc.expectedOutput || tc.output),
          is_hidden: Boolean(tc.isHidden),
          execution_order: i + 1,
          created_at: new Date().toISOString(),
        });
      }
    }

    return NextResponse.json({ message: "Problem created successfully", problem: problemObj });
  } catch (error: any) {
    console.error("POST /api/problems error:", error);
    return NextResponse.json({ error: error.message || "Failed to create problem" }, { status: 500 });
  }
}
