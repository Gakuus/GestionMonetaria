'use client';

import { useState, useMemo } from 'react';
import { useExpenses } from '@/hooks/useExpenses';
import { ExpenseForm } from '@/components/forms/ExpenseForm';
import type { ExpenseInput } from '@/lib/validations/expenseSchema';

function formatCurrency(n: number) {
  return new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', minimumFractionDigits: 2 }).format(n);
}

const METHOD_STYLES: Record<string, { label: string; color: string; bg: string }> = {
  cash:     { label: 'Efectivo',   color: '#22c55e', bg: '#052e16' },
  debit:    { label: 'Débito',     color: '#60a5fa', bg: '#0f1d35' },
  credit:   { label: 'Crédito',    color: '#f87171', bg: '#2d0f0f' },
  transfer: { label: 'Transfer.',  color: '#a78bfa', bg: '#1e1335' },
};

export default function ExpensesPage() {
  const {
    expenses, total, page, totalPages, loading, error, filters,
    categories, create, remove, setFilters, resetFilters,
    nextPage, prevPage, refetch,
  } = useExpenses();

  const [showModal, setShowModal] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);

  const totalAmount = useMemo(() =>
    expenses.reduce((s, e) => s + Number(e.amount), 0),
  [expenses]);

  const antCount = useMemo(() =>
    expenses.filter((e) => e.is_ant_expense).length,
  [expenses]);

  async function handleCreate(input: ExpenseInput) {
    await create(input);
    setShowModal(false);
  }

  async function handleDelete(id: string) {
    if (!confirm('¿Eliminar este gasto?')) return;
    setDeleting(id);
    await remove(id);
    setDeleting(null);
  }

  return (
    <div>
      {/* Header */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h4 className="fw-bold text-white mb-1">Gastos</h4>
          {!loading && (
            <span style={{ color: '#9ca3af', fontSize: '0.85rem' }}>
              {total} registros · {formatCurrency(totalAmount)}
            </span>
          )}
        </div>
        <button className="btn d-flex align-items-center gap-2 text-white fw-semibold px-3"
          style={{ borderRadius: 10, background: 'linear-gradient(135deg, #ef4444, #dc2626)', height: 38, border: 'none', fontSize: '0.9rem' }}
          onClick={() => setShowModal(true)}>
          <i className="bi bi-plus-lg"></i>
          <span className="d-none d-sm-inline">Nuevo gasto</span>
        </button>
      </div>

      {error && (
        <div className="alert alert-danger d-flex align-items-center gap-2 py-2 small mb-3 border-0 rounded-3" style={{ background: '#2d0f0f', color: '#fca5a5' }}>
          <i className="bi bi-exclamation-triangle-fill"></i>
          {error}
        </div>
      )}

      {/* Stats */}
      {!loading && expenses.length > 0 && (
        <div className="row g-2 mb-4">
          {[
            { label: 'GASTADO', value: formatCurrency(totalAmount), color: '#ef4444', bg: '#2d0f0f' },
            { label: 'TRANSACCIONES', value: String(expenses.length), color: '#60a5fa', bg: '#0f1d35' },
            { label: 'HORMIGA', value: String(antCount), color: '#fbbf24', bg: '#1e1508' },
            { label: 'RECURRENTES', value: String(expenses.reduce((s, e) => s + (e.is_recurring ? 1 : 0), 0)), color: '#a78bfa', bg: '#1e1335' },
          ].map((s) => (
            <div key={s.label} className="col-6 col-md-3">
              <div className="rounded-3 p-2 text-center" style={{ background: s.bg, border: '1px solid rgba(255,255,255,0.04)' }}>
                <div style={{ color: s.color, fontSize: 'clamp(0.85rem, 4vw, 1.15rem)', fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.value}</div>
                <div style={{ color: '#6b7280', fontSize: '0.65rem', letterSpacing: '0.05em' }}>{s.label}</div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Filters */}
      <div className="rounded-3 p-3 mb-4 d-flex flex-wrap align-items-end gap-2"
        style={{ background: '#111827', border: '1px solid #1f2937' }}>
        <div style={{ minWidth: 160, flex: '1 0 auto' }}>
          <label className="form-label small mb-1" style={{ color: '#6b7280' }}>Desde</label>
          <input type="date" className="form-control form-control-sm border-0 text-white"
            style={{ background: '#1f2937', borderRadius: 8, color: '#fff' }}
            value={filters.dateFrom || ''}
            onChange={(e) => setFilters({ ...filters, dateFrom: e.target.value || undefined })} />
        </div>
        <div style={{ minWidth: 160, flex: '1 0 auto' }}>
          <label className="form-label small mb-1" style={{ color: '#6b7280' }}>Hasta</label>
          <input type="date" className="form-control form-control-sm border-0 text-white"
            style={{ background: '#1f2937', borderRadius: 8 }}
            value={filters.dateTo || ''}
            onChange={(e) => setFilters({ ...filters, dateTo: e.target.value || undefined })} />
        </div>
        <div style={{ minWidth: 160, flex: '1 0 auto' }}>
          <label className="form-label small mb-1" style={{ color: '#6b7280' }}>Categoría</label>
          <select className="form-select form-select-sm border-0 text-white"
            style={{ background: '#1f2937', borderRadius: 8 }}
            value={filters.categoryId || ''}
            onChange={(e) => setFilters({ ...filters, categoryId: e.target.value || undefined })}>
            <option value="" style={{ background: '#111827' }}>Todas</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id} style={{ background: '#111827' }}>{c.name}</option>
            ))}
          </select>
        </div>
        <div className="d-flex gap-1" style={{ paddingBottom: 2 }}>
          <button className="btn btn-sm border-0 fw-semibold px-3" style={{ borderRadius: 8, background: '#1f2937', color: '#9ca3af' }}
            onClick={resetFilters}>Limpiar</button>
          <button className="btn btn-sm border-0 d-flex align-items-center justify-content-center"
            style={{ borderRadius: 8, background: '#2d0f0f', color: '#ef4444', width: 34, height: 31 }}
            onClick={() => refetch()}>
            <i className="bi bi-arrow-clockwise"></i>
          </button>
        </div>
      </div>

      {/* Expense list */}
      <div className="rounded-3" style={{ background: '#111827', border: '1px solid #1f2937' }}>
        {loading ? (
          <div className="text-center py-5">
            <div className="spinner-border" style={{ color: '#6b7280', width: 24, height: 24 }} role="status" />
          </div>
        ) : expenses.length === 0 ? (
          <div className="text-center py-5" style={{ color: '#6b7280' }}>
            <i className="bi bi-inbox fs-1 d-block mb-3" style={{ color: '#374151' }}></i>
            No hay gastos registrados
          </div>
        ) : (
          expenses.map((exp, i) => {
            const method = METHOD_STYLES[exp.payment_method];
            const dateParts = exp.date.split('-');
            return (
              <div key={exp.id}
                className="d-flex align-items-center gap-2 gap-sm-3 px-2 px-sm-3 py-2 py-sm-3"
                style={{ borderBottom: i < expenses.length - 1 ? '1px solid #1f2937' : 'none' }}>
                {/* Date badge - hidden on xs */}
                <div className="text-center d-none d-sm-block" style={{ minWidth: 40 }}>
                  <div style={{ color: '#9ca3af', fontSize: '0.65rem', lineHeight: 1 }}>{['dom', 'lun', 'mar', 'mié', 'jue', 'vie', 'sáb'][new Date(exp.date).getDay()]}</div>
                  <div style={{ color: '#fff', fontSize: '1rem', fontWeight: 700, lineHeight: 1.2 }}>{dateParts[2]}</div>
                  <div style={{ color: '#6b7280', fontSize: '0.6rem', lineHeight: 1 }}>{dateParts[1]}/{dateParts[0].slice(2)}</div>
                </div>

                {/* Description + meta */}
                <div className="flex-grow-1 min-width-0">
                  <div className="d-flex align-items-center gap-1 gap-sm-2" style={{ flexWrap: 'wrap' }}>
                    <span style={{ color: '#fff', fontWeight: 500, fontSize: '0.85rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {exp.description || <span style={{ color: '#6b7280', fontStyle: 'italic' }}>Sin descripción</span>}
                    </span>
                    {exp.is_ant_expense && (
                      <span className="badge border-0" style={{ background: '#1e1508', color: '#fbbf24', fontSize: '0.6rem', fontWeight: 500, padding: '2px 5px' }}>Hormiga</span>
                    )}
                    {exp.is_recurring && (
                      <span className="badge border-0" style={{ background: '#0f1d35', color: '#60a5fa', fontSize: '0.6rem', fontWeight: 500, padding: '2px 5px' }}>Recurrente</span>
                    )}
                  </div>
                  <div className="d-flex align-items-center gap-1 gap-sm-2 mt-1" style={{ flexWrap: 'wrap' }}>
                    <span className="badge border-0" style={{ background: '#1f2937', color: '#9ca3af', fontSize: '0.65rem', fontWeight: 400 }}>
                      {exp.category?.name || '—'}
                    </span>
                    {method && (
                      <span className="badge border-0 d-none d-sm-inline" style={{ background: method.bg, color: method.color, fontSize: '0.65rem', fontWeight: 400 }}>
                        {method.label}
                      </span>
                    )}
                    <span className="d-none d-sm-inline" style={{ color: '#4b5563', fontSize: '0.6rem' }}>
                      {dateParts[2]}/{dateParts[1]}/{dateParts[0]}
                    </span>
                    <span className="d-sm-none" style={{ color: '#4b5563', fontSize: '0.6rem' }}>
                      {dateParts[2]}/{dateParts[1]}
                    </span>
                  </div>
                </div>

                {/* Amount + delete */}
                <div className="text-end flex-shrink-0">
                  <div style={{ color: exp.is_ant_expense ? '#fbbf24' : '#fca5a5', fontSize: '0.85rem', fontWeight: 700, whiteSpace: 'nowrap' }}>
                    -{formatCurrency(Number(exp.amount))}
                  </div>
                  <button className="btn btn-sm border-0 d-inline-flex align-items-center justify-content-center"
                    onClick={() => handleDelete(exp.id)} disabled={deleting === exp.id}
                    style={{ width: 32, height: 32, borderRadius: 6, background: 'transparent', color: '#4b5563', padding: 0 }}
                    onMouseEnter={(e) => e.currentTarget.style.background = '#2d0f0f'}
                    onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}>
                    {deleting === exp.id ? (
                      <span className="spinner-border spinner-border-sm" style={{ width: 12, height: 12 }} />
                    ) : (
                      <i className="bi bi-trash" style={{ fontSize: 13 }}></i>
                    )}
                  </button>
                </div>
              </div>
            );
          })
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="d-flex justify-content-between align-items-center px-3 py-2"
            style={{ borderTop: '1px solid #1f2937' }}>
            <span style={{ color: '#6b7280', fontSize: '0.8rem' }}>Pág. {page} de {totalPages}</span>
            <div className="d-flex" style={{ gap: 4 }}>
              <button className="btn btn-sm border-0 d-inline-flex align-items-center justify-content-center"
                onClick={prevPage} disabled={page <= 1}
                style={{ borderRadius: 6, background: page > 1 ? '#1f2937' : 'transparent', color: '#9ca3af', width: 30, height: 30, opacity: page <= 1 ? 0.3 : 1 }}>
                <i className="bi bi-chevron-left"></i>
              </button>
              <span className="btn btn-sm border-0 d-inline-flex align-items-center justify-content-center"
                style={{ borderRadius: 6, background: '#2d0f0f', color: '#ef4444', fontSize: '0.8rem', padding: '4px 10px', fontWeight: 600 }}>
                {page}
              </span>
              <button className="btn btn-sm border-0 d-inline-flex align-items-center justify-content-center"
                onClick={nextPage} disabled={page >= totalPages}
                style={{ borderRadius: 6, background: page < totalPages ? '#1f2937' : 'transparent', color: '#9ca3af', width: 30, height: 30, opacity: page >= totalPages ? 0.3 : 1 }}>
                <i className="bi bi-chevron-right"></i>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
          <div className="modal d-block" tabIndex={-1} style={{ background: 'rgba(0,0,0,0.7)' }}>
            <div className="modal-dialog modal-fullscreen-sm-down modal-lg modal-dialog-centered">
            <div className="modal-content border-0" style={{ background: '#111827', borderRadius: 16 }}>
              <div className="modal-header border-0 px-4 pt-4">
                <h5 className="modal-title text-white d-flex align-items-center gap-2 fw-bold">
                  <i className="bi bi-plus-circle" style={{ color: '#ef4444' }}></i>
                  Nuevo gasto
                </h5>
                <button type="button" className="btn-close btn-close-white" onClick={() => setShowModal(false)} style={{ opacity: 0.5 }}></button>
              </div>
              <div className="modal-body px-4 pb-4 pt-0">
                <ExpenseForm
                  categories={categories}
                  onSubmit={handleCreate}
                  onCancel={() => setShowModal(false)}
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
