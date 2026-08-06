import { NextRequest } from "next/server";
import { z } from "zod";
import { apiSuccess, apiError } from "@/lib/api/response";
import { validateBody } from "@/lib/api/validation";
import { getAuthenticatedUser } from "@/lib/api/auth-middleware";
import { supabaseAdmin } from "@/lib/supabase/server";

const articleSchema = z.object({
  title: z.string().min(5, "Title is required"),
  slug: z.string().min(3, "Slug is required"),
  content: z.string().min(20, "Content is required"),
  cover_image: z.string().optional(),
  read_time: z.number().default(5),
});

export async function GET(req: NextRequest) {
  const { data: articles, error } = await supabaseAdmin
    .from("coding_articles")
    .select("*, users(full_name, username, profile_image)")
    .eq("published", true)
    .order("created_at", { ascending: false });

  if (error) return apiError("Failed to fetch articles", 500, error);
  return apiSuccess(articles, "Articles fetched successfully");
}

export async function POST(req: NextRequest) {
  const user = await getAuthenticatedUser(req);
  if (!user) return apiError("Authentication required", 401);

  const { data: body, error: valError } = await validateBody(req, articleSchema);
  if (valError) return apiError("Validation failed", 400, valError);

  const { data: article, error } = await supabaseAdmin
    .from("coding_articles")
    .insert({
      ...body!,
      author_id: user.id,
      published: true,
    })
    .select("*")
    .single();

  if (error) return apiError("Failed to publish article", 500, error);
  return apiSuccess(article, "Article published successfully", 201);
}
