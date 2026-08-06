import fs from "fs";
import path from "path";

// Load .env.local manually for ts-node test execution
const envPath = path.join(process.cwd(), ".env.local");
if (fs.existsSync(envPath)) {
  const envConfig = fs.readFileSync(envPath, "utf8");
  for (const line of envConfig.split("\n")) {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith("#")) {
      const eqIdx = trimmed.indexOf("=");
      if (eqIdx !== -1) {
        const key = trimmed.substring(0, eqIdx).trim();
        const value = trimmed.substring(eqIdx + 1).trim().replace(/^"|"$/g, "");
        process.env[key] = value;
      }
    }
  }
}

import { verifySupabaseConnection } from "../src/lib/supabase/server";
import { verifyAndInitializeStorageBuckets } from "../src/lib/supabase/storage";

async function main() {
  console.log("==================================================");
  console.log("SUPABASE BACKEND CONNECTION TEST");
  console.log("==================================================");
  console.log("NEXT_PUBLIC_SUPABASE_URL:", process.env.NEXT_PUBLIC_SUPABASE_URL ? "✔ Loaded" : "❌ Missing");
  console.log("NEXT_PUBLIC_SUPABASE_ANON_KEY:", process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? "✔ Loaded" : "❌ Missing");
  console.log("SUPABASE_SERVICE_ROLE_KEY:", process.env.SUPABASE_SERVICE_ROLE_KEY ? "✔ Loaded" : "❌ Missing");

  const connected = await verifySupabaseConnection();
  if (connected) {
    console.log("✔ Supabase Connected");
  } else {
    console.log("❌ Database Connection Failed");
  }

  await verifyAndInitializeStorageBuckets();
  console.log("==================================================");
}

main().catch((err) => {
  console.error("Test failed:", err);
});
