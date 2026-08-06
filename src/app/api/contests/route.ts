import { NextRequest } from "next/server";
import { z } from "zod";
import { apiSuccess, apiError } from "@/lib/api/response";
import { validateBody } from "@/lib/api/validation";
import { getAuthenticatedUser, authorizeRole } from "@/lib/api/auth-middleware";
import { checkRateLimit } from "@/lib/api/rate-limit";
import { supabaseAdmin } from "@/lib/supabase/server";

const createContestSchema = z.object({
  title: z.string().min(3, "Title is required"),
  slug: z.string().min(3, "Slug is required"),
  description: z.string().min(10, "Description is required"),
  contest_type: z.enum(["Practice", "Rated", "Unrated", "College", "Private"]).default("Rated"),
  visibility: z.enum(["Public", "Private"]).default("Public"),
  difficulty: z.enum(["EASY", "MEDIUM", "HARD", "ALL_LEVELS"]).default("ALL_LEVELS"),
  start_time: z.string(),
  end_time: z.string(),
  duration_minutes: z.number().positive(),
  max_participants: z.number().optional(),
});

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status");
  const page = parseInt(searchParams.get("page") || "1");
  const limit = parseInt(searchParams.get("limit") || "10");
  const offset = (page - 1) * limit;

  let query = supabaseAdmin.from("contests").select("*", { count: "exact" });
  if (status) {
    query = query.eq("status", status);
  }

  const { data: contests, count, error } = await query
    .order("start_time", { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) return apiError("Failed to fetch contests", 500, error);
  return apiSuccess({ contests, pagination: { total: count || 0, page, limit } }, "Contests fetched successfully");
}

export async function POST(req: NextRequest) {
  const user = await getAuthenticatedUser(req);
  if (!user || !authorizeRole(user, ["teacher", "admin"])) {
    return apiError("Unauthorized to create contests", 403);
  }

  const ip = req.headers.get("x-forwarded-for") || "client-ip";
  const rate = checkRateLimit(`contest:${user.id}`, 5, 60000);
  if (!rate.success) {
    return apiError("Too many contest creation requests. Please try again later.", 429);
  }

  const { data: body, error: valError } = await validateBody(req, createContestSchema);
  if (valError) return apiError("Validation failed", 400, valError);

  const { data: contest, error } = await supabaseAdmin
    .from("contests")
    .insert({
      ...body!,
      created_by: user.id,
      status: "Upcoming",
    })
    .select("*")
    .single();

  if (error) return apiError("Failed to create contest", 500, error);
  return apiSuccess(contest, "Contest created successfully", 201);
}
