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
      // Automatically mark received messages as READ when opening conversation
      await prisma.message.updateMany({
        where: {
          senderId: peerId,
          receiverId: userId,
          readStatus: false,
        },
        data: {
          readStatus: true,
          readAt: new Date(),
        },
      });

      const rawMessages = await prisma.message.findMany({
        where: {
          OR: [
            { senderId: userId, receiverId: peerId },
            { senderId: peerId, receiverId: userId },
          ],
        },
        orderBy: { createdAt: "asc" },
      });

      // Filter out messages deleted for this specific user
      const messages = rawMessages.filter((m) => {
        try {
          const deletedList = JSON.parse(m.deletedFor || "[]");
          return !deletedList.includes(userId);
        } catch {
          return true;
        }
      });

      return NextResponse.json({ messages });
    }

    // Get list of recent contacts
    const users = await prisma.user.findMany({
      where: { NOT: { id: userId } },
      select: { id: true, name: true, avatar: true, role: true, branch: true },
      take: 20,
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

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const messageId = searchParams.get("messageId");
    const userId = searchParams.get("userId");
    const mode = searchParams.get("mode"); // "everyone" | "me"

    if (!messageId || !userId) {
      return NextResponse.json({ error: "messageId and userId are required" }, { status: 400 });
    }

    const message = await prisma.message.findUnique({ where: { id: messageId } });
    if (!message) {
      return NextResponse.json({ error: "Message not found" }, { status: 404 });
    }

    if (mode === "everyone") {
      // Only sender can delete for everyone
      if (message.senderId !== userId) {
        return NextResponse.json({ error: "Only the sender can unsend/delete for everyone" }, { status: 403 });
      }

      await prisma.message.delete({ where: { id: messageId } });
      return NextResponse.json({ success: true, message: "Deleted for everyone" });
    } else {
      // Delete for me
      let deletedList: string[] = [];
      try {
        deletedList = JSON.parse(message.deletedFor || "[]");
      } catch {
        deletedList = [];
      }

      if (!deletedList.includes(userId)) {
        deletedList.push(userId);
      }

      await prisma.message.update({
        where: { id: messageId },
        data: { deletedFor: JSON.stringify(deletedList) },
      });

      return NextResponse.json({ success: true, message: "Deleted for me" });
    }
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to delete message" }, { status: 500 });
  }
}
