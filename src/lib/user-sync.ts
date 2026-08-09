import { prisma } from "@/lib/prisma";

/**
 * Maps Application User representation to PostgreSQL `users` table schema.
 *
 * App User:         PostgreSQL `users`:
 * - name        -> full_name
 * - avatar      -> profile_image
 * - rollNumber  -> roll_number
 * - githubUrl   -> github_url
 * - linkedinUrl -> linkedin_url
 */
export function mapAppUserToDbUser(appUser: any) {
  if (!appUser) return null;
  return {
    ...(appUser.id ? { id: appUser.id } : {}),
    email: appUser.email ? appUser.email.trim().toLowerCase() : undefined,
    full_name: appUser.name || appUser.fullName || undefined,
    username: appUser.username || (appUser.name ? appUser.name.toLowerCase().replace(/\s+/g, "") : undefined),
    roll_number: appUser.rollNumber || appUser.roll_number || undefined,
    profile_image: appUser.avatar || appUser.profile_image || undefined,
    bio: appUser.bio ?? undefined,
    github_url: appUser.githubUrl || appUser.github_url || undefined,
    linkedin_url: appUser.linkedinUrl || appUser.linkedin_url || undefined,
    portfolio_url: appUser.portfolioUrl || appUser.portfolio_url || undefined,
    resume_url: appUser.resumeUrl || appUser.resume_url || undefined,
    xp: typeof appUser.xp === "number" ? appUser.xp : undefined,
    level: typeof appUser.level === "number" ? appUser.level : undefined,
    coins: typeof appUser.coins === "number" ? appUser.coins : undefined,
    updated_at: new Date(),
  };
}

/**
 * Maps PostgreSQL `users` table row to Application User representation.
 */
export function mapDbUserToAppUser(dbUser: any, streakDays?: number) {
  if (!dbUser) return null;
  const roleName = dbUser.roles?.name ? dbUser.roles.name.toUpperCase() : "STUDENT";
  const className = dbUser.classes?.name || "TY BSc CS";
  return {
    id: dbUser.id,
    name: dbUser.full_name || dbUser.username || dbUser.email?.split("@")[0] || "User",
    email: dbUser.email,
    username: dbUser.username,
    role: roleName,
    avatar: dbUser.profile_image || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80",
    rollNumber: dbUser.roll_number,
    className: className,
    xp: dbUser.xp || 0,
    level: dbUser.level || 1,
    streakDays: streakDays !== undefined ? streakDays : (dbUser.daily_streaks?.current_streak || 0),
    coins: dbUser.coins || 0,
    bio: dbUser.bio,
    githubUrl: dbUser.github_url,
    linkedinUrl: dbUser.linkedin_url,
    portfolioUrl: dbUser.portfolio_url,
    resumeUrl: dbUser.resume_url,
  };
}

/**
 * Maps Application submission data to PostgreSQL `submissions` table schema.
 *
 * App Submission:      PostgreSQL `submissions`:
 * - executionTimeMs -> execution_time / runtime_ms
 * - memoryUsageKb   -> memory_kb
 * - testCasesPassed -> passed_test_cases
 * - totalTestCases  -> total_test_cases
 * - code            -> source_code
 */
export function mapAppSubmissionToDbSubmission(appSubmission: any) {
  if (!appSubmission) return null;
  const passed = appSubmission.testCasesPassed ?? appSubmission.passed_test_cases ?? 0;
  const total = appSubmission.totalTestCases ?? appSubmission.total_test_cases ?? 0;
  const failed = total - passed;
  const execTime = appSubmission.executionTimeMs ?? appSubmission.execution_time ?? appSubmission.runtime_ms ?? 0;
  const memory = appSubmission.memoryUsageKb ?? appSubmission.memory_kb ?? 0;

  return {
    user_id: appSubmission.userId || appSubmission.user_id,
    problem_id: appSubmission.problemId || appSubmission.problem_id,
    language_id: appSubmission.languageId || appSubmission.language_id,
    source_code: appSubmission.code || appSubmission.source_code || appSubmission.sourceCode || "",
    status: appSubmission.status || appSubmission.verdict || "PENDING",
    verdict: appSubmission.verdict || appSubmission.status || "PENDING",
    execution_time: execTime,
    runtime_ms: execTime,
    memory_kb: memory,
    passed_test_cases: passed,
    total_test_cases: total,
    failed_test_cases: Math.max(0, failed),
    submitted_at: appSubmission.submittedAt ? new Date(appSubmission.submittedAt) : new Date(),
  };
}

/**
 * Maps PostgreSQL `submissions` table row to Application submission representation.
 */
export function mapDbSubmissionToAppSubmission(dbSubmission: any) {
  if (!dbSubmission) return null;
  return {
    id: dbSubmission.id,
    userId: dbSubmission.user_id,
    problemId: dbSubmission.problem_id,
    languageId: dbSubmission.language_id,
    code: dbSubmission.source_code,
    status: dbSubmission.status || dbSubmission.verdict,
    verdict: dbSubmission.verdict || dbSubmission.status,
    executionTimeMs: dbSubmission.execution_time || dbSubmission.runtime_ms || 0,
    memoryUsageKb: dbSubmission.memory_kb || 0,
    testCasesPassed: dbSubmission.passed_test_cases || 0,
    totalTestCases: dbSubmission.total_test_cases || 0,
    createdAt: dbSubmission.created_at || dbSubmission.submitted_at,
    submittedAt: dbSubmission.submitted_at || dbSubmission.created_at,
    language: dbSubmission.languages?.slug || dbSubmission.languages?.name || "java",
    problem: dbSubmission.problems
      ? {
          id: dbSubmission.problems.id,
          title: dbSubmission.problems.title,
          slug: dbSubmission.problems.slug,
          difficulty: dbSubmission.problems.difficulty,
        }
      : undefined,
  };
}

export async function syncUserToPersistentStore(user: any) {
  if (!user?.id) return;
  const dbData = mapAppUserToDbUser(user);
  if (!dbData) return;
  try {
    await prisma.users.update({
      where: { id: user.id },
      data: dbData,
    });
  } catch (err) {
    console.error("syncUserToPersistentStore error:", err);
  }
}

export async function syncSubmissionToPersistentStore(submission: any) {
  const dbData = mapAppSubmissionToDbSubmission(submission);
  if (!dbData || !dbData.user_id || !dbData.problem_id || !dbData.language_id) return;
  try {
    await prisma.submissions.create({
      data: dbData,
    });
  } catch (err) {
    console.error("syncSubmissionToPersistentStore error:", err);
  }
}

export async function syncPersistentUsersToPrisma() {
  try {
    return await prisma.users.findMany({
      include: { roles: true, classes: true, daily_streaks: true },
    });
  } catch (err) {
    console.error("syncPersistentUsersToPrisma error:", err);
    return [];
  }
}

export async function syncPersistentSubmissionsToPrisma(userId?: string | null) {
  try {
    return await prisma.submissions.findMany({
      where: userId ? { user_id: userId } : {},
      include: { problems: true, languages: true },
      orderBy: { created_at: "desc" },
    });
  } catch (err) {
    console.error("syncPersistentSubmissionsToPrisma error:", err);
    return [];
  }
}

