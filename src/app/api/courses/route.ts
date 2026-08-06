import { NextRequest } from "next/server";
import { z } from "zod";
import { apiSuccess, apiError } from "@/lib/api/response";
import { validateBody } from "@/lib/api/validation";
import { getAuthenticatedUser, authorizeRole } from "@/lib/api/auth-middleware";
import { supabaseAdmin } from "@/lib/supabase/server";

const createCourseSchema = z.object({
  title: z.string().min(3, "Title is required"),
  description: z.string().min(10, "Description is required"),
  thumbnail: z.string().optional(),
  visibility: z.enum(["Public", "Private"]).default("Public"),
});

export async function GET(req: NextRequest) {
  const { data: courses, error } = await supabaseAdmin
    .from("courses")
    .select("*, users(full_name, email)")
    .eq("visibility", "Public")
    .order("created_at", { ascending: false });

  if (error) return apiError("Failed to fetch courses", 500, error);
  return apiSuccess(courses, "Courses retrieved successfully");
}

export async function POST(req: NextRequest) {
  const user = await getAuthenticatedUser(req);
  if (!user || !authorizeRole(user, ["teacher", "admin"])) {
    return apiError("Unauthorized to create courses", 403);
  }

  const { data: body, error: valError } = await validateBody(req, createCourseSchema);
  if (valError) return apiError("Validation failed", 400, valError);

  const { data: course, error } = await supabaseAdmin
    .from("courses")
    .insert({
      ...body!,
      teacher_id: user.id,
      status: "Published",
    })
    .select("*")
    .single();

  if (error) return apiError("Failed to create course", 500, error);
  return apiSuccess(course, "Course created successfully", 201);
}
