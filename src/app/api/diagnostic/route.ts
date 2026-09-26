import { NextResponse } from "next/server";
import { getApps } from "firebase-admin/app";
import { adminDb, isFirebaseAdminConfigured } from "@/lib/firebase/admin";

export const dynamic = "force-dynamic";

export async function GET() {
  const report: any = {
    timestamp: new Date().toISOString(),
    isFirebaseAdminConfigured,
    appsCount: getApps().length,
    step1_import: "SUCCESS",
    step2_read: "PENDING",
    step3_write: "PENDING",
    readError: null,
    writeError: null,
    docExists: false,
    docData: null,
  };

  try {
    const docRef = adminDb.collection("users").doc("TEST-REGISTRATION");
    const snap = await docRef.get();
    report.step2_read = "SUCCESS";
    report.docExists = snap.exists;
    if (snap.exists) {
      report.docData = snap.data();
    }
  } catch (err: any) {
    report.step2_read = "FAILED";
    report.readError = {
      name: err?.name,
      message: err?.message || String(err),
      code: err?.code,
      stack: err?.stack ? err.stack.split("\n").slice(0, 3).join(" ") : null,
    };
  }

  if (report.step2_read === "SUCCESS") {
    try {
      const docRef = adminDb.collection("users").doc("TEST-REGISTRATION");
      await docRef.set(
        {
          lastDiagnosticCheck: new Date().toISOString(),
          status: "CONNECTED",
          testedBy: "Firebase Admin Diagnostic Route",
        },
        { merge: true }
      );
      report.step3_write = "SUCCESS";
    } catch (err: any) {
      report.step3_write = "FAILED";
      report.writeError = {
        name: err?.name,
        message: err?.message || String(err),
        code: err?.code,
      };
    }
  }

  return NextResponse.json(report, { status: 200 });
}
