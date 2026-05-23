'use client';

import '@/lib/chartConfig';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useHousehold } from '@/context/HouseholdContext';
import { MonthProvider } from '@/context/MonthContext';
import { Sidebar } from '@/components/layout/Sidebar';
import { Navbar } from '@/components/layout/Navbar';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const { household, loading: householdLoading } = useHousehold();

  useEffect(() => {
    if (!authLoading && !user) {
      router.replace('/login');
    }
  }, [user, authLoading, router]);

  if (authLoading || householdLoading) {
    return (
      <div className="d-flex justify-content-center align-items-center vh-100" style={{ background: '#0a0a1a' }}>
        <div className="spinner-border" style={{ color: 'rgba(59,130,246,0.6)' }} role="status">
          <span className="visually-hidden">Cargando...</span>
        </div>
      </div>
    );
  }

  if (!user || !household) return null;

  return (
    <MonthProvider>
      <div className="d-flex" style={{ minHeight: '100vh', background: '#0a0a1a' }}>
        <Sidebar />
        <div className="d-flex flex-column flex-grow-1">
          <Navbar />
          <main className="flex-grow-1 p-3 p-md-4 overflow-auto" style={{ background: '#0a0a1a' }}>
            {children}
          </main>
        </div>
      </div>
    </MonthProvider>
  );
}
