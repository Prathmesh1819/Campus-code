import { NextRequest } from "next/server";
import { apiSuccess, apiError } from "@/lib/api/response";
import { supabaseAdmin } from "@/lib/supabase/server";

export async function GET(req: NextRequest) {
  const { data: tags, error } = await supabaseAdmin
    .from("tags")
    .select("*")
    .order("name", { ascending: true });

  if (error) return apiError("Failed to fetch problem tags", 500, error);
  return apiSuccess(tags, "Tags retrieved successfully");
}
