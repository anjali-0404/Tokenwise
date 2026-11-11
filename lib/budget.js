/**
 * Budget persistence layer.
 *
 * Stores per-user spend in a JSON file so it survives process restarts.
 * Falls back to in-memory when the file cannot be written (e.g. read-only FS).
 *
 * All amounts are in USD.
 */
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'fs';
import { dirname } from 'path';
import { cfg } from './config.js';

// ── in-memory cache ──────────────────────────────────────────────────────────
const _cache = globalThis.__tw_budget ?? (globalThis.__tw_budget = {});

function dbPath() {
  return cfg.budgetDbPath;
}

function load() {
  try {
    const raw = readFileSync(dbPath(), 'utf8');
    const data = JSON.parse(raw);
    Object.assign(_cache, data);
  } catch {
    // first run or unreadable — start empty
  }
}

function persist() {
  try {
    const dir = dirname(dbPath());
    if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
    writeFileSync(dbPath(), JSON.stringify(_cache, null, 2), 'utf8');
  } catch {
    // best-effort; in-memory data is still valid
  }
}

// Load once per process start
if (!globalThis.__tw_budget_loaded) {
  load();
  globalThis.__tw_budget_loaded = true;
}

/** Return the amount spent by a user so far (USD). */
export function getSpend(user) {
  return _cache[user]?.spend ?? 0;
}

/** Add `amount` to the user's spend and persist. */
export function addSpend(user, amount) {
  if (!_cache[user]) _cache[user] = { spend: 0 };
  _cache[user].spend += amount;
  persist();
  return _cache[user].spend;
}

/** Return the user's configured limit, or the default. */
export function getLimit(user) {
  return _cache[user]?.limit ?? cfg.defaultBudget;
}

/** Persist a custom limit for a user. */
export function setLimit(user, limit) {
  if (!_cache[user]) _cache[user] = { spend: 0 };
  _cache[user].limit = limit;
  persist();
}

/** Reset spend for a user (admin / test use). */
export function resetSpend(user) {
  if (_cache[user]) _cache[user].spend = 0;
  persist();
}

/**
 * Check whether the user has headroom for `estimatedCost`.
 * Returns { ok: true } or { ok: false, spent, limit, estimatedCost }.
 */
export function checkBudget(user, estimatedCost, limitOverride) {
  const spent = getSpend(user);
  const limit = limitOverride ?? getLimit(user);
  if (spent + estimatedCost > limit) {
    return { ok: false, spent, limit, estimatedCost };
  }
  return { ok: true, spent, limit, estimatedCost };
}
