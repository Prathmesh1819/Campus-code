import { NextRequest } from "next/server";
import { apiSuccess, apiError } from "@/lib/api/response";
import { getAuthenticatedUser } from "@/lib/api/auth-middleware";
import { supabaseAdmin } from "@/lib/supabase/server";

export async function GET(req: NextRequest) {
  const user = await getAuthenticatedUser(req);
  
  const { data: achievements, error } = await supabaseAdmin
    .from("achievements")
    .select("*");

  if (error) return apiError("Failed to fetch achievements", 500, error);

  if (user) {
    const { data: unlocked } = await supabaseAdmin
      .from("user_achievements")
      .select("achievement_id, unlocked_at")
      .eq("user_id", user.id);

    const unlockedIds = new Set(unlocked?.map((u) => u.achievement_id));

    const enriched = achievements.map((a) => ({
      ...a,
      unlocked: unlockedIds.has(a.id),
    }));

    return apiSuccess(enriched, "Achievements retrieved successfully");
  }

  return apiSuccess(achievements, "Master achievements retrieved successfully");
}
