import { NextRequest } from "next/server";
import { z } from "zod";
import { apiSuccess, apiError } from "@/lib/api/response";
import { validateBody } from "@/lib/api/validation";
import { getAuthenticatedUser } from "@/lib/api/auth-middleware";
import { checkRateLimit } from "@/lib/api/rate-limit";
import { runCodeInJudge0 } from "@/lib/code-runner";
import { supabaseAdmin } from "@/lib/supabase/server";

const submissionSchema = z.object({
  problemId: z.string().min(1, "problemId is required"),
  language: z.string().min(1, "language is required"),
  code: z.string().min(1, "code is required"),
});

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const userId = searchParams.get("userId");
  const problemId = searchParams.get("problemId");

  let query = supabaseAdmin.from("submissions").select("*, problems(title, difficulty)");

  if (userId) query = query.eq("user_id", userId);
  if (problemId) query = query.eq("problem_id", problemId);

  const { data: submissions, error } = await query.order("submitted_at", { ascending: false });

  if (error) return apiError("Failed to fetch submissions", 500, error);
  return apiSuccess({ submissions }, "Submissions retrieved successfully");
}

export async function POST(req: NextRequest) {
  const user = await getAuthenticatedUser(req);
  if (!user) return apiError("Authentication required to submit code", 401);

  const rate = checkRateLimit(`submission:${user.id}`, 10, 60000);
  if (!rate.success) {
    return apiError("Submission rate limit reached. Please wait a minute before submitting again.", 429);
  }

  const { data: body, error: valError } = await validateBody(req, submissionSchema);
  if (valError) return apiError("Validation failed", 400, valError);

  const { problemId, language, code } = body!;

  // Execute against Judge0
  const result = await runCodeInJudge0(problemId, language, code);

  // Fetch language_id from languages table
  const { data: langObj } = await supabaseAdmin
    .from("languages")
    .select("id")
    .eq("slug", language.toLowerCase())
    .single();

  // Save submission into Supabase
  const { data: submission, error: saveError } = await supabaseAdmin
    .from("submissions")
    .insert({
      user_id: user.id,
      problem_id: problemId,
      language_id: langObj?.id || null,
      language,
      source_code: code,
      verdict: result.verdict || "WRONG_ANSWER",
      runtime_ms: result.runtime || 0,
      memory_kb: result.memory || 0,
      compile_output: result.compile_output || null,
      stdout: result.stdout || null,
      stderr: result.stderr || null,
      status: "COMPLETED",
    })
    .select("*")
    .single();

  if (saveError) {
    return apiError("Failed to record submission in database", 500, saveError);
  }

  return apiSuccess({ submission, result }, "Submission evaluated successfully", 201);
}
