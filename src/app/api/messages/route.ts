import { NextResponse } from "next/server";
import { verifyServerToken } from "@/lib/firebase/auth";
import { FirebaseStoreService } from "@/lib/firebase/store";
import { adminDb } from "@/lib/firebase/admin";

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
      try {
        const snap = await adminDb
          .collection("messages")
          .where("conversationId", "==", convId)
          .get();

        if (!snap.empty) {
          messages = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
          // Filter out messages deleted for this user
          messages = messages.filter((m) => !Array.isArray(m.deletedFor) || !m.deletedFor.includes(userId));
          // Sort in memory by created_at/createdAt to avoid requiring composite index
          messages.sort((a, b) => {
            const timeA = new Date(a.created_at || a.createdAt || 0).getTime();
            const timeB = new Date(b.created_at || b.createdAt || 0).getTime();
            return timeA - timeB;
          });
        }
      } catch (err) {
        console.error("Error querying messages:", err);
      }

      return NextResponse.json({ messages });
    }

    // Fetch peer contacts
    const allUsers = await FirebaseStoreService.getUsers();
    const contacts = allUsers
      .filter((u: any) => u.id !== userId)
      .map((u: any) => {
        const fallbackName = u.full_name || u.name || u.username || (u.email ? u.email.split("@")[0] : null) || "Campus User";
        return {
          id: u.id,
          name: fallbackName,
          email: u.email || "",
          role: (u.role || "STUDENT").toUpperCase(),
          avatar: u.profile_image || u.avatar || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80",
          className: u.className || "TY BSc CS",
          lastMessageAt: new Date().toISOString(),
          lastMessageText: "",
          unreadCount: 0,
        };
      });

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

    const body = await req.json();
    const { receiverId, content } = body;
    const senderId = authUser?.userId || body.senderId;

    if (!senderId) {
      return NextResponse.json({ error: "Sender ID is required" }, { status: 401 });
    }

    if (!receiverId || !content) {
      return NextResponse.json({ error: "Receiver ID and message content are required" }, { status: 400 });
    }

    const convId = [senderId, receiverId].sort().join("_");
    const msgId = `msg-${Date.now()}`;
    const messageObj = {
      id: msgId,
      conversationId: convId,
      senderId: senderId,
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

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const messageId = searchParams.get("messageId");
    const userId = searchParams.get("userId");
    const mode = searchParams.get("mode");

    if (!messageId || !userId) {
      return NextResponse.json({ error: "messageId and userId are required" }, { status: 400 });
    }

    const docRef = adminDb.collection("messages").doc(messageId);
    const docSnap = await docRef.get();
    if (!docSnap.exists) {
      return NextResponse.json({ success: true, message: "Message not found or already deleted" });
    }

    const data = docSnap.data();
    if (mode === "everyone") {
      if (data?.senderId === userId) {
        await docRef.delete();
      }
    } else {
      const deletedFor = data?.deletedFor || [];
      if (!deletedFor.includes(userId)) {
        await docRef.update({ deletedFor: [...deletedFor, userId] });
      }
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("DELETE /api/messages error:", error);
    return NextResponse.json({ error: error.message || "Failed to delete message" }, { status: 500 });
  }
}

