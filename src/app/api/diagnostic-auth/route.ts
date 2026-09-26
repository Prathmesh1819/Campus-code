import { NextResponse } from "next/server";
import { adminAuth, isFirebaseAdminConfigured } from "@/lib/firebase/admin";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const emailToTest = searchParams.get("email") || "sb02@gmail.com";

    const report: any = {
      timestamp: new Date().toISOString(),
      isFirebaseAdminConfigured,
      targetEmail: emailToTest,
      adminCheck: "PENDING",
      uid: null,
      error: null,
      totalUsersCount: 0,
      userListSnippet: [],
    };

    if (!isFirebaseAdminConfigured) {
      report.error = "Firebase Admin is not configured.";
      return NextResponse.json(report, { status: 500 });
    }

    // 1. Check getUserByEmail
    try {
      const user = await adminAuth.getUserByEmail(emailToTest);
      report.adminCheck = "FOUND";
      report.uid = user.uid;
    } catch (err: any) {
      if (err.code === "auth/user-not-found") {
        report.adminCheck = "NOT_FOUND";
      } else {
        report.adminCheck = "ERROR";
        report.error = err?.message || String(err);
      }
    }

    // 2. List all users in Firebase Auth to inspect full project users list
    try {
      const listResult = await adminAuth.listUsers(50);
      report.totalUsersCount = listResult.users.length;
      report.userListSnippet = listResult.users.map((u) => ({
        uid: u.uid,
        email: u.email,
        creationTime: u.metadata.creationTime,
        providers: u.providerData.map((p) => p.providerId),
      }));
    } catch (listErr: any) {
      console.error("[Diagnostic Auth] Error listing users:", listErr);
    }

    return NextResponse.json(report, { status: 200 });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err?.message || String(err) },
      { status: 500 }
    );
  }
}
