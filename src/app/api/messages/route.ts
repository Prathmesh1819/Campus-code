import { NextResponse } from "next/server";
import { verifyServerToken } from "@/lib/firebase/auth";
import { FirebaseStoreService } from "@/lib/firebase/store";
import { adminDb } from "@/lib/firebase/admin";
import { COLLECTIONS } from "@/lib/firebase/firestore";

export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

export async function GET(req: Request) {
  try {
    const authHeader = req.headers.get("Authorization");
    const token = authHeader?.startsWith("Bearer ") ? authHeader.substring(7) : "";
    const authUser = await verifyServerToken(token);

    const { searchParams } = new URL(req.url);
    const userId = authUser?.userId || searchParams.get("userId");
    const peerId = searchParams.get("peerId");

    if (!userId) {
      return NextResponse.json({ error: "Authentication or User ID is required" }, { status: 400 });
    }

    if (peerId) {
      // Fetch direct peer-to-peer messages from Firestore
      const convId = [userId, peerId].sort().join("_");
      let messages: any[] = [];
      const snap = await adminDb
        .collection("messages")
        .where("conversationId", "==", convId)
        .orderBy("created_at", "asc")
        .get();

      if (!snap.empty) {
        messages = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      }

      return NextResponse.json({ messages });
    }

    // Fetch peer contacts
    const allUsers = await FirebaseStoreService.getUsers();
    const contacts = allUsers
      .filter((u: any) => u.id !== userId)
      .map((u: any) => ({
        id: u.id,
        name: u.full_name || u.name || u.username || u.email?.split("@")[0],
        email: u.email,
        role: (u.role || "STUDENT").toUpperCase(),
        avatar: u.profile_image || u.avatar || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80",
        className: u.className || "TY BSc CS",
        lastMessageAt: new Date().toISOString(),
        lastMessageText: "",
        unreadCount: 0,
      }));

    return NextResponse.json({ contacts });
  } catch (error: any) {
    console.error("GET /api/messages error:", error);
    return NextResponse.json({ error: error.message || "Failed to fetch messages" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const authHeader = req.headers.get("Authorization");
    const token = authHeader?.startsWith("Bearer ") ? authHeader.substring(7) : "";
    const authUser = await verifyServerToken(token);

    if (!authUser || !authUser.userId) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    const body = await req.json();
    const { receiverId, content } = body;

    if (!receiverId || !content) {
      return NextResponse.json({ error: "Receiver ID and message content are required" }, { status: 400 });
    }

    const convId = [authUser.userId, receiverId].sort().join("_");
    const msgId = `msg-${Date.now()}`;
    const messageObj = {
      id: msgId,
      conversationId: convId,
      senderId: authUser.userId,
      receiverId: receiverId,
      content: content.trim(),
      created_at: new Date().toISOString(),
    };

    await adminDb.collection("messages").doc(msgId).set(messageObj);

    return NextResponse.json({ message: messageObj });
  } catch (error: any) {
    console.error("POST /api/messages error:", error);
    return NextResponse.json({ error: error.message || "Failed to send message" }, { status: 500 });
  }
}
