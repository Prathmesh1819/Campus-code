import { NextRequest } from "next/server";
import { apiSuccess, apiError } from "@/lib/api/response";
import { supabaseAdmin } from "@/lib/supabase/server";

export async function GET(req: NextRequest) {
  const { data: companies, error } = await supabaseAdmin
    .from("companies")
    .select("*")
    .order("name", { ascending: true });

  if (error) return apiError("Failed to fetch companies", 500, error);
  return apiSuccess(companies, "Companies retrieved successfully");
}
