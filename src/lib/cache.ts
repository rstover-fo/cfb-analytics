/**
 * Simple in-memory cache with TTL support.
 *
 * Used for caching static/slowly-changing data like available seasons
 * and opponent lists to reduce database queries.
 *
 * TTL Strategy (from Sprint 5.5 decisions):
 * - Truly static data (seasons list): 1 hour
 * - Slowly changing data (completed games): 15 min
 * - Frequently changing (live data): No cache
 */

interface CacheEntry<T> {
  value: T;
  expiresAt: number;
}

const cache = new Map<string, CacheEntry<unknown>>();

const isDev = process.env.NODE_ENV === 'development';

/**
 * Get a value from the cache.
 * Returns undefined if the key doesn't exist or has expired.
 */
export function cacheGet<T>(key: string): T | undefined {
  const entry = cache.get(key) as CacheEntry<T> | undefined;

  if (!entry) {
    if (isDev) {
      console.debug(`[Cache] MISS: ${key} (not found)`);
    }
    return undefined;
  }

  if (Date.now() > entry.expiresAt) {
    cache.delete(key);
    if (isDev) {
      console.debug(`[Cache] MISS: ${key} (expired)`);
    }
    return undefined;
  }

  if (isDev) {
    console.debug(`[Cache] HIT: ${key}`);
  }
  return entry.value;
}

/**
 * Set a value in the cache with a TTL in milliseconds.
 */
export function cacheSet<T>(key: string, value: T, ttlMs: number): void {
  cache.set(key, {
    value,
    expiresAt: Date.now() + ttlMs,
  });

  if (isDev) {
    console.debug(`[Cache] SET: ${key} (TTL: ${ttlMs}ms)`);
  }
}

/**
 * Invalidate a specific cache key.
 */
export function cacheInvalidate(key: string): boolean {
  const deleted = cache.delete(key);
  if (isDev && deleted) {
    console.debug(`[Cache] INVALIDATE: ${key}`);
  }
  return deleted;
}

/**
 * Invalidate all cache entries matching a prefix.
 */
export function cacheInvalidatePrefix(prefix: string): number {
  let count = 0;
  for (const key of cache.keys()) {
    if (key.startsWith(prefix)) {
      cache.delete(key);
      count++;
    }
  }
  if (isDev && count > 0) {
    console.debug(`[Cache] INVALIDATE PREFIX: ${prefix} (${count} entries)`);
  }
  return count;
}

/**
 * Clear all cache entries.
 */
export function cacheClear(): void {
  const size = cache.size;
  cache.clear();
  if (isDev) {
    console.debug(`[Cache] CLEAR: removed ${size} entries`);
  }
}

/**
 * Get cache statistics for debugging.
 */
export function cacheStats(): { size: number; keys: string[] } {
  return {
    size: cache.size,
    keys: Array.from(cache.keys()),
  };
}

// Cache TTL constants (in milliseconds)
export const CACHE_TTL = {
  /** Truly static data - changes once per year (1 hour) */
  STATIC: 60 * 60 * 1000,
  /** Slowly changing data - completed game results (15 min) */
  SLOW: 15 * 60 * 1000,
  /** Short cache for semi-dynamic data (5 min) */
  SHORT: 5 * 60 * 1000,
} as const;

// Cache keys
export const CACHE_KEYS = {
  AVAILABLE_SEASONS: 'available_seasons',
  ALL_OPPONENTS: 'all_opponents',
} as const;
