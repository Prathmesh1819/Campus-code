import { NextRequest } from "next/server";
import { z } from "zod";
import { apiSuccess, apiError } from "@/lib/api/response";
import { validateBody } from "@/lib/api/validation";
import { getAuthenticatedUser, authorizeRole } from "@/lib/api/auth-middleware";
import { supabaseAdmin } from "@/lib/supabase/server";

const createProblemSchema = z.object({
  title: z.string().min(3, "Title is required"),
  slug: z.string().optional(),
  difficulty: z.enum(["EASY", "MEDIUM", "HARD"]).default("EASY"),
  category: z.string().default("Arrays"),
  description: z.string().min(10, "Description is required"),
  constraints: z.string().default("1 <= N <= 10^5"),
  examples: z.any().optional(),
  companyTags: z.any().optional(),
  testCases: z.array(z.any()).optional(),
});

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const difficulty = searchParams.get("difficulty");
  const search = searchParams.get("search");

  let query = supabaseAdmin.from("problems").select("*");

  if (difficulty && difficulty !== "ALL") {
    query = query.eq("difficulty", difficulty);
  }
  if (search) {
    query = query.ilike("title", `%${search}%`);
  }

  const { data: problems, error } = await query.order("created_at", { ascending: false });

  if (error) return apiError("Failed to fetch problems from Supabase", 500, error);
  return apiSuccess({ problems }, "Problems fetched successfully");
}

export async function POST(req: NextRequest) {
  const user = await getAuthenticatedUser(req);
  if (!user || !authorizeRole(user, ["teacher", "admin"])) {
    return apiError("Unauthorized to create problems", 403);
  }

  const { data: body, error: valError } = await validateBody(req, createProblemSchema);
  if (valError) return apiError("Validation failed", 400, valError);

  const { title, slug, difficulty, description, constraints } = body!;
  const generatedSlug = slug || title.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");

  const { data: problem, error } = await supabaseAdmin
    .from("problems")
    .insert({
      title,
      slug: generatedSlug,
      difficulty,
      description,
      constraints,
      status: "published",
      created_by: user.id,
    })
    .select("*")
    .single();

  if (error) return apiError("Failed to create problem", 500, error);
  return apiSuccess(problem, "Problem created successfully", 201);
}
