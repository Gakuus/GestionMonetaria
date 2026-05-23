'use client';

import { useMonth } from '@/context/MonthContext';

export function MonthPicker() {
  const { label, goToPrevMonth, goToNextMonth, goToToday, isCurrentMonth } = useMonth();

  const btnStyle: React.CSSProperties = {
    background: 'rgba(255,255,255,0.06)',
    border: 'none',
    borderRadius: 8,
    color: 'rgba(255,255,255,0.5)',
    padding: '4px 8px',
    transition: 'background .15s',
  };

  return (
    <div className="d-flex align-items-center gap-1">
      <button className="btn btn-sm" style={btnStyle}
        onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.1)'; }}
        onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; }}
        onClick={goToPrevMonth} title="Mes anterior">
        <i className="bi bi-chevron-left"></i>
      </button>

      <span className="fw-semibold mx-1 text-nowrap" style={{ minWidth: 130, textAlign: 'center', color: 'rgba(255,255,255,0.7)', fontSize: '0.9rem' }}>
        {label}
      </span>

      <button className="btn btn-sm" style={btnStyle}
        onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.1)'; }}
        onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; }}
        onClick={goToNextMonth} title="Mes siguiente">
        <i className="bi bi-chevron-right"></i>
      </button>

      {!isCurrentMonth && (
        <button className="btn btn-sm border-0 px-3 text-white"
          style={{ borderRadius: 8, background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)' }}
          onClick={goToToday} title="Volver al mes actual">
          Hoy
        </button>
      )}
    </div>
  );
}
