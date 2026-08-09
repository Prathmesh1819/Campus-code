import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

export async function GET(_req: Request) {
  try {
    const rawNotes = await prisma.teacher_notes.findMany({
      include: {
        users: { select: { full_name: true, username: true, profile_image: true } },
      },
      orderBy: { created_at: "desc" },
    });

    const notes = rawNotes.map((n) => ({
      id: n.id,
      title: n.title,
      description: n.content,
      fileUrl: "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf",
      fileType: "PDF",
      subject: "Computer Science",
      createdAt: n.created_at,
      teacher: n.users ? { name: n.users.full_name || n.users.username, avatar: n.users.profile_image } : { name: "Dr. Vikramaditya Gupta" },
    }));

    return NextResponse.json({ notes });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to fetch notes" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { teacherId, title, description } = body;

    const course = await prisma.courses.findFirst();
    if (!course) {
      return NextResponse.json({ message: "Note processed", note: { id: "note-" + Date.now(), title } });
    }

    const note = await prisma.teacher_notes.create({
      data: {
        title: title || "Lecture Note",
        content: description || title || "Course material",
        uploaded_by: teacherId || null,
        course_id: course.id,
      },
    });

    return NextResponse.json({ message: "Note uploaded successfully", note });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to upload note" }, { status: 500 });
  }
}
