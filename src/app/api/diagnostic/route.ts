import { NextResponse } from "next/server";
import { adminDb, isFirebaseAdminConfigured } from "@/lib/firebase/admin";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const diagnosticReport: any = {
      timestamp: new Date().toISOString(),
      isFirebaseAdminConfigured,
      readSuccess: false,
      writeSuccess: false,
      testDocExists: false,
      testDocData: null,
      error: null,
    };

    if (!isFirebaseAdminConfigured) {
      diagnosticReport.error = "Firebase Admin is not configured with valid service account credentials.";
      return NextResponse.json(diagnosticReport, { status: 500 });
    }

    // 1. Read TEST-REGISTRATION
    try {
      const docRef = adminDb.collection("users").doc("TEST-REGISTRATION");
      const docSnap = await docRef.get();
      diagnosticReport.readSuccess = true;
      diagnosticReport.testDocExists = docSnap.exists;
      if (docSnap.exists) {
        diagnosticReport.testDocData = docSnap.data();
      }
    } catch (readErr: any) {
      console.error("[Diagnostic] Error reading TEST-REGISTRATION:", readErr);
      diagnosticReport.error = `Read failed: ${readErr?.message || String(readErr)}`;
      return NextResponse.json(diagnosticReport, { status: 500 });
    }

    // 2. Write/Update TEST-REGISTRATION safely
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
      diagnosticReport.writeSuccess = true;
    } catch (writeErr: any) {
      console.error("[Diagnostic] Error writing TEST-REGISTRATION:", writeErr);
      diagnosticReport.error = `Write failed: ${writeErr?.message || String(writeErr)}`;
      return NextResponse.json(diagnosticReport, { status: 500 });
    }

    return NextResponse.json(diagnosticReport, { status: 200 });
  } catch (err: any) {
    console.error("[Diagnostic] Top level failure:", err);
    return NextResponse.json(
      { success: false, error: err?.message || String(err) },
      { status: 500 }
    );
  }
}
