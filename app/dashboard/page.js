'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import {
  Code2, Play, LogOut, CheckCircle2, AlertTriangle, Info, XCircle,
  ShieldCheck, Loader2, RefreshCw, Zap, Lock, Terminal,
  GitBranch, FileText, ChevronDown, ChevronUp, Cpu, Globe,
  Wifi, WifiOff, AlertCircle, ExternalLink,
} from 'lucide-react';

// ── Step icon map ─────────────────────────────────────────────────────────────
const IC = {
  ok:  [CheckCircle2, 'ok'],
  wn:  [AlertTriangle, 'wn'],
  in:  [Info, 'in'],
  bad: [XCircle, 'bad'],
};

const TOOL_ICONS = { write_file: FileText, run_shell: Terminal, git: GitBranch };

// ── Status dot ────────────────────────────────────────────────────────────────
function StatusDot({ ok, loading }) {
  const color = loading ? '#fbbf24' : ok ? '#5eead4' : '#ff7aa8';
  return (
    <span style={{
      display: 'inline-block', width: 8, height: 8, borderRadius: '50%',
      background: color, flexShrink: 0,
      boxShadow: ok && !loading ? `0 0 6px ${color}` : 'none',
    }} />
  );
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function fmtCost(n) { return typeof n === 'number' ? `$${n.toFixed(5)}` : '$0.00000'; }
function pct(a, b)  { return (!b || b === 0) ? 0 : Math.min(100, Math.round((a / b) * 100)); }

// ── Main ──────────────────────────────────────────────────────────────────────
export default function Dashboard() {
  const router = useRouter();

  // auth
  const [user, setUser] = useState(null);

  // form
  const [form, setForm] = useState({
    task:          'Search the web for the latest Next.js 14 features and summarise them.',
    files:         '',
    limitOverride: 0.50,
    confidential:  false,
  });

  // session
  const [sessionId, setSessionId] = useState('');
  useEffect(() => {
    setSessionId(
      typeof crypto !== 'undefined' ? crypto.randomUUID() : `s_${Date.now()}`
    );
  }, []);

  // result & state
  const [res,          setRes]          = useState(null);
  const [loading,      setLoading]      = useState(false);
  const [error,        setError]        = useState('');
  const [approvedNow,  setApprovedNow]  = useState([]);
  const [prevMessages, setPrevMessages] = useState([]);
  const [showRaw,      setShowRaw]      = useState(false);

  // health
  const [health,         setHealth]         = useState(null);
  const [healthLoading,  setHealthLoading]  = useState(false);

  // ── Auth guard ─────────────────────────────────────────────────────────────
  useEffect(() => {
    const stored = localStorage.getItem('tw_user');
    if (stored) setUser(stored);
    else router.replace('/login');
  }, [router]);

  // ── Health check ───────────────────────────────────────────────────────────
  const fetchHealth = useCallback(async () => {
    setHealthLoading(true);
    try {
      const r = await fetch('/api/health');
      const j = await r.json();
      setHealth(j);
    } catch {
      setHealth(null);
    }
    setHealthLoading(false);
  }, []);

  useEffect(() => { fetchHealth(); }, [fetchHealth]);

  // ── Run / resume ──────────────────────────────────────────────────────────
  const run = useCallback(async (extraApproved = [], resumeMessages = []) => {
    if (!user || !sessionId) return;
    setLoading(true);
    setError('');
    try {
      const fileList = form.files.split(',').map((x) => x.trim()).filter(Boolean);
      const body = {
        task:             form.task,
        sessionId,
        user,
        files:            fileList,
        confidential:     form.confidential,
        limitOverride:    parseFloat(form.limitOverride) || 0.50,
        approvedActions:  extraApproved,
        previousMessages: resumeMessages,
      };
      const resp = await fetch('/api/agent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const json = await resp.json();
      if (!resp.ok) throw new Error(json.error ?? `HTTP ${resp.status}`);
      setRes(json);
      if (json.resumeMessages) setPrevMessages(json.resumeMessages);
    } catch (e) {
      setError(e.message);
    }
    setLoading(false);
  }, [form, sessionId, user]);

  // ── Approve / reject ───────────────────────────────────────────────────────
  async function approve(action) {
    const next = [...approvedNow, action];
    setApprovedNow(next);
    await run(next, prevMessages);
  }

  function reject(action) {
    setRes((prev) => ({
      ...prev,
      pendingActions: (prev.pendingActions ?? []).filter((a) => a.callId !== action.callId),
      steps: [
        ...(prev.steps ?? []),
        { k: 'wn', t: `You rejected "${action.tool}". The agent was notified.` },
      ],
    }));
  }

  // ── New session ───────────────────────────────────────────────────────────
  function newSession() {
    setSessionId(typeof crypto !== 'undefined' ? crypto.randomUUID() : `s_${Date.now()}`);
    setRes(null);
    setApprovedNow([]);
    setPrevMessages([]);
    setError('');
  }

  function set(k, v) { setForm((f) => ({ ...f, [k]: v })); }

  if (!user) return null;

  // ── Computed display values ───────────────────────────────────────────────
  const spent    = res?.spent ?? 0;
  const limit    = res?.limit ?? (parseFloat(form.limitOverride) || 0.50);
  const tokens   = res?.usage?.total_tokens ?? 0;
  const saved    = res?.tokensSaved ?? 0;
  const naive    = tokens + saved;
  const savedPct = naive > 0 ? Math.round((1 - tokens / naive) * 100) : 0;
  const spendPct = pct(spent, limit);

  // health convenience flags
  const bifrostOk  = health?.services?.bifrost?.ok  ?? false;
  const tavilyOk   = health?.services?.tavily?.ok   ?? false;
  const ollamaOk   = health?.services?.ollama?.ok   ?? false;
  const isMock     = health?.mock ?? false;

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="w">

      {/* ── Nav ─────────────────────────────────────────────────────────── */}
      <nav>
        <div className="brand"><Code2 size={20} color="#6ee7ff" />TOKENWISE AGENT</div>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center', fontSize: 13, color: '#9a97b8' }}>
          {/* quick health indicators */}
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', fontSize: 11 }}>
            <StatusDot ok={bifrostOk} loading={healthLoading} />
            <span style={{ color: bifrostOk ? '#5eead4' : '#ff7aa8' }}>Bifrost</span>
            <StatusDot ok={tavilyOk} loading={healthLoading} />
            <span style={{ color: tavilyOk ? '#5eead4' : '#fbbf24' }}>Tavily</span>
            <StatusDot ok={ollamaOk} loading={healthLoading} />
            <span style={{ color: ollamaOk ? '#5eead4' : '#9a97b8' }}>Ollama</span>
            <button
              onClick={fetchHealth}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#8b7cf6', padding: 0 }}
              title="Refresh service status"
              aria-label="Refresh service status"
            >
              <RefreshCw size={11} />
            </button>
          </div>
          <span>{user}</span>
          <button
            className="pill"
            style={{ background: 'none', cursor: 'pointer' }}
            onClick={() => { localStorage.removeItem('tw_user'); router.push('/'); }}
            aria-label="Sign out"
          >
            <LogOut size={11} /> SIGN OUT
          </button>
        </div>
      </nav>

      {/* ── Setup banner when Bifrost is down and not in mock mode ─────── */}
      {!healthLoading && !bifrostOk && !isMock && (
        <div style={{
          border: '1px solid #fbbf2466', background: '#fbbf2408',
          borderRadius: 12, padding: '14px 18px', marginBottom: 16,
          display: 'flex', gap: 12, alignItems: 'flex-start',
        }}>
          <AlertCircle size={16} style={{ color: '#fbbf24', flexShrink: 0, marginTop: 2 }} />
          <div style={{ fontSize: 13, lineHeight: 1.7 }}>
            <b style={{ color: '#fbbf24' }}>Bifrost is not running.</b>
            {' '}Start it in a terminal, then configure your OpenAI key in the web UI.
            <br />
            <code style={{ background: '#0d0b2688', padding: '2px 8px', borderRadius: 6, fontSize: 12 }}>
              npx -y @maximhq/bifrost
            </code>
            {' '}→ open{' '}
            <a href="http://localhost:8080" target="_blank" rel="noreferrer"
              style={{ color: '#8b7cf6', display: 'inline-flex', alignItems: 'center', gap: 3 }}>
              localhost:8080 <ExternalLink size={10} />
            </a>
            {' '}→ Providers → add OpenAI key.
            <br />
            Or set{' '}
            <code style={{ background: '#0d0b2688', padding: '2px 8px', borderRadius: 6, fontSize: 12 }}>MOCK=1</code>
            {' '}in <code style={{ background: '#0d0b2688', padding: '2px 8px', borderRadius: 6, fontSize: 12 }}>.env.local</code>
            {' '}to run offline with canned responses.
          </div>
        </div>
      )}

      {isMock && (
        <div style={{
          border: '1px solid #8b7cf666', background: '#8b7cf608',
          borderRadius: 12, padding: '10px 18px', marginBottom: 16,
          fontSize: 13, color: '#b3a9ff', display: 'flex', gap: 8, alignItems: 'center',
        }}>
          <Info size={14} />
          Running in <b>MOCK mode</b> — no real API calls are made. Set <code style={{ background: '#0d0b2688', padding: '1px 6px', borderRadius: 4 }}>MOCK=0</code> in .env.local for live mode.
        </div>
      )}

      <div className="dash">

        {/* ── Left: task form ────────────────────────────────────────────── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
          <div className="box" style={{ alignSelf: 'start' }}>
            <span className="lab">NEW TASK</span>

            <label htmlFor="tw-task">Task</label>
            <textarea
              id="tw-task"
              rows={5}
              value={form.task}
              onChange={(e) => set('task', e.target.value)}
              placeholder="Describe what you want the agent to do…"
            />

            <label htmlFor="tw-files">
              Pre-read files{' '}
              <span style={{ color: '#9a97b8', fontWeight: 400 }}>
                (comma-separated paths relative to workspace)
              </span>
            </label>
            <input
              id="tw-files"
              value={form.files}
              onChange={(e) => set('files', e.target.value)}
              placeholder="src/auth.js, src/db.js"
            />

            <label htmlFor="tw-limit">Spending limit (USD)</label>
            <input
              id="tw-limit"
              type="number"
              step="0.01"
              min="0.01"
              value={form.limitOverride}
              onChange={(e) => set('limitOverride', e.target.value)}
            />

            <div className="row">
              <label htmlFor="tw-conf" style={{ margin: 0 }}>
                <Lock size={12} style={{ verticalAlign: 'middle', marginRight: 4 }} />
                Confidential repository
              </label>
              <input
                id="tw-conf"
                className="tg"
                type="checkbox"
                role="switch"
                checked={form.confidential}
                onChange={(e) => set('confidential', e.target.checked)}
              />
            </div>
            <p style={{ fontSize: 12, color: '#9a97b8', marginTop: 4, lineHeight: 1.5 }}>
              {form.confidential
                ? '🔒 Local Ollama only · web search off · cloud fallback blocked in code'
                : '☁️ Cloud models · web search on · automatic failover chain active'}
            </p>

            <button
              className="btn"
              style={{ width: '100%', justifyContent: 'center', marginTop: 20 }}
              disabled={loading || (!bifrostOk && !isMock)}
              onClick={() => { setApprovedNow([]); setPrevMessages([]); run([]); }}
              aria-busy={loading}
            >
              {loading
                ? <><Loader2 size={15} className="spin" /> Running…</>
                : <><Play size={15} /> Run task</>}
            </button>

            <button
              className="btn g"
              style={{ width: '100%', justifyContent: 'center', marginTop: 10 }}
              onClick={newSession}
              disabled={loading}
              title="Clear file cache and start a new conversation"
            >
              <RefreshCw size={13} /> New session
            </button>

            {error && (
              <div className="err" role="alert" style={{ marginTop: 12 }}>
                {error}
              </div>
            )}
          </div>

          {/* ── Service status card ──────────────────────────────────────── */}
          <div className="box" style={{ marginTop: 14, fontSize: 12 }}>
            <span className="lab" style={{ marginBottom: 8 }}>SERVICES</span>
            {[
              { label: 'Bifrost (LLM gateway)', ok: bifrostOk,
                note: bifrostOk ? health?.services?.bifrost?.model : (health?.services?.bifrost?.error ?? 'not running') },
              { label: 'Tavily (web search)',   ok: tavilyOk,
                note: tavilyOk ? 'connected' : (health?.services?.tavily?.note ?? health?.services?.tavily?.error ?? 'check TAVILY_API_KEY') },
              { label: 'Ollama (local model)',  ok: ollamaOk,
                note: ollamaOk
                  ? (health?.services?.ollama?.targetPulled
                      ? `${health?.services?.ollama?.targetModel} ✓`
                      : `${health?.services?.ollama?.targetModel} not pulled`)
                  : (health?.services?.ollama?.hint ?? health?.services?.ollama?.error ?? 'not running') },
            ].map(({ label, ok, note }) => (
              <div key={label} style={{ display: 'flex', gap: 8, alignItems: 'flex-start', padding: '5px 0', borderTop: '1px solid #ffffff0a' }}>
                <StatusDot ok={ok} loading={healthLoading} />
                <div>
                  <span style={{ color: '#cfcbee' }}>{label}</span>
                  {note && <span style={{ display: 'block', color: '#9a97b8', fontSize: 11, marginTop: 1 }}>{note}</span>}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── Right: results ──────────────────────────────────────────────── */}
        <div>
          {res ? (
            <>
              {/* ── Stats ───────────────────────────────────────────────── */}
              <div className="stats">
                <div className="box">
                  <b>{tokens.toLocaleString()}</b>
                  <small>tokens used</small>
                </div>
                <div className="box">
                  <b className="ok">{savedPct}%</b>
                  <small>
                    tokens saved
                    {saved > 0 && (
                      <span style={{ display: 'block', color: '#5eead4', fontSize: 11 }}>
                        {saved.toLocaleString()} from cache
                      </span>
                    )}
                  </small>
                </div>
                <div className="box">
                  <b>{fmtCost(spent)}</b>
                  <small>
                    of {fmtCost(limit)} limit
                    <div className="meter" style={{ marginTop: 6 }}>
                      <i style={{ width: spendPct + '%' }} />
                    </div>
                  </small>
                </div>
              </div>

              {/* ── Model badge ─────────────────────────────────────────── */}
              {res.model && (
                <div className="box" style={{
                  marginBottom: 14, fontSize: 13,
                  display: 'flex', gap: 10, alignItems: 'flex-start', flexWrap: 'wrap',
                }}>
                  <Cpu size={14} style={{ color: 'var(--pu)', flexShrink: 0, marginTop: 3 }} />
                  <div style={{ flex: 1 }}>
                    <span style={{ color: '#9a97b8' }}>Answered by </span>
                    <b style={{ color: '#b3a9ff' }}>{res.model}</b>
                    {res.tier && (
                      <span style={{
                        marginLeft: 8, padding: '2px 8px', borderRadius: 99,
                        background: '#8b7cf622', fontSize: 11, color: '#8b7cf6',
                      }}>
                        {res.tier}
                      </span>
                    )}
                    {res.triedFallback && (
                      <span style={{
                        marginLeft: 6, padding: '2px 8px', borderRadius: 99,
                        background: '#fbbf2422', fontSize: 11, color: '#fbbf24',
                      }}>
                        fallback used
                      </span>
                    )}
                    {res.whyFallback && (
                      <p style={{ color: '#fbbf24', fontSize: 12, marginTop: 4, lineHeight: 1.5 }}>
                        {res.whyFallback}
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* ── Activity log ────────────────────────────────────────── */}
              <div className="box">
                <span className="lab">ACTIVITY</span>

                {(res.steps ?? []).map((s, i) => {
                  const [Icon, cls] = IC[s.k] ?? IC.in;
                  return (
                    <div className="step" key={i}>
                      <Icon size={15} className={cls} aria-hidden />
                      <span style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word', fontSize: 13 }}>
                        {s.t}
                      </span>
                    </div>
                  );
                })}

                {/* ── Pending approvals ─────────────────────────────────── */}
                {(res.pendingActions ?? []).length > 0 && (
                  <div style={{ marginTop: 16 }}>
                    <span className="lab" style={{ color: '#fbbf24' }}>AWAITING YOUR APPROVAL</span>
                    {(res.pendingActions ?? []).map((action) => {
                      const ToolIcon = TOOL_ICONS[action.tool] ?? ShieldCheck;
                      return (
                        <div key={action.callId} style={{
                          border: '1px solid #fbbf2455', borderRadius: 10,
                          padding: 14, marginBottom: 12, background: '#fbbf2406',
                        }}>
                          <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 10 }}>
                            <ToolIcon size={14} style={{ color: '#fbbf24' }} />
                            <b style={{ color: '#fbbf24', fontSize: 13 }}>{action.tool}</b>
                          </div>
                          <pre style={{
                            fontSize: 12, color: '#cfcbee',
                            background: '#0d0b2699', padding: '10px 12px',
                            borderRadius: 8, overflowX: 'auto', margin: '0 0 12px',
                            whiteSpace: 'pre-wrap', wordBreak: 'break-word', maxHeight: 260,
                          }}>
                            {action.preview}
                          </pre>
                          <div style={{ display: 'flex', gap: 10 }}>
                            <button
                              className="btn"
                              style={{ flex: 1, justifyContent: 'center' }}
                              onClick={() => approve(action)}
                              disabled={loading}
                            >
                              <ShieldCheck size={14} /> Approve & run
                            </button>
                            <button
                              className="btn g"
                              style={{ flex: 1, justifyContent: 'center' }}
                              onClick={() => reject(action)}
                              disabled={loading}
                            >
                              <XCircle size={14} /> Reject
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* ── Final answer ──────────────────────────────────────── */}
                {res.finalAnswer && (
                  <div style={{
                    marginTop: 16, padding: '14px 16px',
                    background: '#1b174788', borderRadius: 10,
                    border: '1px solid #8b7cf633',
                  }}>
                    <span className="lab" style={{ marginBottom: 8 }}>ANSWER</span>
                    <p style={{
                      fontSize: 14, lineHeight: 1.75,
                      whiteSpace: 'pre-wrap', wordBreak: 'break-word', margin: 0,
                    }}>
                      {res.finalAnswer}
                    </p>
                  </div>
                )}

                {/* ── Blocked message ───────────────────────────────────── */}
                {res.blocked && !res.finalAnswer && (
                  <div style={{
                    marginTop: 14, padding: '12px 14px',
                    background: '#ff7aa808', borderRadius: 10,
                    border: '1px solid #ff7aa833',
                  }}>
                    <XCircle size={14} style={{ color: '#ff7aa8', verticalAlign: 'middle', marginRight: 6 }} />
                    <span style={{ fontSize: 13, color: '#ff7aa8' }}>
                      Task was blocked — see activity log above.
                    </span>
                  </div>
                )}

                {/* ── Debug raw ─────────────────────────────────────────── */}
                <button
                  onClick={() => setShowRaw((v) => !v)}
                  style={{
                    marginTop: 14, background: 'none', border: 'none',
                    cursor: 'pointer', color: '#9a97b8', fontSize: 11,
                    display: 'flex', alignItems: 'center', gap: 4,
                  }}
                >
                  {showRaw ? <ChevronUp size={11} /> : <ChevronDown size={11} />}
                  {showRaw ? 'Hide' : 'Show'} raw API response
                </button>
                {showRaw && (
                  <pre style={{
                    fontSize: 11, color: '#9a97b8', marginTop: 8,
                    overflowX: 'auto', maxHeight: 360,
                    background: '#0d0b2688', padding: 12, borderRadius: 8,
                  }}>
                    {JSON.stringify(res, null, 2)}
                  </pre>
                )}
              </div>
            </>
          ) : (
            /* ── Empty state ──────────────────────────────────────────── */
            <div className="box">
              <span className="lab">ACTIVITY</span>
              <p style={{ color: '#9a97b8', fontSize: 14, lineHeight: 1.75, marginBottom: 20 }}>
                Run a task to see model routing, file caching, failover, spending and
                approval gates here. Try the same task twice to see cached files cut
                the token count — the savings % updates live.
              </p>
              <div className="grid4">
                {[
                  [Zap,       'Token savings',   'Files already read this session cost zero tokens on re-use. Token savings shown live.'],
                  [RefreshCw, 'Fallback chain',  'If Bifrost returns 429 or 5xx, the agent retries and then switches models automatically.'],
                  [Lock,      'Privacy mode',    'Confidential repos are locked to local Ollama. Cloud models never see the code.'],
                  [ShieldCheck,'Approval gate',  'write_file, run_shell and git pause and show the exact change before running.'],
                ].map(([Icon, title, desc]) => (
                  <div className="req" key={title}>
                    <Icon size={18} />
                    <div><b>{title}</b><span>{desc}</span></div>
                  </div>
                ))}
              </div>
              <div style={{
                marginTop: 20, padding: '12px 14px', borderRadius: 10,
                background: '#8b7cf608', border: '1px solid #8b7cf622',
                fontSize: 13, color: '#9a97b8', lineHeight: 1.65,
              }}>
                <b style={{ color: '#b3a9ff' }}>Try these example tasks:</b>
                {[
                  'Search the web for the latest Next.js 14 features and summarise them.',
                  'List the files in the workspace.',
                  'Write a hello.txt file with today\'s date in the workspace.',
                  'What is the current Node.js LTS version?',
                ].map((t) => (
                  <div
                    key={t}
                    onClick={() => set('task', t)}
                    style={{
                      marginTop: 8, padding: '6px 10px', borderRadius: 8,
                      background: '#ffffff08', cursor: 'pointer',
                      border: '1px solid #ffffff0a',
                      transition: 'background 0.15s',
                    }}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => e.key === 'Enter' && set('task', t)}
                    aria-label={`Use task: ${t}`}
                  >
                    {t}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
