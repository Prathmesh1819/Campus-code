import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search");

    const whereClause: any = {};
    if (search) {
      whereClause.OR = [
        { title: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
      ];
    }

    const rawProjects = await prisma.projects.findMany({
      where: whereClause,
      include: {
        users: { select: { id: true, full_name: true, username: true, profile_image: true, classes: true } },
        project_likes: true,
        project_comments: {
          include: {
            users: { select: { full_name: true, username: true, profile_image: true } },
          },
          orderBy: { created_at: "desc" },
        },
      },
      orderBy: { created_at: "desc" },
    });

    const projects = rawProjects.map((p) => ({
      id: p.id,
      userId: p.user_id,
      title: p.title,
      description: p.description,
      category: "Full Stack",
      tags: JSON.stringify(p.tech_stack || ["React", "Node.js"]),
      githubUrl: p.github_url,
      liveDemoUrl: p.live_demo_url,
      imageUrl: p.thumbnail || "https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=800&auto=format&fit=crop&q=80",
      likesCount: p.project_likes.length,
      commentsCount: p.project_comments.length,
      createdAt: p.created_at,
      user: {
        id: p.users.id,
        name: p.users.full_name || p.users.username || "Student",
        avatar: p.users.profile_image,
        className: p.users.classes?.name || "TY BSc CS",
      },
      likes: p.project_likes.map((l) => ({ userId: l.user_id })),
      comments: p.project_comments.map((c) => ({
        id: c.id,
        content: c.comment,
        createdAt: c.created_at,
        user: { name: c.users.full_name || c.users.username, avatar: c.users.profile_image },
      })),
    }));

    return NextResponse.json({ projects });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to fetch projects" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { action, userId, projectId, title, description, tags, githubUrl, liveDemoUrl, imageUrl, comment } = body;

    // Like project
    if (action === "like") {
      const existing = await prisma.project_likes.findUnique({
        where: { project_id_user_id: { project_id: projectId, user_id: userId } },
      });

      if (existing) {
        await prisma.project_likes.delete({
          where: { project_id_user_id: { project_id: projectId, user_id: userId } },
        });
        return NextResponse.json({ liked: false });
      } else {
        await prisma.project_likes.create({
          data: { project_id: projectId, user_id: userId },
        });
        return NextResponse.json({ liked: true });
      }
    }

    // Comment on project
    if (action === "comment") {
      const newComment = await prisma.project_comments.create({
        data: { project_id: projectId, user_id: userId, comment: comment || "" },
        include: { users: { select: { full_name: true, username: true, profile_image: true } } },
      });

      return NextResponse.json({
        comment: {
          id: newComment.id,
          content: newComment.comment,
          createdAt: newComment.created_at,
          user: { name: newComment.users.full_name || newComment.users.username, avatar: newComment.users.profile_image },
        },
      });
    }

    // Create new Project
    const newProject = await prisma.projects.create({
      data: {
        user_id: userId,
        title,
        description,
        github_url: githubUrl,
        live_demo_url: liveDemoUrl,
        thumbnail: imageUrl || "https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=800&auto=format&fit=crop&q=80",
        tech_stack: Array.isArray(tags) ? tags : [tags || "Full Stack"],
      },
      include: {
        users: { select: { id: true, full_name: true, username: true, profile_image: true } },
      },
    });

    // Reward XP for project upload
    await prisma.users.update({
      where: { id: userId },
      data: { xp: { increment: 200 }, coins: { increment: 50 } },
    });

    return NextResponse.json({
      project: {
        id: newProject.id,
        userId: newProject.user_id,
        title: newProject.title,
        description: newProject.description,
        githubUrl: newProject.github_url,
        liveDemoUrl: newProject.live_demo_url,
        imageUrl: newProject.thumbnail,
        user: {
          id: newProject.users.id,
          name: newProject.users.full_name || newProject.users.username,
          avatar: newProject.users.profile_image,
        },
      },
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Project action failed" }, { status: 500 });
  }
}
