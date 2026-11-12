/**
 * LLM gateway wrapper — calls Bifrost (OpenAI-compatible API).
 *
 * Features:
 *  - 3-attempt retry with exponential back-off on 429 / 5xx / timeout
 *  - Fallback chain: primary tier → backup → local Ollama
 *  - Confidential mode: local Ollama ONLY, throws if unreachable (no cloud fallback)
 *  - MOCK=1 short-circuits to a canned response (fully offline dev)
 *
 * Bifrost model format: "provider/model-name"
 *   e.g. "openai/gpt-4o-mini", "anthropic/claude-3-5-haiku-20241022", "ollama/llama3.2"
 *
 * Returns:
 *   { message, usage, model, tier, triedFallback, whyFallback }
 */

import { cfg } from './config.js';

const RETRY_DELAYS = [600, 2000, 5000]; // ms between attempts
const TIMEOUT_MS   = 60_000;            // 60s — model calls can be slow

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

/** Actual USD cost from real usage returned by the model. */
export function estimateCost(tier, usage) {
  const tokens = usage?.total_tokens ?? 0;
  return (tokens / 1000) * (cfg.prices[tier] ?? 0);
}

/**
 * Send one chat-completions request to Bifrost with retry.
 *
 * @returns {{ ok: true, data: object } | { ok: false, status?: number, error: string }}
 */
async function fetchCompletion(model, messages, tools, retries = 3) {
  const body = {
    model,
    messages,
    max_tokens: 2048,
    ...(tools?.length ? { tools, tool_choice: 'auto' } : {}),
  };

  for (let attempt = 0; attempt < retries; attempt++) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

    try {
      const res = await fetch(cfg.bifrostUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${cfg.bifrostKey}`,
        },
        body: JSON.stringify(body),
        signal: controller.signal,
      });
      clearTimeout(timer);

      if (res.ok) {
        const data = await res.json();
        return { ok: true, data };
      }

      const status = res.status;

      // Retryable: rate-limit or server error
      if (status === 429 || status >= 500) {
        if (attempt < retries - 1) {
          await sleep(RETRY_DELAYS[attempt]);
          continue;
        }
        let errDetail = '';
        try { errDetail = JSON.stringify(await res.json()); } catch { /* ignore */ }
        return { ok: false, status, error: `HTTP ${status} ${errDetail}`.slice(0, 300) };
      }

      // Non-retryable 4xx
      let errMsg = '';
      try {
        const j = await res.json();
        errMsg = j?.error?.message ?? j?.message ?? JSON.stringify(j);
      } catch { /* ignore */ }
      return { ok: false, status, error: (errMsg || `HTTP ${status}`).slice(0, 300) };

    } catch (e) {
      clearTimeout(timer);
      const isAbort = e.name === 'AbortError';
      if (attempt < retries - 1) {
        await sleep(RETRY_DELAYS[attempt]);
        continue;
      }
      return { ok: false, error: isAbort ? `Request timed out after ${TIMEOUT_MS / 1000}s` : (e.message ?? 'Network error') };
    }
  }

  return { ok: false, error: 'Max retries exceeded' };
}

/**
 * Main entry point called by the agent loop.
 *
 * @param {{
 *   messages:     object[],
 *   tools?:       object[],
 *   tier?:        'small'|'large'|'backup'|'local',
 *   confidential?: boolean,
 * }} opts
 */
export async function callLLM({ messages, tools = [], tier = 'small', confidential = false, forceFailover = false }) {

  // ── MOCK mode (MOCK=1) ───────────────────────────────────────────────────
  if (cfg.mock) {
    return {
      message: {
        role: 'assistant',
        content:
          '[MOCK] Task acknowledged. No real model was called because MOCK=1 is set.\n\n' +
          'To use real models: start Bifrost (`npx -y @maximhq/bifrost`), ' +
          'configure your API keys at http://localhost:8080, then set MOCK=0 in .env.local.',
      },
      usage: { prompt_tokens: 60, completion_tokens: 40, total_tokens: 100 },
      model: 'mock/mock',
      tier:  confidential ? 'local' : (forceFailover ? 'backup' : tier),
      triedFallback: forceFailover && !confidential,
      whyFallback: forceFailover && !confidential
        ? `[MOCK] Simulated outage: primary model skipped, using backup.`
        : null,
    };
  }

  // ── Confidential: local Ollama ONLY ─────────────────────────────────────
  if (confidential) {
    const model = cfg.models.local;
    const result = await fetchCompletion(model, messages, tools);
    if (!result.ok) {
      throw new Error(
        `Confidential mode: local model "${model}" is unreachable (${result.error}). ` +
        `Ensure Ollama is running and "${model.replace('ollama/', '')}" is pulled. ` +
        `Cloud fallback is NOT permitted for confidential repositories.`
      );
    }
    const choice = result.data.choices?.[0];
    return {
      message: choice?.message ?? { role: 'assistant', content: '' },
      usage:   result.data.usage ?? {},
      model,
      tier:    'local',
      triedFallback: false,
      whyFallback:   null,
    };
  }

  // ── Normal fallback chain: primary → backup → local ─────────────────────
  const chain = [
    { tierKey: tier,     model: cfg.models[tier]    },
    { tierKey: 'backup', model: cfg.models.backup   },
    { tierKey: 'local',  model: cfg.models.local    },
  ];

  let triedFallback = false;
  let whyFallback   = null;
  let lastError     = 'unknown error';

  // forceFailover: simulate primary outage — skip to backup
  const startIndex = forceFailover ? 1 : 0;
  if (forceFailover) {
    triedFallback = true;
    whyFallback = `${chain[0].model} simulated as unavailable (outage toggle ON). Using ${chain[1].model} instead.`;
    lastError = 'simulated outage';
  }

  for (let i = startIndex; i < chain.length; i++) {
    const { tierKey, model } = chain[i];
    const result = await fetchCompletion(model, messages, tools);

    if (result.ok) {
      const choice = result.data.choices?.[0];
      if (i > 0 && !forceFailover) {
        triedFallback = true;
        whyFallback   = `${chain[i - 1].model} failed (${lastError}). Using ${model} instead.`;
      }
      return {
        message: choice?.message ?? { role: 'assistant', content: '' },
        usage:   result.data.usage ?? {},
        model,
        tier: tierKey,
        triedFallback,
        whyFallback,
      };
    }

    lastError = result.error ?? `HTTP ${result.status}`;
  }

  throw new Error(
    `All models in the fallback chain failed.\n` +
    chain.map((c) => `  • ${c.model}`).join('\n') +
    `\nLast error: ${lastError}\n\n` +
    `Check that Bifrost is running at ${cfg.bifrostUrl} and your API keys are configured ` +
    `in the Bifrost web UI (http://localhost:8080).`
  );
}
