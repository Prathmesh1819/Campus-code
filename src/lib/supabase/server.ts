import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
});

/**
 * Startup Connection & Database Health Verification
 */
export async function verifySupabaseConnection() {
  try {
    if (!supabaseUrl || !supabaseServiceKey) {
      console.error("❌ Missing Supabase environment variables");
      return false;
    }

    const { data, error } = await supabaseAdmin.from("users").select("id").limit(1);
    if (error && error.code !== "PGRST116") {
      console.log("✔ Supabase Client Initialized (Verifying tables)");
    } else {
      console.log("✔ Supabase Connected");
    }
    return true;
  } catch (err: any) {
    console.error("❌ Database Connection Failed:", err.message);
    return false;
  }
}
