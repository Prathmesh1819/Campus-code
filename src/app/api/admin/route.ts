import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";
export const revalidate = 0;

export async function GET(_req: Request) {
  try {
    const totalUsers = await prisma.users.count();
    const studentRole = await prisma.roles.findFirst({ where: { name: { equals: "student", mode: "insensitive" } } });
    const teacherRole = await prisma.roles.findFirst({ where: { name: { equals: "teacher", mode: "insensitive" } } });
    const adminRole = await prisma.roles.findFirst({ where: { name: { equals: "admin", mode: "insensitive" } } });
    const superAdminRole = await prisma.roles.findFirst({ where: { name: { equals: "super_admin", mode: "insensitive" } } });

    const totalStudents = studentRole
      ? await prisma.users.count({
          where: {
            role_id: studentRole.id,
          },
        })
      : 0;

    const totalTeachers = teacherRole ? await prisma.users.count({ where: { role_id: teacherRole.id } }) : 0;
    const totalAdmins = await prisma.users.count({
      where: {
        OR: [
          adminRole ? { role_id: adminRole.id } : {},
          superAdminRole ? { role_id: superAdminRole.id } : {},
        ],
      },
    });

    const totalProblems = await prisma.problems.count({ where: { status: "published" } });
    const totalSubmissions = await prisma.submissions.count();
    const totalProjects = await prisma.projects.count();
    const totalPosts = 0;

    const rawUsers = await prisma.users.findMany({
      include: {
        roles: true,
        classes: true,
      },
      orderBy: { created_at: "desc" },
    });

    const users = rawUsers.map((u) => ({
      id: u.id,
      name: u.full_name || u.username || u.email.split("@")[0],
      email: u.email,
      role: u.roles?.name ? u.roles.name.toUpperCase() : "STUDENT",
      rollNumber: u.roll_number,
      className: u.classes?.name || "TY BSc CS",
      branch: "Computer Science",
      xp: u.xp || 0,
      coins: u.coins || 0,
      createdAt: u.created_at,
    }));

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
      posts: [],
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Admin API error" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { name, email, role, rollNumber, className } = body;

    if (!name || !email) {
      return NextResponse.json({ error: "Name and email are required" }, { status: 400 });
    }

    const cleanEmail = email.trim().toLowerCase();
    const existingUser = await prisma.users.findUnique({ where: { email: cleanEmail } });
    if (existingUser) {
      return NextResponse.json({ error: "User with this email already exists" }, { status: 400 });
    }

    const roleName = (role || "STUDENT").toLowerCase();
    const roleRecord = await prisma.roles.findFirst({ where: { name: { equals: roleName, mode: "insensitive" } } });
    const classRecord = className ? await prisma.classes.findFirst({ where: { name: { equals: className, mode: "insensitive" } } }) : null;

    const newUser = await prisma.users.create({
      data: {
        full_name: name,
        username: name.toLowerCase().replace(/\s+/g, ""),
        email: cleanEmail,
        role_id: roleRecord?.id || null,
        class_id: classRecord?.id || null,
        roll_number: rollNumber ? rollNumber.trim().toUpperCase() : null,
        profile_image: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80",
        xp: 0,
        level: 1,
        coins: 0,
      },
      include: { roles: true, classes: true },
    });

    return NextResponse.json({
      message: `User ${newUser.full_name} created successfully!`,
      user: {
        id: newUser.id,
        name: newUser.full_name,
        email: newUser.email,
        role: newUser.roles?.name ? newUser.roles.name.toUpperCase() : "STUDENT",
        rollNumber: newUser.roll_number,
        className: newUser.classes?.name || className,
      },
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to create user" }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const body = await req.json();
    const { userId, name, email, role, rollNumber, className, xp, coins } = body;

    if (!userId) {
      return NextResponse.json({ error: "User ID is required" }, { status: 400 });
    }

    const updateData: any = { updated_at: new Date() };
    if (name) updateData.full_name = name;
    if (email) updateData.email = email.trim().toLowerCase();
    if (rollNumber !== undefined) updateData.roll_number = rollNumber ? rollNumber.trim().toUpperCase() : null;
    if (xp !== undefined && !isNaN(Number(xp))) updateData.xp = Number(xp);
    if (coins !== undefined && !isNaN(Number(coins))) updateData.coins = Number(coins);

    if (role) {
      const roleRecord = await prisma.roles.findFirst({ where: { name: { equals: role.toLowerCase(), mode: "insensitive" } } });
      if (roleRecord) updateData.role_id = roleRecord.id;
    }

    if (className) {
      const classRecord = await prisma.classes.findFirst({ where: { name: { equals: className, mode: "insensitive" } } });
      if (classRecord) updateData.class_id = classRecord.id;
    }

    const updatedUser = await prisma.users.update({
      where: { id: userId },
      data: updateData,
      include: { roles: true, classes: true },
    });

    return NextResponse.json({
      message: `User ${updatedUser.full_name} details updated successfully!`,
      user: {
        id: updatedUser.id,
        name: updatedUser.full_name,
        email: updatedUser.email,
        role: updatedUser.roles?.name ? updatedUser.roles.name.toUpperCase() : "STUDENT",
        rollNumber: updatedUser.roll_number,
        className: updatedUser.classes?.name || className,
        xp: updatedUser.xp,
        coins: updatedUser.coins,
      },
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to update user details" }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const body = await req.json();
    const { userId, newRole } = body;

    if (!userId || !newRole) {
      return NextResponse.json({ error: "User ID and new role are required" }, { status: 400 });
    }

    const roleRecord = await prisma.roles.findFirst({ where: { name: { equals: newRole.toLowerCase(), mode: "insensitive" } } });

    const updatedUser = await prisma.users.update({
      where: { id: userId },
      data: { role_id: roleRecord?.id || null, updated_at: new Date() },
      include: { roles: true },
    });

    return NextResponse.json({
      message: `User ${updatedUser.full_name} role changed to ${newRole} by Admin`,
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

    if (userId) {
      const deletedUser = await prisma.users.delete({ where: { id: userId } });
      return NextResponse.json({ message: `User ${deletedUser.full_name} deleted successfully.` });
    }

    return NextResponse.json({ error: "User ID required for deletion" }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Deletion failed" }, { status: 500 });
  }
}
