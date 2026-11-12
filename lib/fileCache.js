/**
 * Per-session file content cache.
 *
 * Files already read in this session are served from cache (zero tokens).
 * Cache lives in globalThis so it persists across route invocations in the
 * same Next.js dev/prod process.
 *
 * Key: `${sessionId}:${normalizedPath}`
 * Value: { content: string, tokens: number, readAt: number }
 */

const _store = globalThis.__tw_file_cache ?? (globalThis.__tw_file_cache = new Map());

/** Token estimate: 1 token ≈ 4 characters. */
function countTokens(text) {
  return Math.ceil(text.length / 4);
}

/** Normalise a path so variations of the same file share one cache entry. */
function norm(p) {
  return String(p).trim().replace(/\\/g, '/').toLowerCase();
}

/**
 * Get a cached file entry.
 * @param {string} sessionId
 * @param {string} filePath
 * @returns {{ content: string, tokens: number } | null}
 */
export function getCachedFile(sessionId, filePath) {
  return _store.get(`${sessionId}:${norm(filePath)}`) ?? null;
}

/**
 * Store a file in the cache.
 * @param {string} sessionId
 * @param {string} filePath
 * @param {string} content
 * @returns {{ tokens: number }}
 */
export function setCachedFile(sessionId, filePath, content) {
  const tokens = countTokens(content);
  _store.set(`${sessionId}:${norm(filePath)}`, {
    content,
    tokens,
    readAt: Date.now(),
  });
  return { tokens };
}

/**
 * Return stats for a list of files relative to a session:
 *   { cacheHits, cacheMisses, tokensSaved, freshPaths }
 */
export function fileStats(sessionId, paths) {
  let cacheHits = 0, cacheMisses = 0, tokensSaved = 0;
  const freshPaths = [];
  for (const p of paths) {
    const cached = getCachedFile(sessionId, p);
    if (cached) {
      cacheHits++;
      tokensSaved += cached.tokens;
    } else {
      cacheMisses++;
      freshPaths.push(p);
    }
  }
  return { cacheHits, cacheMisses, tokensSaved, freshPaths };
}
