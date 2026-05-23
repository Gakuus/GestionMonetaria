'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useHousehold } from '@/context/HouseholdContext';

const NAV_ITEMS = [
  { href: '/dashboard', label: 'Dashboard', icon: 'bi-speedometer2' },
  { href: '/expenses', label: 'Gastos', icon: 'bi-cash-stack' },
  { href: '/incomes', label: 'Ingresos', icon: 'bi-graph-up-arrow' },
  { href: '/budgets', label: 'Presupuestos', icon: 'bi-pie-chart' },
  { href: '/pending-bills', label: 'Pendientes', icon: 'bi-receipt' },
  { href: '/subscriptions', label: 'Suscripciones', icon: 'bi-arrow-repeat' },
  { href: '/members', label: 'Miembros', icon: 'bi-people' },
  { href: '/settings', label: 'Configuración', icon: 'bi-gear' },
];

export function Sidebar() {
  const pathname = usePathname();
  const { household } = useHousehold();

  const navLinks = NAV_ITEMS.map((item) => {
    const isActive = pathname === item.href;
    return (
      <li className="nav-item" key={item.href}>
        <Link
          href={item.href}
          className="nav-link d-flex align-items-center gap-2 border-0 py-2 px-3"
          style={{
            borderRadius: 10,
            background: isActive ? 'rgba(59,130,246,0.15)' : 'transparent',
            color: isActive ? '#60a5fa' : 'rgba(255,255,255,0.45)',
            fontWeight: isActive ? 500 : 400,
            transition: 'all .15s',
          }}
          onMouseEnter={(e) => {
            if (!isActive) { e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; e.currentTarget.style.color = 'rgba(255,255,255,0.7)'; }
          }}
          onMouseLeave={(e) => {
            if (!isActive) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'rgba(255,255,255,0.45)'; }
          }}>
          <i className={`bi ${item.icon}`} style={{ fontSize: '1rem' }}></i>
          {item.label}
        </Link>
      </li>
    );
  });

  return (
    <>
      {/* Desktop sidebar */}
      <nav className="d-none d-md-flex flex-column flex-shrink-0"
        style={{
          width: 250,
          minHeight: '100vh',
          background: 'rgba(10,10,26,0.95)',
          borderRight: '1px solid rgba(255,255,255,0.06)',
        }}>
        <div className="p-3 d-flex align-items-center gap-2" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
          <div className="d-flex align-items-center justify-content-center rounded-2"
            style={{ width: 32, height: 32, background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)' }}>
            <i className="bi bi-wallet2 text-white small"></i>
          </div>
          <span className="fw-semibold text-white text-truncate" style={{ fontSize: '0.95rem' }}>
            {household?.name || 'GestionMonetaria'}
          </span>
        </div>
        <ul className="nav nav-pills flex-column p-2 gap-0" style={{ flex: 1 }}>{navLinks}</ul>
      </nav>

      {/* Mobile offcanvas */}
      <div className="offcanvas offcanvas-start d-md-none"
        tabIndex={-1} id="sidebarOffcanvas" aria-labelledby="sidebarOffcanvasLabel"
        style={{ background: 'rgba(10,10,26,0.98)', backdropFilter: 'blur(24px)', borderRight: '1px solid rgba(255,255,255,0.06)' }}>
        <div className="offcanvas-header" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
          <div className="d-flex align-items-center gap-2">
            <div className="d-flex align-items-center justify-content-center rounded-2"
              style={{ width: 32, height: 32, background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)' }}>
              <i className="bi bi-wallet2 text-white small"></i>
            </div>
            <h5 className="offcanvas-title text-white mb-0" id="sidebarOffcanvasLabel" style={{ fontSize: '0.95rem' }}>
              {household?.name || 'GestionMonetaria'}
            </h5>
          </div>
          <button type="button" className="btn-close btn-close-white" data-bs-dismiss="offcanvas" aria-label="Cerrar"
            style={{ opacity: 0.4 }}></button>
        </div>
        <div className="offcanvas-body p-0">
          <ul className="nav nav-pills flex-column p-2 gap-0">{navLinks}</ul>
        </div>
      </div>
    </>
  );
}
