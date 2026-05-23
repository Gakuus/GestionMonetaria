'use client';

import { useState } from 'react';
import type { ExpenseCategory, PaymentMethod } from '@/shared/types';
import type { ExpenseInput } from '@/lib/validations/expenseSchema';
import { expenseSchema } from '@/lib/validations/expenseSchema';

interface Props {
  categories: ExpenseCategory[];
  onSubmit: (input: ExpenseInput) => Promise<void>;
  onCancel: () => void;
  initial?: Partial<ExpenseInput>;
}

const inputDark: React.CSSProperties = {
  background: 'rgba(255,255,255,0.06)',
  border: '1px solid rgba(255,255,255,0.08)',
  borderRadius: 10,
  color: '#fff',
};

export function ExpenseForm({ categories, onSubmit, onCancel, initial }: Props) {
  const [amount, setAmount] = useState(initial?.amount?.toString() || '');
  const [date, setDate] = useState(initial?.date || new Date().toISOString().split('T')[0]);
  const [categoryId, setCategoryId] = useState(initial?.category_id || '');
  const [description, setDescription] = useState(initial?.description || '');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(initial?.payment_method || 'cash');
  const [isRecurring, setIsRecurring] = useState(initial?.is_recurring || false);
  const [recurringType, setRecurringType] = useState(initial?.recurring_type || 'monthly');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    const parsed = expenseSchema.safeParse({
      amount: amount ? parseFloat(amount) : undefined,
      date,
      category_id: categoryId || undefined,
      description,
      payment_method: paymentMethod,
      is_recurring: isRecurring,
      recurring_type: isRecurring ? recurringType : undefined,
    });

    if (!parsed.success) {
      setError(parsed.error.errors[0].message);
      return;
    }

    setLoading(true);
    try {
      await onSubmit(parsed.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al guardar');
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      {error && (
        <div className="d-flex align-items-center gap-2 px-3 py-2 small mb-3 rounded-3"
          style={{ background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.2)', color: '#fca5a5' }}>
          <i className="bi bi-exclamation-triangle-fill" style={{ color: '#ef4444' }}></i>
          {error}
        </div>
      )}

      <div className="row g-3">
        <div className="col-md-6">
          <label className="form-label small" style={{ color: 'rgba(255,255,255,0.5)' }}>Monto *</label>
          <input type="number" step="0.01" min="0.01" className="form-control border-0 text-white"
            style={inputDark} value={amount} onChange={(e) => setAmount(e.target.value)} required />
        </div>

        <div className="col-md-6">
          <label className="form-label small" style={{ color: 'rgba(255,255,255,0.5)' }}>Fecha *</label>
          <input type="date" className="form-control border-0 text-white"
            style={inputDark} value={date} onChange={(e) => setDate(e.target.value)} required />
        </div>

        <div className="col-md-6">
          <label className="form-label small" style={{ color: 'rgba(255,255,255,0.5)' }}>Categoría *</label>
          <select className="form-select border-0 text-white" style={inputDark}
            value={categoryId} onChange={(e) => setCategoryId(e.target.value)} required>
            <option value="" style={{ background: '#1a1a2e' }}>Seleccionar...</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id} style={{ background: '#1a1a2e' }}>{cat.name}</option>
            ))}
          </select>
        </div>

        <div className="col-md-6">
          <label className="form-label small" style={{ color: 'rgba(255,255,255,0.5)' }}>Método de pago *</label>
          <select className="form-select border-0 text-white" style={inputDark}
            value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)} required>
            <option value="cash" style={{ background: '#1a1a2e' }}>Efectivo</option>
            <option value="debit" style={{ background: '#1a1a2e' }}>Débito</option>
            <option value="credit" style={{ background: '#1a1a2e' }}>Crédito</option>
            <option value="transfer" style={{ background: '#1a1a2e' }}>Transferencia</option>
          </select>
        </div>

        <div className="col-12">
          <label className="form-label small" style={{ color: 'rgba(255,255,255,0.5)' }}>Descripción</label>
          <input type="text" className="form-control border-0 text-white" maxLength={255}
            style={inputDark} value={description} onChange={(e) => setDescription(e.target.value)} />
        </div>

        <div className="col-12">
          <div className="form-check">
            <input className="form-check-input" type="checkbox" id="isRecurring"
              checked={isRecurring} onChange={(e) => setIsRecurring(e.target.checked)}
              style={{ background: isRecurring ? 'rgba(59,130,246,0.6)' : 'rgba(255,255,255,0.06)', borderColor: 'rgba(255,255,255,0.15)' }} />
            <label className="form-check-label small" htmlFor="isRecurring" style={{ color: 'rgba(255,255,255,0.5)' }}>
              Gasto recurrente
            </label>
          </div>
        </div>

        {isRecurring && (
          <div className="col-md-6">
            <label className="form-label small" style={{ color: 'rgba(255,255,255,0.5)' }}>Periodicidad</label>
            <select className="form-select border-0 text-white" style={inputDark}
              value={recurringType} onChange={(e) => setRecurringType(e.target.value as 'weekly' | 'monthly' | 'yearly')}>
              <option value="weekly" style={{ background: '#1a1a2e' }}>Semanal</option>
              <option value="monthly" style={{ background: '#1a1a2e' }}>Mensual</option>
              <option value="yearly" style={{ background: '#1a1a2e' }}>Anual</option>
            </select>
          </div>
        )}
      </div>

      <div className="d-flex justify-content-end gap-2 mt-4">
        <button type="button" className="btn btn-sm border-0 px-3 py-2"
          onClick={onCancel}
          style={{ borderRadius: 10, background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.5)' }}>
          Cancelar
        </button>
        <button type="submit" className="btn btn-sm border-0 px-3 py-2 text-white d-flex align-items-center gap-1"
          disabled={loading}
          style={{ borderRadius: 10, background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)' }}>
          {loading ? <span className="spinner-border spinner-border-sm" role="status" /> : null}
          {loading ? 'Guardando...' : 'Guardar'}
        </button>
      </div>
    </form>
  );
}
