import { NextResponse } from "next/server";
import { getApps } from "firebase-admin/app";

export const dynamic = "force-dynamic";

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
  let key = cleanEnvString(val);
  if (!key) return undefined;
  key = key.replace(/\\n/g, "\n");
  key = key.replace(/^["']+|["']+$|\r/g, "");
  return key.length > 20 ? key : undefined;
}

export async function GET() {
  const rawProjectId = process.env.FIREBASE_PROJECT_ID || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
  const rawEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const rawKey = process.env.FIREBASE_PRIVATE_KEY;

  const projectId = cleanEnvString(rawProjectId);
  const clientEmail = cleanEnvString(rawEmail);
  const privateKey = cleanPrivateKey(rawKey);

  const appsCount = getApps().length;

  return NextResponse.json({
    timestamp: new Date().toISOString(),
    envCheck: {
      FIREBASE_PROJECT_ID: Boolean(projectId),
      FIREBASE_PROJECT_ID_VAL: projectId || "campus-code-7dbb5",
      FIREBASE_CLIENT_EMAIL: Boolean(clientEmail),
      FIREBASE_CLIENT_EMAIL_LEN: rawEmail ? rawEmail.length : 0,
      FIREBASE_PRIVATE_KEY: Boolean(privateKey),
      FIREBASE_PRIVATE_KEY_LEN: rawKey ? rawKey.length : 0,
      FIREBASE_PRIVATE_KEY_CONTAINS_BEGIN: rawKey ? rawKey.includes("BEGIN PRIVATE KEY") : false,
      FIREBASE_PRIVATE_KEY_CONTAINS_ESCAPED_N: rawKey ? rawKey.includes("\\n") : false,
    },
    firebaseAdmin: {
      appsCount,
      initialized: appsCount > 0,
    },
  });
}
