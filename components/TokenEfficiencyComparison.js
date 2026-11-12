'use client';

import { XCircle, CheckCircle2, FileText, Cpu, Wallet, Lock, ShieldAlert } from 'lucide-react';

const COMPARISON_ROWS = [
  {
    category: 'Context Ingestion',
    icon: FileText,
    traditionalTitle: 'Repeated File Re-reading',
    traditionalDesc: 'Re-ingests every file into context on every conversation turn (~800 tokens per file repeatedly charged).',
    tokenwiseTitle: 'Content-Aware Hash Caching',
    tokenwiseDesc: 'Caches read files in-memory per session. Repeated file inspections consume 0 tokens on cache hit.',
    metricTraditional: '800 tok / file / turn',
    metricTokenwise: '0 tok on hit',
  },
  {
    category: 'Model Selection',
    icon: Cpu,
    traditionalTitle: 'Flagship-Only Monolith',
    traditionalDesc: 'Dispatches all queries—even basic one-line fixes—to top-tier flagship cloud models at max pricing.',
    tokenwiseTitle: 'Intelligent Adaptive Router',
    tokenwiseDesc: 'Routes simple tasks to lightweight cloud models ($0.002/k), reserving flagship models ($0.01/k) for complex refactors.',
    metricTraditional: '$0.010+ per call',
    metricTokenwise: '$0.000 – $0.002 avg',
  },
  {
    category: 'Budget Governance',
    icon: Wallet,
    traditionalTitle: 'Unbounded Spending Runaway',
    traditionalDesc: 'Processes loops and extensive context until billing quotas are depleted or cards decline.',
    tokenwiseTitle: 'Pre-Flight Budget Enforcement',
    tokenwiseDesc: 'Validates cumulative user spend against a hard configurable limit prior to every API call. Stops instantly when reached.',
    metricTraditional: 'No hard cap',
    metricTokenwise: 'Hard user limit ($0.05+)',
  },
  {
    category: 'Code Confidentiality',
    icon: Lock,
    traditionalTitle: 'Uncontrolled Cloud Exfiltration',
    traditionalDesc: 'Transmits proprietary code and credentials to remote public cloud AI providers regardless of repository sensitivity.',
    tokenwiseTitle: 'Air-Gapped Confidential Mode',
    tokenwiseDesc: 'When toggled, prompt instructions cannot override: strictly forces execution to 100% local model (Ollama llama3.2).',
    metricTraditional: 'Public cloud only',
    metricTokenwise: '100% local execution ($0)',
  },
  {
    category: 'Operational Safety',
    icon: ShieldAlert,
    traditionalTitle: 'Autonomous Unchecked Writes',
    traditionalDesc: 'Agent automatically executes destructive file overwrites, bash commands, and git commits without warning.',
    tokenwiseTitle: 'Human-in-the-Loop Approval Gate',
    tokenwiseDesc: 'Reads are free and immediate. File writes, shell commands, and git pushes are intercepted for explicit human authorization.',
    metricTraditional: 'Auto-executes risks',
    metricTokenwise: 'Explicit 1-click approval',
  },
];

export default function TokenEfficiencyComparison() {
  return (
    <div style={{ margin: '48px 0 56px' }}>
      <div style={{ marginBottom: 24 }}>
        <span className="lab">EFFICIENCY ARCHITECTURE</span>
        <h2 style={{ fontSize: 'clamp(24px, 3.2vw, 36px)', fontWeight: 800, letterSpacing: '-0.02em', color: '#fff', marginBottom: 8 }}>
          Traditional Coding Agent <span style={{ color: 'var(--mut)', fontWeight: 400 }}>vs.</span> Tokenwise Agent
        </h2>
        <p style={{ color: 'var(--ink-secondary)', fontSize: 15, maxWidth: 680 }}>
          Designed specifically to address the major pain points of AI coding agents: skyrocketing token waste, vendor lock-in outages, runaway credit cards, and untracked code modifications.
        </p>
      </div>

      {/* Comparison Matrix Table */}
      <div
        style={{
          border: '1px solid rgba(139, 124, 246, 0.25)',
          borderRadius: 16,
          background: 'rgba(13, 11, 30, 0.75)',
          backdropFilter: 'blur(16px)',
          overflow: 'hidden',
          boxShadow: '0 16px 40px -10px rgba(0, 0, 0, 0.6)',
        }}
      >
        {/* Table Header */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1.1fr 1fr',
            borderBottom: '1px solid var(--ln)',
            background: 'rgba(20, 16, 45, 0.85)',
            padding: '16px 24px',
            fontFamily: 'var(--font-mono)',
            fontSize: 12,
            letterSpacing: '0.08em',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#ff7aa8' }}>
            <XCircle size={16} />
            <span>TRADITIONAL CODING AGENT (NAIVE)</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#5eead4' }}>
            <CheckCircle2 size={16} />
            <span>TOKENWISE AGENT (OPTIMIZED)</span>
          </div>
        </div>

        {/* Rows */}
        <div>
          {COMPARISON_ROWS.map((row, idx) => {
            const Icon = row.icon;
            return (
              <div
                key={row.category}
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1.1fr 1fr',
                  padding: '20px 24px',
                  borderTop: idx > 0 ? '1px solid var(--ln)' : 'none',
                  transition: 'background 0.2s ease',
                  position: 'relative',
                }}
              >
                {/* Traditional Side */}
                <div style={{ paddingRight: 24, borderRight: '1px solid var(--ln)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                    <span
                      style={{
                        fontFamily: 'var(--font-mono)',
                        fontSize: 10,
                        color: 'var(--mut)',
                        background: 'rgba(255, 255, 255, 0.05)',
                        padding: '2px 6px',
                        borderRadius: 4,
                      }}
                    >
                      {row.category}
                    </span>
                    <span style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: '#ff7aa8' }}>
                      {row.metricTraditional}
                    </span>
                  </div>
                  <h4 style={{ fontSize: 15, fontWeight: 700, color: '#e2e8f0', marginBottom: 4 }}>
                    {row.traditionalTitle}
                  </h4>
                  <p style={{ fontSize: 13, color: 'var(--mut)', lineHeight: 1.5 }}>
                    {row.traditionalDesc}
                  </p>
                </div>

                {/* Tokenwise Side */}
                <div style={{ paddingLeft: 24 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                    <div
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 4,
                        fontFamily: 'var(--font-mono)',
                        fontSize: 10,
                        color: '#5eead4',
                        background: 'rgba(16, 185, 129, 0.12)',
                        border: '1px solid rgba(16, 185, 129, 0.3)',
                        padding: '2px 8px',
                        borderRadius: 4,
                      }}
                    >
                      <Icon size={11} />
                      TOKENWISE ADVANTAGE
                    </div>
                    <span style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: '#5eead4', fontWeight: 600 }}>
                      {row.metricTokenwise}
                    </span>
                  </div>
                  <h4 style={{ fontSize: 15, fontWeight: 700, color: '#ffffff', marginBottom: 4 }}>
                    {row.tokenwiseTitle}
                  </h4>
                  <p style={{ fontSize: 13, color: 'var(--ink-secondary)', lineHeight: 1.5 }}>
                    {row.tokenwiseDesc}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
