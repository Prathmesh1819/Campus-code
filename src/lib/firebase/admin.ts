import { initializeApp, getApps, cert } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { getAuth } from "firebase-admin/auth";
import { getStorage } from "firebase-admin/storage";

function cleanEnvString(val: string | undefined): string | undefined {
  if (!val) return undefined;
  let str = val.trim();
  while (
    (str.startsWith('"') && str.endsWith('"')) ||
    (str.startsWith("'") && str.endsWith("'"))
  ) {
    str = str.slice(1, -1).trim();
  }
  return str.length > 0 ? str : undefined;
}

function cleanPrivateKey(val: string | undefined): string | undefined {
  if (!val) return undefined;
  let key = val.trim();
  while (
    (key.startsWith('"') && key.endsWith('"')) ||
    (key.startsWith("'") && key.endsWith("'"))
  ) {
    key = key.slice(1, -1).trim();
  }
  key = key.replace(/\\\\n/g, "\n").replace(/\\n/g, "\n").replace(/\r/g, "");
  key = key.replace(/^["']+|["']+$|\r/g, "");
  return key.length > 20 ? key : undefined;
}

const projectId =
  cleanEnvString(process.env.FIREBASE_PROJECT_ID) ||
  cleanEnvString(process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID) ||
  "campus-code-7dbb5";

const clientEmail = cleanEnvString(process.env.FIREBASE_CLIENT_EMAIL);
const privateKey = cleanPrivateKey(process.env.FIREBASE_PRIVATE_KEY);

console.log("[Firebase Admin Config Status]");
console.log(`  - FIREBASE_PROJECT_ID configured: ${projectId ? "YES" : "NO"} (${projectId})`);
console.log(`  - FIREBASE_CLIENT_EMAIL configured: ${clientEmail ? "YES" : "NO"}`);
console.log(`  - FIREBASE_PRIVATE_KEY configured: ${privateKey ? "YES" : "NO"}`);

let initError: Error | null = null;

if (!getApps().length) {
  if (!clientEmail || !privateKey) {
    initError = new Error(
      "Firebase Admin Service Account credentials (FIREBASE_CLIENT_EMAIL and/or FIREBASE_PRIVATE_KEY) are missing in environment variables."
    );
    console.warn(`[Firebase Admin] ${initError.message}`);
  } else {
    try {
      initializeApp({
        credential: cert({
          projectId,
          clientEmail,
          privateKey,
        }),
        storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || `${projectId}.appspot.com`,
      });
      console.log("[Firebase Admin] Firebase Admin initialized: YES");
    } catch (err: any) {
      initError = err instanceof Error ? err : new Error(String(err));
      console.error("[Firebase Admin] Initialization failed:", initError.message);
    }
  }
} else {
  console.log("[Firebase Admin] Firebase Admin initialized: YES (reusing existing app)");
}

export const isFirebaseAdminConfigured = Boolean(getApps().length > 0 && !initError);

function getAdminDbInstance() {
  if (!getApps().length || initError) {
    throw (
      initError ||
      new Error(
        "Firebase Admin Service Account credentials (FIREBASE_CLIENT_EMAIL and FIREBASE_PRIVATE_KEY) are missing or failed to initialize."
      )
    );
  }
  return getFirestore();
}

function getAdminAuthInstance() {
  if (!getApps().length || initError) {
    throw (
      initError ||
      new Error(
        "Firebase Admin Service Account credentials (FIREBASE_CLIENT_EMAIL and FIREBASE_PRIVATE_KEY) are missing or failed to initialize."
      )
    );
  }
  return getAuth();
}

function getAdminStorageInstance() {
  if (!getApps().length || initError) {
    throw (
      initError ||
      new Error(
        "Firebase Admin Service Account credentials (FIREBASE_CLIENT_EMAIL and FIREBASE_PRIVATE_KEY) are missing or failed to initialize."
      )
    );
  }
  return getStorage();
}

function isInternalSymbol(prop: string | symbol): boolean {
  return (
    typeof prop === "symbol" ||
    prop === "then" ||
    prop === "toJSON" ||
    prop === "constructor" ||
    prop === "prototype"
  );
}

export const adminDb = new Proxy({} as ReturnType<typeof getFirestore>, {
  get(_target, prop) {
    if (isInternalSymbol(prop)) return undefined;
    const instance = getAdminDbInstance();
    const val = (instance as any)[prop];
    return typeof val === "function" ? val.bind(instance) : val;
  },
});

export const adminAuth = new Proxy({} as ReturnType<typeof getAuth>, {
  get(_target, prop) {
    if (isInternalSymbol(prop)) return undefined;
    const instance = getAdminAuthInstance();
    const val = (instance as any)[prop];
    return typeof val === "function" ? val.bind(instance) : val;
  },
});

export const adminStorage = new Proxy({} as ReturnType<typeof getStorage>, {
  get(_target, prop) {
    if (isInternalSymbol(prop)) return undefined;
    const instance = getAdminStorageInstance();
    const val = (instance as any)[prop];
    return typeof val === "function" ? val.bind(instance) : val;
  },
});


