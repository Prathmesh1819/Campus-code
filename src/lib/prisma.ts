import { PrismaClient } from "@prisma/client";
import path from "path";
import fs from "fs";

function getDatabaseUrl(): string {
  const envDbUrl = process.env.DATABASE_URL;
  if (envDbUrl && envDbUrl.startsWith("file:")) {
    return envDbUrl;
  }

  if (process.env.VERCEL || process.env.NODE_ENV === "production") {
    const tmpDbPath = "/tmp/dev.db";
    const seedDbPath = path.join(process.cwd(), "prisma", "dev.db");

    try {
      if (!fs.existsSync(tmpDbPath)) {
        if (fs.existsSync(seedDbPath)) {
          fs.copyFileSync(seedDbPath, tmpDbPath);
        } else {
          fs.writeFileSync(tmpDbPath, "");
        }
      }
    } catch (e) {
      console.error("Error setting up Vercel writable SQLite db:", e);
    }
    return `file:${tmpDbPath}`;
  }

  return `file:${path.join(process.cwd(), "prisma", "dev.db")}`;
}

const globalForPrisma = global as unknown as { prisma: PrismaClient };

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    datasources: {
      db: {
        url: getDatabaseUrl(),
      },
    },
    log: process.env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
