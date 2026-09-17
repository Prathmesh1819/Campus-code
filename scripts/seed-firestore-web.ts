import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore, doc, setDoc, collection } from "firebase/firestore";
import fs from "fs";
import path from "path";

const firebaseConfig = {
  apiKey: "AIzaSyDCIK7qFNKGEI6spZrTEK0Eln27eHgep1Q",
  authDomain: "campus-code-7dbb5.firebaseapp.com",
  projectId: "campus-code-7dbb5",
  storageBucket: "campus-code-7dbb5.firebasestorage.app",
  messagingSenderId: "619216238001",
  appId: "1:619216238001:web:1d116fcef89c16bef2b990",
};

import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword } from "firebase/auth";

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const db = getFirestore(app);
const auth = getAuth(app);

async function seed() {
  console.log("Seeding Firestore via Web SDK (campus-code-7dbb5)...");

  // Sign in or create admin account for seeding
  try {
    await signInWithEmailAndPassword(auth, "admin@campuscode.com", "AdminPass123!");
    console.log("Authenticated as admin@campuscode.com");
  } catch (err: any) {
    try {
      await createUserWithEmailAndPassword(auth, "admin@campuscode.com", "AdminPass123!");
      console.log("Created & Authenticated as admin@campuscode.com");
    } catch (createErr: any) {
      console.warn("Auth warning during seed:", createErr.message);
    }
  }

  // 1. Roles
  const roles = [
    { id: "ed561bef-83da-4223-9b07-d39fe81f3318", name: "STUDENT", description: "Student account" },
    { id: "1a0ecadb-775c-4c85-9a26-a638cd32d947", name: "TEACHER", description: "Teacher account" },
    { id: "4e55d3d5-dc1b-43fa-854d-b9522b7e41ac", name: "ADMIN", description: "Department Admin" },
    { id: "f9b6d757-5d62-4be8-bef8-9b1674362f94", name: "SUPER_ADMIN", description: "Super Admin" },
  ];

  for (const r of roles) {
    await setDoc(doc(db, "roles", r.id), { ...r, created_at: new Date().toISOString() });
  }
  console.log("Roles seeded.");

  // 2. Classrooms
  const classrooms = [
    { id: "class-cse", name: "CSE", code: "CSE", year: "2026-27" },
    { id: "class-ty-bsc-cs", name: "TY BSc CS", code: "TY-BSC-CS", year: "2026-27" },
    { id: "class-sy-bsc-cs", name: "SY BSc CS", code: "SY-BSC-CS", year: "2026-27" },
    { id: "class-fy-bsc-cs", name: "FY BSc CS", code: "FY-BSC-CS", year: "2026-27" },
  ];

  for (const c of classrooms) {
    await setDoc(doc(db, "classrooms", c.id), { ...c, created_at: new Date().toISOString() });
  }
  console.log("Classrooms seeded.");

  // 3. Seed 50 Published Problems
  const pdfPath = path.join(process.cwd(), "prisma/canonical_50_pdf_dataset.json");
  let pdfQuestions: any[] = [];
  if (fs.existsSync(pdfPath)) {
    pdfQuestions = JSON.parse(fs.readFileSync(pdfPath, "utf8"));
  }

  let publishedCount = 0;
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
      constraints: item.constraints || "Standard constraints apply.",
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
          explanation: "Canonical sample test case",
        },
      ],
      starter_codes: [
        { language_id: "62", language: "java", starter_code: `class Solution {\n    public Object solve(Object input) {\n        return null;\n    }\n}` },
        { language_id: "71", language: "python", starter_code: `def solve(input):\n    pass` },
        { language_id: "50", language: "c", starter_code: `#include <stdio.h>\nint main() {\n    return 0;\n}` },
        { language_id: "54", language: "cpp", starter_code: `#include <iostream>\nint main() {\n    return 0;\n}` },
        { language_id: "63", language: "javascript", starter_code: `function solve(input) {\n    return null;\n}` },
      ],
    };

    await setDoc(doc(db, "problems", probId), problemObj);
    publishedCount++;

    const testCases = item.testCases || [];
    for (let j = 0; j < testCases.length; j++) {
      const tc = testCases[j];
      const tcId = `tc-${probId}-${j + 1}`;
      const isHidden = tc.isHidden !== undefined ? tc.isHidden : j > 1;

      await setDoc(doc(db, "testCases", tcId), {
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
  console.log(`Seeded ${publishedCount} published problems.`);

  // 4. Seed 87 Archived Problems
  const ccpsPath = path.join(process.cwd(), "prisma/ccps_problems.json");
  let ccpsQuestions: any[] = [];
  if (fs.existsSync(ccpsPath)) {
    ccpsQuestions = JSON.parse(fs.readFileSync(ccpsPath, "utf8"));
  }

  let archivedCount = 0;
  for (let i = 0; i < Math.min(87, ccpsQuestions.length); i++) {
    const item = ccpsQuestions[i];
    const probId = `problem-archived-${i + 1}`;

    const problemObj = {
      id: probId,
      title: item.title,
      slug: item.slug || `archived-${item.title.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`,
      difficulty: item.difficulty || "Medium",
      category: item.category || "General",
      description: item.description,
      constraints: item.constraints || "Standard constraints.",
      acceptance_rate: 50.0,
      status: "archived",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      examples: item.examples || [],
      starter_codes: item.starter_codes || [],
    };

    await setDoc(doc(db, "problems", probId), problemObj);
    archivedCount++;
  }
  console.log(`Seeded ${archivedCount} archived problems. Total problems: ${publishedCount + archivedCount}`);
}

seed().then(() => console.log("Seeding finished successfully.")).catch(console.error);
