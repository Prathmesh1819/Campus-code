import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const className = searchParams.get("className");

    const whereClause: any = {};
    if (className) whereClause.className = className;

    const notes = await prisma.note.findMany({
      where: whereClause,
      include: { teacher: true },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ notes });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to fetch notes" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { teacherId, title, description, fileUrl, fileType, subject, className } = body;

    if (!title || !fileUrl || !className) {
      return NextResponse.json({ error: "Title, File URL, and Class Name are required" }, { status: 400 });
    }

    const note = await prisma.note.create({
      data: {
        teacherId,
        title,
        description: description || "",
        fileUrl,
        fileType: fileType || "PDF",
        subject: subject || "General",
        className,
      },
    });

    return NextResponse.json({ message: "Note uploaded successfully", note });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to upload note" }, { status: 500 });
  }
}
