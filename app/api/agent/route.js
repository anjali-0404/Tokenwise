/**
 * POST /api/agent
 *
 * Body:
 * {
 *   task: string,
 *   sessionId: string,       // client-generated UUID for file-cache scoping
 *   user: string,            // authenticated user email
 *   files?: string[],        // workspace-relative paths to pre-read
 *   confidential?: boolean,
 *   limitOverride?: number,  // per-call USD cap (overrides stored limit)
 *   approvedActions?: {      // actions the user has approved via /api/approve
 *     callId: string, tool: string, args: object
 *   }[],
 *   previousMessages?: object[], // conversation history for multi-turn resumption
 * }
 *
 * Returns the standard agent response envelope (see agentLoop.js).
 */

import { runAgentLoop } from '../../../lib/agentLoop.js';
import { getSpend, getLimit } from '../../../lib/budget.js';

export async function POST(request) {
  let body;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: 'Invalid JSON body.' }, { status: 400 });
  }

  const {
    task,
    sessionId,
    user,
    files,
    confidential,
    limitOverride,
    approvedActions,
    previousMessages,
    forceFailover,
  } = body;

  if (!task || typeof task !== 'string' || !task.trim()) {
    return Response.json({ error: 'Describe a task first.' }, { status: 400 });
  }

  if (!user || typeof user !== 'string') {
    return Response.json({ error: 'User identifier is required.' }, { status: 400 });
  }

  // Sanitise inputs
  const safeTask = String(task).slice(0, 8000);
  const safeFiles = Array.isArray(files)
    ? files.map((f) => String(f).trim()).filter(Boolean).slice(0, 20)
    : [];

  try {
    const result = await runAgentLoop({
      task: safeTask,
      sessionId: String(sessionId || `s_${user}`),
      user: String(user),
      files: safeFiles,
      confidential: Boolean(confidential),
      limitOverride: limitOverride != null ? parseFloat(limitOverride) : undefined,
      approvedActions: Array.isArray(approvedActions) ? approvedActions : [],
      previousMessages: Array.isArray(previousMessages) ? previousMessages : [],
      forceFailover: Boolean(forceFailover),
    });

    return Response.json({
      ...result,
      spent: getSpend(String(user)),
      limit: limitOverride ?? getLimit(String(user)),
    });
  } catch (err) {
    console.error('[agent] unhandled error:', err);
    return Response.json(
      { error: err.message ?? 'Internal server error.' },
      { status: 500 }
    );
  }
}
