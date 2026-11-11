/**
 * GET /api/health
 *
 * Checks all external dependencies and returns a status object.
 * Returns HTTP 200 when all critical services are reachable,
 * HTTP 503 when any critical service is down.
 */

import { cfg } from '../../../lib/config.js';
import { getSpend } from '../../../lib/budget.js';

/** Probe Bifrost by sending a minimal chat completion. */
async function checkBifrost() {
  if (cfg.mock) return { ok: true, note: 'MOCK=1 — not checked' };
  try {
    const ctrl  = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 8000);

    const res = await fetch(cfg.bifrostUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${cfg.bifrostKey}`,
      },
      body: JSON.stringify({
        model: cfg.models.small,
        messages: [{ role: 'user', content: 'ping' }],
        max_tokens: 1,
      }),
      signal: ctrl.signal,
    });
    clearTimeout(timer);

    // 200 = working, 400/422 = gateway up but bad request (still counts as reachable)
    const up = res.ok || res.status < 500;
    return { ok: up, status: res.status, model: cfg.models.small };
  } catch (e) {
    return {
      ok: false,
      error: e.name === 'AbortError' ? 'Timed out after 8s' : e.message,
      hint: `Start Bifrost: npx -y @maximhq/bifrost  then open http://localhost:8080 to add API keys`,
    };
  }
}

/** Probe Tavily with a minimal search. */
async function checkTavily() {
  if (!cfg.tavilyKey) return { ok: false, note: 'TAVILY_API_KEY not set in .env.local' };
  if (cfg.mock)       return { ok: true,  note: 'MOCK=1 — not checked' };
  try {
    const ctrl  = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 8000);
    const res   = await fetch('https://api.tavily.com/search', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${cfg.tavilyKey}`,
      },
      body: JSON.stringify({ query: 'health check ping', max_results: 1 }),
      signal: ctrl.signal,
    });
    clearTimeout(timer);
    return { ok: res.ok, status: res.status };
  } catch (e) {
    return { ok: false, error: e.name === 'AbortError' ? 'Timed out after 8s' : e.message };
  }
}

/** Probe Ollama directly on its default port. */
async function checkOllama() {
  if (cfg.mock) return { ok: true, note: 'MOCK=1 — not checked' };
  try {
    const ctrl  = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 4000);
    const res   = await fetch('http://localhost:11434/api/tags', { signal: ctrl.signal });
    clearTimeout(timer);
    if (res.ok) {
      const data   = await res.json();
      const models = (data.models ?? []).map((m) => m.name);
      const target = cfg.models.local.replace('ollama/', '');
      return {
        ok: true,
        models,
        targetPulled: models.some((m) => m.startsWith(target)),
        targetModel: target,
      };
    }
    return { ok: false, status: res.status };
  } catch (e) {
    return {
      ok: false,
      error: e.name === 'AbortError' ? 'Timed out after 4s' : e.message,
      hint: 'Install Ollama from https://ollama.com/download, then run: ollama pull ' + cfg.models.local.replace('ollama/', ''),
    };
  }
}

function checkBudgetDb() {
  try {
    getSpend('__health_check__');
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e.message };
  }
}

export async function GET() {
  const [bifrost, tavily, ollama] = await Promise.all([
    checkBifrost(),
    checkTavily(),
    checkOllama(),
  ]);
  const budgetDb = checkBudgetDb();

  // Critical = Bifrost + budgetDb (Tavily and Ollama are optional/degraded)
  const critical = bifrost.ok && budgetDb.ok;

  return Response.json(
    {
      status: critical ? 'ok' : 'degraded',
      mock:   cfg.mock,
      timestamp: new Date().toISOString(),
      services: { bifrost, tavily, ollama, budgetDb },
      config: {
        bifrostUrl:    cfg.bifrostUrl,
        workspaceDir:  cfg.workspaceDir,
        maxSteps:      cfg.maxSteps,
        defaultBudget: cfg.defaultBudget,
        models:        cfg.models,
      },
    },
    { status: critical ? 200 : 503 }
  );
}
