import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId");
    const peerId = searchParams.get("peerId");

    if (!userId) {
      return NextResponse.json({ error: "User ID is required" }, { status: 400 });
    }

    if (peerId) {
      return NextResponse.json({ messages: [] });
    }

    // Get list of all campus users except self
    const allUsers = await prisma.users.findMany({
      where: { NOT: { id: userId } },
      include: { roles: true, classes: true },
    });

    const contacts = allUsers.map((u) => ({
      id: u.id,
      name: u.full_name || u.username || u.email.split("@")[0],
      email: u.email,
      role: u.roles?.name ? u.roles.name.toUpperCase() : "STUDENT",
      avatar: u.profile_image || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80",
      className: u.classes?.name || "TY BSc CS",
      lastMessageAt: new Date(0).toISOString(),
      lastMessageText: "",
      unreadCount: 0,
    }));

    return NextResponse.json({ contacts });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to fetch messages" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { senderId, receiverId, content } = body;

    return NextResponse.json({
      message: {
        id: "msg-" + Date.now(),
        senderId,
        receiverId,
        content,
        createdAt: new Date().toISOString(),
      },
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to send message" }, { status: 500 });
  }
}
