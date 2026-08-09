import { prisma } from "./prisma";

// Map Judge0 / internal language slugs to Supabase language UUIDs
const LANGUAGE_UUID_MAP: Record<string, string> = {
  java: "63880bbb-7ea9-40e7-8974-53771c0f3898",
  c: "3812a620-f022-4972-a091-afd493a2b7a2",
  cpp: "9dde843e-0359-490a-9eef-3e14817946de",
  "c++": "9dde843e-0359-490a-9eef-3e14817946de",
  javascript: "b7f48e23-06a6-47b5-9158-7e8cfbf060c6",
  js: "b7f48e23-06a6-47b5-9158-7e8cfbf060c6",
  typescript: "00e06fae-5e16-4ff3-971e-3ecb4092cf7c",
  ts: "00e06fae-5e16-4ff3-971e-3ecb4092cf7c",
  python: "0f8da678-9637-4b95-8f0a-afdd1dca8172",
  py: "0f8da678-9637-4b95-8f0a-afdd1dca8172",
  kotlin: "66bdea65-b109-4c9d-9f3c-467104009036",
  kt: "66bdea65-b109-4c9d-9f3c-467104009036",
  go: "c2904865-638a-4d00-85b3-b0f13227b9d2",
  rust: "48fdb2dc-e5db-479f-8862-1c73858a90e9",
  sql: "b8056cbb-2022-433f-96f7-f3bf740ebbb3",
};

export async function syncUserToPersistentStore(user: any) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !serviceKey || !user?.id) return;

    const payload = {
      id: user.id,
      email: user.email,
      full_name: user.name,
      username: user.name ? user.name.toLowerCase().replace(/\s+/g, "") : user.email.split("@")[0],
      roll_number: user.rollNumber || null,
      profile_image: user.avatar || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80",
      bio: user.bio || null,
      github_url: user.githubUrl || null,
      linkedin_url: user.linkedinUrl || null,
      xp: user.xp || 0,
      level: user.level || 1,
      coins: user.coins || 0,
    };

    await fetch(`${supabaseUrl}/rest/v1/users`, {
      method: "POST",
      headers: {
        apikey: serviceKey,
        Authorization: `Bearer ${serviceKey}`,
        "Content-Type": "application/json",
        Prefer: "resolution=merge-duplicates",
      },
      body: JSON.stringify(payload),
    });
  } catch (error) {
    console.error("Error syncing user to persistent store:", error);
  }
}

export async function syncSubmissionToPersistentStore(submission: any, userRecord?: any) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !serviceKey || !submission?.id || !submission?.userId) return;

    const langSlug = (submission.language || "java").toLowerCase();
    const languageUuid = LANGUAGE_UUID_MAP[langSlug] || LANGUAGE_UUID_MAP["java"];

    // 1. Resolve problem UUID in Supabase
    const probRes = await fetch(`${supabaseUrl}/rest/v1/problems?id=eq.${submission.problemId}&select=id`, {
      headers: { apikey: serviceKey, Authorization: `Bearer ${serviceKey}` },
    });
    let problemUuid = submission.problemId;
    if (probRes.ok) {
      const pData = await probRes.json();
      if (Array.isArray(pData) && pData[0]?.id) {
        problemUuid = pData[0].id;
      } else {
        // Fallback: match first available problem or CC001
        const fallbackProbRes = await fetch(`${supabaseUrl}/rest/v1/problems?select=id&limit=1`, {
          headers: { apikey: serviceKey, Authorization: `Bearer ${serviceKey}` },
        });
        if (fallbackProbRes.ok) {
          const fbData = await fallbackProbRes.json();
          if (Array.isArray(fbData) && fbData[0]?.id) {
            problemUuid = fbData[0].id;
          }
        }
      }
    }

    const subPayload = {
      id: submission.id,
      user_id: submission.userId,
      problem_id: problemUuid,
      language_id: languageUuid,
      source_code: submission.code || "",
      status: submission.status || "ACCEPTED",
      verdict: submission.status || "ACCEPTED",
      execution_time: submission.executionTimeMs || 0,
      memory_kb: submission.memoryUsageKb || 0,
      passed_test_cases: submission.testCasesPassed || 0,
      total_test_cases: submission.totalTestCases || 0,
    };

    await fetch(`${supabaseUrl}/rest/v1/submissions`, {
      method: "POST",
      headers: {
        apikey: serviceKey,
        Authorization: `Bearer ${serviceKey}`,
        "Content-Type": "application/json",
        Prefer: "resolution=merge-duplicates",
      },
      body: JSON.stringify(subPayload),
    });

    // 2. Sync updated user stats if provided
    if (userRecord && userRecord.id) {
      const fullUser = await prisma.user.findUnique({
        where: { id: userRecord.id },
        select: {
          id: true,
          name: true,
          email: true,
          avatar: true,
          rollNumber: true,
          bio: true,
          githubUrl: true,
          linkedinUrl: true,
          xp: true,
          level: true,
          coins: true,
          streakDays: true,
        },
      });
      if (fullUser) {
        await syncUserToPersistentStore(fullUser);
      }
    }
  } catch (error) {
    console.error("Error syncing submission to persistent store:", error);
  }
}

export async function syncPersistentUsersToPrisma() {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !serviceKey) return;

    const res = await fetch(`${supabaseUrl}/rest/v1/users?select=*`, {
      headers: {
        apikey: serviceKey,
        Authorization: `Bearer ${serviceKey}`,
        "Cache-Control": "no-cache",
      },
    });

    if (!res.ok) return;

    const supabaseUsers = await res.json();
    if (!Array.isArray(supabaseUsers)) return;

    for (const su of supabaseUsers) {
      if (!su.id || !su.email) continue;
      const userName = su.full_name || su.username || su.email.split("@")[0];

      await prisma.user.upsert({
        where: { id: su.id },
        update: {
          name: userName,
          email: su.email.toLowerCase(),
          avatar: su.profile_image || undefined,
          xp: su.xp || 0,
          level: su.level || 1,
          coins: su.coins || 0,
          bio: su.bio || undefined,
          githubUrl: su.github_url || undefined,
          linkedinUrl: su.linkedin_url || undefined,
        },
        create: {
          id: su.id,
          name: userName,
          email: su.email.toLowerCase(),
          password: "$2a$10$e8q4G.Y8J5j5.5j5j5j5j5e8q4G.Y8J5j5.5j5j5j5j5",
          role: "STUDENT",
          rollNumber: su.roll_number || null,
          avatar: su.profile_image || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80",
          xp: su.xp || 0,
          level: su.level || 1,
          coins: su.coins || 0,
          streakDays: 0,
          bio: su.bio || null,
          githubUrl: su.github_url || null,
          linkedinUrl: su.linkedin_url || null,
        },
      });
    }
  } catch (error) {
    console.error("Error syncing persistent users to Prisma:", error);
  }
}

export async function syncPersistentSubmissionsToPrisma(userId?: string | null) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !serviceKey) return;

    const endpoint = userId
      ? `${supabaseUrl}/rest/v1/submissions?user_id=eq.${userId}&select=*`
      : `${supabaseUrl}/rest/v1/submissions?select=*`;

    const res = await fetch(endpoint, {
      headers: {
        apikey: serviceKey,
        Authorization: `Bearer ${serviceKey}`,
        "Cache-Control": "no-cache",
      },
    });

    if (!res.ok) return;

    const supabaseSubs = await res.json();
    if (!Array.isArray(supabaseSubs)) return;

    // Find default problem fallback if problem_id doesn't match local Prisma DB
    const defaultProblem = await prisma.problem.findFirst({ select: { id: true } });
    if (!defaultProblem) return;

    for (const ss of supabaseSubs) {
      if (!ss.id || !ss.user_id) continue;

      let targetProbId = ss.problem_id;
      const localProb = await prisma.problem.findUnique({ where: { id: targetProbId }, select: { id: true } });
      if (!localProb) {
        targetProbId = defaultProblem.id;
      }

      await prisma.submission.upsert({
        where: { id: ss.id },
        update: {
          status: ss.status || ss.verdict || "ACCEPTED",
          code: ss.source_code || "",
          executionTimeMs: ss.execution_time || 0,
          memoryUsageKb: ss.memory_kb || 0,
          testCasesPassed: ss.passed_test_cases || 0,
          totalTestCases: ss.total_test_cases || 0,
        },
        create: {
          id: ss.id,
          userId: ss.user_id,
          problemId: targetProbId,
          language: "java",
          status: ss.status || ss.verdict || "ACCEPTED",
          code: ss.source_code || "",
          executionTimeMs: ss.execution_time || 0,
          memoryUsageKb: ss.memory_kb || 0,
          testCasesPassed: ss.passed_test_cases || 0,
          totalTestCases: ss.total_test_cases || 0,
        },
      });
    }

    if (userId) {
      const { calculateAndUpdateStreak } = await import("./streak");
      await calculateAndUpdateStreak(userId);
    }
  } catch (error) {
    console.error("Error syncing persistent submissions to Prisma:", error);
  }
}
