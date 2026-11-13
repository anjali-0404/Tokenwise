/**
 * Central configuration — reads env vars with safe defaults.
 * Import this everywhere instead of reading process.env directly.
 */
export const cfg = {
  bifrostUrl:  process.env.BIFROST_URL   || 'http://localhost:8080/v1/chat/completions',
  bifrostKey:  process.env.BIFROST_API_KEY || 'tokenwise',
  tavilyKey:   process.env.TAVILY_API_KEY  || '',
  ollamaHost:  (process.env.OLLAMA_HOST  || 'http://localhost:11434').replace(/\/+$/, ''),
  ollamaKey:   process.env.OLLAMA_API_KEY || '',

  models: {
    small:  process.env.MODEL_SMALL  || 'openai/gpt-4o-mini',
    large:  process.env.MODEL_LARGE  || 'openai/gpt-4o',
    backup: process.env.MODEL_BACKUP || 'anthropic/claude-3-5-haiku-20241022',
    local:  process.env.MODEL_LOCAL  || 'ollama/llama3.2',
  },

  // USD per 1 000 tokens (blended estimate)
  prices: {
    small:  parseFloat(process.env.PRICE_SMALL  || '0.000200'),
    large:  parseFloat(process.env.PRICE_LARGE  || '0.010000'),
    backup: parseFloat(process.env.PRICE_BACKUP || '0.003000'),
    local:  parseFloat(process.env.PRICE_LOCAL  || '0.000000'),
  },

  workspaceDir: process.env.WORKSPACE_DIR  || '/tmp/tokenwise-workspace',
  budgetDbPath: process.env.BUDGET_DB_PATH || './data/budget.json',

  mock:     process.env.MOCK === '1',
  maxSteps: parseInt(process.env.MAX_STEPS || '8', 10),
  defaultBudget: parseFloat(process.env.DEFAULT_BUDGET || '0.05'),
};

/** Human-friendly display name for a tier key */
export const tierLabel = {
  small:  'Small model (fast)',
  large:  'Large model (capable)',
  backup: 'Backup model (failover)',
  local:  'Local Ollama (private)',
};
