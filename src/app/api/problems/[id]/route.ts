import { NextRequest } from "next/server";
import { apiSuccess, apiError } from "@/lib/api/response";
import { supabaseAdmin } from "@/lib/supabase/server";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  try {
    const { data: problem, error: pErr } = await supabaseAdmin
      .from("problems")
      .select("*")
      .or(`id.eq.${id},slug.eq.${id}`)
      .single();

    if (pErr || !problem) {
      return apiError("Problem not found in database", 404, pErr);
    }

    const { data: starterCodes } = await supabaseAdmin
      .from("starter_codes")
      .select("*")
      .eq("problem_id", problem.id);

    const { data: testCases } = await supabaseAdmin
      .from("test_cases")
      .select("*")
      .eq("problem_id", problem.id);

    return apiSuccess(
      {
        problem: {
          ...problem,
          starterCodes: starterCodes || [],
          testCases: testCases || [],
        },
      },
      "Problem details retrieved successfully from Supabase"
    );
  } catch (err: any) {
    return apiError(`Database query failed: ${err.message}`, 500);
  }
}
