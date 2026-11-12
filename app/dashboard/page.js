'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Code2, Play, LogOut, CheckCircle2, AlertTriangle, Info, XCircle,
  ShieldCheck, ShieldAlert, Loader2, RefreshCw, Zap, Lock, Terminal,
  GitBranch, FileText, ChevronDown, ChevronUp, Cpu, DollarSign,
  ArrowRight, ExternalLink, AlertCircle,
} from 'lucide-react';

// ── Step icon + label map ────────────────────────────────────────────────────
const IC = {
  ok:  [CheckCircle2, 'ok',  'COMPLETED',  '#10b981'],
  wn:  [AlertTriangle, 'wn', 'ATTENTION',  '#f59e0b'],
  in:  [Info, 'in',    'ROUTING',    '#8b7cf6'],
  bad: [XCircle, 'bad','INTERCEPTED','#f43f5e'],
};

const TOOL_ICONS = { write_file: FileText, run_shell: Terminal, git: GitBranch };

// ── Model tier definitions (used for the routing visualization) ──────────────
const MODEL_TIERS = [
  { id: 'local',  label: 'Local Ollama',  tier: 'AIR-GAPPED LOCAL',  rate: '$0.00 / 1k',   color: '#10b981' },
  { id: 'small',  label: 'Small Cloud',   tier: 'LIGHTWEIGHT CLOUD', rate: '$0.0002 / 1k', color: '#00f2fe' },
  { id: 'large',  label: 'Large Cloud',   tier: 'HIGH-REASONING',    rate: '$0.01 / 1k',   color: '#8b7cf6' },
  { id: 'backup', label: 'Backup Cloud',  tier: 'FAILOVER PROVIDER',rate: '$0.003 / 1k',  color: '#f59e0b' },
];

// ── Example tasks for the empty state ────────────────────────────────────────
const EXAMPLE_TASKS = [
  { title: 'Search the web for Next.js 14 features', task: 'Search the web for the latest Next.js 14 features and summarise the top 3.', files: '', badge: 'WEB SEARCH' },
  { title: 'List workspace files',                    task: 'List all the files in the workspace and explain what each one does.', files: '', badge: 'READ-ONLY' },
  { title: 'Create a hello file',                      task: 'Write a file called hello.txt with "Hello from TokenWise Agent!" in the workspace.', files: '', badge: 'NEEDS APPROVAL' },
  { title: 'Check Node.js LTS version',                task: 'What is the current Node.js LTS version?', files: '', badge: 'QUICK LOOKUP' },
];

// ── Status dot component ─────────────────────────────────────────────────────
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

// ══════════════════════════════════════════════════════════════════════════════
// Main Dashboard Component
// ══════════════════════════════════════════════════════════════════════════════
export default function Dashboard() {
  const router = useRouter();

  // ── Auth ──────────────────────────────────────────────────────────────────
  const [user, setUser] = useState(null);

  // ── Form state ────────────────────────────────────────────────────────────
  const [form, setForm] = useState({
    task:          'Search the web for the latest Next.js 14 features and summarise the top 3.',
    files:         '',
    limitOverride: 0.50,
    confidential:  false,
    outage:        false,
  });

  // ── Session ───────────────────────────────────────────────────────────────
  const [sessionId, setSessionId] = useState('');
  useEffect(() => {
    setSessionId(typeof crypto !== 'undefined' ? crypto.randomUUID() : `s_${Date.now()}`);
  }, []);

  // ── Result & loading ──────────────────────────────────────────────────────
  const [res,           setRes]           = useState(null);
  const [loading,       setLoading]       = useState(false);
  const [error,         setError]         = useState('');
  const [approvedNow,   setApprovedNow]   = useState([]);
  const [prevMessages,  setPrevMessages]  = useState([]);
  const [showRaw,       setShowRaw]       = useState(false);

  // ── Health ────────────────────────────────────────────────────────────────
  const [health,        setHealth]        = useState(null);
  const [healthLoading, setHealthLoading] = useState(false);

  // ── Auth guard ────────────────────────────────────────────────────────────
  useEffect(() => {
    const stored = localStorage.getItem('tw_user');
    if (stored) setUser(stored);
    else router.replace('/login');
  }, [router]);

  // ── Fetch health ──────────────────────────────────────────────────────────
  const fetchHealth = useCallback(async () => {
    setHealthLoading(true);
    try {
      const r = await fetch('/api/health');
      setHealth(await r.json());
    } catch { setHealth(null); }
    setHealthLoading(false);
  }, []);
  useEffect(() => { fetchHealth(); }, [fetchHealth]);

  // ── Run / resume task ──────────────────────────────────────────────────────
  const run = useCallback(async (extraApproved = [], resumeMessages = []) => {
    if (!user || !sessionId) return;
    setLoading(true);
    setError('');
    try {
      const fileList = form.files.split(',').map((x) => x.trim()).filter(Boolean);
      const resp = await fetch('/api/agent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          task:            form.task,
          sessionId,
          user,
          files:           fileList,
          confidential:    form.confidential,
          limitOverride:    parseFloat(form.limitOverride) || 0.50,
          forceFailover:   form.outage,
          approvedActions: extraApproved,
          previousMessages: resumeMessages,
        }),
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

  // ── Approve a pending action ──────────────────────────────────────────────
  async function approve(action) {
    const next = [...approvedNow, action];
    setApprovedNow(next);
    await run(next, prevMessages);
  }

  // ── Reject a pending action ───────────────────────────────────────────────
  function reject(action) {
    setRes((prev) => ({
      ...prev,
      pendingActions: (prev?.pendingActions ?? []).filter((a) => a.callId !== action.callId),
      steps: [...(prev?.steps ?? []), { k: 'wn', t: `You rejected "${action.tool}". The agent was notified.` }],
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

  // ── Keyboard shortcut: Cmd/Ctrl+Enter ─────────────────────────────────────
  function handleKeyDown(e) {
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter' && !loading) {
      setApprovedNow([]);
      setPrevMessages([]);
      run([]);
    }
  }

  function set(k, v) { setForm((f) => ({ ...f, [k]: v })); }

  if (!user) return null;

  // ── Computed display values ───────────────────────────────────────────────
  const spent     = res?.spent ?? 0;
  const limit     = res?.limit ?? (parseFloat(form.limitOverride) || 0.50);
  const tokens    = res?.usage?.total_tokens ?? 0;
  const saved     = res?.tokensSaved ?? 0;
  const naive     = tokens + saved;
  const savedPct  = naive > 0 ? Math.round((1 - tokens / naive) * 100) : 0;
  const spendPct  = pct(spent, limit);
  const isBlocked = res?.blocked ?? false;

  // ── Health convenience flags ──────────────────────────────────────────────
  const bifrostOk = health?.services?.bifrost?.ok  ?? false;
  const tavilyOk  = health?.services?.tavily?.ok   ?? false;
  const ollamaOk  = health?.services?.ollama?.ok   ?? false;
  const isMock    = health?.mock ?? false;
  // Can run if: mock mode OR Ollama is ready (all models are local)
  const canRun    = isMock || ollamaOk || bifrostOk;

  // ── Model name from config (for tier visualization) ───────────────────────
  const cfgModels = health?.config?.models ?? {};
  const activeTierId = res?.tier ?? null;
  const activeModel   = res?.model ?? null;

  // ════════════════════════════════════════════════════════════════════════════
  // Render
  // ════════════════════════════════════════════════════════════════════════════
  return (
    <div className="w">
      {/* ── Navigation ───────────────────────────────────────────────────── */}
      <nav style={{ padding: '18px 0', borderBottom: '1px solid var(--ln)', marginBottom: 8 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <Link href="/" className="brand" title="Return to Landing Page">
            <div className="brand-icon-wrapper"><Code2 size={20} color="#00f2fe" /></div>
            <span>TOKENWISE AGENT</span>
          </Link>
          <span style={{
            fontFamily: 'var(--font-mono)', fontSize: 10, padding: '2px 8px',
            borderRadius: 6, background: 'rgba(0, 242, 254, 0.1)',
            border: '1px solid rgba(0, 242, 254, 0.3)', color: '#6ee7ff',
            letterSpacing: '0.06em',
          }}>
            COMMAND CENTER
          </span>
        </div>

        <div style={{ display: 'flex', gap: 14, alignItems: 'center' }}>
          {/* Health status indicators */}
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', fontSize: 11 }}>
            <StatusDot ok={bifrostOk} loading={healthLoading} />
            <span style={{ color: bifrostOk ? '#5eead4' : '#ff7aa8' }}>Bifrost</span>
            <StatusDot ok={tavilyOk} loading={healthLoading} />
            <span style={{ color: tavilyOk ? '#5eead4' : '#fbbf24' }}>Tavily</span>
            <StatusDot ok={ollamaOk} loading={healthLoading} />
            <span style={{ color: ollamaOk ? '#5eead4' : '#9a97b8' }}>Ollama</span>
            <button onClick={fetchHealth} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#8b7cf6', padding: 0 }} title="Refresh service status" aria-label="Refresh service status">
              <RefreshCw size={11} />
            </button>
          </div>

          {/* User identity pill */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: 8, padding: '5px 12px',
            borderRadius: 99, background: 'rgba(255,255,255,0.04)',
            border: '1px solid rgba(255,255,255,0.1)', fontSize: 12,
            color: 'var(--ink-secondary)', fontFamily: 'var(--font-mono)',
          }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#10b981', boxShadow: '0 0 6px #10b981' }} />
            {user}
          </div>

          {/* Sign out */}
          <button className="pill" style={{
            background: 'rgba(244,63,94,0.08)', borderColor: 'rgba(244,63,94,0.3)',
            color: '#ff85ad', cursor: 'pointer',
          }} onClick={() => { localStorage.removeItem('tw_user'); router.push('/'); }} aria-label="Sign out">
            <LogOut size={12} /> SIGN OUT
          </button>
        </div>
      </nav>

      {/* ── Setup banner ─────────────────────────────────────────────────── */}
      {!healthLoading && !canRun && !isMock && (
        <div style={{
          border: '1px solid #fbbf2466', background: '#fbbf2408',
          borderRadius: 12, padding: '14px 18px', marginBottom: 16,
          display: 'flex', gap: 12, alignItems: 'flex-start',
        }}>
          <AlertCircle size={16} style={{ color: '#fbbf24', flexShrink: 0, marginTop: 2 }} />
          <div style={{ fontSize: 13, lineHeight: 1.8 }}>
            {!ollamaOk ? (
              <>
                <b style={{ color: '#fbbf24' }}>Ollama is not running.</b> Start it and the model will be ready.
                <br />
                <code style={{ background: '#0d0b2688', padding: '2px 8px', borderRadius: 6, fontSize: 12 }}>ollama serve</code>
                {' '}— Ollama server must be running for all tasks (all models are local).
                <br />
                <span style={{ color: 'var(--mut)' }}>
                  Model: <code style={{ background: '#0d0b2688', padding: '1px 6px', borderRadius: 4 }}>qwen2.5-coder:3b</code> — already pulled ✓
                </span>
              </>
            ) : (
              <>
                <b style={{ color: '#fbbf24' }}>Model not ready yet.</b>
                {' '}Run: <code style={{ background: '#0d0b2688', padding: '2px 8px', borderRadius: 6, fontSize: 12 }}>ollama pull qwen2.5-coder:3b</code>
              </>
            )}
          </div>
        </div>
      )}

      {/* ── Mock mode banner ────────────────────────────────────────────────── */}
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

      {/* ══════════════════════════════════════════════════════════════════════ */}
      {/* Main two-column layout                                                    */}
      {/* ══════════════════════════════════════════════════════════════════════ */}
      <div className="dash">

        {/* ── LEFT: Task Composer ─────────────────────────────────────────────── */}
        <div className="box" style={{ alignSelf: 'start' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <span className="lab" style={{ margin: 0 }}>NEW AGENT TASK</span>
            <span style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--mut)' }}>Cmd+Enter to Run</span>
          </div>

          {/* Task textarea */}
          <label htmlFor="tw-task"><Terminal size={12} /> Task Description</label>
          <textarea
            id="tw-task" rows={4} value={form.task}
            onChange={(e) => set('task', e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Describe the coding task, bug fix, or refactor…"
          />

          {/* Files to read */}
          <label htmlFor="tw-files"><FileText size={12} /> Files to read (comma-separated)</label>
          <input
            id="tw-files" value={form.files}
            onChange={(e) => set('files', e.target.value)}
            placeholder="src/auth.js, src/db.js"
          />
          <span style={{ fontSize: 11, color: 'var(--mut-dim)', fontFamily: 'var(--font-mono)', display: 'block', marginTop: 4 }}>
            Cached files cost 0 tokens on repeat turns
          </span>

          {/* Spending limit with presets */}
          <div style={{ marginTop: 14 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <label htmlFor="tw-limit" style={{ margin: 0 }}><DollarSign size={12} /> Spending Limit (USD)</label>
              <div style={{ display: 'flex', gap: 6 }}>
                {[0.05, 0.10, 0.50].map((val) => (
                  <button key={val} type="button" onClick={() => set('limitOverride', val)} style={{
                    background: +form.limitOverride === val ? 'rgba(139,124,246,0.3)' : 'rgba(255,255,255,0.05)',
                    border: `1px solid ${+form.limitOverride === val ? 'var(--pu)' : 'rgba(255,255,255,0.1)'}`,
                    borderRadius: 4, color: +form.limitOverride === val ? '#fff' : 'var(--mut)',
                    fontFamily: 'var(--font-mono)', fontSize: 10, padding: '2px 6px', cursor: 'pointer',
                  }}>${val.toFixed(2)}</button>
                ))}
              </div>
            </div>
            <input id="tw-limit" type="number" step="0.01" min="0.01" value={form.limitOverride}
              onChange={(e) => set('limitOverride', e.target.value)} style={{ marginTop: 6 }} />
          </div>

          {/* Confidential toggle */}
          <div className="row" style={{
            marginTop: 18,
            borderColor: form.confidential ? 'rgba(16,185,129,0.4)' : 'rgba(255,255,255,0.08)',
            background:  form.confidential ? 'rgba(16,185,129,0.08)' : 'rgba(255,255,255,0.02)',
          }}>
            <div>
              <label htmlFor="tw-conf" style={{
                margin: 0, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6,
                color: form.confidential ? '#34d399' : '#cfcbee',
              }}>
                <Lock size={13} color={form.confidential ? '#34d399' : '#8b7cf6'} /> Confidential repository
              </label>
              <span style={{ fontSize: 11, color: 'var(--mut-dim)', display: 'block', marginTop: 2 }}>
                Forces 100% local model (Ollama) · web search off
              </span>
            </div>
            <input id="tw-conf" className="tg" type="checkbox" role="switch"
              checked={form.confidential} onChange={(e) => set('confidential', e.target.checked)} />
          </div>

          {/* Outage simulation toggle */}
          <div className="row" style={{
            marginTop: 10,
            borderColor: form.outage ? 'rgba(245,158,11,0.4)' : 'rgba(255,255,255,0.08)',
            background:  form.outage ? 'rgba(245,158,11,0.08)' : 'rgba(255,255,255,0.02)',
          }}>
            <div>
              <label htmlFor="tw-out" style={{
                margin: 0, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6,
                color: form.outage ? '#fbbf24' : '#cfcbee',
              }}>
                <RefreshCw size={13} color={form.outage ? '#fbbf24' : '#8b7cf6'} /> Simulate provider outage
              </label>
              <span style={{ fontSize: 11, color: 'var(--mut-dim)', display: 'block', marginTop: 2 }}>
                Forces failover to backup model
              </span>
            </div>
            <input id="tw-out" className="tg" type="checkbox" role="switch"
              checked={form.outage} onChange={(e) => set('outage', e.target.checked)}
              disabled={form.confidential} />
          </div>

          {/* Run button */}
          <button className="btn" style={{ width: '100%', justifyContent: 'center', marginTop: 22, padding: '14px' }}
            disabled={loading || !canRun}
            onClick={() => { setApprovedNow([]); setPrevMessages([]); run([]); }}
            aria-busy={loading}>
            {loading
              ? <><Loader2 size={16} className="spin" /> Evaluating Task & Routing…</>
              : <><Play size={16} fill="currentColor" /> Run Agent Task</>}
          </button>

          {/* New session button */}
          <button className="btn g" style={{ width: '100%', justifyContent: 'center', marginTop: 10 }}
            onClick={newSession} disabled={loading} title="Clear file cache and start a new conversation">
            <RefreshCw size={13} /> New Session
          </button>

          {error && (
            <div className="err" role="alert" style={{ marginTop: 12 }}>
              <XCircle size={16} style={{ flex: 'none' }} /> {error}
            </div>
          )}

          {/* ── Service status mini-card ─────────────────────────────────────── */}
          <div style={{ marginTop: 18, paddingTop: 14, borderTop: '1px solid var(--ln)' }}>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: '0.1em', color: 'var(--mut-dim)', fontWeight: 700 }}>SERVICE STATUS</span>
            {[
              { label: 'Ollama (qwen2.5-coder:3b)', ok: ollamaOk,
                note: ollamaOk
                  ? (health?.services?.ollama?.targetPulled ? 'qwen2.5-coder:3b ✓ ready' : 'running — model pulling...')
                  : (health?.services?.ollama?.hint ?? 'not running — run: ollama serve') },
              { label: 'Tavily (web search)',   ok: tavilyOk,
                note: tavilyOk ? 'connected' : (health?.services?.tavily?.note ?? health?.services?.tavily?.error ?? 'check TAVILY_API_KEY') },
              { label: 'Bifrost (optional)',     ok: bifrostOk,
                note: bifrostOk ? 'running' : 'not running — not needed (all models are local)' },
            ].map(({ label, ok, note }) => (
              <div key={label} style={{ display: 'flex', gap: 8, alignItems: 'flex-start', padding: '5px 0', borderTop: '1px solid rgba(255,255,255,0.04)' }}>
                <StatusDot ok={ok} loading={healthLoading} />
                <div>
                  <span style={{ color: '#cfcbee', fontSize: 12 }}>{label}</span>
                  {note && <span style={{ display: 'block', color: 'var(--mut-dim)', fontSize: 10, marginTop: 1 }}>{note}</span>}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── RIGHT: Results & Telemetry ──────────────────────────────────────── */}
        <div>
          {res ? (
            <>
              {/* ── Stats row ───────────────────────────────────────────────── */}
              <div className="stats">
                <div className="box">
                  <span className="lab" style={{ fontSize: 10 }}>TOKENS USED</span>
                  <b>{tokens.toLocaleString()}</b>
                  <small>
                    {saved > 0
                      ? <span>vs <span style={{ textDecoration: 'line-through', opacity: 0.6 }}>{naive.toLocaleString()}</span> naive</span>
                      : 'tokens consumed in run'}
                  </small>
                </div>
                <div className="box">
                  <span className="lab" style={{ fontSize: 10, color: '#34d399' }}>CACHE SAVINGS</span>
                  <b className="ok">{savedPct}%</b>
                  <small>
                    saved vs. un-cached
                    {saved > 0 && <span style={{ display: 'block', color: '#5eead4', fontSize: 11 }}>{saved.toLocaleString()} tokens from cache</span>}
                  </small>
                </div>
                <div className="box">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span className="lab" style={{ fontSize: 10 }}>TOTAL SPEND</span>
                    {isBlocked && <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: '#f43f5e', background: 'rgba(244,63,94,0.15)', padding: '1px 6px', borderRadius: 4, fontWeight: 700 }}>LIMIT REACHED</span>}
                  </div>
                  <b>{fmtCost(spent)}</b>
                  <small>
                    of {fmtCost(limit)} limit
                    <div className="meter" style={{ marginTop: 6 }}>
                      <i style={{ width: `${spendPct}%`, background: spendPct >= 90 ? 'linear-gradient(90deg, #f59e0b, #f43f5e)' : 'linear-gradient(90deg, #8b7cf6, #00f2fe, #ff3d9a)' }} />
                    </div>
                  </small>
                </div>
              </div>

              {/* ── Model routing visualization ─────────────────────────────── */}
              <div className="box" style={{ marginBottom: 16, padding: '18px 22px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                  <span className="lab" style={{ margin: 0 }}>INTELLIGENT MODEL ROUTING</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--mut)' }}>
                    <span>Answered by:</span>
                    <strong style={{ color: activeModel ? '#00f2fe' : 'var(--mut)' }}>{activeModel ?? 'None'}</strong>
                  </div>
                </div>

                {/* 4-tier grid */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10 }}>
                  {MODEL_TIERS.map((t) => {
                    const isActive = activeTierId === t.id;
                    return (
                      <div key={t.id} style={{
                        padding: '10px 12px', borderRadius: 10,
                        background: isActive ? `linear-gradient(135deg, ${t.color}25, rgba(20,16,50,0.9))` : 'rgba(255,255,255,0.03)',
                        border: `1px solid ${isActive ? t.color : 'rgba(255,255,255,0.08)'}`,
                        boxShadow: isActive ? `0 0 16px ${t.color}33` : 'none',
                        transition: 'all 0.25s ease',
                      }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, fontWeight: 700, color: isActive ? t.color : 'var(--mut)' }}>{t.tier}</span>
                          {isActive && <span style={{ width: 6, height: 6, borderRadius: '50%', background: t.color, boxShadow: `0 0 6px ${t.color}` }} />}
                        </div>
                        <div style={{ fontSize: 12, fontWeight: 700, color: isActive ? '#fff' : 'var(--ink-secondary)', marginBottom: 2 }}>{t.label}</div>
                        <div style={{ fontSize: 10, fontFamily: 'var(--font-mono)', color: 'var(--mut-dim)' }}>
                          {cfgModels[t.id] ?? '—'}
                        </div>
                        <div style={{ fontSize: 10, fontFamily: 'var(--font-mono)', color: t.color, marginTop: 2 }}>{t.rate}</div>
                      </div>
                    );
                  })}
                </div>

                {/* Fallback notice */}
                {res.triedFallback && res.whyFallback && (
                  <div style={{
                    marginTop: 12, display: 'flex', alignItems: 'center', gap: 8,
                    padding: '8px 12px', borderRadius: 8,
                    background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.3)',
                    fontSize: 12, color: '#fde68a',
                  }}>
                    <RefreshCw size={14} color="#fbbf24" />
                    <span><strong>Provider Failover:</strong> {res.whyFallback}</span>
                  </div>
                )}

                {/* Confidential notice */}
                {form.confidential && (
                  <div style={{
                    marginTop: form.outage ? 0 : 12, display: 'flex', alignItems: 'center', gap: 8,
                    padding: '8px 12px', borderRadius: 8,
                    background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.3)',
                    fontSize: 12, color: '#a7f3d0',
                  }}>
                    <ShieldCheck size={14} color="#34d399" />
                    <span><strong>Confidential Mode Enforced:</strong> Only local Ollama was used. Cloud models were blocked in code.</span>
                  </div>
                )}
              </div>

              {/* ── Activity timeline ───────────────────────────────────────── */}
              <div className="box">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                  <span className="lab" style={{ margin: 0 }}>EXECUTION ACTIVITY TIMELINE</span>
                  <span style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--mut)' }}>
                    {res.steps?.length ?? 0} events
                  </span>
                </div>

                {(res.steps ?? []).map((s, i) => {
                  const [Icon, cls, statusLabel, accentColor] = IC[s.k] ?? [Info, 'in', 'INFO', '#8b7cf6'];
                  return (
                    <div className="step" key={i}>
                      <div className={`step-icon-wrapper ${cls}`}><Icon size={15} /></div>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2 }}>
                          <span style={{
                            fontFamily: 'var(--font-mono)', fontSize: 9.5, color: accentColor,
                            background: `${accentColor}18`, padding: '1px 6px', borderRadius: 4, fontWeight: 700,
                          }}>
                            STEP {String(i + 1).padStart(2, '0')} · {statusLabel}
                          </span>
                        </div>
                        <span style={{ color: '#f1effa', whiteSpace: 'pre-wrap', wordBreak: 'break-word', fontSize: 13.5 }}>{s.t}</span>
                      </div>
                    </div>
                  );
                })}

                {/* ── Pending approvals ─────────────────────────────────────── */}
                {(res.pendingActions ?? []).length > 0 && (
                  <div style={{
                    marginTop: 20, padding: '18px 20px', borderRadius: 14,
                    background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.35)',
                    boxShadow: '0 8px 24px rgba(245,158,11,0.15)',
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8, color: '#fbbf24' }}>
                      <ShieldAlert size={18} />
                      <strong style={{ fontSize: 14, letterSpacing: '-0.01em' }}>Actions Require Human Authorization</strong>
                    </div>
                    <p style={{ fontSize: 13, color: '#e2e8f0', marginBottom: 14, lineHeight: 1.5 }}>
                      The agent wants to perform destructive actions. In accordance with safety policies, prompt instructions cannot override this gate.
                    </p>

                    {(res.pendingActions ?? []).map((action) => {
                      const ToolIcon = TOOL_ICONS[action.tool] ?? ShieldCheck;
                      return (
                        <div key={action.callId} style={{
                          border: '1px solid rgba(245,158,11,0.3)', borderRadius: 10,
                          padding: 14, marginBottom: 12, background: 'rgba(8,7,20,0.6)',
                        }}>
                          <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 10 }}>
                            <ToolIcon size={14} style={{ color: '#fbbf24' }} />
                            <b style={{ color: '#fbbf24', fontSize: 13 }}>{action.tool}</b>
                          </div>
                          <pre style={{
                            fontSize: 12, color: '#cfcbee', background: '#0d0b2699',
                            padding: '10px 12px', borderRadius: 8, overflowX: 'auto', margin: '0 0 12px',
                            whiteSpace: 'pre-wrap', wordBreak: 'break-word', maxHeight: 260,
                          }}>
                            {action.preview}
                          </pre>
                          <div style={{ display: 'flex', gap: 10 }}>
                            <button className="btn" style={{ flex: 1, justifyContent: 'center' }}
                              onClick={() => approve(action)} disabled={loading}>
                              <ShieldCheck size={14} /> Approve &amp; Run
                            </button>
                            <button className="btn g" style={{ flex: 1, justifyContent: 'center' }}
                              onClick={() => reject(action)} disabled={loading}>
                              <XCircle size={14} /> Reject
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* ── Final answer ──────────────────────────────────────────── */}
                {res.finalAnswer && (
                  <div style={{
                    marginTop: 16, padding: '14px 16px', borderRadius: 10,
                    background: 'rgba(27,23,71,0.53)', border: '1px solid rgba(139,124,246,0.2)',
                  }}>
                    <span className="lab" style={{ marginBottom: 8 }}>ANSWER</span>
                    <p style={{ fontSize: 14, lineHeight: 1.75, whiteSpace: 'pre-wrap', wordBreak: 'break-word', margin: 0, color: '#f1effa' }}>
                      {res.finalAnswer}
                    </p>
                  </div>
                )}

                {/* ── Blocked message ───────────────────────────────────────── */}
                {isBlocked && !res.finalAnswer && (
                  <div style={{
                    marginTop: 14, padding: '12px 14px', borderRadius: 10,
                    background: 'rgba(244,63,94,0.08)', border: '1px solid rgba(244,63,94,0.2)',
                    display: 'flex', gap: 8, alignItems: 'center',
                  }}>
                    <XCircle size={14} style={{ color: '#ff7aa8', flexShrink: 0 }} />
                    <span style={{ fontSize: 13, color: '#ff7aa8' }}>Task was blocked — see activity log above.</span>
                  </div>
                )}

                {/* ── Debug raw toggle ──────────────────────────────────────── */}
                <button onClick={() => setShowRaw((v) => !v)} style={{
                  marginTop: 14, background: 'none', border: 'none', cursor: 'pointer',
                  color: 'var(--mut)', fontSize: 11, display: 'flex', alignItems: 'center', gap: 4,
                }}>
                  {showRaw ? <ChevronUp size={11} /> : <ChevronDown size={11} />}
                  {showRaw ? 'Hide' : 'Show'} raw API response
                </button>
                {showRaw && (
                  <pre style={{
                    fontSize: 11, color: 'var(--mut)', marginTop: 8, overflowX: 'auto', maxHeight: 360,
                    background: '#0d0b2688', padding: 12, borderRadius: 8,
                  }}>
                    {JSON.stringify(res, null, 2)}
                  </pre>
                )}
              </div>
            </>
          ) : (
            /* ── Empty state ──────────────────────────────────────────────── */
            <div className="box" style={{
              textAlign: 'center', padding: '48px 32px', display: 'flex',
              flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: 420,
            }}>
              <div style={{
                width: 64, height: 64, borderRadius: 20,
                background: 'linear-gradient(135deg, rgba(139,124,246,0.2), rgba(0,242,254,0.15))',
                border: '1px solid rgba(139,124,246,0.4)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: '#6ee7ff', boxShadow: '0 0 30px rgba(139,124,246,0.25)', marginBottom: 18,
              }}>
                <Cpu size={32} />
              </div>
              <span className="lab" style={{ color: '#00f2fe' }}>INTELLIGENCE SYSTEM STANDBY</span>
              <h3 style={{ fontSize: 24, fontWeight: 800, color: '#fff', marginBottom: 8, letterSpacing: '-0.02em' }}>
                Ready to Execute Your First Task
              </h3>
              <p style={{ color: 'var(--mut)', fontSize: 14.5, maxWidth: 500, lineHeight: 1.6, marginBottom: 28 }}>
                Run a task to see model routing, caching, failover, spending limits, and human approvals live. Try the same task twice to watch cached files cut tokens to zero.
              </p>

              {/* Example task chips */}
              <div style={{ width: '100%', maxWidth: 540 }}>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, letterSpacing: '0.1em', color: 'var(--mut-dim)', display: 'block', marginBottom: 10 }}>
                  CLICK AN EXAMPLE TASK TO LOAD:
                </span>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {EXAMPLE_TASKS.map((ex) => (
                    <button key={ex.title} type="button"
                      onClick={() => { set('task', ex.task); set('files', ex.files); }}
                      style={{
                        padding: '12px 16px', background: 'rgba(255,255,255,0.03)',
                        border: '1px solid rgba(255,255,255,0.08)', borderRadius: 10,
                        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                        cursor: 'pointer', textAlign: 'left', transition: 'all 0.2s ease',
                      }}
                      onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(139,124,246,0.12)'; e.currentTarget.style.borderColor = 'rgba(139,124,246,0.4)'; }}
                      onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.03)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'; }}
                    >
                      <div>
                        <strong style={{ fontSize: 13, color: '#fff', display: 'block' }}>{ex.title}</strong>
                        {ex.files && <span style={{ fontSize: 12, color: 'var(--mut)' }}>{ex.files}</span>}
                      </div>
                      <span style={{
                        fontFamily: 'var(--font-mono)', fontSize: 10, color: '#c4b5fd',
                        background: 'rgba(139,124,246,0.15)', padding: '3px 8px', borderRadius: 6, flex: 'none',
                      }}>
                        {ex.badge}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
