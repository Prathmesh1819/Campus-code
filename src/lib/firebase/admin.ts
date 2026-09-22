import { initializeApp, getApps, cert } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { getAuth } from "firebase-admin/auth";
import { getStorage } from "firebase-admin/storage";

let isConfigured = false;

if (!getApps().length) {
  try {
    const projectId = process.env.FIREBASE_PROJECT_ID || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "campus-code-7dbb5";
    const rawEmail = process.env.FIREBASE_CLIENT_EMAIL?.trim().replace(/^"|"$/g, "").replace(/^'|'$/g, "");
    let rawKey = process.env.FIREBASE_PRIVATE_KEY?.trim().replace(/^"|"$/g, "").replace(/^'|'$/g, "");

    if (rawKey && rawKey.includes("\\n")) {
      rawKey = rawKey.replace(/\\n/g, "\n");
    }

    const clientEmail = rawEmail && rawEmail.length > 5 ? rawEmail : undefined;
    const privateKey = rawKey && rawKey.length > 20 ? rawKey : undefined;

    if (clientEmail && privateKey) {
      initializeApp({
        credential: cert({
          projectId,
          clientEmail,
          privateKey,
        }),
        storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || `${projectId}.appspot.com`,
      });
      isConfigured = true;
    } else {
      console.warn("[Firebase Admin] Service Account credentials (FIREBASE_CLIENT_EMAIL / FIREBASE_PRIVATE_KEY) not found. Initializing with Project ID only.");
      initializeApp({
        projectId,
        storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || `${projectId}.appspot.com`,
      });
    }
  } catch (error) {
    console.error("[Firebase Admin] Initialization warning:", error);
  }
} else {
  isConfigured = Boolean(process.env.FIREBASE_CLIENT_EMAIL && process.env.FIREBASE_PRIVATE_KEY);
}

export const isFirebaseAdminConfigured = isConfigured;
export const adminDb = getFirestore();
export const adminAuth = getAuth();
export const adminStorage = getStorage();
