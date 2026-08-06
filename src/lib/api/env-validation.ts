export interface EnvConfig {
  supabaseUrl: string;
  supabaseAnonKey: string;
  supabaseServiceKey: string;
  openaiApiKey?: string;
  geminiApiKey?: string;
  judge0Url?: string;
  redisUrl?: string;
  resendApiKey?: string;
}

export function validateRequiredEnvVars(): { valid: boolean; missing: string[]; config: EnvConfig } {
  const missing: string[] = [];

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

  if (!supabaseUrl || supabaseUrl.includes("pdqycwozkhiwhkwhwatu")) missing.push("NEXT_PUBLIC_SUPABASE_URL (requires active live project URL)");
  if (!supabaseAnonKey) missing.push("NEXT_PUBLIC_SUPABASE_ANON_KEY");
  if (!supabaseServiceKey) missing.push("SUPABASE_SERVICE_ROLE_KEY");

  return {
    valid: missing.length === 0,
    missing,
    config: {
      supabaseUrl,
      supabaseAnonKey,
      supabaseServiceKey,
      openaiApiKey: process.env.OPENAI_API_KEY,
      geminiApiKey: process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY,
      judge0Url: process.env.JUDGE0_API_URL || "https://ce.judge0.com",
      resendApiKey: process.env.RESEND_API_KEY,
    },
  };
}
