'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { usePendingBills } from '@/hooks/usePendingBills';
import { useHousehold } from '@/context/HouseholdContext';
import { useAuth } from '@/context/AuthContext';
import { createSupabaseClient } from '@/infrastructure/supabase/client';
import { pendingBillSchema } from '@/lib/validations/expenseSchema';
import type { ExpenseCategory, PendingBill } from '@/shared/types';

const supabase = createSupabaseClient();

function formatCurrency(n: number) {
  return new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', minimumFractionDigits: 2 }).format(n);
}

function formatDate(d: string) {
  const parts = d.split('-');
  return `${parts[2]}/${parts[1]}/${parts[0]}`;
}

export default function PendingBillsPage() {
  const { bills, loading, error, create, update, remove } = usePendingBills();
  const { household } = useHousehold();
  const { user } = useAuth();

  const [categories, setCategories] = useState<ExpenseCategory[]>([]);
  const [memberId, setMemberId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState({ description: '', amount: '', due_date: '', category_id: '', notes: '' });
  const [saving, setSaving] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  useEffect(() => {
    supabase.from('expense_categories').select('*').order('name').then(({ data }) => {
      if (data) setCategories(data as ExpenseCategory[]);
    });
  }, []);

  useEffect(() => {
    if (!household || !user) return;
    supabase.from('household_members').select('id').eq('profile_id', user.id).eq('household_id', household.id).single()
      .then(({ data }) => { if (data) setMemberId(data.id); });
  }, [household, user]);

  const unpaid = useMemo(() => bills.filter((b) => !b.paid), [bills]);
  const paid = useMemo(() => bills.filter((b) => b.paid), [bills]);
  const overdue = useMemo(() => unpaid.filter((b) => new Date(b.due_date) < new Date()), [unpaid]);

  const unpaidTotal = useMemo(() => unpaid.reduce((s, b) => s + Number(b.amount), 0), [unpaid]);
  const paidTotal = useMemo(() => paid.reduce((s, b) => s + Number(b.amount), 0), [paid]);
  const overdueTotal = useMemo(() => overdue.reduce((s, b) => s + Number(b.amount), 0), [overdue]);

  function resetForm() {
    setForm({ description: '', amount: '', due_date: '', category_id: '', notes: '' });
    setEditId(null);
    setShowForm(false);
  }

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!household || !memberId) return;
    setActionError(null);
    setSaving(true);

    try {
      const parsed = pendingBillSchema.safeParse({
        description: form.description,
        amount: parseFloat(form.amount),
        due_date: form.due_date,
        category_id: form.category_id || null,
        notes: form.notes || '',
      });
      if (!parsed.success) {
        setActionError(parsed.error.errors.map((e) => e.message).join(', '));
        return;
      }

      const payload = {
        household_id: household.id,
        member_id: memberId,
        ...parsed.data,
        category_id: parsed.data.category_id ?? null,
        paid: false,
        paid_date: null,
      };

      if (editId) {
        await update(editId, payload);
      } else {
        await create(payload);
      }
      resetForm();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Error al guardar');
    } finally {
      setSaving(false);
    }
  }, [household, memberId, form, editId, create, update]);

  async function handleTogglePaid(bill: PendingBill) {
    try {
      await update(bill.id, { paid: !bill.paid, paid_date: bill.paid ? null : new Date().toISOString().split('T')[0] });
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Error');
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('¿Eliminar esta cuenta?')) return;
    try {
      await remove(id);
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Error');
    }
  }

  function openEdit(bill: PendingBill) {
    setEditId(bill.id);
    setForm({
      description: bill.description,
      amount: String(bill.amount),
      due_date: bill.due_date,
      category_id: bill.category_id || '',
      notes: bill.notes || '',
    });
    setShowForm(true);
  }

  return (
    <div>
      {/* Header */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h4 className="fw-bold text-white mb-1">Cuentas pendientes</h4>
          {!loading && (
            <span style={{ color: '#9ca3af', fontSize: '0.85rem' }}>
              {bills.length} registros · {formatCurrency(unpaidTotal)} pendientes
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
        {!loading && bills.length > 0 && (
        <div className="row g-2 mb-4">
          {[
            { label: 'PENDIENTES', value: String(unpaid.length), sub: formatCurrency(unpaidTotal), color: '#fbbf24', bg: '#1e1508' },
            { label: 'VENCIDAS', value: String(overdue.length), sub: formatCurrency(overdueTotal), color: '#ef4444', bg: '#2d0f0f' },
            { label: 'PAGADAS', value: String(paid.length), sub: formatCurrency(paidTotal), color: '#22c55e', bg: '#052e16' },
          ].map((s) => (
            <div key={s.label} className="col-6 col-sm-4">
              <div className="rounded-3 p-2 text-center" style={{ background: s.bg, border: '1px solid rgba(255,255,255,0.04)' }}>
                <div style={{ color: s.color, fontSize: 'clamp(0.9rem, 4vw, 1.15rem)', fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.value}</div>
                <div style={{ color: '#6b7280', fontSize: '0.65rem', letterSpacing: '0.05em' }}>{s.label}</div>
                {s.sub && <div style={{ color: s.color, fontSize: 'clamp(0.65rem, 3vw, 0.75rem)', fontWeight: 500, opacity: 0.7, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.sub}</div>}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Overdue alert */}
      {overdue.length > 0 && (
        <div className="alert d-flex align-items-center gap-2 py-2 small mb-3 border-0 rounded-3" style={{ background: '#2d0f0f', color: '#fca5a5' }}>
          <i className="bi bi-exclamation-triangle-fill"></i>
          <span>{overdue.length} cuenta{overdue.length !== 1 ? 's' : ''} vencida{overdue.length !== 1 ? 's' : ''} por <strong>{formatCurrency(overdueTotal)}</strong></span>
        </div>
      )}

      {/* New bill button + form */}
      <div className="d-flex gap-2 mb-3">
        <button className="btn btn-sm d-flex align-items-center gap-2 fw-semibold px-3"
          style={{ borderRadius: 8, background: showForm ? '#1f2937' : 'linear-gradient(135deg, #f59e0b, #d97706)', color: showForm ? '#9ca3af' : '#fff', border: 'none', height: 34, fontSize: '0.85rem' }}
          onClick={() => { resetForm(); setShowForm(!showForm); }}>
          <i className={`bi bi-${showForm ? 'x' : 'plus'}-circle`}></i>
          {showForm ? 'Cancelar' : 'Nueva cuenta'}
        </button>
      </div>

      {showForm && (
        <div className="rounded-3 p-3 mb-4" style={{ background: '#111827', border: '1px solid #1f2937' }}>
          <div className="mb-3 d-flex align-items-center gap-2" style={{ color: '#9ca3af', fontSize: '0.85rem' }}>
            <i className={`bi bi-${editId ? 'pencil' : 'plus'}-circle`} style={{ color: '#fbbf24' }}></i>
            {editId ? 'Editar cuenta' : 'Nueva cuenta pendiente'}
          </div>
          <form onSubmit={handleSubmit}>
            <div className="row g-3">
              <div className="col-md-4">
                <label className="form-label small mb-1" style={{ color: '#6b7280' }}>Descripción</label>
                <input type="text" className="form-control border-0 text-white"
                  style={{ background: '#1f2937', borderRadius: 8 }}
                  value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} required placeholder="Ej: Expensas" />
              </div>
              <div className="col-md-2">
                <label className="form-label small mb-1" style={{ color: '#6b7280' }}>Monto</label>
                <input type="number" step="0.01" className="form-control border-0 text-white"
                  style={{ background: '#1f2937', borderRadius: 8 }}
                  value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} required min={0} placeholder="0.00" />
              </div>
              <div className="col-md-2">
                <label className="form-label small mb-1" style={{ color: '#6b7280' }}>Vence</label>
                <input type="date" className="form-control border-0 text-white"
                  style={{ background: '#1f2937', borderRadius: 8 }}
                  value={form.due_date} onChange={(e) => setForm({ ...form, due_date: e.target.value })} required />
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
              <div className="col-md-2">
                <label className="form-label small mb-1" style={{ color: '#6b7280' }}>Notas</label>
                <input type="text" className="form-control border-0 text-white"
                  style={{ background: '#1f2937', borderRadius: 8 }}
                  value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="Opcional" />
              </div>
            </div>
            <div className="mt-3 d-flex gap-2">
              <button type="submit" className="btn btn-sm d-flex align-items-center gap-2 fw-semibold px-3 text-white"
                disabled={saving}
                style={{ borderRadius: 8, background: 'linear-gradient(135deg, #f59e0b, #d97706)', border: 'none', height: 34, fontSize: '0.85rem' }}>
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

      {/* Pending list */}
      <div className="rounded-3 mb-4" style={{ background: '#111827', border: '1px solid #1f2937' }}>
        <div className="px-3 py-2 d-flex align-items-center gap-2" style={{ borderBottom: '1px solid #1f2937' }}>
          <span style={{ color: '#9ca3af', fontSize: '0.85rem' }}>
            <i className="bi bi-clock me-1" style={{ color: '#fbbf24' }}></i>Pendientes ({unpaid.length})
          </span>
          {unpaid.length > 0 && (
            <span className="fw-semibold ms-auto" style={{ color: '#fbbf24', fontSize: '0.95rem' }}>
              {formatCurrency(unpaidTotal)}
            </span>
          )}
        </div>

        {loading ? (
          <div className="text-center py-5">
            <div className="spinner-border" style={{ color: '#6b7280', width: 24, height: 24 }} role="status" />
          </div>
        ) : unpaid.length === 0 ? (
          <div className="text-center py-5" style={{ color: '#6b7280' }}>
            <i className="bi bi-check2-circle fs-1 d-block mb-3" style={{ color: '#374151' }}></i>
            No hay cuentas pendientes
          </div>
        ) : (
          unpaid.map((bill, i) => {
            const isOverdue = new Date(bill.due_date) < new Date();
            const dateParts = bill.due_date.split('-');
            return (
              <div key={bill.id}
                className="d-flex align-items-center gap-2 gap-sm-3 px-2 px-sm-3 py-2 py-sm-3"
                style={{ borderBottom: i < unpaid.length - 1 ? '1px solid #1f2937' : 'none' }}>
                {/* Status indicator */}
                <div className="text-center d-none d-sm-block" style={{ minWidth: 32 }}>
                  <div style={{
                    width: 28, height: 28, borderRadius: 8,
                    background: isOverdue ? '#2d0f0f' : '#1e1508',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <i className={`bi bi-${isOverdue ? 'exclamation' : 'clock'}`}
                      style={{ color: isOverdue ? '#ef4444' : '#fbbf24', fontSize: 13 }}></i>
                  </div>
                </div>

                {/* Info */}
                <div className="flex-grow-1 min-width-0">
                  <div className="d-flex align-items-center gap-1 gap-sm-2" style={{ flexWrap: 'wrap' }}>
                    <span style={{ color: isOverdue ? '#fca5a5' : '#fff', fontWeight: 500, fontSize: '0.85rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {bill.description}
                    </span>
                    {isOverdue && <span className="badge border-0" style={{ background: '#2d0f0f', color: '#ef4444', fontSize: '0.6rem', fontWeight: 500, padding: '2px 5px' }}>Vencida</span>}
                  </div>
                  <div className="d-flex align-items-center gap-1 gap-sm-2 mt-1" style={{ flexWrap: 'wrap' }}>
                    {bill.category?.name && (
                      <span className="badge border-0" style={{ background: '#1f2937', color: '#9ca3af', fontSize: '0.65rem', fontWeight: 400 }}>
                        {bill.category.name}
                      </span>
                    )}
                    <span style={{ color: '#4b5563', fontSize: '0.6rem' }}>Vence {dateParts[2]}/{dateParts[1]}</span>
                    {bill.notes && <span className="d-none d-sm-inline" style={{ color: '#6b7280', fontSize: '0.6rem' }}>· {bill.notes}</span>}
                  </div>
                </div>

                {/* Amount + actions */}
                <div className="text-end flex-shrink-0">
                  <div style={{ color: isOverdue ? '#ef4444' : '#fca5a5', fontSize: '0.85rem', fontWeight: 700, whiteSpace: 'nowrap' }}>
                    {formatCurrency(Number(bill.amount))}
                  </div>
                  <div className="d-flex gap-1 mt-1 justify-content-end">
                    <button className="btn btn-sm border-0 d-inline-flex align-items-center justify-content-center"
                      onClick={() => handleTogglePaid(bill)} title="Marcar pagada"
                      style={{ width: 32, height: 32, borderRadius: 6, background: 'transparent', color: '#4b5563', padding: 0, fontSize: 12 }}
                      onMouseEnter={(e) => e.currentTarget.style.background = '#052e16'}
                      onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}>
                      <i className="bi bi-check-lg"></i>
                    </button>
                    <button className="btn btn-sm border-0 d-inline-flex align-items-center justify-content-center"
                      onClick={() => openEdit(bill)} title="Editar"
                      style={{ width: 32, height: 32, borderRadius: 6, background: 'transparent', color: '#4b5563', padding: 0, fontSize: 12 }}
                      onMouseEnter={(e) => e.currentTarget.style.background = '#0f1d35'}
                      onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}>
                      <i className="bi bi-pencil"></i>
                    </button>
                    <button className="btn btn-sm border-0 d-inline-flex align-items-center justify-content-center"
                      onClick={() => handleDelete(bill.id)} title="Eliminar"
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

      {/* Paid history */}
      {paid.length > 0 && (
        <div className="rounded-3" style={{ background: '#111827', border: '1px solid #1f2937' }}>
          <div className="px-3 py-2 d-flex justify-content-between align-items-center"
            style={{ borderBottom: '1px solid #1f2937' }}>
            <div className="d-flex align-items-center gap-2">
              <span style={{ color: '#9ca3af', fontSize: '0.85rem' }}>
                <i className="bi bi-check-circle me-1" style={{ color: '#22c55e' }}></i>Pagadas ({paid.length})
              </span>
              <span className="fw-semibold" style={{ color: '#22c55e', fontSize: '0.9rem' }}>
                {formatCurrency(paidTotal)}
              </span>
            </div>
            <button className="btn btn-sm border-0 d-flex align-items-center gap-1 px-2"
              onClick={() => setShowHistory(!showHistory)}
              style={{ borderRadius: 6, background: '#1f2937', color: '#9ca3af', fontSize: 12, height: 28 }}>
              <i className={`bi bi-chevron-${showHistory ? 'up' : 'down'}`}></i>
              {showHistory ? 'Ocultar' : 'Ver historial'}
            </button>
          </div>
          {showHistory && (
            paid.map((bill, i) => {
              const dateParts = bill.due_date.split('-');
              const paidDateParts = bill.paid_date ? bill.paid_date.split('-') : null;
              return (
                <div key={bill.id}
                  className="d-flex align-items-center gap-2 gap-sm-3 px-2 px-sm-3 py-2 py-sm-3"
                  style={{ borderBottom: i < paid.length - 1 ? '1px solid #1f2937' : 'none' }}>
                  <div className="text-center d-none d-sm-block" style={{ minWidth: 32 }}>
                    <div style={{
                      width: 28, height: 28, borderRadius: 8,
                      background: '#052e16',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      <i className="bi bi-check-lg" style={{ color: '#22c55e', fontSize: 13 }}></i>
                    </div>
                  </div>
                  <div className="flex-grow-1 min-width-0">
                    <div style={{ color: 'rgba(255,255,255,0.5)', fontWeight: 500, fontSize: '0.85rem', textDecoration: 'line-through', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {bill.description}
                    </div>
                    <div className="d-flex align-items-center gap-1" style={{ flexWrap: 'wrap' }}>
                      <span style={{ color: '#4b5563', fontSize: '0.6rem' }}>
                        Vencía {dateParts[2]}/{dateParts[1]}/{dateParts[0]}
                      </span>
                      {paidDateParts && <span style={{ color: '#4b5563', fontSize: '0.6rem' }}>· Pagada {paidDateParts[2]}/{paidDateParts[1]}/{paidDateParts[0]}</span>}
                    </div>
                  </div>
                  <div className="text-end flex-shrink-0">
                    <div style={{ color: '#6b7280', fontSize: '0.85rem', fontWeight: 700, whiteSpace: 'nowrap' }}>
                      {formatCurrency(Number(bill.amount))}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}
