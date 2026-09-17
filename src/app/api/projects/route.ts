import { NextResponse } from "next/server";
import { verifyServerToken } from "@/lib/firebase/auth";
import { adminDb } from "@/lib/firebase/admin";
import { COLLECTIONS } from "@/lib/firebase/firestore";

export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

export async function GET(_req: Request) {
  try {
    let projects: any[] = [];
    const snap = await adminDb.collection(COLLECTIONS.PROJECTS).orderBy("created_at", "desc").get();
    if (!snap.empty) {
      projects = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    }

    return NextResponse.json({ projects });
  } catch (error: any) {
    console.error("GET /api/projects error:", error);
    return NextResponse.json({ error: error.message || "Failed to fetch projects" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const authHeader = req.headers.get("Authorization");
    const token = authHeader?.startsWith("Bearer ") ? authHeader.substring(7) : "";
    const authUser = await verifyServerToken(token);

    if (!authUser || !authUser.userId) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    const body = await req.json();
    const { action, projectId, title, description, githubUrl, liveDemoUrl, imageUrl, tags, category } = body;

    if (action === "like" && projectId) {
      const projRef = adminDb.collection(COLLECTIONS.PROJECTS).doc(projectId);
      const projDoc = await projRef.get();
      if (projDoc.exists) {
        const data = projDoc.data() || {};
        const likes = data.likes || [];
        const hasLiked = likes.includes(authUser.userId);
        const newLikes = hasLiked ? likes.filter((uid: string) => uid !== authUser.userId) : [...likes, authUser.userId];
        await projRef.set({ likes: newLikes, likesCount: newLikes.length }, { merge: true });
        return NextResponse.json({ liked: !hasLiked, likesCount: newLikes.length });
      }
    }

    if (!title || !description) {
      return NextResponse.json({ error: "Title and description are required" }, { status: 400 });
    }

    const projId = `proj-${Date.now()}`;
    const newProject = {
      id: projId,
      userId: authUser.userId,
      title: title.trim(),
      description: description.trim(),
      category: category || "Full Stack",
      tags: typeof tags === "string" ? tags : JSON.stringify(tags || ["Web"]),
      githubUrl: githubUrl || "",
      liveDemoUrl: liveDemoUrl || "",
      imageUrl: imageUrl || "https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=800&auto=format&fit=crop&q=80",
      likesCount: 0,
      likes: [],
      commentsCount: 0,
      comments: [],
      created_at: new Date().toISOString(),
      user: {
        id: authUser.userId,
        name: authUser.name,
        email: authUser.email,
        avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80",
      },
    };

    await adminDb.collection(COLLECTIONS.PROJECTS).doc(projId).set(newProject);

    return NextResponse.json({ message: "Project published successfully", project: newProject });
  } catch (error: any) {
    console.error("POST /api/projects error:", error);
    return NextResponse.json({ error: error.message || "Failed to process project action" }, { status: 500 });
  }
}
