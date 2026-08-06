import { NextRequest, NextResponse } from "next/server";
import { apiSuccess, apiError } from "@/lib/api/response";
import { supabaseAdmin } from "@/lib/supabase/server";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    
    // Fetch problem by ID or Slug
    let query = supabaseAdmin.from("problems").select("*");
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
    
    if (isUuid) {
      query = query.eq("id", id);
    } else {
      query = query.eq("slug", id);
    }

    const { data: problem, error } = await query.single();

    if (error || !problem) {
      return apiError("Problem not found", 404);
    }

    // Fetch problem metadata and test cases
    const { data: metadata } = await supabaseAdmin
      .from("problem_metadata")
      .select("*")
      .eq("problem_id", problem.id)
      .single();

    const { data: sampleTestCases } = await supabaseAdmin
      .from("sample_test_cases")
      .select("*")
      .eq("problem_id", problem.id);

    const { data: starterCodes } = await supabaseAdmin
      .from("starter_codes")
      .select("*, languages(name, slug, judge0_id)")
      .eq("problem_id", problem.id);

    return apiSuccess(
      {
        problem,
        metadata: metadata || null,
        sampleTestCases: sampleTestCases || [],
        starterCodes: starterCodes || [],
      },
      "Problem details fetched successfully"
    );
  } catch (error: any) {
    return apiError(error.message || "Failed to fetch problem", 500);
  }
}
