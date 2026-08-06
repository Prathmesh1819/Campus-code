const inMemoryCache = new Map<string, { value: any; expiresAt: number }>();

export async function getCachedData<T>(key: string): Promise<T | null> {
  const now = Date.now();
  const item = inMemoryCache.get(key);

  if (!item) return null;
  if (item.expiresAt < now) {
    inMemoryCache.delete(key);
    return null;
  }

  return item.value as T;
}

export async function setCachedData<T>(key: string, value: T, ttlSeconds = 60): Promise<void> {
  const expiresAt = Date.now() + ttlSeconds * 1000;
  inMemoryCache.set(key, { value, expiresAt });
}

export async function deleteCachedData(key: string): Promise<void> {
  inMemoryCache.delete(key);
}
