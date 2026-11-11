'use client';

import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Code2,
  Play,
  LogOut,
  CheckCircle2,
  AlertTriangle,
  Info,
  XCircle,
  ShieldCheck,
  Shield,
  Loader2,
  FileText,
  DollarSign,
  Cpu,
  Layers,
  Sparkles,
  Zap,
  Terminal,
  Lock,
  RefreshCw,
  Sliders,
  ChevronRight,
  Database,
  ArrowRight,
  User,
  KeyRound,
  ShieldAlert,
} from 'lucide-react';

const IC = {
  ok: [CheckCircle2, 'ok', 'COMPLETED', '#10b981'],
  wn: [AlertTriangle, 'wn', 'ATTENTION', '#f59e0b'],
  in: [Info, 'in', 'ROUTING INFO', '#8b7cf6'],
  bad: [XCircle, 'bad', 'INTERCEPTED', '#f43f5e'],
};

// Known model definitions from backend
const MODEL_TIERS = [
  {
    id: 'local',
    name: 'ollama/llama3.2 (local)',
    label: 'Local Llama 3.2',
    tier: 'LOCAL AIR-GAPPED',
    rate: '$0.00 / 1k tok',
    color: '#10b981',
    isFree: true,
  },
  {
    id: 'small',
    name: 'haiku-class (cloud)',
    label: 'Haiku Class',
    tier: 'LIGHTWEIGHT CLOUD',
    rate: '$0.002 / 1k tok',
    color: '#00f2fe',
    isFree: false,
  },
  {
    id: 'big',
    name: 'sonnet-class (cloud)',
    label: 'Sonnet Class',
    tier: 'HIGH-REASONING CLOUD',
    rate: '$0.010 / 1k tok',
    color: '#8b7cf6',
    isFree: false,
  },
  {
    id: 'backup',
    name: 'backup-provider mid-tier (cloud)',
    label: 'Backup Mid-Tier',
    tier: 'FAILOVER PROVIDER',
    rate: '$0.006 / 1k tok',
    color: '#f59e0b',
    isFree: false,
  },
];

const EXAMPLE_TASKS = [
  {
    title: 'Fix null check in auth.js',
    task: 'Fix the null check in auth.js and run the tests',
    files: 'src/auth.js, src/db.js',
    badge: 'Standard Refactor',
  },
  {
    title: 'Inspect database connection pooling',
    task: 'Review src/db.js and optimize the connection timeout settings',
    files: 'src/db.js',
    badge: 'Cache Demo (0 Tok Hit)',
  },
  {
    title: 'Security audit on credentials handler',
    task: 'Audit src/auth.js for password timing vulnerabilities and write test cases',
    files: 'src/auth.js, tests/auth.test.js',
    badge: 'Confidential Task',
  },
];

export default function D() {
  const r = useRouter();
  const [u, setU] = useState(null);
  const [f, setF] = useState({
    task: 'Fix the null check in auth.js and run the tests',
    files: 'src/auth.js, src/db.js',
    limit: 0.05,
    confidential: false,
    outage: false,
  });
  const [res, setRes] = useState(null);
  const [ap, setAp] = useState([]);
  const [ld, setLd] = useState(false);
  const [er, setEr] = useState('');

  // Authentication check
  useEffect(() => {
    const x = localStorage.getItem('tw_user');
    x ? setU(x) : r.replace('/login');
  }, [r]);

  // Execute Agent Task
  async function run(a = ap) {
    setLd(true);
    setEr('');
    try {
      const x = await fetch('/api/agent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...f, user: u, approved: a }),
      });
      const j = await x.json();
      if (!x.ok) throw new Error(j.error);
      setRes(j);
    } catch (k) {
      setEr(k.message);
    }
    setLd(false);
  }

  // Handle explicit human approval
  const approve = (n) => {
    const a = [...ap, n];
    setAp(a);
    run(a);
  };

  const set = (k, v) => setF({ ...f, [k]: v });

  // Keyboard shortcut: Cmd+Enter or Ctrl+Enter to trigger task
  const handleKeyDown = (e) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter' && !ld) {
      setAp([]);
      run([]);
    }
  };

  if (!u) return null;

  const pc = res && res.limit > 0 ? Math.min(100, (res.spent / res.limit) * 100) : 0;
  const isBudgetBlocked = res?.blocked;

  return (
    <div className="w">
      {/* Top Console Navigation Bar */}
      <nav style={{ padding: '18px 0', borderBottom: '1px solid var(--ln)', marginBottom: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <Link href="/" className="brand" title="Return to Landing Page">
            <div className="brand-icon-wrapper">
              <Code2 size={20} color="#00f2fe" />
            </div>
            <span>TOKENWISE AGENT</span>
          </Link>
          <span
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '10px',
              padding: '2px 8px',
              borderRadius: '6px',
              background: 'rgba(0, 242, 254, 0.1)',
              border: '1px solid rgba(0, 242, 254, 0.3)',
              color: '#6ee7ff',
              letterSpacing: '0.06em',
            }}
          >
            COMMAND CENTER
          </span>
        </div>

        {/* User Identity and Sign Out */}
        <div style={{ display: 'flex', gap: 14, alignItems: 'center' }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              padding: '5px 12px',
              borderRadius: '99px',
              background: 'rgba(255, 255, 255, 0.04)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              fontSize: 12,
              color: 'var(--ink-secondary)',
              fontFamily: 'var(--font-mono)',
            }}
          >
            <span
              style={{
                width: 6,
                height: 6,
                borderRadius: '50%',
                background: '#10b981',
                boxShadow: '0 0 6px #10b981',
              }}
            />
            <span>{u}</span>
          </div>

          <button
            className="pill"
            style={{
              background: 'rgba(244, 63, 94, 0.08)',
              borderColor: 'rgba(244, 63, 94, 0.3)',
              color: '#ff85ad',
              cursor: 'pointer',
            }}
            onClick={() => {
              localStorage.removeItem('tw_user');
              r.push('/');
            }}
          >
            <LogOut size={12} />
            <span>SIGN OUT</span>
          </button>
        </div>
      </nav>

      {/* Main Command Dashboard Layout */}
      <div className="dash">
        {/* Left Column: Task Composer & Controls */}
        <div className="box" style={{ alignSelf: 'start', position: 'sticky', top: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <span className="lab" style={{ margin: 0 }}>NEW AGENT TASK</span>
            <span style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--mut)' }}>
              Cmd+Enter to Run
            </span>
          </div>

          {/* Task Description Textarea */}
          <label htmlFor="t">
            <Terminal size={12} /> Task Description
          </label>
          <textarea
            id="t"
            rows={4}
            value={f.task}
            onChange={(e) => set('task', e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Describe the coding task, bug fix, or refactor..."
          />

          {/* Files to Read Input */}
          <label htmlFor="fl">
            <FileText size={12} /> Files to read (comma-separated)
          </label>
          <input
            id="fl"
            value={f.files}
            onChange={(e) => set('files', e.target.value)}
            placeholder="src/auth.js, src/db.js"
          />
          <div style={{ display: 'flex', gap: 6, marginTop: 6, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 11, color: 'var(--mut-dim)', fontFamily: 'var(--font-mono)' }}>
              Cached files cost 0 tokens on repeat turns
            </span>
          </div>

          {/* Spending Limit Input */}
          <div style={{ marginTop: 14 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <label htmlFor="l" style={{ margin: 0 }}>
                <DollarSign size={12} /> Spending Limit (USD)
              </label>
              <div style={{ display: 'flex', gap: 6 }}>
                {[0.05, 0.1, 0.5].map((val) => (
                  <button
                    key={val}
                    type="button"
                    onClick={() => set('limit', val)}
                    style={{
                      background: +f.limit === val ? 'rgba(139, 124, 246, 0.3)' : 'rgba(255, 255, 255, 0.05)',
                      border: `1px solid ${+f.limit === val ? 'var(--pu)' : 'rgba(255, 255, 255, 0.1)'}`,
                      borderRadius: 4,
                      color: +f.limit === val ? '#fff' : 'var(--mut)',
                      fontFamily: 'var(--font-mono)',
                      fontSize: 10,
                      padding: '2px 6px',
                      cursor: 'pointer',
                    }}
                  >
                    ${val.toFixed(2)}
                  </button>
                ))}
              </div>
            </div>
            <input
              id="l"
              type="number"
              step="0.01"
              min="0"
              value={f.limit}
              onChange={(e) => set('limit', e.target.value)}
              style={{ marginTop: 6 }}
            />
          </div>

          {/* Governance & Simulation Toggles */}
          <div style={{ marginTop: 18, display: 'flex', flexDirection: 'column', gap: 10 }}>
            {/* Confidential Repository Toggle */}
            <div
              className="row"
              style={{
                marginTop: 0,
                borderColor: f.confidential ? 'rgba(16, 185, 129, 0.4)' : 'rgba(255, 255, 255, 0.08)',
                background: f.confidential ? 'rgba(16, 185, 129, 0.08)' : 'rgba(255, 255, 255, 0.02)',
              }}
            >
              <div>
                <label
                  htmlFor="c"
                  style={{
                    margin: 0,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    color: f.confidential ? '#34d399' : '#cfcbee',
                  }}
                >
                  <Lock size={13} color={f.confidential ? '#34d399' : '#8b7cf6'} />
                  <span>Confidential repository</span>
                </label>
                <span style={{ fontSize: 11, color: 'var(--mut-dim)', display: 'block', marginTop: 2 }}>
                  Forces 100% local model (Ollama)
                </span>
              </div>
              <input
                id="c"
                className="tg"
                type="checkbox"
                checked={f.confidential}
                onChange={(e) => set('confidential', e.target.checked)}
              />
            </div>

            {/* Provider Outage Simulation Toggle */}
            <div
              className="row"
              style={{
                marginTop: 0,
                borderColor: f.outage ? 'rgba(245, 158, 11, 0.4)' : 'rgba(255, 255, 255, 0.08)',
                background: f.outage ? 'rgba(245, 158, 11, 0.08)' : 'rgba(255, 255, 255, 0.02)',
              }}
            >
              <div>
                <label
                  htmlFor="o"
                  style={{
                    margin: 0,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    color: f.outage ? '#fbbf24' : '#cfcbee',
                  }}
                >
                  <RefreshCw size={13} color={f.outage ? '#fbbf24' : '#8b7cf6'} />
                  <span>Simulate provider outage</span>
                </label>
                <span style={{ fontSize: 11, color: 'var(--mut-dim)', display: 'block', marginTop: 2 }}>
                  Tests failover to secondary provider
                </span>
              </div>
              <input
                id="o"
                className="tg"
                type="checkbox"
                checked={f.outage}
                onChange={(e) => set('outage', e.target.checked)}
              />
            </div>
          </div>

          {/* Run Task Button */}
          <button
            className="btn"
            style={{
              width: '100%',
              justifyContent: 'center',
              marginTop: 22,
              padding: '14px',
            }}
            disabled={ld}
            onClick={() => {
              setAp([]);
              run([]);
            }}
          >
            {ld ? (
              <>
                <Loader2 size={16} className="spin" />
                <span>Evaluating Task &amp; Routing...</span>
              </>
            ) : (
              <>
                <Play size={16} fill="currentColor" />
                <span>Run Agent Task</span>
              </>
            )}
          </button>

          {/* Error Message Alert */}
          {er && (
            <div className="err" role="alert">
              <XCircle size={16} style={{ flex: 'none' }} />
              <span>{er}</span>
            </div>
          )}
        </div>

        {/* Right Column: Telemetry, Model Routing, Activity Timeline & Approvals */}
        <div>
          {/* Active Execution State */}
          {res && (
            <>
              {/* Telemetry Statistics Cards */}
              <div className="stats">
                {/* Tokens Used Card */}
                <div className="box">
                  <span className="lab" style={{ fontSize: 10 }}>TOKENS USED</span>
                  <b>{res.tokens.toLocaleString()}</b>
                  <small>
                    {res.naive ? (
                      <span>
                        vs. <span style={{ textDecoration: 'line-through', opacity: 0.6 }}>{res.naive.toLocaleString()}</span> naive
                      </span>
                    ) : (
                      'tokens consumed in run'
                    )}
                  </small>
                </div>

                {/* Tokens Saved Card */}
                <div className="box">
                  <span className="lab" style={{ fontSize: 10, color: '#34d399' }}>CACHE SAVINGS</span>
                  <b className="ok">
                    {res.naive ? Math.max(0, Math.round((1 - res.tokens / res.naive) * 100)) : 0}%
                  </b>
                  <small>saved vs. un-cached ingestion</small>
                </div>

                {/* Spend & Limit Progress Card */}
                <div className="box">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span className="lab" style={{ fontSize: 10 }}>TOTAL SPEND</span>
                    {isBudgetBlocked && (
                      <span
                        style={{
                          fontFamily: 'var(--font-mono)',
                          fontSize: 9,
                          color: '#f43f5e',
                          background: 'rgba(244, 63, 94, 0.15)',
                          padding: '1px 6px',
                          borderRadius: 4,
                          fontWeight: 700,
                        }}
                      >
                        LIMIT REACHED
                      </span>
                    )}
                  </div>
                  <b>${res.spent.toFixed(4)}</b>
                  <small>
                    of ${(+res.limit).toFixed(2)} limit
                    <div className="meter">
                      <i
                        style={{
                          width: `${pc}%`,
                          background:
                            pc >= 90
                              ? 'linear-gradient(90deg, #f59e0b, #f43f5e)'
                              : 'linear-gradient(90deg, #8b7cf6, #00f2fe, #ff3d9a)',
                        }}
                      />
                    </div>
                  </small>
                </div>
              </div>

              {/* Model Routing Status Showcase */}
              <div
                className="box"
                style={{
                  marginBottom: 16,
                  padding: '18px 22px',
                  background: 'rgba(15, 12, 36, 0.85)',
                  border: '1px solid rgba(139, 124, 246, 0.3)',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                  <span className="lab" style={{ margin: 0 }}>INTELLIGENT MODEL ROUTING</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--mut)' }}>
                    <span>Active Selection:</span>
                    <strong style={{ color: '#00f2fe' }}>{res.model || 'None'}</strong>
                  </div>
                </div>

                {/* 4 Model Tiers Visual Representation */}
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(4, 1fr)',
                    gap: 10,
                  }}
                >
                  {MODEL_TIERS.map((tier) => {
                    const isSelected = res.model === tier.name;
                    return (
                      <div
                        key={tier.id}
                        style={{
                          padding: '10px 12px',
                          borderRadius: 10,
                          background: isSelected
                            ? `linear-gradient(135deg, ${tier.color}25, rgba(20, 16, 50, 0.9))`
                            : 'rgba(255, 255, 255, 0.03)',
                          border: `1px solid ${isSelected ? tier.color : 'rgba(255, 255, 255, 0.08)'}`,
                          boxShadow: isSelected ? `0 0 16px ${tier.color}33` : 'none',
                          transition: 'all 0.25s ease',
                          position: 'relative',
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                          <span
                            style={{
                              fontFamily: 'var(--font-mono)',
                              fontSize: 9,
                              fontWeight: 700,
                              color: isSelected ? tier.color : 'var(--mut)',
                            }}
                          >
                            {tier.tier}
                          </span>
                          {isSelected && (
                            <span
                              style={{
                                width: 6,
                                height: 6,
                                borderRadius: '50%',
                                background: tier.color,
                                boxShadow: `0 0 6px ${tier.color}`,
                              }}
                            />
                          )}
                        </div>
                        <div
                          style={{
                            fontSize: 12,
                            fontWeight: 700,
                            color: isSelected ? '#fff' : 'var(--ink-secondary)',
                            marginBottom: 2,
                          }}
                        >
                          {tier.label}
                        </div>
                        <span style={{ fontSize: 10, fontFamily: 'var(--font-mono)', color: 'var(--mut-dim)' }}>
                          {tier.rate}
                        </span>
                      </div>
                    );
                  })}
                </div>

                {/* Special Notification Badges for Confidentiality or Provider Failover */}
                {f.confidential && (
                  <div
                    style={{
                      marginTop: 12,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                      padding: '8px 12px',
                      borderRadius: 8,
                      background: 'rgba(16, 185, 129, 0.1)',
                      border: '1px solid rgba(16, 185, 129, 0.3)',
                      fontSize: 12,
                      color: '#a7f3d0',
                    }}
                  >
                    <ShieldCheck size={14} color="#34d399" />
                    <span>
                      <strong>Confidential Mode Enforced:</strong> Repository privacy settings prevented any cloud API transmission.
                    </span>
                  </div>
                )}

                {f.outage && res.model?.includes('backup') && (
                  <div
                    style={{
                      marginTop: 12,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                      padding: '8px 12px',
                      borderRadius: 8,
                      background: 'rgba(245, 158, 11, 0.1)',
                      border: '1px solid rgba(245, 158, 11, 0.3)',
                      fontSize: 12,
                      color: '#fde68a',
                    }}
                  >
                    <RefreshCw size={14} color="#fbbf24" />
                    <span>
                      <strong>Provider Failover Active:</strong> Primary endpoint suffered an simulated outage; seamlessly switched to backup tier.
                    </span>
                  </div>
                )}
              </div>

              {/* Execution Activity Timeline */}
              <div className="box">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                  <span className="lab" style={{ margin: 0 }}>EXECUTION ACTIVITY TIMELINE</span>
                  <span style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--mut)' }}>
                    {res.steps?.length || 0} Telemetry Events
                  </span>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  {res.steps.map((s, i) => {
                    const [I, c, statusLabel, accentColor] = IC[s.k] || [Info, 'in', 'INFO', '#8b7cf6'];

                    return (
                      <div className="step" key={i}>
                        <div className={`step-icon-wrapper ${c}`}>
                          <I size={15} />
                        </div>
                        <div style={{ flex: 1 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2 }}>
                            <span
                              style={{
                                fontFamily: 'var(--font-mono)',
                                fontSize: 9.5,
                                color: accentColor,
                                background: `${accentColor}18`,
                                padding: '1px 6px',
                                borderRadius: 4,
                                fontWeight: 700,
                              }}
                            >
                              STEP {String(i + 1).padStart(2, '0')} · {statusLabel}
                            </span>
                          </div>
                          <span style={{ color: '#f1effa' }}>{s.t}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Human-in-the-Loop Pending Approvals Card Area */}
                {res.pending?.length > 0 && (
                  <div
                    style={{
                      marginTop: 20,
                      padding: '18px 20px',
                      borderRadius: 14,
                      background: 'rgba(245, 158, 11, 0.08)',
                      border: '1px solid rgba(245, 158, 11, 0.35)',
                      boxShadow: '0 8px 24px rgba(245, 158, 11, 0.15)',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8, color: '#fbbf24' }}>
                      <ShieldAlert size={18} />
                      <strong style={{ fontSize: 14, letterSpacing: '-0.01em' }}>
                        Actions Require Human Authorization
                      </strong>
                    </div>
                    <p style={{ fontSize: 13, color: '#e2e8f0', marginBottom: 14, lineHeight: 1.5 }}>
                      The agent identified potentially destructive modifications. In accordance with safety policies, prompt instructions cannot override this human approval gate.
                    </p>

                    <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                      {res.pending.map((n) => (
                        <button
                          key={n}
                          className="btn"
                          style={{
                            background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                            boxShadow: '0 4px 16px rgba(245, 158, 11, 0.3)',
                            fontSize: 13,
                            padding: '10px 18px',
                          }}
                          onClick={() => approve(n)}
                        >
                          <ShieldCheck size={16} />
                          <span>Authorize &amp; Execute: <strong>{n}</strong></span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </>
          )}

          {/* Empty State (when no task has been run yet) */}
          {!res && (
            <div
              className="box"
              style={{
                textAlign: 'center',
                padding: '48px 32px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                minHeight: '420px',
              }}
            >
              <div
                style={{
                  width: 64,
                  height: 64,
                  borderRadius: 20,
                  background: 'linear-gradient(135deg, rgba(139, 124, 246, 0.2), rgba(0, 242, 254, 0.15))',
                  border: '1px solid rgba(139, 124, 246, 0.4)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#6ee7ff',
                  boxShadow: '0 0 30px rgba(139, 124, 246, 0.25)',
                  marginBottom: 18,
                }}
              >
                <Cpu size={32} />
              </div>

              <span className="lab" style={{ color: '#00f2fe' }}>INTELLIGENCE SYSTEM STANDBY</span>
              <h3 style={{ fontSize: 24, fontWeight: 800, color: '#fff', marginBottom: 8, letterSpacing: '-0.02em' }}>
                Ready to Execute Your First Task
              </h3>
              <p style={{ color: 'var(--mut)', fontSize: 14.5, maxWidth: 500, lineHeight: 1.6, marginBottom: 28 }}>
                Run a task to see model routing, caching, failover, spending limits, and human approvals live in action. Try the same task twice to observe cached files cutting the token count to zero!
              </p>

              {/* Suggested Example Tasks */}
              <div style={{ width: '100%', maxWidth: 540 }}>
                <span
                  style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: 11,
                    letterSpacing: '0.1em',
                    color: 'var(--mut-dim)',
                    display: 'block',
                    marginBottom: 10,
                  }}
                >
                  CLICK AN EXAMPLE TASK TO LOAD:
                </span>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {EXAMPLE_TASKS.map((ex) => (
                    <button
                      key={ex.title}
                      type="button"
                      onClick={() => {
                        set('task', ex.task);
                        set('files', ex.files);
                      }}
                      style={{
                        padding: '12px 16px',
                        background: 'rgba(255, 255, 255, 0.03)',
                        border: '1px solid rgba(255, 255, 255, 0.08)',
                        borderRadius: 10,
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        cursor: 'pointer',
                        textAlign: 'left',
                        transition: 'all 0.2s ease',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = 'rgba(139, 124, 246, 0.12)';
                        e.currentTarget.style.borderColor = 'rgba(139, 124, 246, 0.4)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = 'rgba(255, 255, 255, 0.03)';
                        e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.08)';
                      }}
                    >
                      <div>
                        <strong style={{ fontSize: 13, color: '#fff', display: 'block' }}>{ex.title}</strong>
                        <span style={{ fontSize: 12, color: 'var(--mut)' }}>{ex.files}</span>
                      </div>
                      <span
                        style={{
                          fontFamily: 'var(--font-mono)',
                          fontSize: 10,
                          color: '#c4b5fd',
                          background: 'rgba(139, 124, 246, 0.15)',
                          padding: '3px 8px',
                          borderRadius: 6,
                          flex: 'none',
                        }}
                      >
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
