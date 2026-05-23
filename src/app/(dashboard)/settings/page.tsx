'use client';

import { useState } from 'react';
import { createSupabaseClient } from '@/infrastructure/supabase/client';
import { useAuth } from '@/context/AuthContext';
import { useHousehold } from '@/context/HouseholdContext';
import { profileSchema, householdNameSchema } from '@/lib/validations/expenseSchema';

const supabase = createSupabaseClient();

const glassCard: React.CSSProperties = {
  background: 'rgba(255,255,255,0.04)',
  backdropFilter: 'blur(24px)',
  WebkitBackdropFilter: 'blur(24px)',
  border: '1px solid rgba(255,255,255,0.08)',
  borderRadius: 16,
};

const inputDark: React.CSSProperties = {
  background: 'rgba(255,255,255,0.06)',
  border: '1px solid rgba(255,255,255,0.08)',
  borderRadius: 10,
  color: '#fff',
};

export default function SettingsPage() {
  const { user, profile } = useAuth();
  const { household, isAdmin, refresh: refreshHousehold } = useHousehold();

  const [name, setName] = useState(profile?.full_name ?? '');
  const [householdName, setHouseholdName] = useState(household?.name ?? '');
  const [saving, setSaving] = useState<'profile' | 'household' | null>(null);
  const [msg, setMsg] = useState<{ type: 'success' | 'danger'; text: string } | null>(null);

  async function updateProfile(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return;

    const parsed = profileSchema.safeParse({ full_name: name });
    if (!parsed.success) { setMsg({ type: 'danger', text: parsed.error.errors.map((e) => e.message).join(', ') }); return; }

    setSaving('profile');
    setMsg(null);

    const { error } = await supabase.from('profiles').update({ full_name: name }).eq('id', user.id);
    if (error) setMsg({ type: 'danger', text: error.message });
    else setMsg({ type: 'success', text: 'Perfil actualizado' });
    setSaving(null);
  }

  async function updateHousehold(e: React.FormEvent) {
    e.preventDefault();
    if (!household?.id) return;

    const parsed = householdNameSchema.safeParse({ name: householdName });
    if (!parsed.success) { setMsg({ type: 'danger', text: parsed.error.errors.map((e) => e.message).join(', ') }); return; }

    setSaving('household');
    setMsg(null);

    const { error } = await supabase.from('households').update({ name: householdName }).eq('id', household.id);
    if (error) setMsg({ type: 'danger', text: error.message });
    else { setMsg({ type: 'success', text: 'Hogar actualizado' }); await refreshHousehold(); }
    setSaving(null);
  }

  return (
    <div>
      <div className="d-flex align-items-center gap-2 mb-4">
        <div className="d-flex align-items-center justify-content-center rounded-2"
          style={{ width: 32, height: 32, background: 'linear-gradient(135deg, #64748b, #475569)' }}>
          <i className="bi bi-gear text-white small"></i>
        </div>
        <h5 className="fw-bold text-white mb-0">Configuración</h5>
      </div>

      {msg && (
        <div className="d-flex align-items-center gap-2 px-3 py-2 small mb-3 rounded-3"
          style={{
            background: msg.type === 'success' ? 'rgba(34,197,94,0.12)' : 'rgba(239,68,68,0.12)',
            border: `1px solid ${msg.type === 'success' ? 'rgba(34,197,94,0.2)' : 'rgba(239,68,68,0.2)'}`,
            color: msg.type === 'success' ? '#86efac' : '#fca5a5',
          }}>
          <i className={`bi bi-${msg.type === 'success' ? 'check-circle-fill' : 'exclamation-triangle-fill'}`}
            style={{ color: msg.type === 'success' ? '#22c55e' : '#ef4444' }}></i>
          {msg.text}
          <button type="button" className="btn-close ms-auto" style={{ fontSize: 12, filter: 'invert(0.8)' }}
            onClick={() => setMsg(null)} aria-label="Cerrar"></button>
        </div>
      )}

      <div className="row g-4">
        <div className="col-md-6">
          <div className="p-3" style={glassCard}>
            <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.85rem', fontWeight: 500, marginBottom: 12 }}>
              <i className="bi bi-person me-1"></i>Mi perfil
            </div>
            <form onSubmit={updateProfile}>
              <div className="mb-3">
                <label className="form-label small" style={{ color: 'rgba(255,255,255,0.5)' }}>Email</label>
                <input type="email" className="form-control border-0 text-white" style={{ ...inputDark, opacity: 0.5 }} value={user?.email ?? ''} disabled />
              </div>
              <div className="mb-3">
                <label className="form-label small" style={{ color: 'rgba(255,255,255,0.5)' }}>Nombre completo</label>
                <input type="text" className="form-control border-0 text-white" style={inputDark}
                  value={name} onChange={(e) => setName(e.target.value)} />
              </div>
              <button type="submit" className="btn btn-sm border-0 px-3 py-2 text-white d-flex align-items-center gap-1"
                disabled={saving === 'profile'}
                style={{ borderRadius: 10, background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)' }}>
                {saving === 'profile' ? <span className="spinner-border spinner-border-sm" role="status" /> : null}
                {saving === 'profile' ? 'Guardando...' : 'Guardar cambios'}
              </button>
            </form>
          </div>
        </div>

        <div className="col-md-6">
          <div className="p-3" style={glassCard}>
            <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.85rem', fontWeight: 500, marginBottom: 12 }}>
              <i className="bi bi-house me-1"></i>Mi hogar
            </div>
            {!isAdmin ? (
              <p style={{ color: 'rgba(255,255,255,0.3)' }}>Solo el administrador puede editar la información del hogar.</p>
            ) : (
              <form onSubmit={updateHousehold}>
                <div className="mb-3">
                  <label className="form-label small" style={{ color: 'rgba(255,255,255,0.5)' }}>Nombre del hogar</label>
                  <input type="text" className="form-control border-0 text-white" style={inputDark}
                    value={householdName} onChange={(e) => setHouseholdName(e.target.value)} />
                </div>
                <button type="submit" className="btn btn-sm border-0 px-3 py-2 text-white d-flex align-items-center gap-1"
                  disabled={saving === 'household'}
                  style={{ borderRadius: 10, background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)' }}>
                  {saving === 'household' ? <span className="spinner-border spinner-border-sm" role="status" /> : null}
                  {saving === 'household' ? 'Guardando...' : 'Guardar cambios'}
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
