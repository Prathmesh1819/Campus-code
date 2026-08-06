import { NextRequest } from "next/server";
import { apiSuccess, apiError } from "@/lib/api/response";
import { getAuthenticatedUser } from "@/lib/api/auth-middleware";
import { supabaseAdmin } from "@/lib/supabase/server";

export async function GET(req: NextRequest) {
  const user = await getAuthenticatedUser(req);
  if (!user) return apiError("Authentication required", 401);

  const { data: certs, error } = await supabaseAdmin
    .from("certificates")
    .select("*")
    .eq("user_id", user.id);

  if (error) return apiError("Failed to fetch certificates", 500, error);
  return apiSuccess(certs, "Certificates retrieved successfully");
}
