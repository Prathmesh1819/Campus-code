import { NextRequest } from "next/server";
import { apiSuccess, apiError } from "@/lib/api/response";
import { getAuthenticatedUser, authorizeRole } from "@/lib/api/auth-middleware";
import { supabaseAdmin } from "@/lib/supabase/server";

export async function GET(req: NextRequest) {
  const user = await getAuthenticatedUser(req);
  if (!user || !authorizeRole(user, ["admin"])) {
    return apiError("Admin privileges required", 403);
  }

  const { data: adminDash } = await supabaseAdmin.from("v_admin_dashboard").select("*").single();
  const { data: systemHealth } = await supabaseAdmin.from("v_system_health").select("*").single();
  const { data: platformStats } = await supabaseAdmin.from("v_platform_statistics").select("*").single();

  return apiSuccess(
    {
      dashboard: adminDash,
      health: systemHealth,
      statistics: platformStats,
    },
    "Analytics data retrieved successfully"
  );
}
