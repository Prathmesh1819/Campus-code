import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🚀 Verifying PostgreSQL Production Database Setup...");

  const roleCount = await prisma.roles.count();
  const langCount = await prisma.languages.count();

  console.log(`Roles count: ${roleCount}, Languages count: ${langCount}`);
  console.log("✨ PostgreSQL Production Database Verified!");
}

main()
  .catch((e) => {
    console.error("❌ Error running production seed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
