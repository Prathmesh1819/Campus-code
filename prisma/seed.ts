import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🚀 Seeding PostgreSQL database with roles, languages, and initial data...");

  // Seed Roles if missing
  const roles = [
    { name: "student", description: "Student account for learning, solving problems, and competing" },
    { name: "teacher", description: "Teacher account for creating notes, assignments, and managing classes" },
    { name: "admin", description: "Department Administrator account" },
    { name: "super_admin", description: "System Super Administrator account" },
  ];

  for (const r of roles) {
    await prisma.roles.upsert({
      where: { name: r.name },
      update: { description: r.description },
      create: { name: r.name, description: r.description },
    });
  }

  // Seed Languages if missing
  const languages = [
    { name: "Java", slug: "java", judge0_id: 62, version: "JDK 17.0.6" },
    { name: "C", slug: "c", judge0_id: 50, version: "GCC 9.2.0" },
    { name: "C++", slug: "cpp", judge0_id: 54, version: "GCC 9.2.0" },
    { name: "JavaScript", slug: "javascript", judge0_id: 63, version: "Node.js 12.14.0" },
    { name: "TypeScript", slug: "typescript", judge0_id: 74, version: "3.7.4" },
    { name: "Python", slug: "python", judge0_id: 71, version: "3.8.1" },
    { name: "Kotlin", slug: "kotlin", judge0_id: 78, version: "1.3.70" },
    { name: "Go", slug: "go", judge0_id: 60, version: "1.13.5" },
    { name: "Rust", slug: "rust", judge0_id: 73, version: "1.40.0" },
    { name: "SQL", slug: "sql", judge0_id: 82, version: "SQLite 3.31.1" },
  ];

  for (const l of languages) {
    await prisma.languages.upsert({
      where: { slug: l.slug },
      update: { name: l.name, judge0_id: l.judge0_id, version: l.version },
      create: { name: l.name, slug: l.slug, judge0_id: l.judge0_id, version: l.version },
    });
  }

  // Seed Classes if missing
  await prisma.classes.upsert({
    where: { code: "TY-BSC-CS-2025" },
    update: { name: "TY BSc CS", year: "2025-26" },
    create: { name: "TY BSc CS", code: "TY-BSC-CS-2025", year: "2025-26" },
  });

  console.log("✅ Seed completed successfully!");
}

main()
  .catch((e) => {
    console.error("❌ Error seeding database:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
