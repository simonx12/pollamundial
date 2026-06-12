/**
 * Redis-like local cache implementation for the frontend.
 * Uses both in-memory map and localStorage to persist data across reloads.
 */

const CACHE_PREFIX = 'polla_cache_';
const DEFAULT_TTL = 5 * 60 * 1000; // 5 minutes default TTL

const memoryCache = new Map();

/**
 * Saves a value to the cache with a TTL.
 * @param {string} key - The cache key.
 * @param {any} value - The value to cache.
 * @param {number} ttl - Time to live in milliseconds.
 */
export function setCache(key, value, ttl = DEFAULT_TTL) {
  const expiresAt = Date.now() + ttl;
  const payload = { value, expiresAt };

  // Set in memory
  memoryCache.set(key, payload);

  // Set in localStorage
  try {
    localStorage.setItem(CACHE_PREFIX + key, JSON.stringify(payload));
  } catch (err) {
    console.warn('Unable to persist cache to localStorage:', err);
  }
}

/**
 * Retrieves a value from the cache if it exists and has not expired.
 * @param {string} key - The cache key.
 * @returns {any|null} The cached value or null if missed/expired.
 */
export function getCache(key) {
  // Try memory first
  let payload = memoryCache.get(key);

  // Try localStorage if not in memory
  if (!payload) {
    try {
      const stored = localStorage.getItem(CACHE_PREFIX + key);
      if (stored) {
        payload = JSON.parse(stored);
        // Hydrate memory
        memoryCache.set(key, payload);
      }
    } catch (err) {
      console.warn('Unable to read cache from localStorage:', err);
    }
  }

  if (!payload) return null;

  // Check expiration
  if (Date.now() > payload.expiresAt) {
    invalidateCache(key);
    return null;
  }

  return payload.value;
}

/**
 * Invalidates a specific cache key.
 * @param {string} key - The cache key.
 */
export function invalidateCache(key) {
  memoryCache.delete(key);
  try {
    localStorage.removeItem(CACHE_PREFIX + key);
  } catch (e) {
    // ignore
  }
}

/**
 * Clears all caches managed by this utility.
 */
export function clearAllCache() {
  memoryCache.clear();
  try {
    Object.keys(localStorage).forEach((k) => {
      if (k.startsWith(CACHE_PREFIX)) {
        localStorage.removeItem(k);
      }
    });
  } catch (e) {
    // ignore
  }
}
