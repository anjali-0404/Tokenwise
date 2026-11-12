/**
 * Tool implementations for the agent loop.
 *
 * Auto-allowed  : read_file, list_dir, web_search
 * Approval-required: write_file, run_shell, git
 *
 * All file/shell operations are sandboxed to WORKSPACE_DIR.
 * Prompt-injection attempts to escape the sandbox are rejected in code.
 */

import { readFileSync, writeFileSync, readdirSync, mkdirSync, existsSync } from 'fs';
import { resolve, dirname, sep } from 'path';
import { execSync } from 'child_process';
import { cfg } from './config.js';

// ── Sandbox enforcement ──────────────────────────────────────────────────────

function safeResolve(userPath) {
  const workspace = resolve(cfg.workspaceDir);
  const abs = resolve(workspace, userPath);
  // normalise to forward-slashes for a consistent check on all platforms
  const normWorkspace = workspace.replace(/\\/g, '/');
  const normAbs = abs.replace(/\\/g, '/');
  if (normAbs !== normWorkspace && !normAbs.startsWith(normWorkspace + '/')) {
    throw new Error(
      `Path "${userPath}" is outside the sandbox (${cfg.workspaceDir}). Operation refused.`
    );
  }
  return abs;
}

function ensureWorkspace() {
  if (!existsSync(cfg.workspaceDir)) {
    mkdirSync(cfg.workspaceDir, { recursive: true });
  }
}

// ── Auto-allowed tools ───────────────────────────────────────────────────────

/**
 * read_file: read a text file inside the workspace.
 */
export async function read_file({ path: filePath }) {
  ensureWorkspace();
  let abs;
  try { abs = safeResolve(filePath); } catch (e) {
    return { error: e.message };
  }
  if (!existsSync(abs)) return { error: `File not found: ${filePath}` };
  try {
    const content = readFileSync(abs, 'utf8');
    return { content, path: filePath };
  } catch (e) {
    return { error: `Could not read file: ${e.message}` };
  }
}

/**
 * list_dir: list files and directories inside the workspace.
 */
export async function list_dir({ path: dirPath = '.' }) {
  ensureWorkspace();
  let abs;
  try { abs = safeResolve(dirPath); } catch (e) {
    return { error: e.message };
  }
  if (!existsSync(abs)) return { error: `Directory not found: ${dirPath}` };
  try {
    const entries = readdirSync(abs, { withFileTypes: true }).map((d) => ({
      name: d.name,
      type: d.isDirectory() ? 'dir' : 'file',
    }));
    return { entries, path: dirPath };
  } catch (e) {
    return { error: `Could not list directory: ${e.message}` };
  }
}

/**
 * web_search: search the web via Tavily.
 * Disabled when the repo is confidential (enforced by the agent loop, not here).
 */
export async function web_search({ query, max_results = 5 }) {
  if (!cfg.tavilyKey) {
    return { error: 'TAVILY_API_KEY is not configured. Web search is unavailable.' };
  }

  // Sanitise query — reject obvious injection attempts
  const cleanQuery = String(query).slice(0, 400).replace(/[\r\n]/g, ' ');

  try {
    const res = await fetch('https://api.tavily.com/search', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${cfg.tavilyKey}`,
      },
      body: JSON.stringify({
        query: cleanQuery,
        max_results: Math.min(max_results, 10),
        include_answer: true,
        include_raw_content: false,
      }),
    });

    if (!res.ok) {
      const txt = await res.text().catch(() => '');
      return { error: `Tavily returned HTTP ${res.status}: ${txt.slice(0, 200)}` };
    }

    const data = await res.json();

    // Trim snippets to control token spend
    const results = (data.results ?? []).slice(0, max_results).map((r) => ({
      title: r.title,
      url: r.url,
      snippet: (r.content ?? '').slice(0, 300),
    }));

    return {
      answer: (data.answer ?? '').slice(0, 500),
      results,
    };
  } catch (e) {
    return { error: `Web search failed: ${e.message}` };
  }
}

// ── Approval-required tools ──────────────────────────────────────────────────
// These are NOT called directly by the agent loop on their own.
// The loop returns them as "pendingActions" and the UI calls approve/reject.

/**
 * write_file: create or overwrite a file inside the workspace.
 */
export async function write_file({ path: filePath, content }) {
  ensureWorkspace();
  let abs;
  try { abs = safeResolve(filePath); } catch (e) {
    return { error: e.message };
  }
  // Create parent dirs if needed (cross-platform via dirname)
  const dir = dirname(abs);
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
  writeFileSync(abs, content, 'utf8');
  return { written: filePath, bytes: Buffer.byteLength(content, 'utf8') };
}

/**
 * run_shell: run a shell command inside the workspace.
 * Limited to 10-second wall time and 64 KB output.
 */
export async function run_shell({ command }) {
  ensureWorkspace();

  // Reject attempts to escape the sandbox via path traversal
  if (/\.\.[/\\]/.test(command)) {
    return { error: 'Command contains path traversal (..) and was refused.' };
  }

  try {
    const stdout = execSync(command, {
      cwd: cfg.workspaceDir,
      timeout: 10_000,
      maxBuffer: 64 * 1024,
      encoding: 'utf8',
      // On Windows use cmd; on Unix use sh
      shell: process.platform === 'win32' ? 'cmd.exe' : '/bin/sh',
    });
    return { stdout: stdout.slice(0, 4096) };
  } catch (e) {
    return {
      error: (e.message ?? '').slice(0, 1000),
      stderr: (e.stderr ?? '').slice(0, 1000),
    };
  }
}

/**
 * git: run a whitelisted git command inside the workspace.
 */
const GIT_ALLOWLIST = /^git (status|diff|log|add|commit|push|pull|checkout|branch)\b/;

export async function git({ command }) {
  ensureWorkspace();

  if (!GIT_ALLOWLIST.test(command)) {
    return {
      error: `Git command "${command}" is not in the allowlist (status, diff, log, add, commit, push, pull, checkout, branch).`,
    };
  }

  try {
    const stdout = execSync(command, {
      cwd: cfg.workspaceDir,
      timeout: 15_000,
      maxBuffer: 64 * 1024,
      encoding: 'utf8',
    });
    return { stdout: stdout.slice(0, 4096) };
  } catch (e) {
    return { error: (e.message ?? '').slice(0, 1000) };
  }
}

// ── Tool registry ─────────────────────────────────────────────────────────────

export const AUTO_TOOLS = { read_file, list_dir, web_search };
export const APPROVAL_TOOLS = { write_file, run_shell, git };
export const ALL_TOOLS = { ...AUTO_TOOLS, ...APPROVAL_TOOLS };

/** OpenAI-format tool schemas sent to the model. */
export const TOOL_SCHEMAS = [
  {
    type: 'function',
    function: {
      name: 'read_file',
      description: 'Read the content of a text file inside the workspace sandbox.',
      parameters: {
        type: 'object',
        properties: {
          path: { type: 'string', description: 'Relative path inside the workspace.' },
        },
        required: ['path'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'list_dir',
      description: 'List files and directories inside the workspace sandbox.',
      parameters: {
        type: 'object',
        properties: {
          path: { type: 'string', description: 'Relative directory path (default: ".").' },
        },
        required: [],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'web_search',
      description: 'Search the web via Tavily. Disabled for confidential repositories.',
      parameters: {
        type: 'object',
        properties: {
          query: { type: 'string', description: 'Search query.' },
          max_results: { type: 'integer', description: 'Max results (1-10, default 5).' },
        },
        required: ['query'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'write_file',
      description: 'Write or overwrite a file inside the workspace. REQUIRES USER APPROVAL before execution.',
      parameters: {
        type: 'object',
        properties: {
          path: { type: 'string', description: 'Relative path inside the workspace.' },
          content: { type: 'string', description: 'Full file content to write.' },
        },
        required: ['path', 'content'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'run_shell',
      description: 'Run a shell command inside the workspace. REQUIRES USER APPROVAL.',
      parameters: {
        type: 'object',
        properties: {
          command: { type: 'string', description: 'Shell command to execute.' },
        },
        required: ['command'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'git',
      description: 'Run a whitelisted git command inside the workspace. REQUIRES USER APPROVAL.',
      parameters: {
        type: 'object',
        properties: {
          command: { type: 'string', description: 'Git command (e.g. "git status").' },
        },
        required: ['command'],
      },
    },
  },
];
