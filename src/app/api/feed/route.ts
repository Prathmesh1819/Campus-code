import { NextResponse } from "next/server";
import { verifyServerToken } from "@/lib/firebase/auth";
import { adminDb } from "@/lib/firebase/admin";
import { COLLECTIONS } from "@/lib/firebase/firestore";

export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

export async function GET(_req: Request) {
  try {
    let posts: any[] = [];
    const snap = await adminDb.collection("posts").orderBy("created_at", "desc").get();
    if (!snap.empty) {
      posts = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    }

    return NextResponse.json({ posts });
  } catch (error: any) {
    console.error("GET /api/feed error:", error);
    return NextResponse.json({ error: error.message || "Failed to fetch community posts" }, { status: 500 });
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
    const { action, postId, content, title } = body;

    if (action === "like" && postId) {
      const postRef = adminDb.collection("posts").doc(postId);
      const doc = await postRef.get();
      if (doc.exists) {
        const data = doc.data() || {};
        const likes = data.likes || [];
        const hasLiked = likes.includes(authUser.userId);
        const newLikes = hasLiked ? likes.filter((uid: string) => uid !== authUser.userId) : [...likes, authUser.userId];
        await postRef.set({ likes: newLikes, likesCount: newLikes.length }, { merge: true });
        return NextResponse.json({ liked: !hasLiked, likesCount: newLikes.length });
      }
    }

    if (!content) {
      return NextResponse.json({ error: "Post content is required" }, { status: 400 });
    }

    const newPostId = `post-${Date.now()}`;
    const newPost = {
      id: newPostId,
      userId: authUser.userId,
      title: title || content.substring(0, 50),
      content: content.trim(),
      likesCount: 0,
      likes: [],
      commentsCount: 0,
      comments: [],
      created_at: new Date().toISOString(),
      user: {
        id: authUser.userId,
        name: authUser.name,
        email: authUser.email,
        role: authUser.role,
        avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80",
      },
    };

    await adminDb.collection("posts").doc(newPostId).set(newPost);

    return NextResponse.json({ message: "Post published successfully", post: newPost });
  } catch (error: any) {
    console.error("POST /api/feed error:", error);
    return NextResponse.json({ error: error.message || "Failed to process post" }, { status: 500 });
  }
}
