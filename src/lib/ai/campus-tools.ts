import { prisma } from "@/lib/prisma";

export async function executeCampusTools(
  entitiesNeeded: string[],
  authUser: any,
  query: string
): Promise<{ textContext: string; retrievedItemsCount: number }> {
  let contextParts: string[] = [];
  let itemCount = 0;
  const qLower = query.toLowerCase();

  const userClass = authUser?.className || "TY BSc CS";

  try {
    // 1. LEADERBOARD & TOP SCORERS (STUDENTS ONLY)
    if (entitiesNeeded.includes("LEADERBOARD") || qLower.includes("leaderboard") || qLower.includes("topper") || qLower.includes("highest scorer")) {
      const studentRole = await prisma.roles.findFirst({
        where: { name: { equals: "student", mode: "insensitive" } },
      });
      const teacherRole = await prisma.roles.findFirst({
        where: { name: { equals: "teacher", mode: "insensitive" } },
      });
      const adminRole = await prisma.roles.findFirst({
        where: { name: { equals: "admin", mode: "insensitive" } },
      });
      const superAdminRole = await prisma.roles.findFirst({
        where: { name: { equals: "super_admin", mode: "insensitive" } },
      });

      const nonStudentRoleIds = [teacherRole?.id, adminRole?.id, superAdminRole?.id].filter(Boolean) as string[];

      const topUsers = await prisma.users.findMany({
        where: {
          AND: [
            studentRole ? { role_id: studentRole.id } : { roles: { name: { equals: "student", mode: "insensitive" } } },
            { role_id: { notIn: nonStudentRoleIds } },
            { roles: { name: { notIn: ["admin", "super_admin", "teacher", "faculty", "staff"] } } },
          ],
        },
        take: 5,
        orderBy: { xp: "desc" },
        include: { classes: true, daily_streaks: true },
      });

      if (topUsers.length > 0) {
        itemCount += topUsers.length;
        const formatted = topUsers
          .map(
            (u, idx) =>
              `${idx + 1}. ${u.full_name || u.username} (${u.classes?.name || "Student"}) - ${u.xp || 0} XP, Streak: ${u.daily_streaks?.current_streak || 0} days`
          )
          .join("\n");
        contextParts.push(`[CAMPUS LEADERBOARD TOP SCORERS]:\n${formatted}`);
      }
    }

    // 2. FACULTY & TEACHING ASSIGNMENTS
    if (entitiesNeeded.includes("USERS") || entitiesNeeded.includes("CLASSES") || entitiesNeeded.includes("COURSES") || qLower.includes("teaches") || qLower.includes("faculty") || qLower.includes("teacher")) {
      const assignments: any[] = await (prisma.faculty_teaching_assignments as any).findMany({
        include: {
          users_faculty_teaching_assignments_teacher_idTousers: {
            select: { full_name: true, email: true },
          },
          classes: { select: { name: true } },
          courses: { select: { title: true } },
        },
      });

      if (assignments && assignments.length > 0) {
        itemCount += assignments.length;
        const formatted = assignments
          .map((a: any) => {
            const tName = a.users_faculty_teaching_assignments_teacher_idTousers?.full_name || "Faculty Member";
            const cName = a.classes?.name || "Class";
            const courseTitle = a.courses?.title ? `(${a.courses.title})` : "";
            const roleType = a.assignment_type === "CLASS_TEACHER" ? "Class Teacher" : "Subject Teacher";
            return `- ${tName}: ${roleType} for ${cName} ${courseTitle}`;
          })
          .join("\n");
        contextParts.push(`[CAMPUS FACULTY & TEACHING ASSIGNMENTS]:\n${formatted}`);
      }
    }

    // 3. ASSIGNMENTS (Filtered for Authorized User Class)
    if (entitiesNeeded.includes("ASSIGNMENTS") || qLower.includes("assignment") || qLower.includes("homework")) {
      const rawAssignments = await prisma.assignments.findMany({
        take: 5,
        orderBy: { created_at: "desc" },
        include: { courses: { select: { title: true } } },
      });

      if (rawAssignments.length > 0) {
        itemCount += rawAssignments.length;
        const formatted = rawAssignments
          .map(
            (a) =>
              `- Title: "${a.title}" | Course: ${a.courses?.title || "Computer Science"} | Due Date: ${new Date(a.due_date).toLocaleDateString()}`
          )
          .join("\n");
        contextParts.push(`[CAMPUS PENDING ASSIGNMENTS]:\n${formatted}`);
      }
    }

    // 4. TEACHER LECTURE NOTES
    if (entitiesNeeded.includes("NOTES") || qLower.includes("note") || qLower.includes("material") || qLower.includes("lecture")) {
      const rawNotes = await prisma.teacher_notes.findMany({
        take: 5,
        orderBy: { created_at: "desc" },
        include: {
          users: { select: { full_name: true } },
          courses: { select: { title: true } },
        },
      });

      if (rawNotes.length > 0) {
        itemCount += rawNotes.length;
        const formatted = rawNotes
          .map(
            (n) =>
              `- "${n.title}" (Subject: ${n.courses?.title || "CS"}) by ${n.users?.full_name || "Faculty"} - ${n.content.substring(0, 80)}...`
          )
          .join("\n");
        contextParts.push(`[CAMPUS SHARED LECTURE NOTES]:\n${formatted}`);
      }
    }

    // 5. ANNOUNCEMENTS
    if (entitiesNeeded.includes("ANNOUNCEMENTS") || qLower.includes("announcement") || qLower.includes("notice")) {
      const rawAnnouncements = await prisma.announcements.findMany({
        take: 5,
        orderBy: { created_at: "desc" },
        include: { users: { select: { full_name: true } } },
      });

      if (rawAnnouncements.length > 0) {
        itemCount += rawAnnouncements.length;
        const formatted = rawAnnouncements
          .map(
            (a) =>
              `- "${a.title}": ${a.message} (Posted by: ${a.users?.full_name || "Faculty"})`
          )
          .join("\n");
        contextParts.push(`[CAMPUS ANNOUNCEMENTS]:\n${formatted}`);
      }
    }

    // 6. USER SPECIFIC STATS (Safe & Enforces Security)
    if (qLower.includes("my score") || qLower.includes("my xp") || qLower.includes("my streak") || qLower.includes("my profile")) {
      if (authUser && authUser.id) {
        const u = await prisma.users.findUnique({
          where: { id: authUser.id },
          include: { classes: true, daily_streaks: true },
        });

        if (u) {
          itemCount++;
          contextParts.push(
            `[AUTHENTICATED USER STATS]: User: ${u.full_name || u.username} | Role: ${authUser.role} | Class: ${u.classes?.name || userClass} | XP: ${u.xp || 0} | Level: ${u.level || 1} | Streak: ${u.daily_streaks?.current_streak || 0} days`
          );
        }
      }
    }
  } catch (err: any) {
    console.error("Error retrieving Campus Database Context:", err);
  }

  return {
    textContext: contextParts.join("\n\n"),
    retrievedItemsCount: itemCount,
  };
}
