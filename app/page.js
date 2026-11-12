'use client';

import dynamic from 'next/dynamic';
import Link from 'next/link';
import {
  Code2,
  ShieldCheck,
  Wallet,
  RefreshCw,
  Lock,
  ArrowRight,
  Cpu,
  Database,
  GitFork,
  Activity,
  Terminal,
  Zap,
  Layers,
  ChevronRight,
  Sparkles,
} from 'lucide-react';
import WorkflowPipeline from '../components/WorkflowPipeline';
import TokenEfficiencyComparison from '../components/TokenEfficiencyComparison';

// Dynamic import for Three.js scene (no SSR)
const Hero3D = dynamic(() => import('../components/Hero3D'), {
  ssr: false,
  loading: () => (
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'rgba(10, 8, 25, 0.7)',
        borderRadius: 24,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: '#8b7cf6', fontSize: 13, fontFamily: 'var(--font-mono)' }}>
        <Activity size={18} className="spin" />
        INITIALIZING INTELLIGENCE CORE...
      </div>
    </div>
  ),
});

// Guaranteed Core Architectural Pillars (preserving exact existing items)
const R = [
  [
    RefreshCw,
    'Reliability & Provider Failover',
    'Keeps working through provider outages and rate limits without losing the session, and tells you when another model takes over.',
    'BIFROST COMPATIBLE',
  ],
  [
    Wallet,
    'Strict Budget Management',
    'Enforces a spending limit per user before every model call, with a clear stop when the limit is reached.',
    'HARD CAP ENFORCEMENT',
  ],
  [
    Lock,
    'Confidential Code Privacy',
    'Repositories marked confidential go to local models only, whatever the prompt says.',
    'AIR-GAPPED OLLAMA',
  ],
  [
    ShieldCheck,
    'Human Action Approval',
    'Reads are free. Writes, shell commands and Git operations wait for your approval. Prompts cannot override this.',
    'STRICT AUDIT GATE',
  ],
];

// The 6 High-Impact Features
const ALL_FEATURES = [
  {
    icon: GitFork,
    title: 'Intelligent Model Routing',
    desc: 'Analyzes prompt length and cognitive demand. Routes simple fixes to lightweight models and deep refactors to flagship models.',
    tag: 'DYNAMIC DISPATCH',
  },
  {
    icon: Database,
    title: 'Context-Aware File Caching',
    desc: 'In-memory file hashing ensures previously inspected files cost 0 tokens on subsequent turns, drastically reducing context bloat.',
    tag: 'HASH DEDUPLICATION',
  },
  {
    icon: RefreshCw,
    title: 'Provider Failover',
    desc: 'Simulate or endure real provider downtime. Automatically falls back to secondary cloud providers without losing user state.',
    tag: 'ZERO DOWNTIME',
  },
  {
    icon: Wallet,
    title: 'Budget Governance',
    desc: 'Pre-flight check blocks calls exceeding your preset spending cap, giving you complete visibility and zero surprise bills.',
    tag: 'REAL-TIME TRACKING',
  },
  {
    icon: Lock,
    title: 'Confidential Repository Protection',
    desc: 'Locks execution to local Ollama (llama3.2). Code never touches external APIs, guaranteeing total air-gapped security.',
    tag: 'ZERO DATA EXFILTRATION',
  },
  {
    icon: ShieldCheck,
    title: 'Human Approval Gates',
    desc: 'Interception layer halts destructive actions—file writes, shell execution, git commits—until explicitly approved by you.',
    tag: 'SAFE RUNTIME',
  },
];

export default function P() {
  return (
    <>
      {/* Top accent light bar */}
      <div className="top" />

      <div className="w">
        {/* Navigation Bar */}
        <nav>
          <div className="brand">
            <div className="brand-icon-wrapper">
              <Code2 size={20} color="#00f2fe" />
            </div>
            <span>TOKENWISE AGENT</span>
            <span className="brand-badge">HACKATHON EDITION</span>
          </div>
          <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
            <Link href="/login" className="pill">
              SIGN IN
            </Link>
            <Link
              href="/signup"
              className="pill"
              style={{
                background: 'linear-gradient(135deg, rgba(139, 124, 246, 0.25), rgba(255, 61, 154, 0.2))',
                borderColor: 'rgba(139, 124, 246, 0.6)',
                color: '#fff',
              }}
            >
              LAUNCH AGENT <ArrowRight size={12} />
            </Link>
          </div>
        </nav>

        {/* Hero Section */}
        <section className="hero">
          <div className="hero-content">
            <div className="tag-banner">
              <span className="live-beacon" />
              <span className="tag-banner-text">GLOBAL AI HACKATHON · AI AGENTS &amp; INTELLIGENT SYSTEMS</span>
            </div>

            <h1>
              A coding agent that gets the job done on the{' '}
              <span className="pk">fewest tokens</span>
            </h1>

            <p className="lead">
              It caches files it has already read, sends simple tasks to smaller models,
              switches providers when one goes down, and asks before it changes anything.
            </p>

            <div className="hero-actions">
              <Link href="/signup" className="btn">
                <span>Start building</span>
                <ArrowRight size={16} />
              </Link>
              <Link href="/login" className="btn g">
                Sign in to workspace
              </Link>
            </div>

            {/* Quick architectural proof points */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(3, 1fr)',
                gap: '12px',
                marginTop: '36px',
                paddingTop: '24px',
                borderTop: '1px solid var(--ln)',
              }}
            >
              <div>
                <span style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: 'var(--mut)', display: 'block' }}>
                  CONTEXT CACHING
                </span>
                <strong style={{ fontSize: '18px', color: '#5eead4', fontWeight: 800 }}>0 Tokens</strong>
                <span style={{ fontSize: '12px', color: 'var(--mut-dim)', display: 'block' }}>on repeat reads</span>
              </div>
              <div>
                <span style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: 'var(--mut)', display: 'block' }}>
                  ADAPTIVE TIERING
                </span>
                <strong style={{ fontSize: '18px', color: '#a78bfa', fontWeight: 800 }}>Sub-cent</strong>
                <span style={{ fontSize: '12px', color: 'var(--mut-dim)', display: 'block' }}>for simple tasks</span>
              </div>
              <div>
                <span style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: 'var(--mut)', display: 'block' }}>
                  CONFIDENTIAL MODE
                </span>
                <strong style={{ fontSize: '18px', color: '#ff76b8', fontWeight: 800 }}>100% Local</strong>
                <span style={{ fontSize: '12px', color: 'var(--mut-dim)', display: 'block' }}>zero cloud egress</span>
              </div>
            </div>
          </div>

          {/* 3D Interactive Core Visualizer */}
          <div className="stage">
            <Hero3D />
          </div>
        </section>

        {/* Section C: Interactive Workflow Pipeline */}
        <WorkflowPipeline />

        {/* Section D: Token Efficiency Comparison Table */}
        <TokenEfficiencyComparison />

        {/* Section E: 6 Comprehensive Feature Cards */}
        <div style={{ margin: '36px 0 20px' }}>
          <span className="lab">INTELLIGENT CAPABILITIES</span>
          <h2 style={{ fontSize: 'clamp(24px, 3.2vw, 36px)', fontWeight: 800, letterSpacing: '-0.02em', color: '#fff', marginBottom: 12 }}>
            Engineered for Token Frugality &amp; Developer Safety
          </h2>
          <p style={{ color: 'var(--ink-secondary)', fontSize: 15, maxWidth: 650, marginBottom: 28 }}>
            Every component in Tokenwise works collectively to minimize API consumption, enforce strict financial boundaries, and protect your local codebase.
          </p>

          <div className="features-grid">
            {ALL_FEATURES.map((feat) => {
              const Icon = feat.icon;
              return (
                <div className="feature-card" key={feat.title}>
                  <div className="feature-card-header">
                    <div className="feature-card-icon">
                      <Icon size={20} />
                    </div>
                    <span className="feature-pill">{feat.tag}</span>
                  </div>
                  <h3>{feat.title}</h3>
                  <p>{feat.desc}</p>
                </div>
              );
            })}
          </div>
        </div>

        {/* What It Guarantees (Preserving exact original items with elevated visual presentation) */}
        <div style={{ margin: '48px 0 32px' }}>
          <span className="lab">WHAT IT GUARANTEES</span>
          <div className="grid4">
            {R.map(([I, t, d, badge]) => (
              <div className="req" key={t}>
                <div className="req-icon-box">
                  <I size={20} />
                </div>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                    <b>{t}</b>
                    {badge && (
                      <span
                        style={{
                          fontFamily: 'var(--font-mono)',
                          fontSize: 9,
                          color: '#a78bfa',
                          background: 'rgba(139, 124, 246, 0.15)',
                          padding: '1px 6px',
                          borderRadius: 4,
                          fontWeight: 600,
                        }}
                      >
                        {badge}
                      </span>
                    )}
                  </div>
                  <span>{d}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Expected Outcome Box */}
        <div className="box" style={{ margin: '32px 0 48px', borderLeft: '4px solid #ff3d9a' }}>
          <span className="lab" style={{ color: '#ff3d9a' }}>EXPECTED OUTCOME</span>
          <p style={{ fontSize: 15, color: '#f1effa', lineHeight: 1.7, margin: 0 }}>
            Successful task completion, lower token use, reliable model failover, enforced spending limits, and secure execution of development operations.
          </p>
        </div>

        {/* Footer (Preserving exact hackathon info) */}
        <footer className="foot">
          <div className="foot-items">
            <span>BUILD <b>1–15 NOV 2026</b></span>
            <span>TEAM <b>1–4</b></span>
            <span>FORMAT <b>ONLINE · GLOBAL</b></span>
            <span>JUDGING <b>29 NOV 2026</b></span>
            <span>INTEGRATE <b>BIFROST + TAVILY</b></span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#5eead4' }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#5eead4', boxShadow: '0 0 8px #5eead4' }} />
            <span>SYSTEM READY · TOKENWISE AGENT v1.0</span>
          </div>
        </footer>
      </div>
    </>
  );
}
