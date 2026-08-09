import { prisma } from "./prisma";

export async function syncUserToPersistentStore(user: any) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !serviceKey) return;

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
          password: "$2a$10$e8q4G.Y8J5j5.5j5j5j5j5e8q4G.Y8J5j5.5j5j5j5j5", // Default hashed placeholder
          role: "STUDENT",
          rollNumber: su.roll_number || null,
          avatar: su.profile_image || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80",
          xp: su.xp || 0,
          level: su.level || 1,
          coins: su.coins || 0,
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
