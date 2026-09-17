import { PrismaClient } from "@prisma/client";
import { initializeApp, getApps } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

if (!getApps().length) {
  const projectId = process.env.FIREBASE_PROJECT_ID || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "campuscode-app";
  initializeApp({ projectId });
}

const adminDb = getFirestore();
const prisma = new PrismaClient();

const COLLECTIONS = {
  USERS: "users",
  ROLES: "roles",
  CLASSROOMS: "classrooms",
  PROBLEMS: "problems",
  TEST_CASES: "testCases",
  SUBMISSIONS: "submissions",
  LEADERBOARD: "leaderboard",
  ANNOUNCEMENTS: "announcements",
  NOTES: "notes",
  PROJECTS: "projects",
  MESSAGES: "messages",
  FACULTY_ASSIGNMENTS: "facultyAssignments",
  STREAKS: "streaks",
  NOTIFICATIONS: "notifications",
  FEEDS: "feeds",
};

async function runMigration() {
  console.log("==================================================");
  console.log(" STARTING SUPABASE/POSTGRESQL → FIREBASE MIGRATION ");
  console.log("==================================================");

  const report = {
    roles: { source: 0, migrated: 0 },
    users: { source: 0, migrated: 0 },
    classrooms: { source: 0, migrated: 0 },
    problems: { source: 0, published: 0, archived: 0, migrated: 0 },
    testCases: { source: 0, hidden: 0, public: 0, migrated: 0 },
    submissions: { source: 0, migrated: 0 },
    facultyAssignments: { source: 0, migrated: 0 },
    notes: { source: 0, migrated: 0 },
    projects: { source: 0, migrated: 0 },
    announcements: { source: 0, migrated: 0 },
  };

  try {
    // 1. Migrate Roles
    console.log("\n1. Migrating Roles...");
    const roles = await prisma.roles.findMany();
    report.roles.source = roles.length;
    for (const r of roles) {
      await adminDb.collection(COLLECTIONS.ROLES).doc(r.id).set({
        id: r.id,
        name: r.name,
        description: r.description || null,
        created_at: r.created_at,
      });
      report.roles.migrated++;
    }

    // 2. Migrate Classrooms (Classes)
    console.log("\n2. Migrating Classrooms...");
    const classes = await prisma.classes.findMany();
    report.classrooms.source = classes.length;
    for (const c of classes) {
      await adminDb.collection(COLLECTIONS.CLASSROOMS).doc(c.id).set({
        id: c.id,
        name: c.name,
        code: c.code,
        year: c.year || "2026-27",
        stream_id: c.stream_id || null,
        created_at: c.created_at,
      });
      report.classrooms.migrated++;
    }

    // 3. Migrate Users
    console.log("\n3. Migrating Users...");
    const users = await prisma.users.findMany({
      include: { roles: true, classes: true, daily_streaks: true },
    });
    report.users.source = users.length;
    for (const u of users) {
      const userObj = {
        id: u.id,
        email: u.email,
        full_name: u.full_name,
        username: u.username || u.full_name?.toLowerCase().replace(/\s+/g, "") || u.email.split("@")[0],
        roll_number: u.roll_number || null,
        role: u.roles?.name ? u.roles.name.toUpperCase() : "STUDENT",
        role_id: u.role_id || null,
        class_id: u.class_id || null,
        className: u.classes?.name || "TY BSc CS",
        profile_image: u.profile_image || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80",
        bio: u.bio || null,
        github_url: u.github_url || null,
        linkedin_url: u.linkedin_url || null,
        xp: u.xp || 0,
        level: u.level || 1,
        coins: u.coins || 0,
        faculty_type: u.faculty_type || "BOTH",
        streakDays: u.daily_streaks?.current_streak || 0,
        created_at: u.created_at,
        updated_at: u.updated_at,
      };

      await adminDb.collection(COLLECTIONS.USERS).doc(u.id).set(userObj);
      report.users.migrated++;
    }

    // 4. Migrate Problems & Test Cases (CRITICAL 137 Dataset: 50 Published, 87 Archived)
    console.log("\n4. Migrating Problems & Test Cases...");
    const problems = await prisma.problems.findMany({
      include: {
        test_cases: true,
        examples: true,
        starter_codes: true,
        editorials: true,
      },
    });

    report.problems.source = problems.length;
    for (const p of problems) {
      const isPublished = p.status === "published";
      if (isPublished) report.problems.published++;
      else report.problems.archived++;

      const problemObj = {
        id: p.id,
        title: p.title,
        slug: p.slug,
        difficulty: p.difficulty,
        description: p.description,
        constraints: p.constraints,
        acceptance_rate: Number(p.acceptance_rate || 0),
        status: p.status || "published",
        created_at: p.created_at,
        updated_at: p.updated_at,
        examples: p.examples.map((e) => ({
          id: e.id,
          example_number: e.example_number,
          input: e.input,
          output: e.output,
          explanation: e.explanation,
        })),
        starter_codes: p.starter_codes.map((s) => ({
          id: s.id,
          language_id: s.language_id,
          starter_code: s.starter_code,
          is_default_language: s.is_default_language,
        })),
        editorial: p.editorials ? { title: p.editorials.title, content: p.editorials.content } : null,
      };

      await adminDb.collection(COLLECTIONS.PROBLEMS).doc(p.id).set(problemObj);
      report.problems.migrated++;

      // Migrate Test Cases (Preserve hidden test protection)
      for (const tc of p.test_cases) {
        report.testCases.source++;
        if (tc.is_hidden) report.testCases.hidden++;
        else report.testCases.public++;

        await adminDb
          .collection(COLLECTIONS.TEST_CASES)
          .doc(tc.id)
          .set({
            id: tc.id,
            problem_id: p.id,
            input: tc.input,
            expected_output: tc.expected_output,
            is_hidden: tc.is_hidden,
            weight: tc.weight || 1,
            execution_order: tc.execution_order || 1,
            explanation: tc.explanation || null,
            created_at: tc.created_at,
          });
        report.testCases.migrated++;
      }
    }

    // 5. Migrate Submissions
    console.log("\n5. Migrating Submissions...");
    const submissions = await prisma.submissions.findMany({
      take: 500,
      orderBy: { created_at: "desc" },
    });
    report.submissions.source = submissions.length;
    for (const s of submissions) {
      await adminDb.collection(COLLECTIONS.SUBMISSIONS).doc(s.id).set({
        id: s.id,
        user_id: s.user_id,
        problem_id: s.problem_id,
        language_id: s.language_id,
        source_code: s.source_code,
        status: s.status,
        verdict: s.verdict,
        runtime_ms: s.runtime_ms || 0,
        memory_kb: s.memory_kb || 0,
        passed_test_cases: s.passed_test_cases || 0,
        total_test_cases: s.total_test_cases || 0,
        score: s.score || 0,
        submitted_at: s.submitted_at || s.created_at,
        created_at: s.created_at,
      });
      report.submissions.migrated++;
    }

    // 6. Migrate Faculty Teaching Assignments
    console.log("\n6. Migrating Faculty Teaching Assignments...");
    const facAssigns = await prisma.faculty_teaching_assignments.findMany({
      include: { classes: true, courses: true },
    });
    report.facultyAssignments.source = facAssigns.length;
    for (const fa of facAssigns) {
      await adminDb.collection(COLLECTIONS.FACULTY_ASSIGNMENTS).doc(fa.id).set({
        id: fa.id,
        teacher_id: fa.teacher_id,
        class_id: fa.class_id,
        course_id: fa.course_id,
        assignment_type: fa.assignment_type,
        className: fa.classes?.name || null,
        courseTitle: fa.courses?.title || null,
        created_at: fa.created_at,
      });
      report.facultyAssignments.migrated++;
    }

    // 7. Migrate Notes
    console.log("\n7. Migrating Teacher Notes...");
    const notes = await prisma.teacher_notes.findMany({
      include: { courses: true },
    });
    report.notes.source = notes.length;
    for (const n of notes) {
      await adminDb.collection(COLLECTIONS.NOTES).doc(n.id).set({
        id: n.id,
        course_id: n.course_id,
        title: n.title,
        content: n.content,
        uploaded_by: n.uploaded_by,
        subject: n.courses?.title || "Computer Science",
        created_at: n.created_at,
      });
      report.notes.migrated++;
    }

    // 8. Migrate Projects
    console.log("\n8. Migrating Projects...");
    const projects = await prisma.projects.findMany();
    report.projects.source = projects.length;
    for (const proj of projects) {
      await adminDb.collection(COLLECTIONS.PROJECTS).doc(proj.id).set({
        id: proj.id,
        user_id: proj.user_id,
        title: proj.title,
        description: proj.description,
        github_url: proj.github_url || null,
        live_demo_url: proj.live_demo_url || null,
        created_at: proj.created_at,
      });
      report.projects.migrated++;
    }

    // 9. Migrate Announcements
    console.log("\n9. Migrating Announcements...");
    const announcements = await prisma.announcements.findMany();
    report.announcements.source = announcements.length;
    for (const a of announcements) {
      await adminDb.collection(COLLECTIONS.ANNOUNCEMENTS).doc(a.id).set({
        id: a.id,
        course_id: a.course_id,
        title: a.title,
        message: a.message,
        posted_by: a.posted_by,
        created_at: a.created_at,
      });
      report.announcements.migrated++;
    }

    console.log("\n==================================================");
    console.log(" MIGRATION COMPARISON REPORT                      ");
    console.log("==================================================");
    console.log(JSON.stringify(report, null, 2));

    await prisma.$disconnect();
    return report;
  } catch (error) {
    console.error("Migration error:", error);
    await prisma.$disconnect();
    throw error;
  }
}

runMigration().catch(console.error);
