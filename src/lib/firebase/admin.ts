import { initializeApp, getApps, cert } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { getAuth } from "firebase-admin/auth";
import { getStorage } from "firebase-admin/storage";

if (!getApps().length) {
  try {
    const projectId = process.env.FIREBASE_PROJECT_ID || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "campus-code-7dbb5";
    const rawEmail = process.env.FIREBASE_CLIENT_EMAIL?.trim().replace(/^"|"$/g, "");
    const rawKey = process.env.FIREBASE_PRIVATE_KEY?.trim().replace(/^"|"$/g, "");
    const clientEmail = rawEmail && rawEmail.length > 5 ? rawEmail : undefined;
    const privateKey = rawKey && rawKey.length > 20 ? rawKey.replace(/\\n/g, "\n") : undefined;

    if (clientEmail && privateKey) {
      initializeApp({
        credential: cert({
          projectId,
          clientEmail,
          privateKey,
        }),
        storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || `${projectId}.appspot.com`,
      });
    } else {
      initializeApp({
        projectId,
        storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || `${projectId}.appspot.com`,
      });
    }
  } catch (error) {
    console.error("[Firebase Admin] Singleton initialization warning:", error);
  }
}

export const isFirebaseAdminConfigured = Boolean(
  (process.env.FIREBASE_CLIENT_EMAIL && process.env.FIREBASE_PRIVATE_KEY) || process.env.GOOGLE_APPLICATION_CREDENTIALS
);

export const adminDb = getFirestore();
export const adminAuth = getAuth();
export const adminStorage = getStorage();
