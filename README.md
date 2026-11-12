# TokenWise Agent

A coding agent that completes developer tasks on the **fewest tokens** — with provider failover, per-user budgets, confidential-repo privacy, and an action approval gate.

Built for the Global AI Hackathon (1–15 Nov 2026) · integrates Bifrost + Tavily.

---

## Features

| Feature | Detail |
|---|---|
| **Token efficiency** | Routes simple tasks to a small model; caches every file read per session; trims long histories; shows tokens saved in the UI |
| **Reliability** | 3-attempt retry on 429/5xx/timeout; fallback chain cloud primary → backup → local Ollama; tells you which model answered and why |
| **Budget enforcement** | Per-user spend tracked from real `response.usage`, checked before every call, persisted to `data/budget.json`, hard-blocked with a clear message |
| **Privacy** | Confidential repos use `ollama/*` only; web search disabled; cloud fallback blocked in code, not just in the prompt |
| **Approval gate** | `write_file`, `run_shell`, and `git` pause the loop, show the exact diff/command, and require a UI click on a single-use endpoint before execution |
| **Prompt injection guard** | Pattern-based pre-check rejects override attempts before they reach the model |
| **Health endpoint** | `GET /api/health` checks Bifrost, Tavily, Ollama, and the budget DB |
| **Offline mode** | `MOCK=1` returns canned responses with no external calls |

---

## Quick start

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment

```bash
cp .env.example .env.local
# edit .env.local with your keys
```

Key variables:

```env
BIFROST_URL=http://localhost:8080/v1/chat/completions
BIFROST_API_KEY=your_key
TAVILY_API_KEY=your_key
WORKSPACE_DIR=/tmp/tokenwise-workspace
MOCK=0
```

### 3. Set up Ollama (for local / confidential mode)

[Install Ollama](https://ollama.com/download), then pull a model:

```bash
ollama pull llama3.2
# or whichever model you set in MODEL_LOCAL
```

Ollama runs on `http://localhost:11434` by default.

### 4. Set up Bifrost

Bifrost is an OpenAI-compatible LLM gateway that handles provider routing, retries, and the `fallbacks` field.

```bash
# Example with Docker (see https://github.com/maximhq/bifrost for the real image)
docker run -p 8080:8080 bifrost/bifrost
```

Configure `BIFROST_URL` to point at the `/v1/chat/completions` endpoint.  
Model names follow the `provider/model` convention, e.g.:

- `openai/gpt-4o-mini`
- `anthropic/claude-3-5-haiku-20241022`
- `ollama/llama3.2`

### 5. Run

```bash
# Development (with MOCK=1 for offline work)
MOCK=1 npm run dev

# Production build
npm run build
npm start
```

Open [http://localhost:3000](http://localhost:3000).

### 6. Run the demo script

```bash
# Start the server in one terminal
MOCK=1 npm run dev

# Run the demo in another
node demo.js
```

The demo covers: token savings, failover, budget block, privacy mode, and prompt injection rejection.

---

## Environment variables

See [`.env.example`](.env.example) for the full list with descriptions.

| Variable | Default | Description |
|---|---|---|
| `BIFROST_URL` | `http://localhost:8080/v1/chat/completions` | Bifrost chat completions endpoint |
| `BIFROST_API_KEY` | `tokenwise` | Key forwarded to Bifrost |
| `TAVILY_API_KEY` | — | Tavily search API key |
| `MODEL_SMALL` | `openai/gpt-4o-mini` | Fast model for simple tasks |
| `MODEL_LARGE` | `openai/gpt-4o` | Capable model for complex tasks |
| `MODEL_BACKUP` | `anthropic/claude-3-5-haiku-20241022` | Fallback when primary fails |
| `MODEL_LOCAL` | `ollama/llama3.2` | Local model for confidential repos |
| `WORKSPACE_DIR` | `/tmp/tokenwise-workspace` | Sandbox root for all file/shell ops |
| `BUDGET_DB_PATH` | `./data/budget.json` | Spend persistence file |
| `MOCK` | `0` | Set to `1` for offline mode |
| `MAX_STEPS` | `8` | Max tool-call iterations per request |
| `DEFAULT_BUDGET` | `0.05` | Default per-user spending limit (USD) |

---

## Architecture

```
app/
  api/
    agent/route.js      ← POST /api/agent  (main entry point)
    approve/route.js    ← POST /api/approve (single-use action gate)
    auth/route.js       ← POST /api/auth
    health/route.js     ← GET  /api/health

lib/
  agentLoop.js   ← tool-calling loop, tier selection, injection guard
  llm.js         ← Bifrost calls, retry, fallback chain
  tools.js        ← read_file, list_dir, web_search, write_file, run_shell, git
  budget.js      ← per-user spend tracking, file persistence
  fileCache.js   ← per-session file content cache
  config.js      ← centralised env-var config

components/
  AuthCard.js    ← shared login/signup form
  Hero3D.js      ← three.js landing animation

demo.js          ← CLI demo script
```

### Tool-calling loop

```
user task
   │
   ▼
[pick tier: small | large | local]
   │
   ▼
[check budget]  →  blocked → return error
   │
   ▼
[call LLM via Bifrost with tool schemas]
   │
   ├─ tool_calls?
   │     ├─ auto-allowed (read_file, list_dir, web_search)
   │     │      → execute, cache if read_file, append result, loop
   │     └─ approval-required (write_file, run_shell, git)
   │            → pause, return pendingActions to UI
   │            → UI shows preview, user clicks Approve/Reject
   │            → re-submit with approvedActions, resume loop
   │
   └─ text response → return finalAnswer
```

### Privacy enforcement

Confidential mode is enforced **in code** at three layers:

1. `agentLoop.js` — forces `tier = 'local'` before any LLM call
2. `llm.js` — `confidential=true` skips the fallback chain entirely; throws if Ollama is down
3. `agentLoop.js` — filters `web_search` out of available tool schemas and rejects any web_search call that the model attempts anyway

The user cannot override any of these by putting text in the task prompt.

---

## API reference

### `POST /api/agent`

```json
{
  "task": "string (required)",
  "sessionId": "string — UUID for file-cache scoping",
  "user": "string — authenticated user email",
  "files": ["workspace/relative/path.js"],
  "confidential": false,
  "limitOverride": 0.10,
  "approvedActions": [{ "callId": "...", "tool": "write_file", "args": {} }],
  "previousMessages": []
}
```

### `GET /api/health`

Returns `{ status: "ok"|"degraded", services: { bifrost, tavily, ollama, budgetDb }, config }`.

### `POST /api/approve`

Single-use token gate for pre-approved actions (token issued internally by the agent loop).

```json
{ "token": "tok_...", "user": "you@example.com" }
```

---

## Bifrost fallback configuration

Bifrost supports a `fallbacks` field in the request body for automatic provider switching. TokenWise also implements an app-level fallback chain so tasks survive even without Bifrost configured:

```
primary (MODEL_SMALL or MODEL_LARGE)
  → MODEL_BACKUP  (on 429 / 5xx / timeout)
  → MODEL_LOCAL   (last resort)
```

For confidential repos the chain is `MODEL_LOCAL` only — no fallback, no cloud.

---

## Development

```bash
npm run dev    # Next.js dev server with hot reload
npm run build  # Production build (must pass with zero errors)
npm start      # Serve production build
```

Lint / format: add your preferred tooling; the project is plain Next.js App Router with no extra build steps.
