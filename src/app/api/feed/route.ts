import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

export async function GET(_req: Request) {
  try {
    const rawPosts = await prisma.discussion_posts.findMany({
      include: {
        users: { select: { id: true, full_name: true, username: true, profile_image: true, roles: true } },
        discussion_votes: true,
        discussion_comments: {
          include: {
            users: { select: { id: true, full_name: true, username: true, profile_image: true } },
          },
          orderBy: { created_at: "desc" },
        },
      },
      orderBy: { created_at: "desc" },
    });

    const posts = rawPosts.map((p) => ({
      id: p.id,
      userId: p.user_id,
      content: p.content,
      title: p.title,
      codeSnippet: null,
      mediaUrl: null,
      tags: JSON.stringify(p.tags || []),
      likesCount: p.discussion_votes.length,
      commentsCount: p.discussion_comments.length,
      createdAt: p.created_at,
      user: {
        id: p.users.id,
        name: p.users.full_name || p.users.username || "Community Member",
        avatar: p.users.profile_image,
        role: p.users.roles?.name ? p.users.roles.name.toUpperCase() : "STUDENT",
      },
      likes: p.discussion_votes.map((v) => ({ userId: v.user_id })),
      comments: p.discussion_comments.map((c) => ({
        id: c.id,
        content: c.comment,
        createdAt: c.created_at,
        user: { id: c.users.id, name: c.users.full_name || c.users.username, avatar: c.users.profile_image },
      })),
    }));

    return NextResponse.json({ posts });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to fetch community posts" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { action, userId, postId, content, comment } = body;

    // Toggle Like
    if (action === "like") {
      const existing = await prisma.discussion_votes.findUnique({
        where: { discussion_id_user_id: { discussion_id: postId, user_id: userId } },
      });

      if (existing) {
        await prisma.discussion_votes.delete({
          where: { discussion_id_user_id: { discussion_id: postId, user_id: userId } },
        });
        return NextResponse.json({ liked: false });
      } else {
        await prisma.discussion_votes.create({
          data: { discussion_id: postId, user_id: userId, vote_type: "UPVOTE" },
        });
        return NextResponse.json({ liked: true });
      }
    }

    // Add Comment
    if (action === "comment") {
      const newComment = await prisma.discussion_comments.create({
        data: { discussion_id: postId, user_id: userId, comment: comment || "" },
        include: { users: { select: { id: true, full_name: true, username: true, profile_image: true } } },
      });
      return NextResponse.json({
        comment: {
          id: newComment.id,
          content: newComment.comment,
          user: { id: newComment.users.id, name: newComment.users.full_name || newComment.users.username, avatar: newComment.users.profile_image },
        },
      });
    }

    // Create New Post
    const newPost = await prisma.discussion_posts.create({
      data: {
        user_id: userId,
        title: content ? content.substring(0, 60) : "Discussion Post",
        content: content || "",
        category: "General",
      },
      include: {
        users: { select: { id: true, full_name: true, username: true, profile_image: true, roles: true } },
      },
    });

    return NextResponse.json({
      post: {
        id: newPost.id,
        userId: newPost.user_id,
        content: newPost.content,
        title: newPost.title,
        user: {
          id: newPost.users.id,
          name: newPost.users.full_name || newPost.users.username,
          avatar: newPost.users.profile_image,
          role: newPost.users.roles?.name ? newPost.users.roles.name.toUpperCase() : "STUDENT",
        },
        likes: [],
        comments: [],
      },
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to post to feed" }, { status: 500 });
  }
}
