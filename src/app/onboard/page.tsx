'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useHousehold } from '@/context/HouseholdContext';

export default function OnboardPage() {
  const router = useRouter();
  const { household, loading, createHousehold, refresh } = useHousehold();
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    if (!loading && household) {
      router.replace('/dashboard');
    }
  }, [household, loading, router]);

  if (loading) {
    return (
      <div className="min-vh-100 d-flex align-items-center justify-content-center" style={{ background: '#0a0a1a' }}>
        <div className="spinner-border" style={{ color: '#3b82f6' }} role="status" />
      </div>
    );
  }

  if (household) return null;

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError('');

    if (!name.trim()) {
      setError('El nombre del hogar es obligatorio');
      return;
    }

    setCreating(true);
    try {
      await createHousehold(name.trim());
      await refresh();
      router.push('/dashboard');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al crear el hogar');
    } finally {
      setCreating(false);
    }
  }

  return (
    <div className="min-vh-100 d-flex align-items-center justify-content-center p-4 position-relative overflow-hidden"
      style={{ background: '#0a0a1a' }}>
      <div className="position-absolute rounded-circle"
        style={{ width: 400, height: 400, top: '-10%', left: '-5%', background: 'radial-gradient(circle, rgba(59,130,246,0.15) 0%, transparent 70%)', animation: 'pulse 8s ease-in-out infinite' }} />
      <div className="position-absolute rounded-circle"
        style={{ width: 500, height: 500, bottom: '-15%', right: '-10%', background: 'radial-gradient(circle, rgba(139,92,246,0.12) 0%, transparent 70%)', animation: 'pulse 10s ease-in-out infinite reverse' }} />

      <style>{`
        @keyframes pulse {
          0%, 100% { transform: scale(1) translate(0, 0); }
          50% { transform: scale(1.1) translate(20px, -20px); }
        }
      `}</style>

      <div className="position-relative w-100 rounded-4 p-4 p-md-5 text-center"
        style={{
          maxWidth: 440,
          background: 'rgba(255,255,255,0.04)',
          backdropFilter: 'blur(24px)',
          WebkitBackdropFilter: 'blur(24px)',
          border: '1px solid rgba(255,255,255,0.08)',
          boxShadow: '0 32px 64px rgba(0,0,0,0.4)',
        }}>
        <div className="d-inline-flex align-items-center justify-content-center rounded-3 mb-4"
          style={{ width: 64, height: 64, background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)', boxShadow: '0 8px 24px rgba(59,130,246,0.25)' }}>
          <i className="bi bi-house-heart text-white fs-3"></i>
        </div>
        <h4 className="fw-bold text-white mb-2">¡Bienvenido!</h4>
        <p className="mb-4" style={{ color: 'rgba(255,255,255,0.4)', lineHeight: 1.6, fontSize: '0.9rem' }}>
          Para empezar, creá un hogar o pedile a alguien que te invite por email.
        </p>

        {error && (
          <div className="d-flex align-items-center gap-2 px-3 py-2 small mb-3 rounded-3 text-start"
            style={{ background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.2)' }}>
            <i className="bi bi-exclamation-triangle-fill" style={{ color: '#ef4444' }}></i>
            <span style={{ color: '#fca5a5' }}>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="mb-3 text-start">
            <label htmlFor="householdName" className="form-label small fw-medium mb-1"
              style={{ color: 'rgba(255,255,255,0.6)' }}>Nombre del hogar</label>
            <input id="householdName" type="text" className="form-control border-0 w-100 px-3 py-2 text-white"
              placeholder="Ej: Casa Rodríguez" value={name} onChange={(e) => setName(e.target.value)}
              required disabled={creating}
              style={{ background: 'rgba(255,255,255,0.06)', borderRadius: '10px', outline: 'none', boxShadow: 'none', transition: 'background .2s, box-shadow .2s' }}
              onFocus={(e) => { e.target.style.background = 'rgba(255,255,255,0.1)'; e.target.style.boxShadow = '0 0 0 1.5px rgba(59,130,246,0.4)' }}
              onBlur={(e) => { e.target.style.background = 'rgba(255,255,255,0.06)'; e.target.style.boxShadow = 'none' }} />
          </div>
          <button type="submit"
            className="btn w-100 py-2 fw-semibold border-0 d-flex align-items-center justify-content-center gap-2"
            disabled={creating}
            style={{ borderRadius: '10px', background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)', color: '#fff', boxShadow: '0 4px 16px rgba(59,130,246,0.3)', transition: 'opacity .2s' }}
            onMouseEnter={(e) => e.currentTarget.style.opacity = '0.9'}
            onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}>
            {creating ? <span className="spinner-border spinner-border-sm" role="status" /> : <i className="bi bi-plus-lg"></i>}
            {creating ? 'Creando...' : 'Crear hogar'}
          </button>
        </form>
      </div>
    </div>
  );
}
