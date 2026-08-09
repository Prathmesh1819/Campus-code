import { PrismaClient } from "@prisma/client";
import path from "path";
import fs from "fs";

function getDatabaseUrl(): string {
  const envDbUrl = process.env.DATABASE_URL || process.env.POSTGRES_PRISMA_URL || process.env.DIRECT_URL;
  if (envDbUrl) {
    return envDbUrl;
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
