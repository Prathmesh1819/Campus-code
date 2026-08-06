import { NextRequest } from "next/server";
import { z } from "zod";
import { apiSuccess, apiError } from "@/lib/api/response";
import { validateBody } from "@/lib/api/validation";
import { getAuthenticatedUser } from "@/lib/api/auth-middleware";
import { supabaseAdmin } from "@/lib/supabase/server";

const prefsSchema = z.object({
  email_enabled: z.boolean().optional(),
  realtime_enabled: z.boolean().optional(),
  daily_digest: z.boolean().optional(),
  weekly_digest: z.boolean().optional(),
  monthly_digest: z.boolean().optional(),
  contest_alerts: z.boolean().optional(),
  assignment_alerts: z.boolean().optional(),
  ai_alerts: z.boolean().optional(),
  marketing_alerts: z.boolean().optional(),
});

export async function GET(req: NextRequest) {
  const user = await getAuthenticatedUser(req);
  if (!user) return apiError("Authentication required", 401);

  let { data: prefs } = await supabaseAdmin
    .from("communication_preferences")
    .select("*")
    .eq("user_id", user.id)
    .single();

  if (!prefs) {
    const { data: newPrefs } = await supabaseAdmin
      .from("communication_preferences")
      .insert({ user_id: user.id })
      .select("*")
      .single();
    prefs = newPrefs;
  }

  return apiSuccess(prefs, "Communication preferences retrieved");
}

export async function PATCH(req: NextRequest) {
  const user = await getAuthenticatedUser(req);
  if (!user) return apiError("Authentication required", 401);

  const { data: body, error: valError } = await validateBody(req, prefsSchema);
  if (valError) return apiError("Validation failed", 400, valError);

  const { data: updated, error } = await supabaseAdmin
    .from("communication_preferences")
    .upsert({ user_id: user.id, ...body!, updated_at: new Date().toISOString() })
    .select("*")
    .single();

  if (error) return apiError("Failed to update preferences", 500, error);
  return apiSuccess(updated, "Preferences updated successfully");
}
