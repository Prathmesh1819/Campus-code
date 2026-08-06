import fs from "fs";
import path from "path";

// Load .env.local manually
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

import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { persistSession: false },
});

const migrationFiles = [
  "001_core_system.sql",
  "002_coding_catalog.sql",
  "003_problem_resources.sql",
  "004_code_execution_engine.sql",
  "005_leaderboard_engine.sql",
  "006_contest_engine.sql",
  "007_lms_engine.sql",
  "008_community_platform.sql",
  "009_developer_career_hub.sql",
  "010_infrastructure_and_operations.sql",
  "011_enterprise_communication.sql",
  "seed_ccps_batch1.sql",
  "seed_ccps_batch2.sql",
];

async function runSingleQuery(sqlString: string) {
  // Use Supabase rest / rpc or direct fetch to execute SQL if function exists
  const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      apikey: serviceRoleKey,
      Authorization: `Bearer ${serviceRoleKey}`,
    },
    body: JSON.stringify({ query: sqlString }),
  });
  return response;
}

async function executeMigrationWithClient() {
  console.log("==================================================");
  console.log("SUPABASE MIGRATION EXECUTION");
  console.log("==================================================");

  const migrationsDir = path.join(process.cwd(), "supabase", "migrations");

  for (const file of migrationFiles) {
    const filePath = path.join(migrationsDir, file);
    if (!fs.existsSync(filePath)) {
      console.error(`❌ Migration file missing: ${file}`);
      continue;
    }

    console.log(`🚀 Executing migration: ${file}...`);
    const sqlContent = fs.readFileSync(filePath, "utf8");

    // Attempt RPC exec_sql first
    const res = await runSingleQuery(sqlContent);
    if (res.ok) {
      console.log(`✔ Successfully executed: ${file}`);
    } else {
      const errText = await res.text();
      console.log(`ℹ️ RPC Exec result for ${file}: ${res.status} - ${errText}`);
    }
  }

  // Populate data using Supabase JS client directly for problems & tables if needed
  await seedDataViaSupabaseSDK();
}

async function seedDataViaSupabaseSDK() {
  console.log("\n🌱 Seeding CC001 - CC100 data into Supabase tables...");

  const ccpsDir = path.join(process.cwd(), "src", "data", "ccps");
  const problems = JSON.parse(fs.readFileSync(path.join(ccpsDir, "problems.json"), "utf8"));
  const starterCodes = JSON.parse(fs.readFileSync(path.join(ccpsDir, "starter_codes.json"), "utf8"));
  const testCases = JSON.parse(fs.readFileSync(path.join(ccpsDir, "test_cases.json"), "utf8"));
  const sampleCases = JSON.parse(fs.readFileSync(path.join(ccpsDir, "sample_cases.json"), "utf8"));
  const editorials = JSON.parse(fs.readFileSync(path.join(ccpsDir, "editorials.json"), "utf8"));
  const hints = JSON.parse(fs.readFileSync(path.join(ccpsDir, "hints.json"), "utf8"));

  // 1. Insert Problems
  const problemPayloads = problems.map((p: any) => ({
    id: p.id,
    title: p.title,
    slug: p.slug,
    difficulty: p.difficulty.toLowerCase(),
    description: p.description,
    constraints: p.constraints,
    status: "published",
  }));

  const { error: pErr } = await supabase.from("problems").upsert(problemPayloads);
  if (pErr) console.error("Error upserting problems:", pErr.message);
  else console.log(`✔ Inserted ${problemPayloads.length} problems into 'problems' table.`);

  // 2. Insert Starter Codes
  const { error: scErr } = await supabase.from("starter_codes").upsert(starterCodes);
  if (scErr) console.error("Error upserting starter_codes:", scErr.message);
  else console.log(`✔ Inserted ${starterCodes.length} starter codes into 'starter_codes' table.`);

  // 3. Insert Test Cases
  const { error: tcErr } = await supabase.from("test_cases").upsert(testCases);
  if (tcErr) console.error("Error upserting test_cases:", tcErr.message);
  else console.log(`✔ Inserted ${testCases.length} test cases into 'test_cases' table.`);

  // 4. Verify counts
  const { count: probCount } = await supabase.from("problems").select("*", { count: "exact", head: true });
  const { count: scCount } = await supabase.from("starter_codes").select("*", { count: "exact", head: true });
  const { count: tcCount } = await supabase.from("test_cases").select("*", { count: "exact", head: true });
  const { count: userCount } = await supabase.from("users").select("*", { count: "exact", head: true });

  console.log("\n==================================================");
  console.log("DATABASE TABLE RECORD COUNTS");
  console.log("==================================================");
  console.log(`problems table count: ${probCount ?? 0}`);
  console.log(`starter_codes table count: ${scCount ?? 0}`);
  console.log(`test_cases table count: ${tcCount ?? 0}`);
  console.log(`users table count: ${userCount ?? 0}`);
  console.log("==================================================");
}

executeMigrationWithClient().catch((err) => {
  console.error("Migration execution failed:", err);
});
