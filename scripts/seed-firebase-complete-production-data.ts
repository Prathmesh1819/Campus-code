import { initializeApp, getApps, cert } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import fs from "fs";
import path from "path";

if (fs.existsSync(".env.local")) {
  const envConfig = fs.readFileSync(".env.local", "utf8");
  envConfig.split("\n").forEach((line) => {
    const match = line.match(/^([^=]+)=(.*)$/);
    if (match) process.env[match[1].trim()] = match[2].trim();
  });
}

if (!getApps().length) {
  const projectId = process.env.FIREBASE_PROJECT_ID || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "campus-code-7dbb5";
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL && process.env.FIREBASE_CLIENT_EMAIL.trim() !== '""' && process.env.FIREBASE_CLIENT_EMAIL.trim() !== '' ? process.env.FIREBASE_CLIENT_EMAIL : undefined;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY && process.env.FIREBASE_PRIVATE_KEY.trim() !== '""' && process.env.FIREBASE_PRIVATE_KEY.trim() !== '' ? process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, "\n") : undefined;

  if (clientEmail && privateKey) {
    initializeApp({
      credential: cert({
        projectId,
        clientEmail,
        privateKey,
      }),
    });
  } else {
    initializeApp({
      projectId,
    });
  }
}

const adminDb = getFirestore();

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

async function seedFirebaseProductionData() {
  console.log("==================================================");
  console.log(" SEEDING CLOUD FIRESTORE PRODUCTION DATASET        ");
  console.log("==================================================");

  const report = {
    roles: 0,
    classrooms: 0,
    users: 0,
    problemsPublished: 0,
    problemsArchived: 0,
    problemsTotal: 0,
    testCasesHidden: 0,
    testCasesPublic: 0,
    testCasesTotal: 0,
    facultyAssignments: 0,
    notes: 0,
  };

  // 1. Roles
  console.log("\n1. Seeding Roles...");
  const roles = [
    { id: "ed561bef-83da-4223-9b07-d39fe81f3318", name: "STUDENT", description: "Student account for learning and solving problems" },
    { id: "1a0ecadb-775c-4c85-9a26-a638cd32d947", name: "TEACHER", description: "Teacher account for notes, assignments, and managing classes" },
    { id: "4e55d3d5-dc1b-43fa-854d-b9522b7e41ac", name: "ADMIN", description: "Department Administrator account" },
    { id: "f9b6d757-5d62-4be8-bef8-9b1674362f94", name: "SUPER_ADMIN", description: "System Super Administrator account" },
    { id: "b2c3d4e5-f6a7-8b9c-0d1e-2f3a4b5c6d7e", name: "FACULTY", description: "Faculty member account" },
    { id: "c3d4e5f6-a7b8-9c0d-1e2f-3a4b5c6d7e8f", name: "STAFF", description: "Staff member account" },
  ];

  for (const r of roles) {
    await adminDb.collection(COLLECTIONS.ROLES).doc(r.id).set({
      ...r,
      created_at: new Date().toISOString(),
    });
    report.roles++;
  }

  // 2. Classrooms
  console.log("\n2. Seeding Classrooms...");
  const classrooms = [
    { id: "class-cse", name: "CSE", code: "CSE", year: "2026-27" },
    { id: "class-ty-bsc-cs", name: "TY BSc CS", code: "TY-BSC-CS", year: "2026-27" },
    { id: "class-sy-bsc-cs", name: "SY BSc CS", code: "SY-BSC-CS", year: "2026-27" },
    { id: "class-fy-bsc-cs", name: "FY BSc CS", code: "FY-BSC-CS", year: "2026-27" },
    { id: "class-msc-cs-1", name: "MSc CS Part 1", code: "MSC-CS-1", year: "2026-27" },
    { id: "class-msc-cs-2", name: "MSc CS Part 2", code: "MSC-CS-2", year: "2026-27" },
  ];

  for (const cls of classrooms) {
    await adminDb.collection(COLLECTIONS.CLASSROOMS).doc(cls.id).set({
      ...cls,
      created_at: new Date().toISOString(),
    });
    report.classrooms++;
  }

  // 3. Users
  console.log("\n3. Seeding Production Accounts...");
  const users = [
    {
      id: "ef876341-424a-416e-b00a-596560b17086",
      email: "sushantbagal@gmail.com",
      full_name: "Sushant Bagal",
      username: "sushant_b",
      roll_number: "A-244001",
      role: "STUDENT",
      role_id: "ed561bef-83da-4223-9b07-d39fe81f3318",
      class_id: "class-cse",
      className: "CSE",
      xp: 450,
      level: 3,
      streakDays: 4,
      profile_image: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80",
    },
    {
      id: "0d54f1fa-1f17-4153-b7c7-fc27ad4c1c30",
      email: "prathmeshdharashivkar18@gmail.com",
      full_name: "Prathmesh Dharashivkar",
      username: "prathmesh_d",
      roll_number: "A-244002",
      role: "STUDENT",
      role_id: "ed561bef-83da-4223-9b07-d39fe81f3318",
      class_id: "class-cse",
      className: "CSE",
      xp: 620,
      level: 4,
      streakDays: 7,
      profile_image: "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=400&auto=format&fit=crop&q=80",
    },
    {
      id: "c1319a47-ccef-48b2-b03e-2c9cb0da8ac4",
      email: "pratikhanamghar@gmail.com",
      full_name: "Pratik Hanamghar",
      username: "pratik_h",
      roll_number: "A-244003",
      role: "STUDENT",
      role_id: "ed561bef-83da-4223-9b07-d39fe81f3318",
      class_id: "class-ty-bsc-cs",
      className: "TY BSc CS",
      xp: 320,
      level: 2,
      streakDays: 2,
      profile_image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&auto=format&fit=crop&q=80",
    },
    {
      id: "teacher-guneshwari-patil",
      email: "guneshwaripatil01@gmail.com",
      full_name: "Guneshwari Patil",
      username: "guneshwari_patil",
      roll_number: "T-1001",
      role: "TEACHER",
      role_id: "1a0ecadb-775c-4c85-9a26-a638cd32d947",
      class_id: null,
      className: "Computer Science Dept",
      xp: 0,
      level: 1,
      streakDays: 0,
      profile_image: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=400&auto=format&fit=crop&q=80",
    },
    {
      id: "admin-super-sarhad",
      email: "admin@campuscode.com",
      full_name: "Sarhad College Admin",
      username: "admin_super",
      roll_number: "ADM-001",
      role: "SUPER_ADMIN",
      role_id: "f9b6d757-5d62-4be8-bef8-9b1674362f94",
      class_id: null,
      className: "System Administration",
      xp: 0,
      level: 1,
      streakDays: 0,
      profile_image: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80",
    },
  ];

  for (const u of users) {
    await adminDb.collection(COLLECTIONS.USERS).doc(u.id).set({
      ...u,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });
    report.users++;
  }

  // 4. Seeding Problems (50 Published PDF Dataset + 87 Archived = 137 Total)
  console.log("\n4. Seeding Problems & Test Cases (50 Published, 87 Archived)...");

  // Read PDF 50 questions
  const pdfPath = path.join(process.cwd(), "prisma/canonical_50_pdf_dataset.json");
  const ccpsPath = "./prisma/ccps_problems.json";

  let pdfQuestions: any[] = [];
  if (fs.existsSync(pdfPath)) {
    pdfQuestions = JSON.parse(fs.readFileSync(pdfPath, "utf8"));
  }

  let ccpsQuestions: any[] = [];
  if (fs.existsSync(ccpsPath)) {
    ccpsQuestions = JSON.parse(fs.readFileSync(ccpsPath, "utf8"));
  }

  // Seed 50 Published PDF Problems
  for (let i = 0; i < pdfQuestions.length; i++) {
    const item = pdfQuestions[i];
    const probId = `problem-published-${i + 1}`;

    const problemObj = {
      id: probId,
      title: item.title,
      slug: item.slug || item.title.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
      difficulty: item.difficulty || "Medium",
      category: item.category || "DSA",
      description: item.description,
      constraints: item.constraints || "See problem statement for constraints.",
      acceptance_rate: 65.5,
      status: "published",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      examples: [
        {
          id: `example-${probId}-1`,
          example_number: 1,
          input: item.testCases?.[0]?.input || "Sample input",
          output: item.testCases?.[0]?.expected || "Sample output",
          explanation: "Canonical test case",
        },
      ],
      starter_codes: [
        {
          language_id: "62",
          starter_code: `class Solution {\n    public Object solve(Object input) {\n        // Write your code here\n        return null;\n    }\n}`,
        },
        {
          language_id: "71",
          starter_code: `def solve(input):\n    # Write your solution here\n    pass`,
        },
        {
          language_id: "50",
          starter_code: `#include <stdio.h>\n\nint main() {\n    // Write your code here\n    return 0;\n}`,
        },
        {
          language_id: "54",
          starter_code: `#include <iostream>\nusing namespace html;\n\nint main() {\n    return 0;\n}`,
        },
        {
          language_id: "63",
          starter_code: `class Solution {\n    solve(input) {\n        return null;\n    }\n}`,
        },
      ],
    };

    await adminDb.collection(COLLECTIONS.PROBLEMS).doc(probId).set(problemObj);
    report.problemsPublished++;
    report.problemsTotal++;

    // Seed test cases for this published problem
    const testCases = item.testCases || [];
    for (let j = 0; j < testCases.length; j++) {
      const tc = testCases[j];
      const tcId = `tc-${probId}-${j + 1}`;
      const isHidden = tc.isHidden !== undefined ? tc.isHidden : j > 1;

      if (isHidden) report.testCasesHidden++;
      else report.testCasesPublic++;
      report.testCasesTotal++;

      await adminDb.collection(COLLECTIONS.TEST_CASES).doc(tcId).set({
        id: tcId,
        problem_id: probId,
        input: String(tc.input),
        expected_output: String(tc.expected),
        is_hidden: isHidden,
        weight: 1,
        execution_order: j + 1,
        created_at: new Date().toISOString(),
      });
    }
  }

  // Seed 87 Archived Problems to reach exactly 137 total problems
  const archivedTarget = 87;
  for (let i = 0; i < Math.min(archivedTarget, ccpsQuestions.length); i++) {
    const item = ccpsQuestions[i];
    const probId = `problem-archived-${i + 1}`;

    const problemObj = {
      id: probId,
      title: item.title,
      slug: item.slug || `archived-${item.title.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`,
      difficulty: item.difficulty || "Medium",
      category: item.category || "General",
      description: item.description,
      constraints: item.constraints || "Standard constraints apply.",
      acceptance_rate: 50.0,
      status: "archived",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      examples: item.examples || [],
      starter_codes: item.starter_codes || [],
    };

    await adminDb.collection(COLLECTIONS.PROBLEMS).doc(probId).set(problemObj);
    report.problemsArchived++;
    report.problemsTotal++;
  }

  // 5. Faculty Teaching Assignments
  console.log("\n5. Seeding Faculty Assignments...");
  const facAssigns = [
    {
      id: "fa-1001",
      teacher_id: "teacher-guneshwari-patil",
      class_id: "class-ty-bsc-cs",
      course_id: "course-dbms",
      assignment_type: "THEORY",
      className: "TY BSc CS",
      courseTitle: "Database Management Systems (DBMS)",
    },
    {
      id: "fa-1002",
      teacher_id: "teacher-guneshwari-patil",
      class_id: "class-ty-bsc-cs",
      course_id: "course-dsa",
      assignment_type: "PRACTICAL",
      className: "TY BSc CS",
      courseTitle: "Data Structures & Algorithms (DSA)",
    },
  ];

  for (const fa of facAssigns) {
    await adminDb.collection(COLLECTIONS.FACULTY_ASSIGNMENTS).doc(fa.id).set({
      ...fa,
      created_at: new Date().toISOString(),
    });
    report.facultyAssignments++;
  }

  // 6. Notes
  console.log("\n6. Seeding Teacher Notes...");
  const notes = [
    {
      id: "note-1001",
      course_id: "course-dbms",
      title: "Unit 1: Relational Database Architecture & SQL Queries",
      content: "Complete lecture reference notes covering ER diagrams, normalization (1NF, 2NF, 3NF, BCNF), transaction processing, and ACID properties.",
      uploaded_by: "teacher-guneshwari-patil",
      subject: "Database Management Systems",
      created_at: new Date().toISOString(),
    },
    {
      id: "note-1002",
      course_id: "course-dsa",
      title: "Unit 2: Graph Algorithms & Dynamic Programming Cheatsheet",
      content: "Detailed walkthrough of BFS, DFS, Dijkstra, Bellman-Ford, Floyd-Warshall, 0/1 Knapsack, and Longest Common Subsequence.",
      uploaded_by: "teacher-guneshwari-patil",
      subject: "Data Structures & Algorithms",
      created_at: new Date().toISOString(),
    },
  ];

  for (const n of notes) {
    await adminDb.collection(COLLECTIONS.NOTES).doc(n.id).set({
      ...n,
      created_at: new Date().toISOString(),
    });
    report.notes++;
  }

  console.log("\n==================================================");
  console.log(" CLOUD FIRESTORE SEED COMPLETE                     ");
  console.log("==================================================");
  console.log(JSON.stringify(report, null, 2));

  return report;
}

seedFirebaseProductionData().catch(console.error);
