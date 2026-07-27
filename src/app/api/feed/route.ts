import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  try {
    const posts = await prisma.post.findMany({
      include: {
        user: { select: { id: true, name: true, avatar: true, branch: true, role: true } },
        likes: true,
        comments: {
          include: {
            user: { select: { id: true, name: true, avatar: true } },
          },
          orderBy: { createdAt: "desc" },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ posts });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to fetch community posts" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { action, userId, postId, content, codeSnippet, mediaUrl, tags, comment } = body;

    // Toggle Like
    if (action === "like") {
      const existing = await prisma.postLike.findUnique({
        where: { userId_postId: { userId, postId } },
      });

      if (existing) {
        await prisma.postLike.delete({ where: { id: existing.id } });
        await prisma.post.update({ where: { id: postId }, data: { likesCount: { decrement: 1 } } });
        return NextResponse.json({ liked: false });
      } else {
        await prisma.postLike.create({ data: { userId, postId } });
        await prisma.post.update({ where: { id: postId }, data: { likesCount: { increment: 1 } } });
        return NextResponse.json({ liked: true });
      }
    }

    // Add Comment
    if (action === "comment") {
      const newComment = await prisma.postComment.create({
        data: { userId, postId, content: comment },
        include: { user: { select: { id: true, name: true, avatar: true } } },
      });
      await prisma.post.update({ where: { id: postId }, data: { commentsCount: { increment: 1 } } });
      return NextResponse.json({ comment: newComment });
    }

    // Create New Post
    const newPost = await prisma.post.create({
      data: {
        userId,
        content,
        codeSnippet,
        mediaUrl,
        tags: typeof tags === "string" ? tags : JSON.stringify(tags || []),
      },
      include: {
        user: { select: { id: true, name: true, avatar: true, branch: true, role: true } },
        likes: true,
        comments: true,
      },
    });

    return NextResponse.json({ post: newPost });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to post to feed" }, { status: 500 });
  }
}
