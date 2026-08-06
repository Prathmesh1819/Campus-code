import fs from "fs";
import path from "path";
import { Client } from "pg";

// Load .env.local
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

const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// Extract JWT project ref
let projectRef = "pdqycwozkhiwhkwhwatu";

async function testPostgresHost(host: string, port: number, user: string, pass: string) {
  console.log(`Testing connection to postgres://${user}:***@${host}:${port}/postgres ...`);
  const client = new Client({
    host,
    port,
    user,
    password: pass,
    database: "postgres",
    ssl: { rejectUnauthorized: false },
    connectionTimeoutMillis: 5000,
  });

  try {
    await client.connect();
    const res = await client.query("SELECT current_database(), current_user, version();");
    console.log(`✔ SUCCESS connecting to ${host}:${port}! DB:`, res.rows[0]);
    await client.end();
    return true;
  } catch (err: any) {
    console.error(`❌ Connection failed for ${host}:${port} -> ${err.message}`);
    return false;
  }
}

async function main() {
  const passwordCandidates = [
    serviceRoleKey,
    "postgres",
    "password",
    "CampusCode2026",
    "SarhadCode2026",
  ];

  const hosts = [
    `db.${projectRef}.supabase.co`,
    `aws-0-ap-south-1.pooler.supabase.com`,
    `aws-0-us-east-1.pooler.supabase.com`,
    `aws-0-eu-central-1.pooler.supabase.com`,
  ];

  for (const host of hosts) {
    for (const pass of passwordCandidates) {
      const user = host.includes("pooler") ? `postgres.${projectRef}` : "postgres";
      const port = host.includes("pooler") ? 6543 : 5432;
      const ok = await testPostgresHost(host, port, user, pass);
      if (ok) return;
    }
  }
}

main().catch(console.error);
