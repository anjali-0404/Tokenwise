'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Code2,
  Mail,
  Lock,
  Loader2,
  ArrowRight,
  Eye,
  EyeOff,
  ShieldCheck,
  Zap,
  Database,
  ArrowLeft,
  Sparkles,
  CheckCircle2,
} from 'lucide-react';

export default function AuthCard({ mode }) {
  const r = useRouter();
  const su = mode === 'signup';
  const [e, setE] = useState('');
  const [p, setP] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [er, setEr] = useState('');
  const [ld, setLd] = useState(false);

  async function go(ev) {
    ev.preventDefault();
    setEr('');
    setLd(true);
    try {
      const x = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mode, email: e, password: p }),
      });
      const j = await x.json();
      if (!x.ok) throw new Error(j.error);
      localStorage.setItem('tw_user', j.email);
      r.push('/dashboard');
    } catch (k) {
      setEr(k.message);
    }
    setLd(false);
  }

  return (
    <div className="auth">
      {/* Return to Landing Link */}
      <div style={{ position: 'absolute', top: 24, left: 24, zIndex: 30 }}>
        <Link
          href="/"
          className="pill"
          style={{ background: 'rgba(255, 255, 255, 0.05)', borderColor: 'rgba(255, 255, 255, 0.15)', color: '#fff' }}
        >
          <ArrowLeft size={12} />
          <span>BACK TO HOME</span>
        </Link>
      </div>

      <div className="auth-split">
        {/* Left Side: Product Showcase & Intelligence Visual */}
        <div className="auth-showcase">
          <div>
            <div className="brand" style={{ marginBottom: 28 }}>
              <div className="brand-icon-wrapper">
                <Code2 size={20} color="#00f2fe" />
              </div>
              <span>TOKENWISE AGENT</span>
            </div>

            <span
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: 10,
                color: '#00f2fe',
                background: 'rgba(0, 242, 254, 0.1)',
                border: '1px solid rgba(0, 242, 254, 0.25)',
                padding: '3px 8px',
                borderRadius: 4,
                letterSpacing: '0.08em',
              }}
            >
              AUTONOMOUS CODING HARNESS
            </span>

            <h1 className="auth-showcase-title">
              Frugal AI Engineering on the <span className="pk">Fewest Tokens</span>
            </h1>

            <p className="auth-showcase-desc">
              Stop bleeding API credits on redundant file reading and unchecked flagship models. Tokenwise equips you with deterministic caching, adaptive model routing, and human-in-the-loop safeguards.
            </p>

            <div className="auth-benefit-list">
              <div className="auth-benefit-item">
                <Database size={16} className="auth-benefit-icon" />
                <span>
                  <strong>Context-Aware Caching:</strong> Repeat file inspections cost 0 tokens.
                </span>
              </div>
              <div className="auth-benefit-item">
                <Zap size={16} className="auth-benefit-icon" style={{ color: '#8b7cf6' }} />
                <span>
                  <strong>Adaptive Tiering:</strong> Lightweight models for simple fixes; flagship for heavy logic.
                </span>
              </div>
              <div className="auth-benefit-item">
                <ShieldCheck size={16} className="auth-benefit-icon" style={{ color: '#10b981' }} />
                <span>
                  <strong>Air-Gapped Confidentiality:</strong> Sensitive repos execute 100% locally on Ollama.
                </span>
              </div>
            </div>
          </div>

          {/* Hackathon Specs Badge */}
          <div
            style={{
              paddingTop: 24,
              borderTop: '1px solid var(--ln)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              fontSize: 11,
              fontFamily: 'var(--font-mono)',
              color: 'var(--mut)',
            }}
          >
            <span>GLOBAL AI HACKATHON 2026</span>
            <span style={{ color: '#5eead4' }}>BIFROST + TAVILY READY</span>
          </div>
        </div>

        {/* Right Side: Authentication Form */}
        <div className="card">
          <div style={{ marginBottom: 20 }}>
            <span className="lab" style={{ fontSize: 10 }}>DEVELOPER AUTHENTICATION</span>
            <h2>{su ? 'Create your workspace' : 'Welcome back'}</h2>
            <p>
              {su
                ? 'Register an account to enforce spending limits, test model failover, and manage approvals.'
                : 'Sign in to access your active coding sessions and execution telemetry.'}
            </p>
          </div>

          <form onSubmit={go}>
            {/* Email Field */}
            <label htmlFor="e">
              <Mail size={12} /> Work Email
            </label>
            <div className="input-with-icon">
              <span className="input-icon-prefix">
                <Mail size={16} />
              </span>
              <input
                id="e"
                type="email"
                required
                value={e}
                onChange={(x) => setE(x.target.value)}
                placeholder="developer@team.io"
                autoComplete="email"
              />
            </div>

            {/* Password Field */}
            <label htmlFor="p" style={{ marginTop: 16 }}>
              <Lock size={12} /> Password (6+ characters)
            </label>
            <div className="input-with-icon">
              <span className="input-icon-prefix">
                <Lock size={16} />
              </span>
              <input
                id="p"
                type={showPassword ? 'text' : 'password'}
                required
                minLength={6}
                value={p}
                onChange={(x) => setP(x.target.value)}
                placeholder="••••••••••••"
                autoComplete={su ? 'new-password' : 'current-password'}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: 'absolute',
                  right: 12,
                  background: 'none',
                  border: 'none',
                  color: 'var(--mut)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  padding: 4,
                }}
                title={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>

            {/* Error Message */}
            {er && (
              <div className="err" role="alert">
                <span>{er}</span>
              </div>
            )}

            {/* Submit Button */}
            <button
              className="btn"
              style={{
                width: '100%',
                justifyContent: 'center',
                marginTop: 24,
                padding: '14px',
              }}
              disabled={ld}
            >
              {ld ? (
                <>
                  <Loader2 size={16} className="spin" />
                  <span>Verifying Credentials...</span>
                </>
              ) : (
                <>
                  <span>{su ? 'Create Workspace Account' : 'Sign in to Dashboard'}</span>
                  <ArrowRight size={16} />
                </>
              )}
            </button>
          </form>

          {/* Mode Switcher */}
          <div
            style={{
              marginTop: 24,
              paddingTop: 18,
              borderTop: '1px solid var(--ln)',
              textAlign: 'center',
              fontSize: 13,
              color: 'var(--mut)',
            }}
          >
            {su ? (
              <span>
                Already have an account?{' '}
                <Link href="/login" className="pk" style={{ fontWeight: 600 }}>
                  Sign in here
                </Link>
              </span>
            ) : (
              <span>
                New to Tokenwise?{' '}
                <Link href="/signup" className="pk" style={{ fontWeight: 600 }}>
                  Create an account
                </Link>
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
