import { NextRequest } from "next/server";
import { apiSuccess, apiError } from "@/lib/api/response";
import { supabaseAdmin } from "@/lib/supabase/server";

export async function GET(req: NextRequest) {
  const { data: languages, error } = await supabaseAdmin
    .from("languages")
    .select("*")
    .order("name", { ascending: true });

  if (error) return apiError("Failed to fetch languages", 500, error);
  return apiSuccess(languages, "Languages retrieved successfully");
}
