'use client';

import { useState, useEffect, useMemo } from 'react';
import { useSubscriptions } from '@/hooks/useSubscriptions';
import { useHousehold } from '@/context/HouseholdContext';
import { useAuth } from '@/context/AuthContext';
import { createSupabaseClient } from '@/infrastructure/supabase/client';
import { subscriptionSchema } from '@/lib/validations/expenseSchema';
import type { ExpenseCategory } from '@/shared/types';

const supabase = createSupabaseClient();

function formatCurrency(n: number) {
  return new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', minimumFractionDigits: 2 }).format(n);
}

export default function SubscriptionsPage() {
  const { subscriptions, loading, error, create, update, remove } = useSubscriptions();
  const { household } = useHousehold();
  const { user } = useAuth();

  const [categories, setCategories] = useState<ExpenseCategory[]>([]);
  const [memberId, setMemberId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState({ service_name: '', amount: '', billing_date: '1', category_id: '', billing_period: 'monthly' as 'monthly' | 'yearly' });
  const [saving, setSaving] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  useEffect(() => {
    supabase.from('expense_categories').select('*').order('name').then(({ data }) => {
      if (data) setCategories(data as ExpenseCategory[]);
    });
    if (household && user) {
      supabase.from('household_members').select('id').eq('profile_id', user.id).eq('household_id', household.id).single()
        .then(({ data }) => { if (data) setMemberId(data.id); });
    }
  }, [household, user]);

  const monthlyTotal = useMemo(() =>
    subscriptions.reduce((s, sub) => {
      if (sub.billing_period === 'yearly') return s + Number(sub.amount) / 12;
      return s + Number(sub.amount);
    }, 0),
  [subscriptions]);

  const unpaid = useMemo(() => subscriptions.filter((s) => !s.paid), [subscriptions]);
  const paid = useMemo(() => subscriptions.filter((s) => s.paid), [subscriptions]);

  const unpaidMonthly = useMemo(() =>
    unpaid.reduce((s, sub) => {
      if (sub.billing_period === 'yearly') return s + Number(sub.amount) / 12;
      return s + Number(sub.amount);
    }, 0),
  [unpaid]);

  function resetForm() {
    setForm({ service_name: '', amount: '', billing_date: '1', category_id: '', billing_period: 'monthly' });
    setEditId(null);
    setShowForm(false);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!household || !memberId) return;
    setActionError(null);
    setSaving(true);

    try {
      const parsed = subscriptionSchema.safeParse({
        service_name: form.service_name,
        amount: parseFloat(form.amount),
        billing_date: parseInt(form.billing_date),
        category_id: form.category_id,
        billing_period: form.billing_period,
      });
      if (!parsed.success) {
        setActionError(parsed.error.errors.map((e) => e.message).join(', '));
        return;
      }

      const payload = { household_id: household.id, paid: false, last_paid_at: null, ...parsed.data };

      if (editId) { await update(editId, payload); }
      else { await create(payload); }
      resetForm();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Error al guardar');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('¿Eliminar esta suscripción?')) return;
    try { await remove(id); }
    catch (err) { setActionError(err instanceof Error ? err.message : 'Error'); }
  }

  async function handleTogglePaid(id: string, currentPaid: boolean) {
    try {
      await update(id, { paid: !currentPaid, last_paid_at: currentPaid ? null : new Date().toISOString().split('T')[0] });
    } catch (err) { setActionError(err instanceof Error ? err.message : 'Error'); }
  }

  return (
    <div>
      {/* Header */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h4 className="fw-bold text-white mb-1">Suscripciones</h4>
          {!loading && (
            <span style={{ color: '#9ca3af', fontSize: '0.85rem' }}>
              {subscriptions.length} registros · {formatCurrency(monthlyTotal)}/mes
            </span>
          )}
        </div>
      </div>

      {error && (
        <div className="alert d-flex align-items-center gap-2 py-2 small mb-3 border-0 rounded-3" style={{ background: '#2d0f0f', color: '#fca5a5' }}>
          <i className="bi bi-exclamation-triangle-fill"></i>
          {error}
        </div>
      )}
      {actionError && (
        <div className="alert d-flex align-items-center gap-2 py-2 small mb-3 border-0 rounded-3" style={{ background: '#2d0f0f', color: '#fca5a5' }}>
          <i className="bi bi-exclamation-triangle-fill"></i>
          {actionError}
        </div>
      )}

      {/* Stats */}
        {!loading && subscriptions.length > 0 && (
        <div className="row g-2 mb-4">
          {[
            { label: 'TOTAL/MES', value: formatCurrency(monthlyTotal), color: '#22d3ee', bg: '#0a2930' },
            { label: 'PAGADAS', value: String(paid.length), sub: paid.length > 0 ? formatCurrency(paid.reduce((s, sub) => s + Number(sub.amount) / (sub.billing_period === 'yearly' ? 12 : 1), 0)) : '', color: '#22c55e', bg: '#052e16' },
            { label: 'PENDIENTES', value: String(unpaid.length), sub: unpaid.length > 0 ? formatCurrency(unpaidMonthly) : '', color: '#fbbf24', bg: '#1e1508' },
          ].map((s) => (
            <div key={s.label} className="col-6 col-sm-4">
              <div className="rounded-3 p-2 text-center" style={{ background: s.bg, border: '1px solid rgba(255,255,255,0.04)' }}>
                <div style={{ color: s.color, fontSize: 'clamp(0.9rem, 4vw, 1.15rem)', fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.value}</div>
                <div style={{ color: '#6b7280', fontSize: '0.65rem', letterSpacing: '0.05em' }}>{s.label}</div>
                {s.sub && <div style={{ color: s.color, fontSize: 'clamp(0.6rem, 3vw, 0.7rem)', opacity: 0.7, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.sub}</div>}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add button */}
      <div className="d-flex gap-2 mb-3">
        <button className="btn btn-sm d-flex align-items-center gap-2 fw-semibold px-3"
          style={{ borderRadius: 8, background: showForm ? '#1f2937' : 'linear-gradient(135deg, #06b6d4, #0891b2)', color: showForm ? '#9ca3af' : '#fff', border: 'none', height: 34, fontSize: '0.85rem' }}
          onClick={() => { resetForm(); setShowForm(!showForm); }}>
          <i className={`bi bi-${showForm ? 'x' : 'plus'}-circle`}></i>
          {showForm ? 'Cancelar' : 'Nueva suscripción'}
        </button>
      </div>

      {/* Form */}
      {showForm && (
        <div className="rounded-3 p-3 mb-4" style={{ background: '#111827', border: '1px solid #1f2937' }}>
          <div className="mb-3 d-flex align-items-center gap-2" style={{ color: '#9ca3af', fontSize: '0.85rem' }}>
            <i className={`bi bi-${editId ? 'pencil' : 'plus'}-circle`} style={{ color: '#22d3ee' }}></i>
            {editId ? 'Editar suscripción' : 'Nueva suscripción'}
          </div>
          <form onSubmit={handleSubmit}>
            <div className="row g-3">
              <div className="col-md-4">
                <label className="form-label small mb-1" style={{ color: '#6b7280' }}>Servicio</label>
                <input type="text" className="form-control border-0 text-white"
                  style={{ background: '#1f2937', borderRadius: 8 }}
                  value={form.service_name} onChange={(e) => setForm({ ...form, service_name: e.target.value })} required placeholder="Ej: Netflix" />
              </div>
              <div className="col-md-2">
                <label className="form-label small mb-1" style={{ color: '#6b7280' }}>Monto</label>
                <input type="number" step="0.01" className="form-control border-0 text-white"
                  style={{ background: '#1f2937', borderRadius: 8 }}
                  value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} required min={0} placeholder="0.00" />
              </div>
              <div className="col-md-2">
                <label className="form-label small mb-1" style={{ color: '#6b7280' }}>Día de fact.</label>
                <input type="number" min={1} max={31} className="form-control border-0 text-white"
                  style={{ background: '#1f2937', borderRadius: 8 }}
                  value={form.billing_date} onChange={(e) => setForm({ ...form, billing_date: e.target.value })} required />
              </div>
              <div className="col-md-2">
                <label className="form-label small mb-1" style={{ color: '#6b7280' }}>Período</label>
                <select className="form-select border-0 text-white"
                  style={{ background: '#1f2937', borderRadius: 8 }}
                  value={form.billing_period} onChange={(e) => setForm({ ...form, billing_period: e.target.value as 'monthly' | 'yearly' })}>
                  <option value="monthly" style={{ background: '#111827' }}>Mensual</option>
                  <option value="yearly" style={{ background: '#111827' }}>Anual</option>
                </select>
              </div>
              <div className="col-md-2">
                <label className="form-label small mb-1" style={{ color: '#6b7280' }}>Categoría</label>
                <select className="form-select border-0 text-white"
                  style={{ background: '#1f2937', borderRadius: 8 }}
                  value={form.category_id} onChange={(e) => setForm({ ...form, category_id: e.target.value })}>
                  <option value="" style={{ background: '#111827' }}>Sin categoría</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id} style={{ background: '#111827' }}>{c.name}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="mt-3 d-flex gap-2">
              <button type="submit" className="btn btn-sm d-flex align-items-center gap-2 fw-semibold px-3 text-white"
                disabled={saving}
                style={{ borderRadius: 8, background: 'linear-gradient(135deg, #06b6d4, #0891b2)', border: 'none', height: 34, fontSize: '0.85rem' }}>
                {saving ? (
                  <span className="spinner-border spinner-border-sm" role="status" />
                ) : (
                  <i className="bi bi-check-lg"></i>
                )}
                {saving ? 'Guardando...' : (editId ? 'Actualizar' : 'Crear')}
              </button>
              <button type="button" className="btn btn-sm fw-semibold px-3"
                style={{ borderRadius: 8, background: '#1f2937', color: '#9ca3af', border: 'none', height: 34, fontSize: '0.85rem' }}
                onClick={resetForm}>Cancelar</button>
            </div>
          </form>
        </div>
      )}

      {/* List */}
      <div className="rounded-3" style={{ background: '#111827', border: '1px solid #1f2937' }}>
        <div className="px-3 py-2 d-flex align-items-center gap-2" style={{ borderBottom: '1px solid #1f2937' }}>
          <span style={{ color: '#9ca3af', fontSize: '0.85rem' }}>
            <i className="bi bi-list me-1" style={{ color: '#22d3ee' }}></i>Suscripciones ({subscriptions.length})
          </span>
          {subscriptions.length > 0 && (
            <span className="ms-auto" style={{ color: '#22d3ee', fontSize: '0.9rem', fontWeight: 600 }}>
              {formatCurrency(monthlyTotal)}/mes
            </span>
          )}
        </div>

        {loading ? (
          <div className="text-center py-5">
            <div className="spinner-border" style={{ color: '#6b7280', width: 24, height: 24 }} role="status" />
          </div>
        ) : subscriptions.length === 0 ? (
          <div className="text-center py-5" style={{ color: '#6b7280' }}>
            <i className="bi bi-arrow-repeat fs-1 d-block mb-3" style={{ color: '#374151' }}></i>
            No hay suscripciones registradas
          </div>
        ) : (
          subscriptions.map((sub, i) => {
            const monthly = sub.billing_period === 'yearly' ? Number(sub.amount) / 12 : Number(sub.amount);
            return (
              <div key={sub.id}
                className="d-flex align-items-center gap-2 gap-sm-3 px-2 px-sm-3 py-2 py-sm-3"
                style={{ borderBottom: i < subscriptions.length - 1 ? '1px solid #1f2937' : 'none' }}>
                {/* Status icon */}
                <div className="text-center d-none d-sm-block" style={{ minWidth: 32 }}>
                  <div style={{
                    width: 28, height: 28, borderRadius: 8,
                    background: sub.paid ? '#052e16' : '#1e1508',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <i className={`bi bi-${sub.paid ? 'check-lg' : 'hourglass'}`}
                      style={{ color: sub.paid ? '#22c55e' : '#fbbf24', fontSize: 13 }}></i>
                  </div>
                </div>

                {/* Info */}
                <div className="flex-grow-1 min-width-0">
                  <div className="d-flex align-items-center gap-1 gap-sm-2" style={{ flexWrap: 'wrap' }}>
                    <span style={{ color: '#fff', fontWeight: 500, fontSize: '0.85rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{sub.service_name}</span>
                    <span className="badge border-0" style={{
                      background: sub.paid ? '#052e16' : '#1e1508',
                      color: sub.paid ? '#22c55e' : '#fbbf24',
                      fontSize: '0.6rem', fontWeight: 500, padding: '2px 5px',
                    }}>
                      {sub.paid ? 'Pagado' : 'Pendiente'}
                    </span>
                  </div>
                  <div className="d-flex align-items-center gap-1 gap-sm-2 mt-1" style={{ flexWrap: 'wrap' }}>
                    <span style={{ color: '#4b5563', fontSize: '0.6rem' }}>
                      Día {sub.billing_date} · {sub.billing_period === 'monthly' ? 'Mensual' : 'Anual'}
                    </span>
                    {sub.category?.name && (
                      <span className="badge border-0" style={{ background: '#1f2937', color: '#9ca3af', fontSize: '0.6rem', fontWeight: 400 }}>
                        {sub.category.name}
                      </span>
                    )}
                  </div>
                </div>

                {/* Amount + actions */}
                <div className="text-end flex-shrink-0">
                  <div style={{ color: '#22d3ee', fontSize: '0.85rem', fontWeight: 700, whiteSpace: 'nowrap' }}>
                    {formatCurrency(Number(sub.amount))}
                  </div>
                  <div style={{ color: '#6b7280', fontSize: '0.65rem' }}>
                    {formatCurrency(monthly)}/mes
                  </div>
                  <div className="d-flex gap-1 mt-1 justify-content-end">
                    <button className="btn btn-sm border-0 d-inline-flex align-items-center justify-content-center"
                      onClick={() => handleTogglePaid(sub.id, sub.paid)}
                      title={sub.paid ? 'Marcar pendiente' : 'Marcar pagado'}
                      style={{ width: 32, height: 32, borderRadius: 6, background: 'transparent', color: sub.paid ? '#fbbf24' : '#22c55e', padding: 0, fontSize: 12 }}
                      onMouseEnter={(e) => e.currentTarget.style.background = sub.paid ? '#1e1508' : '#052e16'}
                      onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}>
                      <i className={`bi bi-${sub.paid ? 'x-circle' : 'check-circle'}`}></i>
                    </button>
                    <button className="btn btn-sm border-0 d-inline-flex align-items-center justify-content-center"
                      onClick={() => { setEditId(sub.id); setForm({ service_name: sub.service_name, amount: String(sub.amount), billing_date: String(sub.billing_date), category_id: sub.category_id, billing_period: sub.billing_period }); setShowForm(true); }}
                      title="Editar"
                      style={{ width: 32, height: 32, borderRadius: 6, background: 'transparent', color: '#4b5563', padding: 0, fontSize: 12 }}
                      onMouseEnter={(e) => e.currentTarget.style.background = '#0f1d35'}
                      onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}>
                      <i className="bi bi-pencil"></i>
                    </button>
                    <button className="btn btn-sm border-0 d-inline-flex align-items-center justify-content-center"
                      onClick={() => handleDelete(sub.id)} title="Eliminar"
                      style={{ width: 32, height: 32, borderRadius: 6, background: 'transparent', color: '#4b5563', padding: 0, fontSize: 12 }}
                      onMouseEnter={(e) => e.currentTarget.style.background = '#2d0f0f'}
                      onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}>
                      <i className="bi bi-trash"></i>
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
