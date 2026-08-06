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

import { supabaseAdmin } from "../src/lib/supabase/server";

async function main() {
  const adminEmail = "admin@campuscode.com";
  const adminPassword = "AdminPassword123!";

  console.log("==================================================");
  console.log("CHECKING / CREATING ADMIN ACCOUNT IN SUPABASE");
  console.log("==================================================");

  // 1. Check if admin user exists in Supabase Auth
  const { data: listUsers } = await supabaseAdmin.auth.admin.listUsers();
  let adminAuthUser = listUsers.users.find((u) => u.email === adminEmail);

  if (!adminAuthUser) {
    console.log(`Creating Admin user in Supabase Auth: ${adminEmail}...`);
    const { data: createData, error: createErr } = await supabaseAdmin.auth.admin.createUser({
      email: adminEmail,
      password: adminPassword,
      email_confirm: true,
      user_metadata: { full_name: "CampusCode Super Admin", role: "admin" },
    });

    if (createErr) {
      console.error("Failed to create admin in Auth:", createErr);
      process.exit(1);
    }
    adminAuthUser = createData.user;
    console.log("✔ Admin Auth account created successfully!");
  } else {
    console.log("✔ Admin Auth account already exists!");
    // Update password to ensure known credentials
    await supabaseAdmin.auth.admin.updateUserById(adminAuthUser.id, {
      password: adminPassword,
    });
    console.log("✔ Admin password updated/confirmed!");
  }

  // 2. Ensure profile exists in public.users
  const { data: userProfile, error: profileErr } = await supabaseAdmin
    .from("users")
    .upsert({
      id: adminAuthUser.id,
      email: adminEmail,
      full_name: "CampusCode Super Admin",
      username: "admin_super",
      bio: "Registered Super Administrator account",
      xp: 10000,
      level: 10,
      coins: 5000,
      is_verified: true,
    })
    .select("*")
    .single();

  if (profileErr) {
    console.error("Failed to upsert admin profile in public.users:", profileErr);
    process.exit(1);
  }

  console.log("✔ Admin profile in public.users verified!");
  console.log("--------------------------------------------------");
  console.log("ADMIN LOGIN CREDENTIALS:");
  console.log(`Email:    ${adminEmail}`);
  console.log(`Password: ${adminPassword}`);
  console.log("==================================================");
}

main().catch((err) => {
  console.error("Execution failed:", err);
});
