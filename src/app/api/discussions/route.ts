import { NextRequest } from "next/server";
import { z } from "zod";
import { apiSuccess, apiError } from "@/lib/api/response";
import { validateBody } from "@/lib/api/validation";
import { getAuthenticatedUser } from "@/lib/api/auth-middleware";
import { checkRateLimit } from "@/lib/api/rate-limit";
import { supabaseAdmin } from "@/lib/supabase/server";

const postSchema = z.object({
  title: z.string().min(5, "Title is required"),
  content: z.string().min(10, "Content is required"),
  category: z.string().default("General"),
  tags: z.array(z.string()).default([]),
});

export async function GET(req: NextRequest) {
  const { data: posts, error } = await supabaseAdmin
    .from("v_trending_discussions")
    .select("*");

  if (error) return apiError("Failed to fetch discussions", 500, error);
  return apiSuccess(posts, "Discussions fetched successfully");
}

export async function POST(req: NextRequest) {
  const user = await getAuthenticatedUser(req);
  if (!user) return apiError("Authentication required", 401);

  const rate = checkRateLimit(`discussion:${user.id}`, 3, 60000);
  if (!rate.success) {
    return apiError("Too many discussion posts. Please wait a minute before posting again.", 429);
  }

  const { data: body, error: valError } = await validateBody(req, postSchema);
  if (valError) return apiError("Validation failed", 400, valError);

  const { data: post, error } = await supabaseAdmin
    .from("discussion_posts")
    .insert({
      ...body!,
      user_id: user.id,
    })
    .select("*")
    .single();

  if (error) return apiError("Failed to create discussion post", 500, error);
  return apiSuccess(post, "Post created successfully", 201);
}
