import { initializeApp, getApps, getApp, FirebaseApp } from "firebase/app";
import { getAuth, Auth } from "firebase/auth";
import { getFirestore, Firestore } from "firebase/firestore";
import { getStorage, FirebaseStorage } from "firebase/storage";

const cleanEnv = (val?: string) => val?.trim().replace(/^["']+|["']+$|\r/g, "");

const firebaseConfig = {
  apiKey: cleanEnv(process.env.NEXT_PUBLIC_FIREBASE_API_KEY) || "AIzaSyDCIK7qFNKGEI6spZrTEK0Eln27eHgep1Q",
  authDomain: cleanEnv(process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN) || "campus-code-7dbb5.firebaseapp.com",
  projectId: cleanEnv(process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID) || "campus-code-7dbb5",
  storageBucket: cleanEnv(process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET) || "campus-code-7dbb5.firebasestorage.app",
  messagingSenderId: cleanEnv(process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID) || "619216238001",
  appId: cleanEnv(process.env.NEXT_PUBLIC_FIREBASE_APP_ID) || "1:619216238001:web:1d116fcef89c16bef2b990",
};

let app: FirebaseApp;
if (!getApps().length) {
  app = initializeApp(firebaseConfig);
} else {
  app = getApp();
}

export const firebaseApp = app;
export const firebaseAuth: Auth = getAuth(app);
export const firestore: Firestore = getFirestore(app);
export const firebaseStorage: FirebaseStorage = getStorage(app);
