import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase/admin";
import { COLLECTIONS } from "@/lib/firebase/firestore";
import { verifyServerToken } from "@/lib/firebase/auth";

export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

export async function GET(req: Request) {
  try {
    const authHeader = req.headers.get("Authorization");
    const token = authHeader?.startsWith("Bearer ") ? authHeader.substring(7) : "";
    const authUser = await verifyServerToken(token);

    const { searchParams } = new URL(req.url);
    const userId = authUser?.userId || searchParams.get("userId");
    const problemId = searchParams.get("problemId");

    let query: any = adminDb.collection(COLLECTIONS.SUBMISSIONS);

    if (userId) {
      query = query.where("user_id", "==", userId);
    }
    if (problemId) {
      query = query.where("problem_id", "==", problemId);
    }

    const snap = await query.get();
    let submissions: any[] = [];

    if (!snap.empty) {
      submissions = snap.docs.map((d: any) => {
        const s = d.data();
        return {
          id: d.id,
          userId: s.user_id,
          problemId: s.problem_id,
          problemTitle: s.problem_title || s.problem?.title || "Problem",
          code: s.source_code,
          language: s.language || "java",
          status: s.status || s.verdict,
          verdict: s.verdict || s.status,
          executionTimeMs: s.execution_time || 0,
          memoryUsageKb: s.memory_kb || 0,
          testCasesPassed: s.passed_test_cases || 0,
          totalTestCases: s.total_test_cases || 0,
          createdAt: s.submitted_at || s.created_at || new Date().toISOString(),
        };
      });
    }

    return NextResponse.json({ submissions });
  } catch (error: any) {
    console.error("GET /api/submissions error:", error);
    return NextResponse.json({ error: error.message || "Failed to fetch submissions" }, { status: 500 });
  }
}
