import { NextRequest } from "next/server";
import { apiSuccess, apiError } from "@/lib/api/response";
import { getAuthenticatedUser } from "@/lib/api/auth-middleware";
import { supabaseAdmin } from "@/lib/supabase/server";

export async function GET(req: NextRequest) {
  const user = await getAuthenticatedUser(req);
  if (!user) return apiError("Authentication required", 401);

  const { searchParams } = new URL(req.url);
  const search = searchParams.get("search");
  const type = searchParams.get("type");

  let query = supabaseAdmin.from("notifications").select("*").eq("user_id", user.id);

  if (type && type !== "ALL") {
    query = query.eq("notification_type", type);
  }
  if (search) {
    query = query.ilike("title", `%${search}%`);
  }

  const { data: timeline, error } = await query.order("created_at", { ascending: false });

  if (error) return apiError("Failed to fetch notification timeline", 500, error);
  return apiSuccess({ timeline }, "Notification timeline retrieved successfully");
}

export async function DELETE(req: NextRequest) {
  const user = await getAuthenticatedUser(req);
  if (!user) return apiError("Authentication required", 401);

  const { error } = await supabaseAdmin.from("notifications").delete().eq("user_id", user.id);
  if (error) return apiError("Failed to clear timeline", 500, error);

  return apiSuccess(null, "Timeline cleared successfully");
}
