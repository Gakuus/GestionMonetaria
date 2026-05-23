'use client';

import { useState } from 'react';
import { useBudgets, type BudgetWithSpent } from '@/hooks/useBudgets';
import { useMonth } from '@/context/MonthContext';
import { budgetSchema } from '@/lib/validations/expenseSchema';

function formatCurrency(n: number) {
  return new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', minimumFractionDigits: 2 }).format(n);
}

const glassCard: React.CSSProperties = {
  background: 'rgba(255,255,255,0.04)',
  backdropFilter: 'blur(24px)',
  WebkitBackdropFilter: 'blur(24px)',
  border: '1px solid rgba(255,255,255,0.08)',
  borderRadius: 16,
};

export default function BudgetsPage() {
  const { budgets, categories, loading, error, upsert, remove } = useBudgets();
  const { label, year, month } = useMonth();
  const monthStr = `${year}-${String(month).padStart(2, '0')}-01`;

  const [editingCategory, setEditingCategory] = useState<string | null>(null);
  const [editAmount, setEditAmount] = useState('');
  const [saving, setSaving] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const budgetMap = new Map(budgets.map((b) => [b.category_id, b]));

  async function handleSave(categoryId: string) {
    const parsed = budgetSchema.safeParse({ category_id: categoryId, month: monthStr, amount: parseFloat(editAmount) });
    if (!parsed.success) return;

    setSaving(true);
    setActionError(null);
    try {
      await upsert(parsed.data);
      setEditingCategory(null);
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Error al guardar');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('¿Eliminar este presupuesto?')) return;
    await remove(id);
  }

  function getBarColor(pct: number) {
    if (pct >= 100) return '#ef4444';
    if (pct >= 75) return '#f59e0b';
    return '#22c55e';
  }

  return (
    <div>
      <div className="d-flex align-items-center gap-2 mb-4">
        <div className="d-flex align-items-center justify-content-center rounded-2"
          style={{ width: 32, height: 32, background: 'linear-gradient(135deg, #f59e0b, #d97706)' }}>
          <i className="bi bi-pie-chart text-white small"></i>
        </div>
        <h5 className="fw-bold text-white mb-0">Presupuestos</h5>
        <span className="ms-auto" style={{ color: 'rgba(255,255,255,0.35)', fontSize: '0.85rem' }}>{label}</span>
      </div>

      {error && (
        <div className="d-flex align-items-center gap-2 px-3 py-2 small mb-3 rounded-3"
          style={{ background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.2)', color: '#fca5a5' }}>
          <i className="bi bi-exclamation-triangle-fill" style={{ color: '#ef4444' }}></i>
          {error}
        </div>
      )}
      {actionError && (
        <div className="d-flex align-items-center gap-2 px-3 py-2 small mb-3 rounded-3"
          style={{ background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.2)', color: '#fca5a5' }}>
          <i className="bi bi-exclamation-triangle-fill" style={{ color: '#ef4444' }}></i>
          {actionError}
        </div>
      )}

      <div className="row g-3">
        {loading ? (
          Array.from({ length: 6 }).map((_, i) => (
            <div className="col-md-6 col-lg-4" key={i}>
              <div className="p-3" style={glassCard}>
                <div className="placeholder-glow" style={{ color: 'rgba(255,255,255,0.3)' }}>
                  <span className="placeholder col-6" style={{ background: 'rgba(255,255,255,0.1)' }}></span>
                  <span className="placeholder col-10 mt-2" style={{ background: 'rgba(255,255,255,0.1)' }}></span>
                </div>
              </div>
            </div>
          ))
        ) : (
          categories.map((cat) => {
            const budget = budgetMap.get(cat.id) as BudgetWithSpent | undefined;
            const isEditing = editingCategory === cat.id;
            const warn = budget && budget.percentage >= 75;

            return (
              <div className="col-md-6 col-lg-4" key={cat.id}>
                <div className="h-100 p-3" style={{
                  ...glassCard,
                  borderColor: warn ? (budget!.percentage >= 100 ? 'rgba(239,68,68,0.3)' : 'rgba(245,158,11,0.3)') : 'rgba(255,255,255,0.08)',
                  borderWidth: warn ? 1.5 : 1,
                }}>
                  <div className="d-flex justify-content-between align-items-start mb-2">
                    <div>
                      <i className={`bi ${cat.icon}`} style={{ color: 'rgba(255,255,255,0.4)' }}></i>
                      <strong className="text-white ms-1">{cat.name}</strong>
                    </div>
                    {budget && (
                      <button className="btn btn-sm border-0 d-inline-flex align-items-center justify-content-center"
                        onClick={() => handleDelete(budget.id)} title="Eliminar presupuesto"
                        style={{ width: 28, height: 28, borderRadius: 8, background: 'rgba(239,68,68,0.12)', color: 'rgba(239,68,68,0.6)' }}>
                        <i className="bi bi-trash" style={{ fontSize: 12 }}></i>
                      </button>
                    )}
                  </div>

                  {isEditing ? (
                    <div className="d-flex gap-2">
                      <input type="number" step="0.01" className="form-control form-control-sm border-0 text-white"
                        style={{ background: 'rgba(255,255,255,0.06)', borderRadius: 8 }}
                        value={editAmount} onChange={(e) => setEditAmount(e.target.value)}
                        placeholder="Monto" autoFocus />
                      <button className="btn btn-sm border-0 text-white d-flex align-items-center justify-content-center"
                        onClick={() => handleSave(cat.id)} disabled={saving}
                        style={{ width: 32, height: 32, borderRadius: 8, background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)' }}>
                        <i className="bi bi-check"></i>
                      </button>
                      <button className="btn btn-sm border-0 d-flex align-items-center justify-content-center"
                        onClick={() => setEditingCategory(null)}
                        style={{ width: 32, height: 32, borderRadius: 8, background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.5)' }}>
                        <i className="bi bi-x"></i>
                      </button>
                    </div>
                  ) : budget ? (
                    <>
                      <div className="d-flex justify-content-between small mb-1"
                        style={{ color: 'rgba(255,255,255,0.4)' }}>
                        <span>Gastado: <strong style={{ color: 'rgba(255,255,255,0.7)' }}>{formatCurrency(budget.spent)}</strong></span>
                        <span>Límite: {formatCurrency(budget.amount)}</span>
                      </div>
                      <div className="progress" style={{ height: 10, background: 'rgba(255,255,255,0.06)' }}>
                        <div className="progress-bar" style={{
                          width: `${Math.min(budget.percentage, 100)}%`,
                          background: getBarColor(budget.percentage),
                          borderRadius: 5,
                        }} />
                      </div>
                      <div className="d-flex justify-content-between align-items-center mt-1">
                        <small style={{ color: warn ? (budget.percentage >= 100 ? '#ef4444' : '#f59e0b') : 'rgba(255,255,255,0.3)' }}>
                          {budget.percentage.toFixed(0)}% utilizado
                        </small>
                        <button className="btn btn-sm border-0 d-flex align-items-center gap-1 px-2"
                          onClick={() => { setEditingCategory(cat.id); setEditAmount(budget.amount.toString()); }}
                          style={{ borderRadius: 8, background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.4)', fontSize: 12 }}>
                          <i className="bi bi-pencil"></i>Editar
                        </button>
                      </div>
                    </>
                  ) : (
                    <>
                      <p className="small mb-2" style={{ color: 'rgba(255,255,255,0.3)' }}>Sin presupuesto definido</p>
                      <button className="btn btn-sm border-0 px-3"
                        onClick={() => { setEditingCategory(cat.id); setEditAmount(''); }}
                        style={{ borderRadius: 8, background: 'rgba(34,197,94,0.12)', color: '#22c55e' }}>
                        <i className="bi bi-plus-circle me-1"></i>Definir
                      </button>
                    </>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
