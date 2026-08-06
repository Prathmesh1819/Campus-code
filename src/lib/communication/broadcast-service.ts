import { supabaseAdmin } from "@/lib/supabase/server";
import { dispatchUnifiedNotification } from "./notification-service";

export interface BroadcastTarget {
  role?: string;
  department_id?: string;
  class_id?: string;
  title: string;
  message: string;
  actionUrl?: string;
  sendEmail?: boolean;
}

export async function sendAdminBroadcast(createdBy: string, target: BroadcastTarget) {
  try {
    let query = supabaseAdmin.from("users").select("id, email, full_name");

    if (target.department_id) query = query.eq("department_id", target.department_id);
    if (target.class_id) query = query.eq("class_id", target.class_id);

    const { data: users, error } = await query;
    if (error || !users) throw new Error("Failed to fetch target users for broadcast");

    let count = 0;
    for (const u of users) {
      await dispatchUnifiedNotification({
        userId: u.id,
        userEmail: u.email,
        title: target.title,
        message: target.message,
        notificationType: "broadcast",
        priority: "high",
        actionUrl: target.actionUrl || "/",
        emailEvent: target.sendEmail ? "daily_digest" : undefined,
        templateData: {
          userName: u.full_name,
          title: target.title,
          details: target.message,
          actionUrl: target.actionUrl || "/",
        },
      });
      count++;
    }

    // Log broadcast action to audit_logs
    await supabaseAdmin.from("audit_logs").insert({
      user_id: createdBy,
      action: "ADMIN_BROADCAST_SENT",
      entity: "platform_announcements",
      new_data: { target, recipient_count: count },
    });

    return { success: true, recipientCount: count };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}
