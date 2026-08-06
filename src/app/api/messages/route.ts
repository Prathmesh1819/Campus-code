import { NextRequest } from "next/server";
import { apiSuccess, apiError } from "@/lib/api/response";
import { supabaseAdmin } from "@/lib/supabase/server";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId");
    const peerId = searchParams.get("peerId");

    if (!userId) {
      return apiError("User ID is required", 400);
    }

    if (peerId) {
      await supabaseAdmin
        .from("notifications")
        .update({ is_read: true })
        .eq("user_id", userId);

      const { data: rawMessages } = await supabaseAdmin
        .from("notifications")
        .select("*")
        .or(`user_id.eq.${userId},user_id.eq.${peerId}`)
        .order("created_at", { ascending: true });

      const messages = (rawMessages || []).map((m: any) => ({
        id: m.id,
        senderId: m.user_id,
        content: m.message,
        createdAt: m.created_at,
      }));

      return apiSuccess({ messages }, "Messages retrieved successfully");
    }

    const { data: allUsers } = await supabaseAdmin
      .from("users")
      .select("id, full_name, profile_image")
      .neq("id", userId);

    const contactsWithLatestMsg = (allUsers || []).map((u: any) => ({
      id: u.id,
      name: u.full_name,
      avatar: u.profile_image,
      lastMessageAt: new Date().toISOString(),
      lastMessageText: "Active in CampusCode community",
      unreadCount: 0,
    }));

    return apiSuccess({ contacts: contactsWithLatestMsg }, "Contacts retrieved successfully");
  } catch (error: any) {
    return apiError(error.message || "Failed to fetch messages", 500);
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { senderId, content } = body;

    const { data: message, error } = await supabaseAdmin
      .from("notifications")
      .insert({
        user_id: senderId,
        title: "Direct Message 💬",
        message: content || "New message",
        notification_type: "message",
        is_read: false,
      })
      .select("*")
      .single();

    if (error) return apiError("Failed to send message", 500, error);
    return apiSuccess({ message }, "Message sent successfully");
  } catch (error: any) {
    return apiError(error.message || "Failed to send message", 500);
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const messageId = searchParams.get("messageId");

    if (!messageId) {
      return apiError("messageId is required", 400);
    }

    await supabaseAdmin.from("notifications").delete().eq("id", messageId);
    return apiSuccess(null, "Message deleted successfully");
  } catch (error: any) {
    return apiError(error.message || "Failed to delete message", 500);
  }
}
