import { adminAuth, adminDb } from "./admin";
import { COLLECTIONS } from "./firestore";

export interface TokenPayload {
  userId: string;
  email: string;
  role: string;
  name: string;
}

export async function verifyServerToken(token: string): Promise<TokenPayload | null> {
  if (!token) return null;

  try {
    const decoded = await adminAuth.verifyIdToken(token);
    if (decoded && decoded.uid) {
      let userData: any = null;
      try {
        const userDoc = await adminDb.collection(COLLECTIONS.USERS).doc(decoded.uid).get();
        if (userDoc && userDoc.exists) {
          userData = userDoc.data();
        }
      } catch (dbErr) {
        console.warn("[verifyServerToken] Firestore user doc lookup warning:", dbErr);
      }

      return {
        userId: decoded.uid,
        email: decoded.email || userData?.email || "",
        role: (userData?.role || decoded.role || "STUDENT").toUpperCase(),
        name: userData?.full_name || userData?.name || decoded.name || "Student",
      };
    }
  } catch (err) {
    console.warn("[verifyServerToken] Token verification failed:", err);
  }

  return null;
}
