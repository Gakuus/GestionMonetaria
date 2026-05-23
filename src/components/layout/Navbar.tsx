'use client';

import { useAuth } from '@/context/AuthContext';
import { CalendarMonthPicker } from '@/components/ui/CalendarMonthPicker';

export function Navbar() {
  const { user, profile, logout } = useAuth();

  return (
    <nav className="d-flex align-items-center px-3 px-md-4 py-2"
      style={{
        background: 'rgba(10,10,26,0.6)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
        minHeight: 56,
        position: 'relative',
        zIndex: 1060,
      }}>
      <div className="d-flex align-items-center gap-3 flex-grow-1">
        <button
          className="btn btn-sm border-0 d-flex align-items-center justify-content-center d-md-none"
          type="button"
          data-bs-toggle="offcanvas"
          data-bs-target="#sidebarOffcanvas"
          aria-controls="sidebarOffcanvas"
          style={{ width: 32, height: 32, borderRadius: 8, background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.5)' }}>
          <i className="bi bi-list"></i>
        </button>
        <span className="d-none d-md-inline" style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.9rem' }}>
          Bienvenido, <strong style={{ color: 'rgba(255,255,255,0.8)' }}>{profile?.full_name || user?.email}</strong>
        </span>
        <CalendarMonthPicker />
      </div>

      <div className="d-flex align-items-center gap-2">
        <span className="d-none d-md-inline px-2 py-1 small rounded-2"
          style={{ background: 'rgba(59,130,246,0.1)', color: 'rgba(59,130,246,0.7)' }}>
          <i className="bi bi-person-circle me-1"></i>
          {user?.email}
        </span>
        <button className="btn btn-sm border-0 d-flex align-items-center gap-1 px-3"
          onClick={logout}
          style={{ borderRadius: 8, background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.5)', transition: 'background .15s' }}
          onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.1)'; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; }}>
          <i className="bi bi-box-arrow-right"></i>
          <span className="d-none d-md-inline">Salir</span>
        </button>
      </div>
    </nav>
  );
}
