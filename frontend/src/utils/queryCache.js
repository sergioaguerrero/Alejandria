/**
 * @file queryCache.js
 * @description Lightweight in-memory TTL cache with in-flight request deduplication
 * so navigating back to Home, Profiles, Repositories, or Search feels instantaneous
 * while avoiding duplicate network calls to Render + Oracle Cloud.
 */

const MAX_CACHE_ENTRIES = 120;

/** @type {Map<string, { data: any, expiresAt: number }>} */
const valueCache = new Map();

/** @type {Map<string, Promise<any>>} */
const inflightRequests = new Map();

function pruneIfNeeded() {
  if (valueCache.size < MAX_CACHE_ENTRIES) return;
  const now = Date.now();
  for (const [key, entry] of valueCache.entries()) {
    if (now >= entry.expiresAt) {
      valueCache.delete(key);
    }
  }
  if (valueCache.size >= MAX_CACHE_ENTRIES) {
    const oldestKey = valueCache.keys().next().value;
    if (oldestKey !== undefined) valueCache.delete(oldestKey);
  }
}

/**
 * Returns a fresh cached result if within TTL, joins an existing in-flight request
 * for the same key, or invokes `fetcher` and stores its result.
 *
 * When `signal` is provided (e.g. debounced Search with AbortController), cached hits
 * still resolve immediately without network traffic, while cache misses execute directly
 * with the caller's AbortSignal so cancellation works cleanly.
 *
 * @template T
 * @param {string} key
 * @param {() => Promise<T>} fetcher
 * @param {{ ttlMs?: number, signal?: AbortSignal }} [options]
 * @returns {Promise<T>}
 */
export function getCachedOrFetch(key, fetcher, { ttlMs = 25000, signal } = {}) {
  const now = Date.now();
  const cached = valueCache.get(key);
  if (cached && now < cached.expiresAt) {
    return Promise.resolve(cached.data);
  }
  if (cached) {
    valueCache.delete(key);
  }

  // If the caller supplied an AbortSignal, run directly so aborting doesn't cancel
  // another caller's shared promise, while still caching successful completions.
  if (signal) {
    return fetcher().then((data) => {
      if (!signal.aborted && ttlMs > 0) {
        pruneIfNeeded();
        valueCache.set(key, { data, expiresAt: Date.now() + ttlMs });
      }
      return data;
    });
  }

  if (inflightRequests.has(key)) {
    return inflightRequests.get(key);
  }

  const request = Promise.resolve()
    .then(fetcher)
    .then((data) => {
      if (ttlMs > 0) {
        pruneIfNeeded();
        valueCache.set(key, { data, expiresAt: Date.now() + ttlMs });
      }
      return data;
    })
    .finally(() => {
      inflightRequests.delete(key);
    });

  inflightRequests.set(key, request);
  return request;
}

/**
 * Removes all cached entries whose key starts with any of the given prefixes.
 * @param {...string} prefixes
 */
export function invalidateCache(...prefixes) {
  for (const key of valueCache.keys()) {
    if (prefixes.some((prefix) => key.startsWith(prefix))) {
      valueCache.delete(key);
    }
  }
}

/** Clears the entire query cache (e.g. on login / logout). */
export function clearAllCache() {
  valueCache.clear();
  inflightRequests.clear();
}
