import { NextRequest } from "next/server";
import { z } from "zod";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { apiSuccess, apiError } from "@/lib/api/response";
import { validateBody } from "@/lib/api/validation";
import { checkRateLimit } from "@/lib/api/rate-limit";
import { supabaseAdmin } from "@/lib/supabase/server";

const JWT_SECRET = process.env.JWT_SECRET || "sarhad-super-secret-key-2026";

const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

const registerSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  full_name: z.string().min(2, "Full name is required"),
  role: z.enum(["student", "teacher", "admin"]).default("student"),
});

export async function POST(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for") || "client-ip";
  const rate = checkRateLimit(`auth:${ip}`, 5, 60000);
  if (!rate.success) {
    return apiError("Too many authentication attempts. Please try again in 1 minute.", 429);
  }

  const { searchParams } = new URL(req.url);
  const action = searchParams.get("action") || "login";

  if (action === "register") {
    const { data: body, error } = await validateBody(req, registerSchema);
    if (error) return apiError("Validation failed", 400, error);

    const { email, password, full_name, role } = body!;

    // Check if user exists in Supabase
    const { data: existingUser } = await supabaseAdmin
      .from("users")
      .select("id")
      .eq("email", email)
      .single();

    if (existingUser) {
      return apiError("A user with this email already exists", 400);
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const { data: newUser, error: createError } = await supabaseAdmin
      .from("users")
      .insert({
        email,
        full_name,
        bio: `Registered as ${role}`,
      })
      .select("*")
      .single();

    if (createError || !newUser) {
      return apiError("Failed to create user account", 500, createError);
    }

    const token = jwt.sign(
      { id: newUser.id, email: newUser.email, role, full_name: newUser.full_name },
      JWT_SECRET,
      { expiresIn: "7d" }
    );

    return apiSuccess({ user: newUser, token }, "Registration successful", 201);
  }

  // Default Login Action
  const { data: body, error } = await validateBody(req, loginSchema);
  if (error) return apiError("Validation failed", 400, error);

  const { email } = body!;

  // Fetch user from Supabase
  const { data: user, error: fetchError } = await supabaseAdmin
    .from("users")
    .select("*, role_id")
    .eq("email", email)
    .single();

  if (fetchError || !user) {
    return apiError("Invalid credentials", 401);
  }

  const token = jwt.sign(
    { id: user.id, email: user.email, role: "student", full_name: user.full_name },
    JWT_SECRET,
    { expiresIn: "7d" }
  );

  return apiSuccess({ user, token }, "Login successful");
}
