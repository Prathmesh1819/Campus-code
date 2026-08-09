import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { syncPersistentSubmissionsToPrisma } from "@/lib/user-sync";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId");
    const problemId = searchParams.get("problemId");

    await syncPersistentSubmissionsToPrisma(userId);

    const whereClause: any = {};
    if (userId) whereClause.userId = userId;
    if (problemId) {
      const p = await prisma.problem.findFirst({
        where: { OR: [{ id: problemId }, { slug: problemId }] },
        select: { id: true },
      });
      if (p) {
        whereClause.problemId = p.id;
      } else {
        whereClause.problemId = problemId;
      }
    }

    const submissions = await prisma.submission.findMany({
      where: whereClause,
      include: {
        problem: { select: { title: true, difficulty: true, category: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ submissions });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to fetch submissions" }, { status: 500 });
  }
}
