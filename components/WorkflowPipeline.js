'use client';

import { useState } from 'react';
import { Terminal, Database, GitFork, Cpu, ShieldAlert, ArrowRight, CheckCircle2 } from 'lucide-react';

const WORKFLOW_STEPS = [
  {
    id: 'task',
    number: '01',
    name: 'USER TASK',
    title: 'Developer Task Input',
    short: 'Task + target files defined',
    icon: Terminal,
    color: '#38bdf8',
    details: 'You provide a natural-language engineering task, specify candidate files, and set an optional hard budget limit ($ USD).',
    badge: 'ENTRY POINT',
  },
  {
    id: 'cache',
    number: '02',
    name: 'CONTEXT CACHE',
    title: 'Content-Aware File Caching',
    short: 'Hits cost 0 tokens',
    icon: Database,
    color: '#00f2fe',
    details: 'Previously read files are served from memory. If a file was read in an earlier turn, Tokenwise consumes 0 tokens instead of re-reading 800 tokens per file.',
    badge: 'ZERO-WASTE',
  },
  {
    id: 'router',
    number: '03',
    name: 'MODEL ROUTER',
    title: 'Adaptive Complexity Tiering',
    short: 'Local / Small / Big / Backup',
    icon: GitFork,
    color: '#8b7cf6',
    details: 'Simple tasks (<90 chars without heavy refactoring) route to high-speed, low-cost models ($0.002/k). Complex logic routes to sonnet-class models. Confidential repos automatically lock to free local Ollama.',
    badge: 'SMART TIERING',
  },
  {
    id: 'execution',
    number: '04',
    name: 'AI EXECUTION',
    title: 'Protected Execution & Failover',
    short: 'Outage failover + budget check',
    icon: Cpu,
    color: '#ff3d9a',
    details: 'Budget is validated before the call. If the primary provider suffers an outage, Tokenwise automatically fails over to the backup mid-tier provider without dropping session context.',
    badge: 'RESILIENT',
  },
  {
    id: 'approval',
    number: '05',
    name: 'APPROVAL GATE',
    title: 'Human-in-the-Loop Safeguard',
    short: 'Writes & scripts paused for you',
    icon: ShieldAlert,
    color: '#10b981',
    details: 'Read-only inspections finish automatically. Destructive changes—file writes, shell commands, and Git operations—are intercepted and require your explicit one-click approval.',
    badge: 'SECURITY GATE',
  },
];

export default function WorkflowPipeline() {
  const [activeStep, setActiveStep] = useState(1); // Default to Context Cache (step index 1)

  const current = WORKFLOW_STEPS[activeStep];

  return (
    <div style={{ margin: '36px 0 54px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 20 }}>
        <div>
          <span className="lab">INTELLIGENT PIPELINE</span>
          <h2 style={{ fontSize: 'clamp(24px, 3.2vw, 36px)', fontWeight: 800, letterSpacing: '-0.02em', color: '#fff' }}>
            From Prompt to Verified Execution
          </h2>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--mut)' }}>
          <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#00f2fe', display: 'inline-block' }} />
          <span>Interactive: click or hover any stage</span>
        </div>
      </div>

      {/* Pipeline Navigation Bar */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(5, 1fr)',
          gap: '8px',
          background: 'rgba(12, 10, 28, 0.75)',
          padding: '8px',
          borderRadius: '16px',
          border: '1px solid rgba(139, 124, 246, 0.25)',
          boxShadow: '0 10px 30px -10px rgba(0, 0, 0, 0.5)',
          overflowX: 'auto',
        }}
      >
        {WORKFLOW_STEPS.map((step, idx) => {
          const isSelected = activeStep === idx;
          const Icon = step.icon;

          return (
            <button
              key={step.id}
              onClick={() => setActiveStep(idx)}
              onMouseEnter={() => setActiveStep(idx)}
              style={{
                background: isSelected
                  ? `linear-gradient(135deg, ${step.color}25, rgba(20, 16, 48, 0.8))`
                  : 'transparent',
                border: isSelected
                  ? `1px solid ${step.color}`
                  : '1px solid transparent',
                borderRadius: '12px',
                padding: '12px 10px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                textAlign: 'center',
                cursor: 'pointer',
                transition: 'all 0.25s ease',
                position: 'relative',
                boxShadow: isSelected ? `0 0 20px ${step.color}33` : 'none',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: 34,
                  height: 34,
                  borderRadius: 10,
                  background: isSelected ? step.color : 'rgba(255, 255, 255, 0.05)',
                  color: isSelected ? '#000' : step.color,
                  marginBottom: 8,
                  transition: 'all 0.2s ease',
                }}
              >
                <Icon size={18} />
              </div>
              <span
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: 10,
                  color: isSelected ? step.color : 'var(--mut-dim)',
                  fontWeight: 700,
                  letterSpacing: '0.08em',
                }}
              >
                {step.number}
              </span>
              <span
                style={{
                  fontSize: 12,
                  fontWeight: 700,
                  color: isSelected ? '#fff' : 'var(--ink-secondary)',
                  marginTop: 2,
                }}
              >
                {step.name}
              </span>
            </button>
          );
        })}
      </div>

      {/* Selected Stage Detail Card */}
      <div
        className="box"
        style={{
          marginTop: '16px',
          borderColor: current.color,
          boxShadow: `0 14px 40px -10px rgba(0, 0, 0, 0.6), 0 0 35px ${current.color}22`,
          display: 'grid',
          gridTemplateColumns: '1.2fr 0.8fr',
          gap: '24px',
          alignItems: 'center',
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
            <span
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: 11,
                color: current.color,
                background: `${current.color}18`,
                border: `1px solid ${current.color}44`,
                padding: '3px 9px',
                borderRadius: 6,
                fontWeight: 700,
              }}
            >
              STAGE {current.number} · {current.badge}
            </span>
          </div>
          <h3 style={{ fontSize: 22, fontWeight: 800, color: '#fff', marginBottom: 10 }}>
            {current.title}
          </h3>
          <p style={{ color: 'var(--ink-secondary)', fontSize: 14.5, lineHeight: 1.7, maxWidth: 600 }}>
            {current.details}
          </p>
        </div>

        {/* Visual schematic for current step */}
        <div
          style={{
            background: 'rgba(8, 7, 20, 0.75)',
            border: `1px solid ${current.color}33`,
            borderRadius: 12,
            padding: '16px 20px',
            fontFamily: 'var(--font-mono)',
            fontSize: 12,
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--mut)', marginBottom: 12, borderBottom: '1px solid var(--ln)', paddingBottom: 8 }}>
            <span>TELEMETRY STATE</span>
            <span style={{ color: current.color, fontWeight: 700 }}>VERIFIED</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, color: '#e2e8f0' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--mut)' }}>Stage Action:</span>
              <span style={{ color: '#fff', fontWeight: 600 }}>{current.name}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--mut)' }}>Token Overhead:</span>
              <span style={{ color: current.color, fontWeight: 600 }}>
                {activeStep === 1 ? '0 Tokens (on hit)' : activeStep === 2 ? 'Tier-Optimized' : 'Governed'}
              </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--mut)' }}>Security Policy:</span>
              <span style={{ color: '#5eead4' }}>Strict Enforced</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
