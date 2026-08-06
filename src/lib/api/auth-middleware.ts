import { NextRequest } from "next/server";
import jwt from "jsonwebtoken";
import { supabaseAdmin } from "../supabase/server";

export interface AuthenticatedUser {
  id: string;
  email: string;
  role: "student" | "teacher" | "admin" | "super_admin";
  full_name?: string;
}

const JWT_SECRET = process.env.JWT_SECRET || "sarhad-super-secret-key-2026";

export async function getAuthenticatedUser(req: NextRequest): Promise<AuthenticatedUser | null> {
  try {
    const authHeader = req.headers.get("authorization");
    let token = "";

    if (authHeader && authHeader.startsWith("Bearer ")) {
      token = authHeader.substring(7);
    } else {
      const cookieToken = req.cookies.get("token")?.value;
      if (cookieToken) token = cookieToken;
    }

    if (!token) return null;

    // Verify JWT
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    if (decoded && decoded.id) {
      return {
        id: decoded.id,
        email: decoded.email,
        role: decoded.role || "student",
        full_name: decoded.full_name || decoded.name,
      };
    }

    // Fallback to Supabase Auth token check
    const { data: { user } } = await supabaseAdmin.auth.getUser(token);
    if (user) {
      return {
        id: user.id,
        email: user.email || "",
        role: (user.user_metadata?.role as any) || "student",
        full_name: user.user_metadata?.full_name,
      };
    }

    return null;
  } catch (error) {
    return null;
  }
}

export function authorizeRole(user: AuthenticatedUser | null, allowedRoles: Array<"student" | "teacher" | "admin" | "super_admin">): boolean {
  if (!user) return false;
  if (allowedRoles.includes(user.role) || user.role === "super_admin") return true;
  return false;
}
