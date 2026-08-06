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
  name: z.string().optional(),
  full_name: z.string().optional(),
  role: z.string().optional(),
  rollNumber: z.string().optional(),
  className: z.string().optional(),
  branch: z.string().optional(),
  academicYear: z.string().optional(),
});

export async function POST(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for") || "client-ip";
  const rate = checkRateLimit(`auth:${ip}`, 10, 60000);
  if (!rate.success) {
    console.error(`[AUTH_ERROR] Rate limit exceeded for IP: ${ip}`);
    return apiError("Too many authentication attempts. Please try again in 1 minute.", 429, {
      code: "RATE_LIMIT_EXCEEDED",
      message: "Too many authentication attempts.",
    });
  }

  const { searchParams } = new URL(req.url);
  const action = searchParams.get("action") || "login";

  if (action === "register") {
    // Step 1: Validate payload
    const { data: body, error: valError } = await validateBody(req, registerSchema);
    if (valError) {
      console.error("[AUTH_REGISTER_ERROR] Request payload validation failed:", valError);
      return apiError("Validation failed: Please fill out all required fields properly.", 400, {
        code: "VALIDATION_ERROR",
        message: "Invalid registration payload",
        details: valError,
      });
    }

    const { email, password, name, full_name, role } = body!;
    const fullName = name || full_name || email.split("@")[0];
    const normalizedRole = (role || "student").toLowerCase();

    // Step 2: Check if email already registered in public.users
    const { data: existingUser } = await supabaseAdmin
      .from("users")
      .select("id, email")
      .eq("email", email)
      .single();

    if (existingUser) {
      console.error(`[AUTH_REGISTER_ERROR] User with email ${email} already exists in database.`);
      return apiError("A user account with this email address already exists.", 400, {
        code: "USER_ALREADY_EXISTS",
        message: `An account with ${email} is already registered.`,
      });
    }

    // Step 3: Supabase Auth signUp / Admin user creation
    let userId: string;
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name: fullName, role: normalizedRole },
    });

    if (authError) {
      // If user already exists in auth.users, try fetching identity
      if (authError.message?.includes("already registered") || authError.status === 422) {
        console.warn(`[AUTH_REGISTER_WARN] User ${email} exists in Auth, linking profile...`);
        const { data: listUsers } = await supabaseAdmin.auth.admin.listUsers();
        const found = listUsers.users.find((u) => u.email === email);
        if (found) {
          userId = found.id;
        } else {
          console.error("[AUTH_REGISTER_ERROR] Supabase Auth createUser error:", authError);
          return apiError(`Auth creation failed: ${authError.message}`, 400, {
            code: authError.code || "AUTH_SIGNUP_FAILED",
            message: authError.message,
          });
        }
      } else {
        console.error("[AUTH_REGISTER_ERROR] Supabase Auth createUser error:", authError);
        return apiError(`Auth creation failed: ${authError.message}`, 400, {
          code: authError.code || "AUTH_SIGNUP_FAILED",
          message: authError.message,
        });
      }
    } else {
      userId = authData.user.id;
    }

    // Step 4: Insert/Upsert profile into public.users
    const { data: newUser, error: dbError } = await supabaseAdmin
      .from("users")
      .upsert({
        id: userId,
        email,
        full_name: fullName,
        username: email.split("@")[0] + "_" + Math.floor(Math.random() * 1000),
        bio: `Registered as ${normalizedRole}`,
        xp: 0,
        level: 1,
        coins: 0,
        is_verified: true,
      })
      .select("*")
      .single();

    if (dbError || !newUser) {
      console.error("[AUTH_REGISTER_ERROR] Public users profile insert error:", dbError);
      return apiError(`Profile creation failed: ${dbError?.message || "Unknown DB error"}`, 500, {
        code: dbError?.code || "DB_INSERT_FAILED",
        message: dbError?.message || "Failed to create user profile row",
      });
    }

    // Step 5: Generate JWT Token for Session
    const token = jwt.sign(
      { id: newUser.id, email: newUser.email, role: normalizedRole, full_name: newUser.full_name },
      JWT_SECRET,
      { expiresIn: "7d" }
    );

    console.log(`[AUTH_REGISTER_SUCCESS] Successfully registered user: ${email} (ID: ${newUser.id})`);
    return apiSuccess({ user: newUser, token }, "Registration successful", 201);
  }

  // Default Login Action
  const { data: body, error: valError } = await validateBody(req, loginSchema);
  if (valError) {
    console.error("[AUTH_LOGIN_ERROR] Login payload validation failed:", valError);
    return apiError("Invalid email or password format", 400, {
      code: "VALIDATION_ERROR",
      message: "Invalid login payload",
    });
  }

  const { email, password } = body!;

  // Fetch user profile from Supabase
  const { data: user, error: fetchError } = await supabaseAdmin
    .from("users")
    .select("*")
    .eq("email", email)
    .single();

  if (fetchError || !user) {
    console.error(`[AUTH_LOGIN_ERROR] User not found for email: ${email}`);
    return apiError("Invalid credentials: No account found with this email", 401, {
      code: "INVALID_CREDENTIALS",
      message: "User account not found.",
    });
  }

  const token = jwt.sign(
    { id: user.id, email: user.email, role: "student", full_name: user.full_name },
    JWT_SECRET,
    { expiresIn: "7d" }
  );

  console.log(`[AUTH_LOGIN_SUCCESS] Successfully logged in user: ${email}`);
  return apiSuccess({ user, token }, "Login successful");
}
