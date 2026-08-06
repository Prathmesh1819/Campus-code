const rateLimitStore = new Map<string, { count: number; expiresAt: number }>();

export function checkRateLimit(key: string, limit = 10, windowMs = 60000): { success: boolean; remaining: number } {
  const now = Date.now();
  const record = rateLimitStore.get(key);

  if (!record || record.expiresAt < now) {
    rateLimitStore.set(key, { count: 1, expiresAt: now + windowMs });
    return { success: true, remaining: limit - 1 };
  }

  if (record.count >= limit) {
    return { success: false, remaining: 0 };
  }

  record.count += 1;
  return { success: true, remaining: limit - record.count };
}
