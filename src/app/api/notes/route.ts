import { NextResponse } from "next/server";
import { verifyServerToken } from "@/lib/firebase/auth";
import { adminDb } from "@/lib/firebase/admin";
import { COLLECTIONS } from "@/lib/firebase/firestore";

export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

export async function GET(_req: Request) {
  try {
    let notes: any[] = [];
    const snap = await adminDb.collection(COLLECTIONS.NOTES).get();
    if (!snap.empty) {
      notes = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    }

    return NextResponse.json({ notes });
  } catch (error: any) {
    console.error("GET /api/notes error:", error);
    return NextResponse.json({ error: error.message || "Failed to fetch notes" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const authHeader = req.headers.get("Authorization");
    const token = authHeader?.startsWith("Bearer ") ? authHeader.substring(7) : "";
    const authUser = await verifyServerToken(token);

    if (!authUser || (authUser.role !== "TEACHER" && authUser.role !== "ADMIN" && authUser.role !== "SUPER_ADMIN" && authUser.role !== "FACULTY")) {
      return NextResponse.json({ error: "Unauthorized. Only Teachers/Faculty can upload notes." }, { status: 403 });
    }

    const body = await req.json();
    const { title, description, subject, fileUrl, classroomId } = body;

    if (!title) {
      return NextResponse.json({ error: "Title is required" }, { status: 400 });
    }

    const noteId = `note-${Date.now()}`;
    const noteObj = {
      id: noteId,
      title: title.trim(),
      description: description ? description.trim() : title.trim(),
      subject: subject || "Computer Science",
      fileUrl: fileUrl || "",
      classroomId: classroomId || "class-ty-bsc-cs",
      uploaded_by: authUser.userId,
      teacher: { name: authUser.name, email: authUser.email },
      createdAt: new Date().toISOString(),
    };

    await adminDb.collection(COLLECTIONS.NOTES).doc(noteId).set(noteObj);

    return NextResponse.json({ message: "Note uploaded successfully", note: noteObj });
  } catch (error: any) {
    console.error("POST /api/notes error:", error);
    return NextResponse.json({ error: error.message || "Failed to upload note" }, { status: 500 });
  }
}
