import { NextResponse } from "next/server";
import { FirebaseStoreService } from "@/lib/firebase/store";

export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";
export const revalidate = 0;

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;

    const problem: any = await FirebaseStoreService.getProblemByIdOrSlug(id);

    if (!problem) {
      return NextResponse.json({ error: "Problem not found" }, { status: 404 });
    }

    // Fetch test cases from Firestore with includeHidden = false for client safety
    const rawTestCases = await FirebaseStoreService.getTestCases(problem.id, false);

    // CRITICAL SECURITY REQUIREMENT: Filter out any hidden test cases before responding to client
    const publicTestCases = rawTestCases.filter((tc: any) => !tc.is_hidden);

    const formattedProblem = {
      id: problem.id,
      title: problem.title,
      slug: problem.slug,
      difficulty: problem.difficulty,
      category: problem.category || "Algorithms",
      description: problem.description,
      constraints: problem.constraints,
      hints: problem.hints ? (typeof problem.hints === "string" ? problem.hints : JSON.stringify(problem.hints)) : "[]",
      editorial: problem.editorial?.content || problem.editorial || "Editorial solution coming soon.",
      examples:
        problem.examples && problem.examples.length > 0
          ? typeof problem.examples === "string"
            ? problem.examples
            : JSON.stringify(problem.examples.map((e: any) => ({ input: e.input, output: e.output || e.expected_output, explanation: e.explanation })))
          : JSON.stringify(publicTestCases.map((tc: any) => ({ input: tc.input, output: tc.expected_output || tc.output }))),
      testCases: publicTestCases.map((tc: any) => ({
        id: tc.id,
        input: tc.input,
        expectedOutput: tc.expected_output || tc.output,
        isHidden: false,
      })),
      starterCodes: (problem.starter_codes || problem.starterCodes || []).map((sc: any) => ({
        language: sc.language || sc.languages?.slug || "java",
        code: sc.starter_code || sc.code,
      })),
      companyTags: JSON.stringify(problem.companyTags || ["Google", "Amazon", "Meta"]),
      acceptedLanguages: JSON.stringify(["c", "cpp", "java", "python", "javascript", "go", "rust", "kotlin"]),
      submissions: [],
    };

    return NextResponse.json(
      { problem: formattedProblem },
      {
        headers: {
          "Cache-Control": "no-cache, no-store, must-revalidate, max-age=0",
          Pragma: "no-cache",
        },
      }
    );
  } catch (error: any) {
    console.error("GET /api/problems/[id] error:", error);
    return NextResponse.json({ error: error.message || "Failed to fetch problem detail" }, { status: 500 });
  }
}
