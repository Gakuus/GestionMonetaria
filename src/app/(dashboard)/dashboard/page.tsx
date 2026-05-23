'use client';

import { useState } from 'react';
import { useDashboard } from '@/hooks/useDashboard';
import { useMonth } from '@/context/MonthContext';
import { MonthlyBarChart } from '@/components/charts/MonthlyBarChart';
import { DailyTrendChart } from '@/components/charts/DailyTrendChart';
import { ExpensePieChart } from '@/components/charts/ExpensePieChart';
import { WalletCards } from '@/components/charts/WalletCards';
import { SavingsGoalCard } from '@/components/charts/SavingsGoalCard';
import { useBudgets } from '@/hooks/useBudgets';
import { usePendingBills } from '@/hooks/usePendingBills';
import { useSubscriptions } from '@/hooks/useSubscriptions';

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

const sectionTitle: React.CSSProperties = {
  color: 'rgba(255,255,255,0.4)',
  fontSize: '0.85rem',
  fontWeight: 500,
  letterSpacing: '0.02em',
};

export default function DashboardPage() {
  const { data, loading, error } = useDashboard();
  const { label, isCurrentMonth } = useMonth();
  const { budgets: budgetAlerts } = useBudgets();
  const { bills: pendingBills } = usePendingBills();
  const { subscriptions } = useSubscriptions();
  const [chartView, setChartView] = useState<'monthly' | 'daily'>('monthly');

  if (error) {
    return (
      <div className="d-flex align-items-center gap-2 px-3 py-2 small rounded-3"
        style={{ background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.2)', color: '#fca5a5' }}>
        <i className="bi bi-exclamation-triangle-fill" style={{ color: '#ef4444' }}></i>
        {error}
      </div>
    );
  }

  function GlassCard({ children, style, className }: { children: React.ReactNode; style?: React.CSSProperties; className?: string }) {
    return (
      <div className={className} style={{ ...glassCard, ...style }}>
        {children}
      </div>
    );
  }

  return (
    <div>
      <div className="d-flex align-items-center gap-2 mb-4">
        <div className="d-flex align-items-center justify-content-center rounded-2"
          style={{ width: 32, height: 32, background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)' }}>
          <i className="bi bi-speedometer2 text-white small"></i>
        </div>
        <h5 className="fw-bold text-white mb-0">Dashboard</h5>
        <span className="ms-auto small" style={{ color: 'rgba(255,255,255,0.35)' }}>{label}</span>
      </div>

      {/* Summary Cards */}
      <div className="row g-3 mb-4">
        <div className="col-md-4">
          <GlassCard className="h-100 p-3">
            <div className="d-flex justify-content-between align-items-start">
              <div>
                <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.8rem', fontWeight: 500 }}>
                  <i className="bi bi-graph-up-arrow me-1"></i>Ingresos
                </div>
                <h3 className={`fw-bold mt-1 mb-0 ${loading ? 'placeholder-glow' : ''}`} style={{ color: '#22c55e', fontSize: 'clamp(1.1rem, 4vw, 1.75rem)' }}>
                  {loading ? <span className="placeholder col-8"></span> : formatCurrency(data?.summary.total_incomes ?? 0)}
                </h3>
              </div>
              <div style={{ fontSize: '1.5rem', color: 'rgba(34,197,94,0.2)' }}>
                <i className="bi bi-arrow-down-circle"></i>
              </div>
            </div>
          </GlassCard>
        </div>
        <div className="col-md-4">
          <GlassCard className="h-100 p-3">
            <div className="d-flex justify-content-between align-items-start">
              <div>
                <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.8rem', fontWeight: 500 }}>
                  <i className="bi bi-cash-stack me-1"></i>Gastos
                </div>
                <h3 className={`fw-bold mt-1 mb-0 ${loading ? 'placeholder-glow' : ''}`} style={{ color: '#ef4444', fontSize: 'clamp(1.1rem, 4vw, 1.75rem)' }}>
                  {loading ? <span className="placeholder col-8"></span> : formatCurrency(data?.summary.total_expenses ?? 0)}
                </h3>
              </div>
              <div style={{ fontSize: '1.5rem', color: 'rgba(239,68,68,0.2)' }}>
                <i className="bi bi-arrow-up-circle"></i>
              </div>
            </div>
          </GlassCard>
        </div>
        <div className="col-md-4">
          <GlassCard className="h-100 p-3">
            <div className="d-flex justify-content-between align-items-start">
              <div>
                <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.8rem', fontWeight: 500 }}>
                  <i className="bi bi-wallet2 me-1"></i>Balance
                </div>
                <h3 className={`fw-bold mt-1 mb-0 ${loading ? 'placeholder-glow' : ''}`}
                  style={{ color: (data?.summary.balance ?? 0) >= 0 ? '#22c55e' : '#ef4444', fontSize: 'clamp(1.1rem, 4vw, 1.75rem)' }}>
                  {loading ? <span className="placeholder col-8"></span> : formatCurrency(data?.summary.balance ?? 0)}
                </h3>
              </div>
              <div style={{ fontSize: '1.5rem', color: (data?.summary.balance ?? 0) >= 0 ? 'rgba(34,197,94,0.2)' : 'rgba(239,68,68,0.2)' }}>
                <i className={`bi bi-${(data?.summary.balance ?? 0) >= 0 ? 'check-circle' : 'exclamation-circle'}`}></i>
              </div>
            </div>
          </GlassCard>
        </div>
      </div>

      {/* Savings goal */}
      <div className="row g-3 mb-4">
        <div className="col-md-4">
          <SavingsGoalCard />
        </div>
      </div>

      {/* Quick summaries */}
      {!loading && (
        <div className="row g-3 mb-4">
          <div className="col-md-4">
            <GlassCard className="h-100 p-3">
              <div className="d-flex align-items-center gap-3">
                <div style={{ fontSize: '1.5rem', color: 'rgba(245,158,11,0.35)' }}>
                  <i className="bi bi-receipt"></i>
                </div>
                <div>
                  <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.8rem', fontWeight: 500 }}>Cuentas pendientes</div>
                  <span className="fw-bold" style={{ color: '#f59e0b' }}>
                    {formatCurrency(pendingBills.filter((b) => !b.paid).reduce((s, b) => s + Number(b.amount), 0))}
                  </span>
                  <span className="ms-2" style={{ color: 'rgba(255,255,255,0.3)' }}>
                    ({pendingBills.filter((b) => !b.paid).length})
                  </span>
                </div>
              </div>
            </GlassCard>
          </div>
          <div className="col-md-4">
            <GlassCard className="h-100 p-3">
              <div className="d-flex align-items-center gap-3">
                <div style={{ fontSize: '1.5rem', color: 'rgba(59,130,246,0.35)' }}>
                  <i className="bi bi-arrow-repeat"></i>
                </div>
                <div>
                  <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.8rem', fontWeight: 500 }}>Suscripciones/mes</div>
                  {(() => {
                    const total = subscriptions.reduce((s, sub) => {
                      const m = sub.billing_period === 'yearly' ? Number(sub.amount) / 12 : Number(sub.amount);
                      return s + m;
                    }, 0);
                    const pending = subscriptions.filter((s) => !s.paid).reduce((s, sub) => {
                      const m = sub.billing_period === 'yearly' ? Number(sub.amount) / 12 : Number(sub.amount);
                      return s + m;
                    }, 0);
                    const paid = total - pending;
                    return (
                      <>
                        <span className="fw-bold text-white">{formatCurrency(total)}</span>
                        <span className="ms-2" style={{ color: 'rgba(255,255,255,0.3)' }}>({subscriptions.length})</span>
                        {pending > 0 && (
                          <>
                            <div className="mt-1">
                              <span style={{ color: '#22c55e', fontSize: '0.85rem' }}>
                                <i className="bi bi-check-circle me-1"></i>Pagado: {formatCurrency(paid)}
                              </span>
                            </div>
                            <div>
                              <span style={{ color: '#f59e0b', fontSize: '0.85rem' }}>
                                <i className="bi bi-hourglass-split me-1"></i>Pendiente: {formatCurrency(pending)}
                              </span>
                            </div>
                          </>
                        )}
                      </>
                    );
                  })()}
                </div>
              </div>
            </GlassCard>
          </div>
        </div>
      )}

      {/* Financial health */}
      {!loading && (data?.summary?.total_incomes ?? 0) > 0 && (
        <div className="row g-3 mb-4">
          <div className="col-12">
            <GlassCard className="p-3">
              <h6 style={{ ...sectionTitle, marginBottom: 12 }}>
                <i className="bi bi-calculator me-1"></i>Análisis financiero
              </h6>
              {(() => {
                const incomes = Number(data?.summary?.total_incomes ?? 0);
                const expenses = Number(data?.summary?.total_expenses ?? 0);
                const pendingBillsTotal = pendingBills.filter((b) => !b.paid).reduce((s, b) => s + Number(b.amount), 0);
                const pendingSubs = subscriptions.filter((s) => !s.paid).reduce((s, sub) => {
                  return s + (sub.billing_period === 'yearly' ? Number(sub.amount) / 12 : Number(sub.amount));
                }, 0);
                const available = incomes - expenses - pendingBillsTotal - pendingSubs;
                return (
                  <div className="row g-2">
                    <div className="col-6 col-md-3">
                      <div className="p-2 rounded-2" style={{ borderLeft: '3px solid #22c55e', background: 'rgba(34,197,94,0.06)' }}>
                        <small style={{ color: 'rgba(255,255,255,0.4)' }}>Ingresos</small>
                        <div className="fw-bold" style={{ color: '#22c55e', fontSize: 'clamp(0.8rem, 3vw, 1rem)' }}>{formatCurrency(incomes)}</div>
                      </div>
                    </div>
                    <div className="col-6 col-md-3">
                      <div className="p-2 rounded-2" style={{ borderLeft: '3px solid #ef4444', background: 'rgba(239,68,68,0.06)' }}>
                        <small style={{ color: 'rgba(255,255,255,0.4)' }}>Ya gastado</small>
                        <div className="fw-bold" style={{ color: '#ef4444', fontSize: 'clamp(0.8rem, 3vw, 1rem)' }}>{formatCurrency(expenses)}</div>
                      </div>
                    </div>
                    <div className="col-6 col-md-3">
                      <div className="p-2 rounded-2" style={{ borderLeft: '3px solid #f59e0b', background: 'rgba(245,158,11,0.06)' }}>
                        <small style={{ color: 'rgba(255,255,255,0.4)' }}>Por pagar aún</small>
                        <div className="fw-bold" style={{ color: '#f59e0b', fontSize: 'clamp(0.8rem, 3vw, 1rem)' }}>{formatCurrency(pendingBillsTotal + pendingSubs)}</div>
                        <small className="d-none d-sm-block" style={{ color: 'rgba(255,255,255,0.3)' }}>
                          ({pendingBills.filter((b) => !b.paid).length} cuentas, {subscriptions.filter((s) => !s.paid).length} suscripciones)
                        </small>
                      </div>
                    </div>
                    <div className="col-6 col-md-3">
                      <div className="p-2 rounded-2" style={{ borderLeft: '3px solid #3b82f6', background: 'rgba(59,130,246,0.06)' }}>
                        <small style={{ color: 'rgba(255,255,255,0.4)' }}>Disponible</small>
                        <div className="fw-bold" style={{ color: available >= 0 ? '#22c55e' : '#ef4444', fontSize: 'clamp(0.8rem, 3vw, 1rem)' }}>{formatCurrency(available)}</div>
                      </div>
                    </div>
                  </div>
                );
              })()}
            </GlassCard>
          </div>
        </div>
      )}

      {/* Charts row */}
      <div className="row g-3 mb-4">
        <div className="col-md-8">
          <GlassCard className="h-100 p-3">
            <div className="d-flex justify-content-between align-items-center mb-3">
              <h6 style={sectionTitle}>
                <i className="bi bi-bar-chart-line me-1"></i>
                {chartView === 'monthly' ? 'Evolución mensual' : 'Tendencia diaria'}
              </h6>
              <div className="d-flex" style={{ gap: 4 }}>
                <button
                  className="btn btn-sm border-0 px-3"
                  style={{
                    borderRadius: 8,
                    background: chartView === 'monthly' ? 'linear-gradient(135deg, #3b82f6, #8b5cf6)' : 'rgba(255,255,255,0.06)',
                    color: chartView === 'monthly' ? '#fff' : 'rgba(255,255,255,0.5)',
                    transition: 'background .2s',
                  }}
                  onClick={() => setChartView('monthly')}>
                  Mensual
                </button>
                <button
                  className="btn btn-sm border-0 px-3"
                  style={{
                    borderRadius: 8,
                    background: chartView === 'daily' ? 'linear-gradient(135deg, #3b82f6, #8b5cf6)' : 'rgba(255,255,255,0.06)',
                    color: chartView === 'daily' ? '#fff' : 'rgba(255,255,255,0.5)',
                    transition: 'background .2s',
                  }}
                  onClick={() => setChartView('daily')}>
                  Diaria
                </button>
              </div>
            </div>
            {loading ? (
              <div className="d-flex justify-content-center align-items-center" style={{ height: 250 }}>
                <div className="spinner-border spinner-border-sm" style={{ color: 'rgba(255,255,255,0.3)' }} role="status" />
              </div>
            ) : chartView === 'monthly' ? (
              <div style={{ height: 250 }}>
                <MonthlyBarChart
                  labels={(data?.evolution ?? []).map((e) => e.label)}
                  incomes={(data?.evolution ?? []).map((e) => Number(e.incomes))}
                  expenses={(data?.evolution ?? []).map((e) => Number(e.expenses))}
                />
              </div>
            ) : (
              <div style={{ height: 250 }}>
                <DailyTrendChart
                  labels={(data?.daily_totals ?? []).map((d) => {
                    const parts = d.date.split('-');
                    return `${parseInt(parts[2])}/${parseInt(parts[1])}`;
                  })}
                  incomes={(data?.daily_totals ?? []).map((d) => Number(d.incomes))}
                  expenses={(data?.daily_totals ?? []).map((d) => Number(d.expenses))}
                  isWeekend={(data?.daily_totals ?? []).map((d) => d.is_weekend)}
                />
              </div>
            )}
          </GlassCard>
        </div>
        <div className="col-md-4">
          <GlassCard className="h-100 p-3">
            <h6 style={{ ...sectionTitle, marginBottom: 12 }}>
              <i className="bi bi-pie-chart me-1"></i>Gastos por categoría
            </h6>
            {loading ? (
              <div className="d-flex justify-content-center align-items-center" style={{ height: 250 }}>
                <div className="spinner-border spinner-border-sm" style={{ color: 'rgba(255,255,255,0.3)' }} role="status" />
              </div>
            ) : (
              <div style={{ height: 250 }}>
                <ExpensePieChart
                  labels={(data?.expenses_by_category ?? []).map((c) => c.category_name)}
                  values={(data?.expenses_by_category ?? []).map((c) => Number(c.total))}
                />
              </div>
            )}
          </GlassCard>
        </div>
      </div>

      {/* Budget alerts */}
      {budgetAlerts.filter((b) => b.percentage >= 75).length > 0 && (
        <div className="mb-4">
          <h6 style={{ ...sectionTitle, marginBottom: 12 }}>
            <i className="bi bi-exclamation-triangle me-1"></i>Alertas de presupuesto
          </h6>
          <div className="row g-2">
            {budgetAlerts.filter((b) => b.percentage >= 75).map((b) => {
              const over = b.percentage >= 100;
              return (
                <div className="col-md-4" key={b.id}>
                  <GlassCard className="h-100 p-3">
                    <div className="d-flex align-items-center gap-3">
                      <div style={{ fontSize: '1.2rem', color: over ? 'rgba(239,68,68,0.4)' : 'rgba(245,158,11,0.4)' }}>
                        <i className={`bi bi-${over ? 'exclamation-circle-fill' : 'exclamation-triangle-fill'}`}></i>
                      </div>
                      <div>
                        <div className="fw-medium text-white">{b.category?.name}</div>
                        <div style={{ fontSize: '0.85rem' }}>
                          <span style={{ color: over ? '#ef4444' : '#f59e0b', fontWeight: 600 }}>
                            {formatCurrency(b.spent)} / {formatCurrency(b.amount)}
                          </span>
                          <span style={{ color: 'rgba(255,255,255,0.3)' }}> ({b.percentage.toFixed(0)}%)</span>
                        </div>
                      </div>
                    </div>
                  </GlassCard>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Wallet cards */}
      <div className="mb-4">
        <h6 style={{ ...sectionTitle, marginBottom: 12 }}>
          <i className="bi bi-wallet2 me-1"></i>Gastos por método de pago
        </h6>
        {loading ? (
          <div className="d-flex justify-content-center py-3">
            <div className="spinner-border spinner-border-sm" style={{ color: 'rgba(255,255,255,0.3)' }} role="status" />
          </div>
        ) : (
          <WalletCards
            data={data?.payment_methods ?? []}
            totalExpenses={data?.summary.total_expenses ?? 0}
          />
        )}
      </div>

      {/* Bottom row */}
      <div className="row g-3">
        <div className="col-md-7">
          <GlassCard className="h-100 p-3">
            <h6 style={{ ...sectionTitle, marginBottom: 12 }}>
              <i className="bi bi-clock-history me-1"></i>Últimos gastos
            </h6>
            {loading ? (
              <div className="d-flex justify-content-center py-3">
                <div className="spinner-border" style={{ color: '#6b7280', width: 20, height: 20 }} role="status" />
              </div>
            ) : (data?.recent_expenses ?? []).length === 0 ? (
              <p style={{ color: '#6b7280' }}>No hay gastos en {label}</p>
            ) : (
              <div className="d-flex flex-column" style={{ gap: 6 }}>
                {(data?.recent_expenses ?? []).map((exp) => {
                  const dateParts = exp.date.split('-');
                  return (
                    <div key={exp.id}
                      className="d-flex align-items-center gap-2 gap-sm-3 px-2 px-sm-3 py-2 rounded-2"
                      style={{ background: '#111827' }}>
                      <div className="text-center d-none d-sm-block" style={{ minWidth: 32 }}>
                        <div style={{ color: '#fff', fontSize: '0.95rem', fontWeight: 700, lineHeight: 1.2 }}>{dateParts[2]}</div>
                        <div style={{ color: '#6b7280', fontSize: '0.55rem', lineHeight: 1 }}>{dateParts[1]}</div>
                      </div>
                      <div className="flex-grow-1 min-width-0">
                        <div style={{ color: '#fff', fontSize: '0.85rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {exp.description || <span style={{ color: '#6b7280', fontStyle: 'italic' }}>Sin descripción</span>}
                        </div>
                        <div className="d-flex align-items-center gap-1 mt-1" style={{ flexWrap: 'wrap' }}>
                          <span className="badge border-0" style={{ background: '#1f2937', color: '#9ca3af', fontWeight: 400, fontSize: '0.6rem', padding: '2px 5px' }}>
                            {exp.category?.name || '—'}
                          </span>
                          {exp.is_ant_expense && (
                            <span className="badge border-0" style={{ background: '#1e1508', color: '#fbbf24', fontWeight: 400, fontSize: '0.6rem', padding: '2px 5px' }}>
                              Hormiga
                            </span>
                          )}
                        </div>
                      </div>
                      <div style={{ color: '#fca5a5', fontSize: 'clamp(0.75rem, 3vw, 0.9rem)', fontWeight: 700, whiteSpace: 'nowrap', flexShrink: 0 }}>
                        {formatCurrency(Number(exp.amount))}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </GlassCard>
        </div>
        <div className="col-md-5">
          <GlassCard className="h-100 p-3">
            <h6 style={{ ...sectionTitle, marginBottom: 12 }}>
              <i className="bi bi-bug me-1"></i>Gastos hormiga
            </h6>
            {loading ? (
              <div className="d-flex justify-content-center py-3">
                <div className="spinner-border spinner-border-sm" style={{ color: 'rgba(255,255,255,0.3)' }} role="status" />
              </div>
            ) : (
              <>
                <div className="mb-2">
                  <span className="fs-3 fw-bold" style={{ color: '#f59e0b' }}>
                    {formatCurrency(data?.ant_expenses_total ?? 0)}
                  </span>
                  <span style={{ color: 'rgba(255,255,255,0.3)' }} className="ms-2">este mes</span>
                </div>
                <div>
                  <span style={{ color: 'rgba(255,255,255,0.4)' }}>Proyección anual: </span>
                  <span className="fw-semibold" style={{ color: '#ef4444' }}>
                    {formatCurrency(data?.ant_expenses_projection ?? 0)}
                  </span>
                </div>
                {(data?.ant_expenses_total ?? 0) > 0 && (
                  <div className="mt-3">
                    <div className="progress" style={{ height: 6, background: 'rgba(255,255,255,0.06)' }}>
                      <div className="progress-bar" style={{
                        width: `${Math.min(100, ((data?.ant_expenses_total ?? 0) / (data?.summary.total_expenses ?? 1)) * 100)}%`,
                        background: '#f59e0b',
                        borderRadius: 3,
                      }} />
                    </div>
                    <small style={{ color: 'rgba(255,255,255,0.3)' }}>
                      {((data?.ant_expenses_total ?? 0) / (data?.summary.total_expenses ?? 1) * 100).toFixed(1)}% del total de gastos
                    </small>
                  </div>
                )}
                {!isCurrentMonth && (data?.ant_expenses_total ?? 0) === 0 && (
                  <p style={{ color: 'rgba(255,255,255,0.3)' }} className="mb-0 mt-2">Sin gastos hormiga detectados</p>
                )}
              </>
            )}
          </GlassCard>
        </div>
      </div>
    </div>
  );
}
