import { NextRequest } from "next/server";
import { apiSuccess, apiError } from "@/lib/api/response";
import { supabaseAdmin } from "@/lib/supabase/server";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const scope = searchParams.get("scope") || "GLOBAL";

    let query = supabaseAdmin
      .from("users")
      .select("id, full_name, email, roll_number, profile_image, xp, level");

    const { data: users, error } = await query.order("xp", { ascending: false });

    if (error) return apiError("Failed to fetch leaderboard", 500, error);

    const rankings = (users || []).map((u: any, idx: number) => ({
      id: u.id,
      name: u.full_name,
      email: u.email,
      rollNumber: u.roll_number,
      avatar: u.profile_image,
      xp: u.xp || 0,
      level: u.level || 1,
      rank: idx + 1,
      rankChange: 0,
    }));

    return apiSuccess({ rankings, total: rankings.length }, "Leaderboard retrieved successfully");
  } catch (error: any) {
    return apiError(error.message || "Failed to fetch leaderboard", 500);
  }
}
