import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/server";

export async function GET() {
  const startTime = Date.now();

  try {
    // Check Supabase connection health
    const { data, error } = await supabaseAdmin.from("system_settings").select("key").limit(1);
    const dbLatencyMs = Date.now() - startTime;

    if (error) {
      return NextResponse.json(
        {
          status: "degraded",
          database: "disconnected",
          error: error.message,
          timestamp: new Date().toISOString(),
        },
        { status: 503 }
      );
    }

    return NextResponse.json({
      status: "healthy",
      database: "connected",
      dbLatencyMs,
      timestamp: new Date().toISOString(),
      uptimeSeconds: process.uptime(),
      memoryUsageMb: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
    });
  } catch (err: any) {
    return NextResponse.json(
      {
        status: "unhealthy",
        error: err.message,
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}
