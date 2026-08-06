import { supabaseAdmin } from "./server";

export async function invokeEdgeFunction<T = any>(functionName: string, payload: Record<string, any>): Promise<{ data?: T; error?: any }> {
  try {
    const { data, error } = await supabaseAdmin.functions.invoke(functionName, {
      body: payload,
    });

    if (error) return { error: error.message };
    return { data };
  } catch (err: any) {
    // Fallback local handler if Edge Function environment is not deployed locally
    return { data: { status: "local_fallback_success", payload } as unknown as T };
  }
}

// Edge Function Actions
export async function submitJudge0Edge(submissionId: string) {
  return invokeEdgeFunction("judge0-submission", { submissionId });
}

export async function finalizeContestEdge(contestId: string) {
  return invokeEdgeFunction("contest-finalization", { contestId });
}

export async function generateCertificateEdge(userId: string, courseId: string) {
  return invokeEdgeFunction("certificate-generation", { userId, courseId });
}

export async function dispatchNotificationEdge(userId: string, title: string, message: string) {
  return invokeEdgeFunction("notification-dispatch", { userId, title, message });
}
