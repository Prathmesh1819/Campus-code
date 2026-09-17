import { NextResponse } from "next/server";
import { FirebaseStoreService } from "@/lib/firebase/store";

export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";
export const revalidate = 0;

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const scope = searchParams.get("scope") || "GLOBAL";
    const className = searchParams.get("className") || searchParams.get("class");

    const rankings = await FirebaseStoreService.getStudentLeaderboard(scope, className);

    return NextResponse.json({
      rankings,
      totalCount: rankings.length,
    });
  } catch (error: any) {
    console.error("GET /api/leaderboard error:", error);
    return NextResponse.json({ error: error.message || "Failed to fetch leaderboard" }, { status: 500 });
  }
}
