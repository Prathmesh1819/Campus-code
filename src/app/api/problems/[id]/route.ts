import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const problem = await prisma.problem.findFirst({
      where: {
        OR: [{ id: id }, { slug: id }],
      },
      include: {
        testCases: true,
        submissions: {
          take: 10,
          orderBy: { createdAt: "desc" },
          include: {
            user: {
              select: { name: true, avatar: true },
            },
          },
        },
      },
    });

    if (!problem) {
      return NextResponse.json({ error: "Problem not found" }, { status: 404 });
    }

    return NextResponse.json({ problem });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to fetch problem" }, { status: 500 });
  }
}
