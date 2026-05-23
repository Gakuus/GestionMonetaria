'use client';

import { useMonth } from '@/context/MonthContext';
import { useHousehold } from '@/context/HouseholdContext';
import { createSupabaseClient } from '@/infrastructure/supabase/client';
import { useState, useEffect, useRef } from 'react';

const supabase = createSupabaseClient();

const MONTHS_SHORT = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];

interface MonthData {
  year: number;
  month: number;
  label: string;
  incomes: number;
  expenses: number;
  balance: number;
}

export function CalendarMonthPicker() {
  const { selectedDate, year, month, label, setSelectedDate, goToPrevMonth, goToNextMonth, goToToday, isCurrentMonth } = useMonth();
  const { household } = useHousehold();
  const [open, setOpen] = useState(false);
  const [data, setData] = useState<MonthData[]>([]);
  const [loadingData, setLoadingData] = useState(false);
  const [viewYear, setViewYear] = useState(year);
  const ref = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    if (open) document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [open]);

  // Fetch monthly data
  useEffect(() => {
    if (!household) return;
    setLoadingData(true);
    supabase.rpc('get_monthly_evolution', { p_household_id: household.id, p_months: 12 }).then(({ data: result }) => {
      if (result) setData(result as MonthData[]);
      setLoadingData(false);
    });
  }, [household]);

  const maxExpenses = Math.max(...data.map((d) => Number(d.expenses)), 1);

  function getIntensity(expenses: number): number {
    return Math.min(Number(expenses) / maxExpenses, 1);
  }

  function navigateTo(y: number, m: number) {
    setSelectedDate(new Date(y, m - 1, 1));
    setViewYear(y);
    setOpen(false);
  }

  return (
    <div ref={ref} className="position-relative">
      {/* Trigger button */}
      <button
        className="btn btn-sm d-flex align-items-center gap-1 gap-sm-2 fw-semibold px-2 px-sm-3"
        style={{
          borderRadius: 8,
          background: isCurrentMonth ? 'rgba(59,130,246,0.12)' : 'rgba(255,255,255,0.06)',
          color: isCurrentMonth ? '#60a5fa' : 'rgba(255,255,255,0.7)',
          border: '1px solid rgba(255,255,255,0.06)',
          height: 34,
          fontSize: '0.85rem',
        }}
        onClick={() => setOpen(!open)}>
        <i className="bi bi-calendar3"></i>
        <span className="d-none d-sm-inline">{label}</span>
        <span className="d-sm-none" style={{ fontSize: '0.75rem' }}>
          {label.split(' ')[0].slice(0, 3)} {label.split(' ')[1]}
        </span>
        <i className={`bi bi-chevron-${open ? 'up' : 'down'}`} style={{ fontSize: 10, opacity: 0.5 }}></i>
      </button>

      {/* Dropdown calendar */}
      {open && (
        <div
          className="position-absolute p-3 rounded-3 shadow-lg"
          style={{
            top: '100%',
            left: 0,
            right: 0,
            marginTop: 6,
            minWidth: 320,
            background: '#111827',
            border: '1px solid #1f2937',
            zIndex: 1050,
          }}>
          {/* Year nav */}
          <div className="d-flex align-items-center justify-content-between mb-3">
            <button className="btn btn-sm border-0 d-flex align-items-center justify-content-center"
              style={{ width: 28, height: 28, borderRadius: 6, background: '#1f2937', color: '#9ca3af' }}
              onClick={() => setViewYear(viewYear - 1)}>
              <i className="bi bi-chevron-left" style={{ fontSize: 11 }}></i>
            </button>
            <span style={{ color: '#fff', fontWeight: 600, fontSize: '0.9rem' }}>{viewYear}</span>
            <button className="btn btn-sm border-0 d-flex align-items-center justify-content-center"
              style={{ width: 28, height: 28, borderRadius: 6, background: '#1f2937', color: '#9ca3af' }}
              onClick={() => setViewYear(viewYear + 1)}>
              <i className="bi bi-chevron-right" style={{ fontSize: 11 }}></i>
            </button>
          </div>

          {/* Month grid: 4 cols x 3 rows */}
          <div className="row g-2">
            {Array.from({ length: 12 }, (_, i) => {
              const m = i + 1;
              const dot = data.find((d) => d.year === viewYear && d.month === m);
              const expenses = Number(dot?.expenses ?? 0);
              const intensity = dot ? getIntensity(expenses) : 0;
              const incomes = Number(dot?.incomes ?? 0);
              const isSelected = year === viewYear && month === m;
              const isFuture = viewYear > new Date().getFullYear() || (viewYear === new Date().getFullYear() && m > new Date().getMonth() + 1);

              // Color: green if balance positive, red if negative
              const bal = incomes - expenses;
              const fillColor = bal > 0 ? 'rgba(34,197,94,' : 'rgba(239,68,68,';

              return (
                <div key={i} className="col-3">
                  <button
                    className="btn btn-sm border-0 d-flex flex-column align-items-center w-100 py-2"
                    disabled={isFuture}
                    style={{
                      borderRadius: 8,
                      background: isSelected
                        ? 'linear-gradient(135deg, #3b82f6, #2563eb)'
                        : intensity > 0
                          ? `${fillColor}${0.08 + intensity * 0.2})`
                          : 'transparent',
                      color: isSelected ? '#fff' : intensity > 0 ? '#e5e7eb' : '#6b7280',
                      cursor: isFuture ? 'not-allowed' : 'pointer',
                      opacity: isFuture ? 0.3 : 1,
                      transition: 'all .1s',
                    }}
                    onClick={() => navigateTo(viewYear, m)}>
                    <span style={{ fontSize: '0.75rem', fontWeight: 500 }}>{MONTHS_SHORT[i]}</span>
                    {dot && (
                      <div className="mt-1 w-100" style={{ height: 3, borderRadius: 2, background: '#1f2937', overflow: 'hidden' }}>
                        <div style={{
                          width: `${intensity * 100}%`,
                          height: '100%',
                          borderRadius: 2,
                          background: bal > 0 ? '#22c55e' : '#ef4444',
                          transition: 'width .3s',
                        }} />
                      </div>
                    )}
                  </button>
                </div>
              );
            })}
          </div>

          {/* Today button */}
          {!isCurrentMonth && (
            <div className="mt-3 text-center">
              <button className="btn btn-sm fw-semibold text-white px-3"
                style={{ borderRadius: 6, background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)', border: 'none', height: 30, fontSize: '0.8rem' }}
                onClick={() => { goToToday(); setOpen(false); }}>
                Volver al mes actual
              </button>
            </div>
          )}

          {/* Loading */}
          {loadingData && (
            <div className="mt-2 text-center">
              <span style={{ color: '#6b7280', fontSize: '0.7rem' }}>Cargando datos...</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
