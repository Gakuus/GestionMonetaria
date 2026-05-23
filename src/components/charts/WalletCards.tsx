'use client';

import type { PaymentMethodTotal } from '@/application/ports/out/IExpenseRepository';

const METHOD_CONFIG: Record<string, { label: string; icon: string; color: string }> = {
  cash:     { label: 'Efectivo',   icon: 'bi-cash',            color: '#22c55e' },
  debit:    { label: 'Débito',     icon: 'bi-credit-card-2-front', color: '#3b82f6' },
  credit:   { label: 'Crédito',    icon: 'bi-credit-card',     color: '#ef4444' },
  transfer: { label: 'Transfer.',  icon: 'bi-arrow-left-right', color: '#8b5cf6' },
};

function formatCurrency(n: number) {
  return new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', minimumFractionDigits: 2 }).format(n);
}

interface Props {
  data: PaymentMethodTotal[];
  totalExpenses: number;
}

const glassCard: React.CSSProperties = {
  background: 'rgba(255,255,255,0.04)',
  backdropFilter: 'blur(24px)',
  WebkitBackdropFilter: 'blur(24px)',
  border: '1px solid rgba(255,255,255,0.08)',
  borderRadius: 16,
};

export function WalletCards({ data, totalExpenses }: Props) {
  const methods = ['cash', 'debit', 'credit', 'transfer'];
  const map = new Map(data.map((d) => [d.payment_method, d]));

  return (
    <div className="row g-2">
      {methods.map((key) => {
        const cfg = METHOD_CONFIG[key];
        const item = map.get(key);
        const total = item?.total ?? 0;
        const count = item?.transaction_count ?? 0;
        const pct = totalExpenses > 0 ? (total / totalExpenses) * 100 : 0;

        return (
          <div className="col-6 col-md-3" key={key}>
            <div className="h-100 p-3" style={glassCard}>
              <div className="text-center">
                <i className={`bi ${cfg.icon}`} style={{ fontSize: '1.5rem', color: cfg.color }}></i>
                <div className="mt-2">
                  <span className="fw-bold text-white">{formatCurrency(total)}</span>
                </div>
                <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.8rem' }}>{cfg.label}</div>
                {count > 0 && (
                  <div className="mt-2">
                    <div className="progress" style={{ height: 4, background: 'rgba(255,255,255,0.06)' }}>
                      <div className="progress-bar" style={{ width: `${pct}%`, backgroundColor: cfg.color }} />
                    </div>
                    <small style={{ color: 'rgba(255,255,255,0.3)', fontSize: '0.7rem' }}>{count} transacciones</small>
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
