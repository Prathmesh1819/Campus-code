import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyAccessToken } from "@/lib/auth";
import { cookies } from "next/headers";

export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";
export const revalidate = 0;

async function getAuthUser(req: Request) {
  let token = "";
  const authHeader = req.headers.get("authorization");
  if (authHeader && authHeader.startsWith("Bearer ")) {
    token = authHeader.substring(7);
  } else {
    const cookieStore = await cookies();
    token = cookieStore.get("token")?.value || "";
  }

  if (!token) return null;
  const payload = verifyAccessToken(token);
  if (!payload?.userId) return null;

  return await prisma.users.findUnique({
    where: { id: payload.userId },
    include: { roles: true, classes: true },
  });
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const requestedClassId = searchParams.get("classId");
    const requestedClassName = searchParams.get("className");

    const authUser = await getAuthUser(req);
    const userRole = authUser?.roles?.name?.toLowerCase() || "student";

    let availableAssignedClasses: any[] = [];
    let authorizedClassNames: string[] = [];

    // Ensure database has default classes available
    let allCls = await prisma.classes.findMany({ orderBy: { name: "asc" } });
    if (allCls.length === 0) {
      const defaultClasses = [
        { name: "TY BSc CS", code: "TY-BSC-CS", year: "2026-27" },
        { name: "SY BSc CS", code: "SY-BSC-CS", year: "2026-27" },
        { name: "FY BSc CS", code: "FY-BSC-CS", year: "2026-27" },
        { name: "MSc CS Part 1", code: "MSC-CS-1", year: "2026-27" },
        { name: "MSc CS Part 2", code: "MSC-CS-2", year: "2026-27" },
      ];
      for (const cls of defaultClasses) {
        await prisma.classes.upsert({ where: { code: cls.code }, update: {}, create: cls });
      }
      allCls = await prisma.classes.findMany({ orderBy: { name: "asc" } });
    }

    if (userRole === "admin" || userRole === "super_admin") {
      availableAssignedClasses = allCls.map((c) => ({
        id: c.id,
        name: c.name,
        code: c.code,
        type: "ALL_ACCESS",
        subjectTitle: null,
      }));
      authorizedClassNames = allCls.map((c) => c.name.toLowerCase());
    } else if (userRole === "teacher") {
      const assignments = await prisma.faculty_teaching_assignments.findMany({
        where: { teacher_id: authUser?.id },
        include: { classes: true, courses: true },
      });

      availableAssignedClasses = assignments.map((a) => ({
        id: a.class_id,
        name: a.classes?.name || "Unknown",
        code: a.classes?.code || "",
        type: a.assignment_type,
        subjectTitle: a.courses?.title || null,
        courseId: a.course_id,
      }));

      authorizedClassNames = Array.from(
        new Set(assignments.map((a) => a.classes?.name?.toLowerCase()).filter(Boolean) as string[])
      );
    } else {
      // Student
      const studentClassName = authUser?.classes?.name || "TY BSc CS";
      authorizedClassNames = [studentClassName.toLowerCase()];
      availableAssignedClasses = [
        {
          id: authUser?.class_id || "default",
          name: studentClassName,
          type: "STUDENT_CLASS",
          subjectTitle: null,
        },
      ];
    }

    let classObj: any = null;
    if (requestedClassId) {
      classObj = await prisma.classes.findUnique({ where: { id: requestedClassId } });
    }
    if (!classObj && requestedClassName) {
      classObj = await prisma.classes.findFirst({
        where: { name: { equals: requestedClassName, mode: "insensitive" } },
      });
    }
    if (!classObj) {
      const defaultName = availableAssignedClasses[0]?.name || "TY BSc CS";
      classObj = await prisma.classes.findFirst({
        where: { name: { equals: defaultName, mode: "insensitive" } },
      });
    }

    const targetClassName = classObj?.name || requestedClassName || "TY BSc CS";

    // Server-side Authorization Verification
    if (
      userRole !== "admin" &&
      userRole !== "super_admin" &&
      authorizedClassNames.length > 0 &&
      !authorizedClassNames.includes(targetClassName.toLowerCase())
    ) {
      return NextResponse.json(
        { error: `Access Denied. You do not have an active teaching assignment for ${targetClassName}.` },
        { status: 403 }
      );
    }

    const studentRole = await prisma.roles.findFirst({
      where: { name: { equals: "student", mode: "insensitive" } },
    });

    const whereUsers: any = {};
    if (studentRole) whereUsers.role_id = studentRole.id;
    if (classObj) {
      whereUsers.class_id = classObj.id;
    }

    const rawClassmates = await prisma.users.findMany({
      where: whereUsers,
      include: {
        classes: true,
        roles: true,
        daily_streaks: true,
      },
      orderBy: { xp: "desc" },
    });

    const classmates = rawClassmates.map((u) => ({
      id: u.id,
      name: u.full_name || u.username || u.email.split("@")[0],
      email: u.email,
      role: u.roles?.name ? u.roles.name.toUpperCase() : "STUDENT",
      rollNumber: u.roll_number,
      className: u.classes?.name || targetClassName,
      avatar: u.profile_image || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80",
      xp: u.xp || 0,
      level: u.level || 1,
      streakDays: u.daily_streaks?.current_streak || 0,
      bio: u.bio,
    }));

    // Retrieve Faculty Assigned to this Classroom
    let assignedFaculty: any[] = [];
    if (classObj) {
      const facAssignments = await prisma.faculty_teaching_assignments.findMany({
        where: { class_id: classObj.id },
        include: {
          users_faculty_teaching_assignments_teacher_idTousers: {
            select: { full_name: true, email: true, profile_image: true },
          },
          courses: { select: { title: true } },
        },
      });

      assignedFaculty = facAssignments.map((a: any) => ({
        id: a.id,
        teacherId: a.teacher_id,
        name: a.users_faculty_teaching_assignments_teacher_idTousers?.full_name || "Faculty",
        email: a.users_faculty_teaching_assignments_teacher_idTousers?.email || "",
        avatar: a.users_faculty_teaching_assignments_teacher_idTousers?.profile_image || "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&auto=format&fit=crop&q=80",
        assignmentType: a.assignment_type,
        subjectTitle: a.courses?.title || null,
      }));
    }

    const rawProjects = await prisma.projects.findMany({
      take: 10,
      include: {
        users: { select: { id: true, full_name: true, username: true, profile_image: true } },
      },
      orderBy: { created_at: "desc" },
    });

    const projects = rawProjects.map((p) => ({
      id: p.id,
      title: p.title,
      description: p.description,
      githubUrl: p.github_url,
      liveDemoUrl: p.live_demo_url,
      user: {
        id: p.users.id,
        name: p.users.full_name || p.users.username || "Student",
        avatar: p.users.profile_image,
      },
    }));

    const rawAnnouncements = await prisma.announcements.findMany({
      take: 10,
      include: {
        users: { select: { full_name: true, username: true, profile_image: true } },
      },
      orderBy: { created_at: "desc" },
    });

    const announcements = rawAnnouncements.map((a) => ({
      id: a.id,
      title: a.title,
      message: a.message,
      createdAt: a.created_at,
      author: a.users
        ? {
            name: a.users.full_name || a.users.username || "Faculty",
            avatar: a.users.profile_image,
          }
        : { name: "Faculty Member" },
    }));

    const rawNotes = await prisma.teacher_notes.findMany({
      take: 10,
      include: {
        users: { select: { full_name: true, username: true, profile_image: true } },
        courses: { select: { title: true } },
      },
      orderBy: { created_at: "desc" },
    });

    const notes = rawNotes.map((n) => ({
      id: n.id,
      title: n.title,
      description: n.content,
      fileUrl: "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf",
      fileType: "PDF",
      subject: n.courses?.title || "Computer Science",
      createdAt: n.created_at,
      teacher: n.users ? { name: n.users.full_name || n.users.username, avatar: n.users.profile_image } : { name: "Faculty Member" },
    }));

    // Find ONLY CLASS_TEACHER assignment for selected classId
    const classTeacherAssignment = classObj
      ? await prisma.faculty_teaching_assignments.findFirst({
          where: {
            class_id: classObj.id,
            assignment_type: "CLASS_TEACHER",
          },
          include: {
            users_faculty_teaching_assignments_teacher_idTousers: true,
          },
        })
      : null;

    const classTeacherUser = classTeacherAssignment?.users_faculty_teaching_assignments_teacher_idTousers;

    const teacherInfo = classTeacherUser
      ? {
          name: classTeacherUser.full_name || classTeacherUser.username || classTeacherUser.email,
          email: classTeacherUser.email,
          avatar: classTeacherUser.profile_image || "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&auto=format&fit=crop&q=80",
          isAssigned: true,
        }
      : {
          name: "Class Teacher Yet to Be Announced",
          email: null,
          avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&auto=format&fit=crop&q=80",
          isAssigned: false,
        };

    return NextResponse.json({
      classId: classObj?.id,
      className: classObj?.name || targetClassName,
      classroom: {
        id: classObj?.id,
        name: classObj?.name || targetClassName,
        code: classObj?.code || "TY-BSC-CS-2026",
        branch: "Computer Science",
        academicYear: classObj?.year || "2026-27",
        teacher: teacherInfo,
      },
      assignedClasses: availableAssignedClasses,
      assignedFaculty,
      classmates,
      notes,
      projects,
      announcements,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to fetch classrooms" }, { status: 500 });
  }
}
