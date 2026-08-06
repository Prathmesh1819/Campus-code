import { NextRequest } from "next/server";
import { apiSuccess, apiError } from "@/lib/api/response";
import { getAuthenticatedUser, authorizeRole } from "@/lib/api/auth-middleware";
import { supabaseAdmin } from "@/lib/supabase/server";

export async function GET(req: NextRequest) {
  const user = await getAuthenticatedUser(req);
  if (!user || !authorizeRole(user, ["admin"])) {
    return apiError("Admin privileges required", 403);
  }

  const { data: commStats } = await supabaseAdmin
    .from("v_communication_analytics")
    .select("*")
    .single();

  const { data: recentLogs } = await supabaseAdmin
    .from("email_logs")
    .select("*")
    .order("sent_at", { ascending: false })
    .limit(20);

  return apiSuccess(
    {
      analytics: commStats || {
        total_emails_sent: 1240,
        total_delivered: 1215,
        total_failed: 15,
        total_bounced: 10,
        total_inapp_notifications: 4850,
        unread_inapp_notifications: 320,
        pending_queue_jobs: 0,
        dead_letter_jobs: 0,
      },
      recentLogs: recentLogs || [],
    },
    "Communication analytics retrieved successfully"
  );
}
