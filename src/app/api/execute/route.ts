import { NextRequest } from "next/server";
import { z } from "zod";
import { apiSuccess, apiError } from "@/lib/api/response";
import { validateBody } from "@/lib/api/validation";
import { getAuthenticatedUser } from "@/lib/api/auth-middleware";
import { checkRateLimit } from "@/lib/api/rate-limit";
import { executeJudge0Submission, resolveProblemMetadata } from "@/lib/code-runner";
import { supabaseAdmin } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const executeSchema = z.object({
  problemId: z.string().min(1, "problemId is required"),
  code: z.string().min(1, "code is required"),
  language: z.string().min(1, "language is required"),
  isSubmit: z.boolean().default(false),
});

export async function POST(req: NextRequest) {
  const user = await getAuthenticatedUser(req);
  const userId = user?.id;

  const ip = req.headers.get("x-forwarded-for") || "client-ip";
  const rateKey = userId ? `exec:${userId}` : `exec:${ip}`;
  const rate = checkRateLimit(rateKey, 10, 60000);
  if (!rate.success) {
    return apiError("Execution rate limit reached. Please wait a minute before running code again.", 429);
  }

  const { data: body, error: valError } = await validateBody(req, executeSchema);
  if (valError) return apiError("Validation failed", 400, valError);

  const { problemId, code, language, isSubmit } = body!;

  // Fetch problem & test cases from Supabase
  const { data: problem, error: probError } = await supabaseAdmin
    .from("problems")
    .select("*")
    .eq("id", problemId)
    .single();

  if (probError || !problem) {
    return apiError("Problem not found", 404);
  }

  // Fetch sample and evaluation test cases
  const { data: testCases } = await supabaseAdmin
    .from("test_cases")
    .select("*")
    .eq("problem_id", problem.id);

  const formattedTestCases = testCases?.map((tc) => ({
    input: tc.input,
    expectedOutput: tc.expected_output,
    isHidden: tc.is_hidden,
  })) || [
    { input: "[2, 7, 11, 15], 9", expectedOutput: "[0, 1]", isHidden: false },
  ];

  // Resolve metadata schema
  const metadata = resolveProblemMetadata(problem.id, problem.title);

  // Execute Judge0
  const result = await executeJudge0Submission(code, language, formattedTestCases, metadata);

  let submissionRecord = null;

  if (isSubmit && userId) {
    // Record execution history or submission in Supabase
    const { data: langObj } = await supabaseAdmin
      .from("languages")
      .select("id")
      .eq("slug", language.toLowerCase())
      .single();

    const { data: savedSub } = await supabaseAdmin
      .from("submissions")
      .insert({
        user_id: userId,
        problem_id: problem.id,
        language_id: langObj?.id || null,
        language,
        source_code: code,
        verdict: result.status,
        runtime_ms: result.executionTimeMs || 0,
        memory_kb: result.memoryUsageKb || 0,
        total_test_cases: result.totalTestCases,
        passed_test_cases: result.testCasesPassed,
        failed_test_cases: result.totalTestCases - result.testCasesPassed,
        stdout: result.outputLogs.join("\n"),
        stderr: result.errorMessage || null,
        status: "COMPLETED",
      })
      .select("*")
      .single();

    submissionRecord = savedSub;
  }

  return apiSuccess({ result, submission: submissionRecord }, "Execution completed successfully");
}
