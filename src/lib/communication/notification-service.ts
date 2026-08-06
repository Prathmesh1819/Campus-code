import { defaultEmailProvider } from "./resend-provider";
import { renderEmailTemplate, EmailEventType, TemplateData } from "./email-templates";
import { supabaseAdmin } from "@/lib/supabase/server";

export interface UnifiedNotificationPayload {
  userId: string;
  userEmail?: string;
  title: string;
  message: string;
  notificationType?: string;
  priority?: "low" | "normal" | "high" | "urgent";
  actionUrl?: string;
  emailEvent?: EmailEventType;
  templateData?: TemplateData;
}

export async function dispatchUnifiedNotification(payload: UnifiedNotificationPayload) {
  const { userId, title, message, notificationType = "general", priority = "normal", actionUrl = "/", emailEvent, templateData } = payload;

  try {
    // 1. Insert Database & In-App Notification
    const { data: notification, error: notifError } = await supabaseAdmin
      .from("notifications")
      .insert({
        user_id: userId,
        title,
        message,
        notification_type: notificationType,
        priority,
        action_url: actionUrl,
        is_read: false,
      })
      .select("*")
      .single();

    if (notifError) console.error("Database notification error:", notifError);

    // 2. Insert Timeline Activity Log Event
    await supabaseAdmin.from("coding_activity").insert({
      user_id: userId,
      activity_type: notificationType.toUpperCase(),
      description: `${title}: ${message}`,
      xp_earned: priority === "urgent" ? 20 : 5,
    });

    // 3. Check User Communication & Notification Preferences
    const { data: userPref } = await supabaseAdmin
      .from("communication_preferences")
      .select("*")
      .eq("user_id", userId)
      .single();

    const emailAllowed = userPref ? userPref.email_enabled : true;

    // 4. Send Email Notification if enabled
    if (emailAllowed && emailEvent) {
      let recipientEmail = payload.userEmail;

      if (!recipientEmail) {
        const { data: userObj } = await supabaseAdmin
          .from("users")
          .select("email, full_name")
          .eq("id", userId)
          .single();
        recipientEmail = userObj?.email;
        if (userObj?.full_name && templateData) {
          templateData.userName = userObj.full_name;
        }
      }

      if (recipientEmail) {
        const rendered = renderEmailTemplate(emailEvent, templateData || { title, details: message, actionUrl });

        const emailResult = await defaultEmailProvider.sendEmail({
          to: recipientEmail,
          subject: rendered.subject,
          html: rendered.html,
        });

        // Log into email_logs
        await supabaseAdmin.from("email_logs").insert({
          user_id: userId,
          recipient_email: recipientEmail,
          subject: rendered.subject,
          template_name: emailEvent,
          provider: defaultEmailProvider.name,
          status: emailResult.success ? "delivered" : "failed",
          error_message: emailResult.error || null,
        });
      }
    }

    return { success: true, notification };
  } catch (err: any) {
    console.error("Failed to dispatch unified notification:", err);
    return { success: false, error: err.message };
  }
}
