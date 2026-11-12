/**
 * GET /api/health
 * Checks Ollama (primary), Tavily (web search), Bifrost (optional cloud gateway), budget DB.
 */

import { cfg } from '../../../lib/config.js';
import { getSpend } from '../../../lib/budget.js';

const OLLAMA_BASE = 'http://localhost:11434';

/** Check if all configured models are Ollama models. */
function allOllama() {
  return Object.values(cfg.models).every((m) => m.startsWith('ollama/'));
}

/** Probe Ollama directly. */
async function checkOllama() {
  if (cfg.mock) return { ok: true, note: 'MOCK=1' };
  try {
    const ctrl  = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 6000);
    const res   = await fetch(`${OLLAMA_BASE}/api/tags`, { signal: ctrl.signal });
    clearTimeout(timer);
    if (res.ok) {
      const data   = await res.json();
      const models = (data.models ?? []).map((m) => m.name);
      const target = cfg.models.local.replace('ollama/', '');
      const pulled = models.some((m) => m.startsWith(target.split(':')[0]));
      return { ok: pulled, models, targetPulled: pulled, targetModel: target,
               note: pulled ? `${target} ready` : `${target} not pulled yet` };
    }
    return { ok: false, status: res.status };
  } catch (e) {
    return { ok: false, error: e.name === 'AbortError' ? 'Timed out' : e.message,
             hint: 'Run: ollama serve  then: ollama pull qwen2.5-coder:3b' };
  }
}

/** Probe Bifrost (optional — only needed for cloud models). */
async function checkBifrost() {
  if (cfg.mock) return { ok: true, note: 'MOCK=1' };
  // If all models are Ollama, Bifrost is optional
  const optional = allOllama();
  try {
    const ctrl  = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 5000);
    const res   = await fetch(`${cfg.bifrostUrl.replace('/v1/chat/completions', '')}/`, { signal: ctrl.signal });
    clearTimeout(timer);
    return { ok: true, optional, status: res.status, note: optional ? 'optional (all models are Ollama)' : 'required' };
  } catch (e) {
    return { ok: optional, optional, error: e.name === 'AbortError' ? 'Timed out' : e.message,
             note: optional ? 'Not running — OK because all models route to Ollama directly' : 'Required for cloud models' };
  }
}

/** Probe Tavily. */
async function checkTavily() {
  if (!cfg.tavilyKey) return { ok: false, note: 'TAVILY_API_KEY not set' };
  if (cfg.mock)       return { ok: true,  note: 'MOCK=1' };
  try {
    const ctrl  = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 8000);
    const res   = await fetch('https://api.tavily.com/search', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${cfg.tavilyKey}` },
      body: JSON.stringify({ query: 'ping', max_results: 1 }),
      signal: ctrl.signal,
    });
    clearTimeout(timer);
    return { ok: res.ok, status: res.status };
  } catch (e) {
    return { ok: false, error: e.name === 'AbortError' ? 'Timed out' : e.message };
  }
}

function checkBudgetDb() {
  try { getSpend('__health__'); return { ok: true }; }
  catch (e) { return { ok: false, error: e.message }; }
}

export async function GET() {
  const [ollama, tavily, bifrost] = await Promise.all([checkOllama(), checkTavily(), checkBifrost()]);
  const budgetDb = checkBudgetDb();

  // Critical: Ollama must be up (or MOCK), budget DB must work
  const critical = (cfg.mock || ollama.ok) && budgetDb.ok;

  return Response.json({
    status: critical ? 'ok' : 'degraded',
    mock: cfg.mock,
    timestamp: new Date().toISOString(),
    allModelsAreOllama: allOllama(),
    services: { ollama, tavily, bifrost, budgetDb },
    config: {
      models: cfg.models,
      workspaceDir: cfg.workspaceDir,
      maxSteps: cfg.maxSteps,
      defaultBudget: cfg.defaultBudget,
    },
  }, { status: critical ? 200 : 503 });
}
