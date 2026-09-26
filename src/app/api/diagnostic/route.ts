import { NextResponse } from "next/server";
import { adminDb, adminAuth, isFirebaseAdminConfigured } from "@/lib/firebase/admin";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const diagnosticReport: any = {
      timestamp: new Date().toISOString(),
      isFirebaseAdminConfigured,
      projectId: "campus-code-7dbb5",
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

    // 1. Read TEST-REGISTRATION document from users collection
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
      diagnosticReport.error = `Firestore Read Failed: ${readErr?.message || String(readErr)}`;
      return NextResponse.json(diagnosticReport, { status: 500 });
    }

    // 2. Safely write/update TEST-REGISTRATION document
    try {
      const docRef = adminDb.collection("users").doc("TEST-REGISTRATION");
      await docRef.set(
        {
          lastDiagnosticCheck: new Date().toISOString(),
          status: "CONNECTED",
          testedBy: "CampusCode Server Diagnostic Procedure",
        },
        { merge: true }
      );
      diagnosticReport.writeSuccess = true;
    } catch (writeErr: any) {
      console.error("[Diagnostic] Error updating TEST-REGISTRATION:", writeErr);
      diagnosticReport.error = `Firestore Write Failed: ${writeErr?.message || String(writeErr)}`;
      return NextResponse.json(diagnosticReport, { status: 500 });
    }

    return NextResponse.json(diagnosticReport, { status: 200 });
  } catch (err: any) {
    console.error("[Diagnostic] Unhandled Exception:", err);
    return NextResponse.json(
      { success: false, error: err?.message || String(err) },
      { status: 500 }
    );
  }
}
