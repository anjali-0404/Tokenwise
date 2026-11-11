/**
 * POST /api/approve
 *
 * Single-use approval endpoint for write_file, run_shell, and git actions.
 * Each approval token is consumed on first use and cannot be replayed.
 *
 * Body:
 * {
 *   token: string,     // one-time approval token issued by /api/agent
 *   user: string,      // must match the user the token was issued for
 * }
 *
 * Returns:
 * { result: object }   // the tool execution result
 *
 * The UI should re-submit the full /api/agent request with
 * approvedActions populated rather than calling this endpoint directly
 * for multi-step resumption.  This endpoint exists as the separate
 * single-use gate described in the spec.
 */

import { APPROVAL_TOOLS } from '../../../lib/tools.js';

// In-memory store: token → { user, tool, args, used }
// In production you'd back this with Redis or a DB.
const _tokens = globalThis.__tw_approval_tokens ?? (globalThis.__tw_approval_tokens = new Map());

/**
 * Issue a single-use approval token (called internally by the agent route
 * when it surfaces a pending action).
 */
export function issueToken(user, tool, args) {
  const token = `tok_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
  _tokens.set(token, { user, tool, args, used: false, issuedAt: Date.now() });
  return token;
}

export async function POST(request) {
  let body;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: 'Invalid JSON body.' }, { status: 400 });
  }

  const { token, user } = body;

  if (!token || !user) {
    return Response.json({ error: 'token and user are required.' }, { status: 400 });
  }

  const record = _tokens.get(token);

  if (!record) {
    return Response.json(
      { error: 'Unknown or expired approval token.' },
      { status: 404 }
    );
  }

  if (record.used) {
    return Response.json(
      { error: 'This approval token has already been used.' },
      { status: 409 }
    );
  }

  if (record.user !== user) {
    return Response.json(
      { error: 'Approval token was not issued to this user.' },
      { status: 403 }
    );
  }

  // Expire tokens older than 10 minutes
  if (Date.now() - record.issuedAt > 10 * 60 * 1000) {
    _tokens.delete(token);
    return Response.json(
      { error: 'Approval token has expired (10-minute window).' },
      { status: 410 }
    );
  }

  if (!APPROVAL_TOOLS[record.tool]) {
    return Response.json(
      { error: `Unknown approval tool: ${record.tool}` },
      { status: 400 }
    );
  }

  // Mark as used BEFORE execution (prevents double-execution on retry)
  record.used = true;

  try {
    const result = await APPROVAL_TOOLS[record.tool](record.args);
    return Response.json({ result, tool: record.tool, args: record.args });
  } catch (err) {
    return Response.json(
      { error: `Tool execution failed: ${err.message}` },
      { status: 500 }
    );
  }
}
