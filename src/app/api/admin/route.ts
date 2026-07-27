import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export async function GET(req: Request) {
  try {
    const totalUsers = await prisma.user.count();
    const totalStudents = await prisma.user.count({ where: { role: "STUDENT" } });
    const totalTeachers = await prisma.user.count({ where: { role: "TEACHER" } });
    const totalAdmins = await prisma.user.count({ where: { role: "ADMIN" } });
    const totalProblems = await prisma.problem.count();
    const totalSubmissions = await prisma.submission.count();
    const totalProjects = await prisma.project.count();
    const totalPosts = await prisma.post.count();

    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        rollNumber: true,
        className: true,
        branch: true,
        createdAt: true,
      },
      orderBy: { createdAt: "desc" },
    });

    const posts = await prisma.post.findMany({
      include: {
        user: { select: { name: true, email: true, role: true, avatar: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({
      stats: {
        totalUsers,
        totalStudents,
        totalTeachers,
        totalAdmins,
        totalProblems,
        totalSubmissions,
        totalProjects,
        totalPosts,
      },
      users,
      posts,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Admin API error" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { name, email, password, role, rollNumber, className, branch, academicYear } = body;

    if (!name || !email || !password) {
      return NextResponse.json({ error: "Name, Email, and Password are required" }, { status: 400 });
    }

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return NextResponse.json({ error: "User with this email already exists" }, { status: 400 });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role: role || "STUDENT",
        rollNumber: rollNumber || null,
        className: className || "TY BSc CS",
        branch: branch || "Computer Science",
        academicYear: academicYear || "2024-2025",
        avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80",
      },
    });

    return NextResponse.json({ message: `New ${user.role} user created successfully!`, user });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to create user" }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const body = await req.json();
    const { userId, newRole } = body;

    if (!userId || !newRole) {
      return NextResponse.json({ error: "User ID and new role are required" }, { status: 400 });
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { role: newRole },
    });

    return NextResponse.json({
      message: `User ${updatedUser.name} role changed to ${newRole} by Admin`,
      user: updatedUser,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to update user role" }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId");
    const postId = searchParams.get("postId");

    if (userId) {
      const deletedUser = await prisma.user.delete({ where: { id: userId } });
      return NextResponse.json({ message: `User ${deletedUser.name} deleted successfully.` });
    }

    if (postId) {
      await prisma.post.delete({ where: { id: postId } });
      return NextResponse.json({ message: "Post deleted by Admin." });
    }

    return NextResponse.json({ error: "User ID or Post ID required for deletion" }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Deletion failed" }, { status: 500 });
  }
}
