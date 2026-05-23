'use client';

import { useState, useMemo } from 'react';
import { useIncomes } from '@/hooks/useIncomes';
import { IncomeForm } from '@/components/forms/IncomeForm';
import type { IncomeInput } from '@/lib/validations/expenseSchema';

function formatCurrency(n: number) {
  return new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', minimumFractionDigits: 2 }).format(n);
}

export default function IncomesPage() {
  const {
    incomes, total, page, totalPages, loading, error,
    categories, create, remove, nextPage, prevPage,
  } = useIncomes();

  const [showModal, setShowModal] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);

  const totalAmount = useMemo(() =>
    incomes.reduce((s, inc) => s + Number(inc.amount), 0),
  [incomes]);

  const avgIncome = useMemo(() =>
    incomes.length > 0 ? totalAmount / incomes.length : 0,
  [incomes, totalAmount]);

  async function handleCreate(input: IncomeInput) {
    await create(input);
    setShowModal(false);
  }

  async function handleDelete(id: string) {
    if (!confirm('¿Eliminar este ingreso?')) return;
    setDeleting(id);
    await remove(id);
    setDeleting(null);
  }

  return (
    <div>
      {/* Header */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h4 className="fw-bold text-white mb-1">Ingresos</h4>
          {!loading && (
            <span style={{ color: '#9ca3af', fontSize: '0.85rem' }}>
              {total} registros · {formatCurrency(totalAmount)}
            </span>
          )}
        </div>
        <button className="btn d-flex align-items-center gap-2 text-white fw-semibold px-3"
          style={{ borderRadius: 10, background: 'linear-gradient(135deg, #22c55e, #16a34a)', height: 38, border: 'none', fontSize: '0.9rem' }}
          onClick={() => setShowModal(true)}>
          <i className="bi bi-plus-lg"></i>
          <span className="d-none d-sm-inline">Nuevo ingreso</span>
        </button>
      </div>

      {error && (
        <div className="alert alert-danger d-flex align-items-center gap-2 py-2 small mb-3 border-0 rounded-3" style={{ background: '#2d0f0f', color: '#fca5a5' }}>
          <i className="bi bi-exclamation-triangle-fill"></i>
          {error}
        </div>
      )}

      {/* Stats */}
        {!loading && incomes.length > 0 && (
        <div className="row g-2 mb-4">
          {[
            { label: 'TOTAL INGRESADO', value: formatCurrency(totalAmount), color: '#22c55e', bg: '#052e16' },
            { label: 'TRANSACCIONES', value: String(incomes.length), color: '#60a5fa', bg: '#0f1d35' },
            { label: 'PROMEDIO', value: formatCurrency(avgIncome), color: '#a78bfa', bg: '#1e1335' },
          ].map((s) => (
            <div key={s.label} className="col-6 col-md-4">
              <div className="rounded-3 p-2 text-center" style={{ background: s.bg, border: '1px solid rgba(255,255,255,0.04)' }}>
                <div style={{ color: s.color, fontSize: 'clamp(0.85rem, 4vw, 1.15rem)', fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.value}</div>
                <div style={{ color: '#6b7280', fontSize: '0.65rem', letterSpacing: '0.05em' }}>{s.label}</div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* List */}
      <div className="rounded-3" style={{ background: '#111827', border: '1px solid #1f2937' }}>
        {loading ? (
          <div className="text-center py-5">
            <div className="spinner-border" style={{ color: '#6b7280', width: 24, height: 24 }} role="status" />
          </div>
        ) : incomes.length === 0 ? (
          <div className="text-center py-5" style={{ color: '#6b7280' }}>
            <i className="bi bi-inbox fs-1 d-block mb-3" style={{ color: '#374151' }}></i>
            No hay ingresos registrados
          </div>
        ) : (
          incomes.map((inc, i) => {
            const dateParts = inc.date.split('-');
            return (
              <div key={inc.id}
                className="d-flex align-items-center gap-2 gap-sm-3 px-2 px-sm-3 py-2 py-sm-3"
                style={{ borderBottom: i < incomes.length - 1 ? '1px solid #1f2937' : 'none' }}>
                {/* Date badge */}
                <div className="text-center d-none d-sm-block" style={{ minWidth: 40 }}>
                  <div style={{ color: '#9ca3af', fontSize: '0.65rem', lineHeight: 1 }}>{['dom', 'lun', 'mar', 'mié', 'jue', 'vie', 'sáb'][new Date(inc.date).getDay()]}</div>
                  <div style={{ color: '#fff', fontSize: '1rem', fontWeight: 700, lineHeight: 1.2 }}>{dateParts[2]}</div>
                  <div style={{ color: '#6b7280', fontSize: '0.6rem', lineHeight: 1 }}>{dateParts[1]}/{dateParts[0].slice(2)}</div>
                </div>

                {/* Description + category */}
                <div className="flex-grow-1 min-width-0">
                  <div style={{ color: '#fff', fontWeight: 500, fontSize: '0.85rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {inc.description || <span style={{ color: '#6b7280', fontStyle: 'italic' }}>Sin descripción</span>}
                  </div>
                  <div className="mt-1 d-flex align-items-center gap-1 gap-sm-2" style={{ flexWrap: 'wrap' }}>
                    <span className="badge border-0" style={{ background: '#052e16', color: '#22c55e', fontSize: '0.65rem', fontWeight: 400 }}>
                      {inc.category?.name || '—'}
                    </span>
                    <span className="d-none d-sm-inline" style={{ color: '#4b5563', fontSize: '0.65rem' }}>
                      {dateParts[2]}/{dateParts[1]}/{dateParts[0]}
                    </span>
                    <span className="d-sm-none" style={{ color: '#4b5563', fontSize: '0.6rem' }}>
                      {dateParts[2]}/{dateParts[1]}
                    </span>
                  </div>
                </div>

                {/* Amount + delete */}
                <div className="text-end flex-shrink-0">
                  <div style={{ color: '#22c55e', fontSize: '0.85rem', fontWeight: 700, whiteSpace: 'nowrap' }}>
                    +{formatCurrency(Number(inc.amount))}
                  </div>
                  <button className="btn btn-sm border-0 d-inline-flex align-items-center justify-content-center mt-1"
                    onClick={() => handleDelete(inc.id)} disabled={deleting === inc.id}
                    style={{ width: 32, height: 32, borderRadius: 6, background: 'transparent', color: '#4b5563', padding: 0 }}
                    onMouseEnter={(e) => e.currentTarget.style.background = '#2d0f0f'}
                    onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}>
                    {deleting === inc.id ? (
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
                style={{ borderRadius: 6, background: '#052e16', color: '#22c55e', fontSize: '0.8rem', padding: '4px 10px', fontWeight: 600 }}>
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
                  <i className="bi bi-plus-circle" style={{ color: '#22c55e' }}></i>
                  Nuevo ingreso
                </h5>
                <button type="button" className="btn-close btn-close-white" onClick={() => setShowModal(false)} style={{ opacity: 0.5 }}></button>
              </div>
              <div className="modal-body px-4 pb-4 pt-0">
                <IncomeForm
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
