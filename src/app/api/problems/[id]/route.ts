import { NextRequest } from "next/server";
import { apiSuccess, apiError } from "@/lib/api/response";
import { supabaseAdmin } from "@/lib/supabase/server";
import fs from "fs";
import path from "path";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  let problem: any = null;

  try {
    const { data: dbProblem } = await supabaseAdmin.from("problems").select("*").eq("id", id).single();
    if (dbProblem) problem = dbProblem;
  } catch {
    // Ignore error and use local CCPS fallback
  }

  if (!problem) {
    const ccpsPath = path.join(process.cwd(), "src", "data", "ccps", "problems.json");
    if (fs.existsSync(ccpsPath)) {
      const problems: any[] = JSON.parse(fs.readFileSync(ccpsPath, "utf8"));
      problem = problems.find((p) => p.id === id || p.ccps_id === id || p.slug === id);
    }
  }

  if (!problem) {
    return apiError("Problem not found", 404);
  }

  // Load starter codes and test cases
  const scPath = path.join(process.cwd(), "src", "data", "ccps", "starter_codes.json");
  const tcPath = path.join(process.cwd(), "src", "data", "ccps", "test_cases.json");

  let starterCodes: any[] = [];
  let testCases: any[] = [];

  if (fs.existsSync(scPath)) {
    const allSc: any[] = JSON.parse(fs.readFileSync(scPath, "utf8"));
    starterCodes = allSc.filter((sc) => sc.problem_id === problem.id);
  }
  if (fs.existsSync(tcPath)) {
    const allTc: any[] = JSON.parse(fs.readFileSync(tcPath, "utf8"));
    testCases = allTc.filter((tc) => tc.problem_id === problem.id);
  }

  return apiSuccess(
    {
      problem: {
        ...problem,
        starterCodes,
        testCases,
      },
    },
    "Problem details retrieved successfully"
  );
}
