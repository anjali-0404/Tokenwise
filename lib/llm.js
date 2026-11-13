/**
 * LLM gateway wrapper.
 *
 * Routing logic:
 *  - ollama/* models  → Ollama directly on http://localhost:11434
 *  - all other models → Bifrost at BIFROST_URL
 *
 * Features: retry (429/5xx/timeout), fallback chain, confidential mode, MOCK mode.
 */

import { cfg } from './config.js';

const RETRY_DELAYS = [600, 2000, 5000];
const TIMEOUT_MS   = 60_000;

function sleep(ms) { return new Promise((r) => setTimeout(r, ms)); }

export function estimateCost(tier, usage) {
  const tokens = usage?.total_tokens ?? 0;
  return (tokens / 1000) * (cfg.prices[tier] ?? 0);
}

/** True if Ollama is likely available (remote host configured, or local dev). */
function ollamaAvailable() {
  // If explicitly configured with an external OLLAMA_HOST, it's considered available
  if (process.env.OLLAMA_HOST) return true;
  // On cloud/production: NODE_ENV=production and no OLLAMA_HOST set → no Ollama daemon on localhost
  if (process.env.NODE_ENV === 'production') return false;
  return true;
}

/** Choose endpoint + auth based on model name and environment. */
function routeModel(model) {
  if (model.startsWith('ollama/') && ollamaAvailable()) {
    return {
      url:   `${cfg.ollamaHost}/v1/chat/completions`,
      auth:  cfg.ollamaKey ? `Bearer ${cfg.ollamaKey}` : 'Bearer ollama',
      model: model.replace('ollama/', ''),
    };
  }
  // Cloud fallback: strip "ollama/" prefix, send to BIFROST_URL (or OpenAI directly)
  const resolvedModel = model.startsWith('ollama/')
    ? cfg.models.small.startsWith('ollama/') ? 'gpt-4o-mini' : cfg.models.small
    : model;
  return {
    url:   cfg.bifrostUrl,
    auth:  `Bearer ${cfg.bifrostKey}`,
    model: resolvedModel,
  };
}

async function fetchCompletion(model, messages, tools, retries = 3) {
  const { url, auth, model: resolvedModel } = routeModel(model);

  const body = {
    model: resolvedModel,
    messages,
    max_tokens: 2048,
    ...(tools?.length ? { tools, tool_choice: 'auto' } : {}),
  };

  for (let attempt = 0; attempt < retries; attempt++) {
    const ctrl  = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), TIMEOUT_MS);
    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: auth },
        body: JSON.stringify(body),
        signal: ctrl.signal,
      });
      clearTimeout(timer);

      if (res.ok) {
        const data = await res.json();
        return { ok: true, data };
      }

      const status = res.status;
      if (status === 429 || status >= 500) {
        if (attempt < retries - 1) { await sleep(RETRY_DELAYS[attempt]); continue; }
        let detail = '';
        try { detail = JSON.stringify(await res.json()); } catch { /* ignore */ }
        return { ok: false, status, error: `HTTP ${status} ${detail}`.slice(0, 300) };
      }

      let errMsg = '';
      try { const j = await res.json(); errMsg = j?.error?.message ?? JSON.stringify(j); } catch { /* ignore */ }
      return { ok: false, status, error: (errMsg || `HTTP ${status}`).slice(0, 300) };

    } catch (e) {
      clearTimeout(timer);
      if (attempt < retries - 1) { await sleep(RETRY_DELAYS[attempt]); continue; }
      return { ok: false, error: e.name === 'AbortError' ? `Timed out after ${TIMEOUT_MS / 1000}s` : (e.message ?? 'Network error') };
    }
  }
  return { ok: false, error: 'Max retries exceeded' };
}

export async function callLLM({ messages, tools = [], tier = 'small', confidential = false, forceFailover = false }) {

  // ── MOCK mode ────────────────────────────────────────────────────────────
  if (cfg.mock) {
    return {
      message: { role: 'assistant', content: '[MOCK] Task done. Set MOCK=0 in .env.local for real calls.' },
      usage: { prompt_tokens: 60, completion_tokens: 40, total_tokens: 100 },
      model: 'mock/mock',
      tier:  confidential ? 'local' : (forceFailover ? 'backup' : tier),
      triedFallback: forceFailover && !confidential,
      whyFallback: forceFailover && !confidential ? '[MOCK] Simulated outage active.' : null,
    };
  }

  // ── Confidential: local Ollama ONLY ─────────────────────────────────────
  if (confidential) {
    const model = cfg.models.local;
    if (process.env.NODE_ENV === 'production' && !ollamaAvailable() && model.startsWith('ollama/')) {
      throw new Error(
        `Confidential mode: No remote Ollama instance configured for this deployment. ` +
        `Set OLLAMA_HOST in your environment variables to your remote Ollama endpoint, or run locally.`
      );
    }
    const result = await fetchCompletion(model, messages, tools);
    if (!result.ok) {
      throw new Error(
        `Confidential mode: Ollama model "${model}" unreachable (${result.error}). ` +
        `Ensure Ollama is running at ${cfg.ollamaHost} and model is pulled. Cloud fallback NOT allowed.`
      );
    }
    const choice = result.data.choices?.[0];
    return {
      message: choice?.message ?? { role: 'assistant', content: '' },
      usage:   result.data.usage ?? {},
      model,
      tier: 'local',
      triedFallback: false,
      whyFallback: null,
    };
  }

  // ── Normal fallback chain ────────────────────────────────────────────────
  const chain = [
    { tierKey: tier,     model: cfg.models[tier]  },
    { tierKey: 'backup', model: cfg.models.backup },
    { tierKey: 'local',  model: cfg.models.local  },
  ];

  let triedFallback = false;
  let whyFallback   = null;
  let lastError     = 'unknown';
  const startIndex  = forceFailover ? 1 : 0;

  if (forceFailover) {
    triedFallback = true;
    whyFallback   = `${chain[0].model} simulated as unavailable. Using ${chain[1].model}.`;
    lastError     = 'simulated outage';
  }

  for (let i = startIndex; i < chain.length; i++) {
    const { tierKey, model } = chain[i];
    const result = await fetchCompletion(model, messages, tools);
    if (result.ok) {
      const choice = result.data.choices?.[0];
      if (i > 0 && !forceFailover) {
        triedFallback = true;
        whyFallback   = `${chain[i - 1].model} failed (${lastError}). Using ${model}.`;
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
    `All models failed.\n` + chain.map((c) => `  • ${c.model}`).join('\n') +
    `\nLast error: ${lastError}`
  );
}
