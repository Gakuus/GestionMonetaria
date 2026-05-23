'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { loginSchema } from '@/lib/validations/authSchema';
import type { LoginInput } from '@/lib/validations/authSchema';

const MAX_ATTEMPTS = 5;
const LOCKOUT_MS = 60_000;

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [attempts, setAttempts] = useState(0);
  const [lockedUntil, setLockedUntil] = useState<number | null>(null);
  const emailRef = useRef<HTMLInputElement>(null);
  const [lockoutCountdown, setLockoutCountdown] = useState(0);

  const isLocked = lockedUntil !== null && Date.now() < lockedUntil;

  useEffect(() => {
    if (!isLocked) { setLockoutCountdown(0); return; }
    const interval = setInterval(() => {
      const remaining = Math.ceil((lockedUntil! - Date.now()) / 1000);
      setLockoutCountdown(remaining);
      if (remaining <= 0) setLockedUntil(null);
    }, 1000);
    return () => clearInterval(interval);
  }, [lockedUntil, isLocked]);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError('');

    if (isLocked) {
      setError(`Demasiados intentos. Esperá ${lockoutCountdown}s`);
      return;
    }

    const form = new FormData(e.currentTarget);
    const data: LoginInput = {
      email: form.get('email') as string,
      password: form.get('password') as string,
    };

    const parsed = loginSchema.safeParse(data);
    if (!parsed.success) {
      setError(parsed.error.errors[0].message);
      return;
    }

    setLoading(true);
    try {
      await login(parsed.data.email, parsed.data.password);
      router.push('/');
    } catch {
      const newAttempts = attempts + 1;
      setAttempts(newAttempts);
      if (newAttempts >= MAX_ATTEMPTS) {
        setLockedUntil(Date.now() + LOCKOUT_MS);
        setAttempts(0);
        setError('Usuario o contraseña incorrectos.');
      } else {
        setError(`Email o contraseña incorrectos. Intento ${newAttempts}/${MAX_ATTEMPTS}`);
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-vh-100 d-flex align-items-center justify-content-center p-3 p-sm-4 position-relative overflow-hidden"
      style={{ background: '#0a0a1a' }}>
      {/* Animated gradient orbs */}
      <div className="position-absolute rounded-circle d-none d-sm-block"
        style={{
          width: 400, height: 400, top: '-10%', left: '-5%',
          background: 'radial-gradient(circle, rgba(59,130,246,0.15) 0%, transparent 70%)',
          animation: 'pulse 8s ease-in-out infinite',
        }} />
      <div className="position-absolute rounded-circle d-none d-sm-block"
        style={{
          width: 500, height: 500, bottom: '-15%', right: '-10%',
          background: 'radial-gradient(circle, rgba(139,92,246,0.12) 0%, transparent 70%)',
          animation: 'pulse 10s ease-in-out infinite reverse',
        }} />
      <div className="position-absolute rounded-circle d-none d-sm-block"
        style={{
          width: 300, height: 300, top: '40%', right: '20%',
          background: 'radial-gradient(circle, rgba(236,72,153,0.08) 0%, transparent 70%)',
          animation: 'pulse 12s ease-in-out infinite 2s',
        }} />

      <style>{`
        @keyframes pulse {
          0%, 100% { transform: scale(1) translate(0, 0); }
          50% { transform: scale(1.1) translate(20px, -20px); }
        }
      `}</style>

      {/* Glass card */}
      <div className="position-relative w-100 rounded-4 p-3 p-sm-5"
        style={{
          maxWidth: 440,
          background: 'rgba(255,255,255,0.04)',
          backdropFilter: 'blur(24px)',
          WebkitBackdropFilter: 'blur(24px)',
          border: '1px solid rgba(255,255,255,0.08)',
          boxShadow: '0 32px 64px rgba(0,0,0,0.4)',
        }}>
        {/* Logo */}
        <div className="text-center mb-4">
          <div className="d-inline-flex align-items-center justify-content-center rounded-3 mb-3"
            style={{
              width: 52, height: 52,
              background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)',
              boxShadow: '0 8px 24px rgba(59,130,246,0.25)',
            }}>
            <i className="bi bi-wallet2 text-white fs-4"></i>
          </div>
          <h4 className="fw-bold text-white mb-1">GestionMonetaria</h4>
          <p className="mb-0" style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.875rem' }}>
            Iniciar sesión
          </p>
        </div>

        {error && (
          <div className="d-flex align-items-center gap-2 px-3 py-2 small mb-3 rounded-3"
            style={{ background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.2)' }}>
            <i className="bi bi-exclamation-triangle-fill" style={{ color: '#ef4444' }}></i>
            <span style={{ color: '#fca5a5' }}>{error}</span>
            <button type="button" className="btn-close ms-auto" style={{ fontSize: 12, filter: 'invert(0.8)' }}
              onClick={() => setError('')} aria-label="Cerrar"></button>
          </div>
        )}

        <form onSubmit={handleSubmit} noValidate>
          <div className="mb-3">
            <label htmlFor="email" className="form-label small fw-medium mb-1"
              style={{ color: 'rgba(255,255,255,0.6)' }}>Email</label>
            <input
              ref={emailRef}
              id="email"
              name="email"
              type="email"
              className="form-control border-0 text-white w-100 px-3 py-2"
              placeholder="tu@email.com"
              required
              autoComplete="email"
              disabled={loading}
              style={{
                background: 'rgba(255,255,255,0.06)',
                borderRadius: '10px',
                outline: 'none',
                boxShadow: 'none',
                transition: 'background .2s, box-shadow .2s',
              }}
              onFocus={(e) => { e.target.style.background = 'rgba(255,255,255,0.1)'; e.target.style.boxShadow = '0 0 0 1.5px rgba(59,130,246,0.4)' }}
              onBlur={(e) => { e.target.style.background = 'rgba(255,255,255,0.06)'; e.target.style.boxShadow = 'none' }}
            />
          </div>

          <div className="mb-4">
            <div className="d-flex justify-content-between align-items-center mb-1">
              <label htmlFor="password" className="form-label small fw-medium mb-0"
                style={{ color: 'rgba(255,255,255,0.6)' }}>Contraseña</label>
              <Link href="/recover" className="small text-decoration-none"
                style={{ color: 'rgba(59,130,246,0.7)' }}>
                Olvidé mi contraseña
              </Link>
            </div>
            <div className="position-relative">
              <input
                id="password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                className="form-control border-0 text-white w-100 px-3 py-2"
                placeholder="••••••••"
                required
                autoComplete="current-password"
                disabled={loading}
                style={{
                  background: 'rgba(255,255,255,0.06)',
                  borderRadius: '10px',
                  outline: 'none',
                  boxShadow: 'none',
                  transition: 'background .2s, box-shadow .2s',
                  paddingRight: '40px',
                }}
                onFocus={(e) => { e.target.style.background = 'rgba(255,255,255,0.1)'; e.target.style.boxShadow = '0 0 0 1.5px rgba(59,130,246,0.4)' }}
                onBlur={(e) => { e.target.style.background = 'rgba(255,255,255,0.06)'; e.target.style.boxShadow = 'none' }}
              />
              <button type="button"
                className="position-absolute border-0 bg-transparent d-flex align-items-center justify-content-center"
                onClick={() => setShowPassword(!showPassword)}
                tabIndex={-1}
                aria-label={showPassword ? 'Ocultar' : 'Mostrar'}
                style={{ right: 6, top: '50%', transform: 'translateY(-50%)', width: 36, height: 36, color: 'rgba(255,255,255,0.35)', cursor: 'pointer', borderRadius: 8 }}>
                <i className={`bi bi-${showPassword ? 'eye-slash' : 'eye'}`}></i>
              </button>
            </div>
          </div>

          <button type="submit"
            className="btn w-100 py-2 fw-semibold border-0 d-flex align-items-center justify-content-center gap-2"
            disabled={loading || isLocked}
            style={{
              borderRadius: '10px',
              background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)',
              color: '#fff',
              boxShadow: '0 4px 16px rgba(59,130,246,0.3)',
              transition: 'opacity .2s, transform .1s',
            }}
            onMouseEnter={(e) => e.currentTarget.style.opacity = '0.9'}
            onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}>
            {loading ? <span className="spinner-border spinner-border-sm" role="status" /> : null}
            {loading ? 'Ingresando...' : 'Ingresar'}
          </button>
        </form>

        <div className="text-center mt-4">
          <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: '0.875rem' }}>
            ¿No tenés cuenta?{' '}
          </span>
          <Link href="/register" className="small fw-medium text-decoration-none"
            style={{ color: 'rgba(59,130,246,0.8)' }}>
            Crear cuenta
          </Link>
        </div>
      </div>
    </div>
  );
}
