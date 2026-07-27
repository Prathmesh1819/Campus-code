import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId");
    const peerId = searchParams.get("peerId");

    if (!userId) {
      return NextResponse.json({ error: "User ID is required" }, { status: 400 });
    }

    if (peerId) {
      const messages = await prisma.message.findMany({
        where: {
          OR: [
            { senderId: userId, receiverId: peerId },
            { senderId: peerId, receiverId: userId },
          ],
        },
        orderBy: { createdAt: "asc" },
      });
      return NextResponse.json({ messages });
    }

    // Get list of recent contacts
    const users = await prisma.user.findMany({
      where: { NOT: { id: userId } },
      select: { id: true, name: true, avatar: true, role: true, branch: true },
      take: 15,
    });

    return NextResponse.json({ contacts: users });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to fetch messages" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { senderId, receiverId, content, mediaUrl } = body;

    const message = await prisma.message.create({
      data: {
        senderId,
        receiverId,
        content,
        mediaUrl,
      },
    });

    return NextResponse.json({ message });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to send message" }, { status: 500 });
  }
}
