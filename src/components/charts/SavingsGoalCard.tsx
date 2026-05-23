'use client';

import { useState, useEffect, useRef } from 'react';
import { createSupabaseClient } from '@/infrastructure/supabase/client';
import { useHousehold } from '@/context/HouseholdContext';
import { useMonth } from '@/context/MonthContext';

const supabase = createSupabaseClient();

function formatCurrency(n: number) {
  return new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', minimumFractionDigits: 2 }).format(n);
}

interface SavingsProgress {
  goal: number;
  saved: number;
  percentage: number;
}

async function fetchSavingsProgress(householdId: string, year: number, month: number): Promise<SavingsProgress | null> {
  const { data } = await supabase.rpc('get_savings_progress', {
    p_household_id: householdId,
    p_year: year,
    p_month: month,
  });
  if (!data || data.length === 0) return null;
  return {
    goal: Number(data[0].goal),
    saved: Number(data[0].saved),
    percentage: Number(data[0].percentage),
  };
}

const glassCard: React.CSSProperties = {
  background: 'rgba(255,255,255,0.04)',
  backdropFilter: 'blur(24px)',
  WebkitBackdropFilter: 'blur(24px)',
  border: '1px solid rgba(255,255,255,0.08)',
  borderRadius: 16,
};

export function SavingsGoalCard() {
  const { household, refresh } = useHousehold();
  const { year, month } = useMonth();

  const [progress, setProgress] = useState<SavingsProgress | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [editValue, setEditValue] = useState('');
  const mountedRef = useRef(true);

  const goal = household?.monthly_savings_goal ?? 0;
  const saved = progress?.saved ?? 0;
  const percentage = progress?.percentage ?? 0;

  useEffect(() => {
    if (!household?.id) return;
    mountedRef.current = true;
    fetchSavingsProgress(household.id, year, month).then((p) => {
      if (mountedRef.current) setProgress(p);
    }).finally(() => {
      if (mountedRef.current) setLoading(false);
    });
    return () => { mountedRef.current = false; };
  }, [household?.id, year, month]);

  function handleSave() {
    if (!household?.id) return;
    const amount = parseFloat(editValue);
    if (isNaN(amount) || amount < 0) return;

    supabase
      .from('households')
      .update({ monthly_savings_goal: amount })
      .eq('id', household.id)
      .then(({ error }) => {
        if (!error) {
          setEditing(false);
          refresh();
        }
      });
  }

  if (goal === 0 && !loading) {
    return (
      <div className="h-100 p-3" style={glassCard}>
        <div className="d-flex justify-content-between align-items-start">
          <div>
            <h6 className="mb-1" style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.85rem', fontWeight: 500 }}>
              <i className="bi bi-piggy-bank me-1"></i>Meta de ahorro
            </h6>
            <p className="mb-2 small" style={{ color: 'rgba(255,255,255,0.3)' }}>Define una meta de ahorro mensual</p>
            {editing ? (
              <div className="d-flex gap-2">
                <input type="number" className="form-control form-control-sm border-0 text-white"
                  style={{ maxWidth: 150, background: 'rgba(255,255,255,0.06)', borderRadius: 8 }}
                  value={editValue} onChange={(e) => setEditValue(e.target.value)}
                  autoFocus min={0} step={1000} />
                <button className="btn btn-sm border-0 text-white d-flex align-items-center justify-content-center"
                  onClick={handleSave}
                  style={{ width: 32, height: 32, borderRadius: 8, background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)' }}>
                  <i className="bi bi-check"></i>
                </button>
                <button className="btn btn-sm border-0 d-flex align-items-center justify-content-center"
                  onClick={() => setEditing(false)}
                  style={{ width: 32, height: 32, borderRadius: 8, background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.5)' }}>
                  <i className="bi bi-x"></i>
                </button>
              </div>
            ) : (
              <button className="btn btn-sm border-0 px-3"
                onClick={() => { setEditValue(''); setEditing(true); }}
                style={{ borderRadius: 8, background: 'rgba(59,130,246,0.12)', color: 'rgba(59,130,246,0.8)' }}>
                <i className="bi bi-plus-circle me-1"></i>Definir meta
              </button>
            )}
          </div>
          <div style={{ fontSize: '1.5rem', color: 'rgba(6,182,212,0.2)' }}>
            <i className="bi bi-piggy-bank"></i>
          </div>
        </div>
      </div>
    );
  }

  const statusColor = percentage >= 100 ? '#22c55e' : percentage >= 50 ? '#06b6d4' : 'rgba(255,255,255,0.3)';

  return (
    <div className="h-100 p-3" style={glassCard}>
      <div className="d-flex justify-content-between align-items-start mb-2">
        <h6 className="mb-0" style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.85rem', fontWeight: 500 }}>
          <i className="bi bi-piggy-bank me-1"></i>Ahorro mensual
        </h6>
        <button className="btn btn-sm border-0 d-flex align-items-center justify-content-center"
          onClick={() => { setEditValue(String(goal)); setEditing(true); }}
          title="Editar meta"
          style={{ width: 28, height: 28, borderRadius: 8, background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.3)' }}>
          <i className="bi bi-pencil" style={{ fontSize: 12 }}></i>
        </button>
      </div>

      {editing ? (
        <div className="d-flex gap-2">
          <input type="number" className="form-control form-control-sm border-0 text-white"
            style={{ maxWidth: 150, background: 'rgba(255,255,255,0.06)', borderRadius: 8 }}
            value={editValue} onChange={(e) => setEditValue(e.target.value)}
            autoFocus min={0} step={1000} />
          <button className="btn btn-sm border-0 text-white d-flex align-items-center justify-content-center"
            onClick={handleSave}
            style={{ width: 32, height: 32, borderRadius: 8, background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)' }}>
            <i className="bi bi-check"></i>
          </button>
          <button className="btn btn-sm border-0 d-flex align-items-center justify-content-center"
            onClick={() => setEditing(false)}
            style={{ width: 32, height: 32, borderRadius: 8, background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.5)' }}>
            <i className="bi bi-x"></i>
          </button>
        </div>
      ) : (
        <>
          <div className="mb-2">
            <span className="fs-3 fw-bold" style={{ color: '#06b6d4' }}>{formatCurrency(saved)}</span>
            <span className="ms-2" style={{ color: 'rgba(255,255,255,0.3)' }}>/ {formatCurrency(goal)}</span>
          </div>
          <div className="progress" style={{ height: 8, background: 'rgba(255,255,255,0.06)' }}>
            <div className="progress-bar" role="progressbar"
              style={{ width: `${Math.min(100, percentage)}%`, background: statusColor, borderRadius: 4 }}
              aria-valuenow={percentage} aria-valuemin={0} aria-valuemax={100} />
          </div>
          <small className="mt-1 d-block" style={{ color: statusColor }}>
            {percentage.toFixed(1)}% de la meta
            {percentage >= 100 && ' ¡Meta cumplida!'}
          </small>
        </>
      )}
    </div>
  );
}
