'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';

export default function RecoverPage() {
  const { resetPassword } = useAuth();
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);

    const form = new FormData(e.currentTarget);
    const email = (form.get('email') as string || '').trim();

    // Always show success to prevent email enumeration
    try {
      await resetPassword(email);
    } catch {
      // Swallow — never reveal whether email exists
    } finally {
      setSent(true);
      setLoading(false);
    }
  }

  return (
    <div className="min-vh-100 d-flex align-items-center justify-content-center p-3 p-sm-4 position-relative overflow-hidden"
      style={{ background: '#0a0a1a' }}>
      <div className="position-absolute rounded-circle d-none d-sm-block"
        style={{ width: 400, height: 400, top: '-10%', left: '-5%', background: 'radial-gradient(circle, rgba(59,130,246,0.15) 0%, transparent 70%)', animation: 'pulse 8s ease-in-out infinite' }} />
      <div className="position-absolute rounded-circle d-none d-sm-block"
        style={{ width: 500, height: 500, bottom: '-15%', right: '-10%', background: 'radial-gradient(circle, rgba(139,92,246,0.12) 0%, transparent 70%)', animation: 'pulse 10s ease-in-out infinite reverse' }} />

      <style>{`
        @keyframes pulse {
          0%, 100% { transform: scale(1) translate(0, 0); }
          50% { transform: scale(1.1) translate(20px, -20px); }
        }
      `}</style>

      <div className="position-relative w-100 rounded-4 p-3 p-sm-5"
        style={{
          maxWidth: 440,
          background: 'rgba(255,255,255,0.04)',
          backdropFilter: 'blur(24px)',
          WebkitBackdropFilter: 'blur(24px)',
          border: '1px solid rgba(255,255,255,0.08)',
          boxShadow: '0 32px 64px rgba(0,0,0,0.4)',
        }}>
        <div className="text-center mb-4">
          <div className="d-inline-flex align-items-center justify-content-center rounded-3 mb-3"
            style={{ width: 52, height: 52, background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)', boxShadow: '0 8px 24px rgba(59,130,246,0.25)' }}>
            <i className="bi bi-wallet2 text-white fs-4"></i>
          </div>
          <h4 className="fw-bold text-white mb-1">GestionMonetaria</h4>
          <p className="mb-0" style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.875rem' }}>Recuperar contraseña</p>
        </div>

        {sent ? (
          <div className="d-flex align-items-start gap-3 px-3 py-3 small rounded-3"
            style={{ background: 'rgba(34,197,94,0.12)', border: '1px solid rgba(34,197,94,0.2)' }}>
            <i className="bi bi-check-circle-fill fs-5 mt-0" style={{ color: '#22c55e' }}></i>
            <div>
              <div className="fw-medium mb-1" style={{ color: '#86efac' }}>Email enviado</div>
              <span style={{ color: '#86efac' }}>Si existe una cuenta con ese email, recibirás instrucciones para recuperar tu contraseña.</span>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} noValidate>
            <div className="mb-4">
              <label htmlFor="email" className="form-label small fw-medium mb-1" style={{ color: 'rgba(255,255,255,0.6)' }}>Email</label>
              <input id="email" name="email" type="email" className="form-control border-0 w-100 px-3 py-2 text-white"
                placeholder="tu@email.com" required disabled={loading} autoComplete="email"
                style={{ background: 'rgba(255,255,255,0.06)', borderRadius: '10px', outline: 'none', boxShadow: 'none', transition: 'background .2s, box-shadow .2s' }}
                onFocus={(e) => { e.target.style.background = 'rgba(255,255,255,0.1)'; e.target.style.boxShadow = '0 0 0 1.5px rgba(59,130,246,0.4)' }}
                onBlur={(e) => { e.target.style.background = 'rgba(255,255,255,0.06)'; e.target.style.boxShadow = 'none' }} />
            </div>
            <button type="submit"
              className="btn w-100 py-2 fw-semibold border-0 d-flex align-items-center justify-content-center gap-2"
              disabled={loading}
              style={{ borderRadius: '10px', background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)', color: '#fff', boxShadow: '0 4px 16px rgba(59,130,246,0.3)', transition: 'opacity .2s' }}
              onMouseEnter={(e) => e.currentTarget.style.opacity = '0.9'}
              onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}>
              {loading ? <span className="spinner-border spinner-border-sm" role="status" /> : <i className="bi bi-send"></i>}
              {loading ? 'Enviando...' : 'Enviar instrucciones'}
            </button>
          </form>
        )}

        <div className="text-center mt-4">
          <Link href="/login" className="small fw-medium text-decoration-none"
            style={{ color: 'rgba(59,130,246,0.8)' }}>
            <i className="bi bi-arrow-left me-1"></i>Volver al inicio de sesión
          </Link>
        </div>
      </div>
    </div>
  );
}
