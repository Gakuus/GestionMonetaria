'use client';

import { useState } from 'react';
import { useHousehold } from '@/context/HouseholdContext';
import { useAuth } from '@/context/AuthContext';
import { createSupabaseClient } from '@/infrastructure/supabase/client';
import { memberInviteSchema } from '@/lib/validations/expenseSchema';

const supabase = createSupabaseClient();

const ROLE_LABELS: Record<string, string> = { admin: 'Admin', member: 'Miembro' };

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

export default function MembersPage() {
  const { household, members, isAdmin, refresh } = useHousehold();
  const { user } = useAuth();

  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteMsg, setInviteMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [inviting, setInviting] = useState(false);
  const [removing, setRemoving] = useState<string | null>(null);

  async function handleInvite(e: React.FormEvent) {
    e.preventDefault();
    if (!household) return;
    setInviteMsg(null);

    const parsed = memberInviteSchema.safeParse({ email: inviteEmail });
    if (!parsed.success) {
      setInviteMsg({ type: 'error', text: parsed.error.errors.map((e) => e.message).join(', ') });
      return;
    }

    setInviting(true);

    try {
      // Show generic message to prevent email enumeration
      setInviteMsg({ type: 'success', text: 'Si el usuario existe, se agregará al hogar.' });
      setInviteEmail('');

      const { data: profile } = await supabase
        .from('profiles').select('id').eq('email', inviteEmail).maybeSingle();

      if (!profile) return;

      const { data: existing } = await supabase
        .from('household_members').select('id')
        .eq('household_id', household.id).eq('profile_id', profile.id).maybeSingle();

      if (existing) return;

      await supabase
        .from('household_members').insert({ household_id: household.id, profile_id: profile.id, role: 'member' });

      await refresh();
    } catch {
      // Swallow — never reveal whether email exists
    } finally {
      setInviting(false);
    }
  }

  async function handleRemove(memberId: string) {
    if (!confirm('¿Eliminar este miembro del hogar?')) return;
    setRemoving(memberId);
    try {
      const { error } = await supabase.from('household_members').delete().eq('id', memberId);
      if (error) throw new Error(error.message);
      await refresh();
    } catch { } finally { setRemoving(null); }
  }

  const currentMember = members.find((m) => m.profile_id === user?.id);

  return (
    <div>
      <div className="d-flex align-items-center gap-2 mb-4">
        <div className="d-flex align-items-center justify-content-center rounded-2"
          style={{ width: 32, height: 32, background: 'linear-gradient(135deg, #8b5cf6, #6d28d9)' }}>
          <i className="bi bi-people text-white small"></i>
        </div>
        <h5 className="fw-bold text-white mb-0">Miembros</h5>
        <span className="ms-auto" style={{ color: 'rgba(255,255,255,0.35)', fontSize: '0.85rem' }}>{household?.name}</span>
      </div>

      <div className="row g-4">
        <div className="col-md-7">
          <div className="p-3" style={glassCard}>
            <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.85rem', fontWeight: 500, marginBottom: 12 }}>
              <i className="bi bi-person-badge me-1"></i>Miembros ({members.length})
            </div>
            {members.map((m) => (
              <div key={m.id} className="d-flex align-items-center gap-3 py-2"
                style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                <div className="d-flex align-items-center justify-content-center rounded-circle"
                  style={{ width: 40, height: 40, background: 'rgba(139,92,246,0.12)', color: '#8b5cf6' }}>
                  <i className="bi bi-person fs-5"></i>
                </div>
                <div className="flex-grow-1">
                  <strong style={{ color: 'rgba(255,255,255,0.8)' }}>{m.profile?.full_name || 'Sin nombre'}</strong>
                  <small className="d-block" style={{ color: 'rgba(255,255,255,0.3)' }}>{m.profile?.email}</small>
                </div>
                <span className="badge border-0" style={{
                  background: m.role === 'admin' ? 'rgba(139,92,246,0.15)' : 'rgba(255,255,255,0.08)',
                  color: m.role === 'admin' ? '#8b5cf6' : 'rgba(255,255,255,0.5)',
                  fontWeight: 400,
                }}>
                  {ROLE_LABELS[m.role] || m.role}
                </span>
                {isAdmin && m.id !== currentMember?.id && (
                  <button className="btn btn-sm border-0 d-inline-flex align-items-center justify-content-center"
                    onClick={() => handleRemove(m.id)} disabled={removing === m.id} title="Eliminar miembro"
                    style={{ width: 32, height: 32, borderRadius: 8, background: 'rgba(239,68,68,0.12)', color: 'rgba(239,68,68,0.6)' }}>
                    <i className="bi bi-person-x"></i>
                  </button>
                )}
              </div>
            ))}
            {members.length === 0 && (
              <p style={{ color: 'rgba(255,255,255,0.3)' }}>Sin miembros</p>
            )}
          </div>
        </div>

        <div className="col-md-5">
          <div className="p-3" style={glassCard}>
            <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.85rem', fontWeight: 500, marginBottom: 12 }}>
              <i className="bi bi-envelope-plus me-1"></i>Invitar miembro
            </div>

            {!isAdmin ? (
              <p style={{ color: 'rgba(255,255,255,0.3)' }}>Solo el administrador puede invitar miembros.</p>
            ) : (
              <form onSubmit={handleInvite}>
                <div className="mb-3">
                  <label className="form-label small" style={{ color: 'rgba(255,255,255,0.5)' }}>Email del usuario</label>
                  <input type="email" className="form-control border-0 text-white" style={inputDark}
                    value={inviteEmail} onChange={(e) => setInviteEmail(e.target.value)}
                    placeholder="usuario@email.com" required />
                </div>
                <button type="submit" className="btn w-100 py-2 border-0 text-white d-flex align-items-center justify-content-center gap-1"
                  disabled={inviting}
                  style={{ borderRadius: 10, background: 'linear-gradient(135deg, #8b5cf6, #6d28d9)' }}>
                  {inviting ? <span className="spinner-border spinner-border-sm" role="status" /> : <i className="bi bi-send"></i>}
                  {inviting ? 'Invitar...' : 'Enviar invitación'}
                </button>
                {inviteMsg && (
                  <div className={`d-flex align-items-center gap-2 px-3 py-2 small mt-3 rounded-3`}
                    style={{
                      background: inviteMsg.type === 'success' ? 'rgba(34,197,94,0.12)' : 'rgba(239,68,68,0.12)',
                      border: `1px solid ${inviteMsg.type === 'success' ? 'rgba(34,197,94,0.2)' : 'rgba(239,68,68,0.2)'}`,
                      color: inviteMsg.type === 'success' ? '#86efac' : '#fca5a5',
                    }}>
                    <i className={`bi bi-${inviteMsg.type === 'success' ? 'check-circle-fill' : 'exclamation-triangle-fill'}`}
                      style={{ color: inviteMsg.type === 'success' ? '#22c55e' : '#ef4444' }}></i>
                    {inviteMsg.text}
                  </div>
                )}
              </form>
            )}
          </div>

          <div className="p-3 mt-3" style={glassCard}>
            <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.85rem', fontWeight: 500, marginBottom: 8 }}>
              <i className="bi bi-info-circle me-1"></i>Roles
            </div>
            <div style={{ color: 'rgba(255,255,255,0.3)', fontSize: '0.85rem' }}>
              <strong style={{ color: '#8b5cf6' }}>Admin</strong> — Puede invitar, eliminar miembros y gestionar presupuestos.
            </div>
            <div style={{ color: 'rgba(255,255,255,0.3)', fontSize: '0.85rem', marginTop: 4 }}>
              <strong style={{ color: 'rgba(255,255,255,0.5)' }}>Miembro</strong> — Puede registrar y ver gastos/ingresos del hogar.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
