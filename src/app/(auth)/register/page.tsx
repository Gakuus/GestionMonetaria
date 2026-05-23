'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { registerSchema } from '@/lib/validations/authSchema';
import type { RegisterInput } from '@/lib/validations/authSchema';

export default function RegisterPage() {
  const { register } = useAuth();
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const inputStyle = (loading: boolean): React.CSSProperties => ({
    background: 'rgba(255,255,255,0.06)',
    borderRadius: '10px',
    outline: 'none',
    boxShadow: 'none',
    transition: 'background .2s, box-shadow .2s',
    color: '#fff',
  });

  const inputFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    e.target.style.background = 'rgba(255,255,255,0.1)';
    e.target.style.boxShadow = '0 0 0 1.5px rgba(59,130,246,0.4)';
  };

  const inputBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    e.target.style.background = 'rgba(255,255,255,0.06)';
    e.target.style.boxShadow = 'none';
  };

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError('');
    setSuccess('');

    const form = new FormData(e.currentTarget);
    const data: RegisterInput = {
      full_name: form.get('full_name') as string,
      email: form.get('email') as string,
      password: form.get('password') as string,
      confirm_password: form.get('confirm_password') as string,
    };

    const parsed = registerSchema.safeParse(data);
    if (!parsed.success) {
      setError(parsed.error.errors[0].message);
      return;
    }

    setLoading(true);
    try {
      await register(parsed.data.email, parsed.data.password, parsed.data.full_name);
      setSuccess('Revisá tu email para verificar la cuenta');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al registrarse');
    } finally {
      setLoading(false);
    }
  }

  function PasswordToggle({ show, onClick }: { show: boolean; onClick: () => void }) {
    return (
      <button type="button" className="position-absolute border-0 bg-transparent d-flex align-items-center justify-content-center"
        onClick={onClick} tabIndex={-1}
        aria-label={show ? 'Ocultar' : 'Mostrar'}
        style={{ right: 6, top: '50%', transform: 'translateY(-50%)', width: 36, height: 36, color: 'rgba(255,255,255,0.35)', cursor: 'pointer', borderRadius: 8 }}>
        <i className={`bi bi-${show ? 'eye-slash' : 'eye'}`}></i>
      </button>
    );
  }

  return (
    <div className="min-vh-100 d-flex align-items-center justify-content-center p-3 p-sm-4 position-relative overflow-hidden"
      style={{ background: '#0a0a1a' }}>
      <div className="position-absolute rounded-circle d-none d-sm-block"
        style={{ width: 400, height: 400, top: '-10%', left: '-5%', background: 'radial-gradient(circle, rgba(59,130,246,0.15) 0%, transparent 70%)', animation: 'pulse 8s ease-in-out infinite' }} />
      <div className="position-absolute rounded-circle d-none d-sm-block"
        style={{ width: 500, height: 500, bottom: '-15%', right: '-10%', background: 'radial-gradient(circle, rgba(139,92,246,0.12) 0%, transparent 70%)', animation: 'pulse 10s ease-in-out infinite reverse' }} />
      <div className="position-absolute rounded-circle d-none d-sm-block"
        style={{ width: 300, height: 300, top: '40%', right: '20%', background: 'radial-gradient(circle, rgba(236,72,153,0.08) 0%, transparent 70%)', animation: 'pulse 12s ease-in-out infinite 2s' }} />

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
          <p className="mb-0" style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.875rem' }}>Crear cuenta</p>
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
        {success && (
          <div className="d-flex align-items-center gap-2 px-3 py-2 small mb-3 rounded-3"
            style={{ background: 'rgba(34,197,94,0.12)', border: '1px solid rgba(34,197,94,0.2)' }}>
            <i className="bi bi-check-circle-fill" style={{ color: '#22c55e' }}></i>
            <span style={{ color: '#86efac' }}>{success}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} noValidate>
          <div className="mb-3">
            <label htmlFor="full_name" className="form-label small fw-medium mb-1" style={{ color: 'rgba(255,255,255,0.6)' }}>Nombre</label>
            <input id="full_name" name="full_name" type="text" className="form-control border-0 w-100 px-3 py-2"
              placeholder="Tu nombre" required disabled={loading} autoComplete="name"
              style={inputStyle(loading)} onFocus={inputFocus} onBlur={inputBlur} />
          </div>

          <div className="mb-3">
            <label htmlFor="email" className="form-label small fw-medium mb-1" style={{ color: 'rgba(255,255,255,0.6)' }}>Email</label>
            <input id="email" name="email" type="email" className="form-control border-0 w-100 px-3 py-2"
              placeholder="tu@email.com" required disabled={loading} autoComplete="email"
              style={inputStyle(loading)} onFocus={inputFocus} onBlur={inputBlur} />
          </div>

          <div className="mb-3">
            <label htmlFor="password" className="form-label small fw-medium mb-1" style={{ color: 'rgba(255,255,255,0.6)' }}>Contraseña</label>
            <div className="position-relative">
              <input id="password" name="password" type={showPassword ? 'text' : 'password'}
                className="form-control border-0 w-100 px-3 py-2" placeholder="Mínimo 8 caracteres"
                required disabled={loading} autoComplete="new-password"
                style={{ ...inputStyle(loading), paddingRight: 40 }} onFocus={inputFocus} onBlur={inputBlur} />
              <PasswordToggle show={showPassword} onClick={() => setShowPassword(!showPassword)} />
            </div>
          </div>

          <div className="mb-4">
            <label htmlFor="confirm_password" className="form-label small fw-medium mb-1" style={{ color: 'rgba(255,255,255,0.6)' }}>Confirmar contraseña</label>
            <div className="position-relative">
              <input id="confirm_password" name="confirm_password" type={showConfirm ? 'text' : 'password'}
                className="form-control border-0 w-100 px-3 py-2" placeholder="Repetí la contraseña"
                required disabled={loading} autoComplete="new-password"
                style={{ ...inputStyle(loading), paddingRight: 40 }} onFocus={inputFocus} onBlur={inputBlur} />
              <PasswordToggle show={showConfirm} onClick={() => setShowConfirm(!showConfirm)} />
            </div>
          </div>

          <button type="submit"
            className="btn w-100 py-2 fw-semibold border-0 d-flex align-items-center justify-content-center gap-2"
            disabled={loading}
            style={{ borderRadius: '10px', background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)', color: '#fff', boxShadow: '0 4px 16px rgba(59,130,246,0.3)', transition: 'opacity .2s' }}
            onMouseEnter={(e) => e.currentTarget.style.opacity = '0.9'}
            onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}>
            {loading ? <span className="spinner-border spinner-border-sm" role="status" /> : null}
            {loading ? 'Registrando...' : 'Crear cuenta'}
          </button>
        </form>

        <div className="text-center mt-4">
          <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: '0.875rem' }}>
            ¿Ya tenés cuenta?{' '}
          </span>
          <Link href="/login" className="small fw-medium text-decoration-none"
            style={{ color: 'rgba(59,130,246,0.8)' }}>
            Iniciar sesión
          </Link>
        </div>
      </div>
    </div>
  );
}
