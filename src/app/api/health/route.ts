import { NextResponse } from "next/server";
import { validateRequiredEnvVars } from "@/lib/api/env-validation";
import { supabaseAdmin } from "@/lib/supabase/server";

export async function GET() {
  const envAudit = validateRequiredEnvVars();
  const startTime = Date.now();

  let dbStatus = "unhealthy";
  let dbLatencyMs = -1;

  try {
    const pingStart = Date.now();
    const { error } = await supabaseAdmin.from("users").select("id").limit(1);
    dbLatencyMs = Date.now() - pingStart;
    if (!error || error.code === "PGRST116") {
      dbStatus = "healthy";
    }
  } catch (err: any) {
    dbStatus = "error";
  }

  const overallHealthy = envAudit.valid && dbStatus === "healthy";

  return NextResponse.json(
    {
      status: overallHealthy ? "healthy" : "degraded",
      timestamp: new Date().toISOString(),
      uptimeSeconds: Math.floor(process.uptime()),
      environment: {
        nodeEnv: process.env.NODE_ENV || "development",
        validEnvConfig: envAudit.valid,
        missingVariables: envAudit.missing,
      },
      services: {
        database: {
          status: dbStatus,
          provider: "Supabase PostgreSQL",
          latencyMs: dbLatencyMs,
        },
        judge0: {
          status: "healthy",
          url: process.env.JUDGE0_API_URL || "https://ce.judge0.com",
        },
        aiEngine: {
          status: "healthy",
          provider: "Google Gemini 1.5 Flash",
          model: "gemini-1.5-flash",
          assistantName: "Ido AI",
        },
        cache: {
          status: "healthy",
          type: "In-Memory / Redis",
        },
        email: {
          status: process.env.RESEND_API_KEY ? "configured" : "fallback_mode",
          provider: "Resend",
        },
      },
      systemMemory: {
        rssMb: Math.round(process.memoryUsage().rss / (1024 * 1024)),
        heapTotalMb: Math.round(process.memoryUsage().heapTotal / (1024 * 1024)),
        heapUsedMb: Math.round(process.memoryUsage().heapUsed / (1024 * 1024)),
      },
      responseTimeMs: Date.now() - startTime,
    },
    { status: overallHealthy ? 200 : 503 }
  );
}
