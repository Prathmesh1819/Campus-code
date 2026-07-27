import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const category = searchParams.get("category");
    const search = searchParams.get("search");

    const whereClause: any = {};
    if (category && category !== "ALL") whereClause.category = category;
    if (search) {
      whereClause.OR = [
        { title: { contains: search } },
        { description: { contains: search } },
        { tags: { contains: search } },
      ];
    }

    const projects = await prisma.project.findMany({
      where: whereClause,
      include: {
        user: {
          select: { id: true, name: true, avatar: true, branch: true, className: true },
        },
        likes: true,
        comments: {
          include: {
            user: { select: { name: true, avatar: true } },
          },
          orderBy: { createdAt: "desc" },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ projects });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to fetch projects" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { action, userId, projectId, title, description, category, tags, githubUrl, liveDemoUrl, imageUrl, isHackathonWinner, comment } = body;

    // Like project
    if (action === "like") {
      const existing = await prisma.projectLike.findUnique({
        where: { userId_projectId: { userId, projectId } },
      });

      if (existing) {
        await prisma.projectLike.delete({ where: { id: existing.id } });
        await prisma.project.update({ where: { id: projectId }, data: { likesCount: { decrement: 1 } } });
        return NextResponse.json({ liked: false });
      } else {
        await prisma.projectLike.create({ data: { userId, projectId } });
        await prisma.project.update({ where: { id: projectId }, data: { likesCount: { increment: 1 } } });
        return NextResponse.json({ liked: true });
      }
    }

    // Add comment
    if (action === "comment") {
      const newComment = await prisma.projectComment.create({
        data: { userId, projectId, content: comment },
        include: { user: { select: { name: true, avatar: true } } },
      });
      return NextResponse.json({ comment: newComment });
    }

    // Create new Project
    const newProject = await prisma.project.create({
      data: {
        userId,
        title,
        description,
        category: category || "Web App",
        tags: typeof tags === "string" ? tags : JSON.stringify(tags || []),
        githubUrl,
        liveDemoUrl,
        imageUrl: imageUrl || "https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=800&auto=format&fit=crop&q=80",
        isHackathonWinner: Boolean(isHackathonWinner),
      },
      include: {
        user: { select: { id: true, name: true, avatar: true, branch: true } },
      },
    });

    // Reward XP for project upload
    await prisma.user.update({
      where: { id: userId },
      data: { xp: { increment: 200 }, coins: { increment: 50 } },
    });

    return NextResponse.json({ project: newProject });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Project action failed" }, { status: 500 });
  }
}
