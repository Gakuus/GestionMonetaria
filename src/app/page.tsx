'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useHousehold } from '@/context/HouseholdContext';

export default function Home() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const { household, loading: householdLoading } = useHousehold();

  useEffect(() => {
    if (authLoading || householdLoading) return;

    if (!user) {
      router.replace('/login');
    } else if (!household) {
      router.replace('/onboard');
    } else {
      router.replace('/dashboard');
    }
  }, [user, household, authLoading, householdLoading, router]);

  return (
    <div className="d-flex justify-content-center align-items-center vh-100">
      <div className="spinner-border text-primary" role="status">
        <span className="visually-hidden">Cargando...</span>
      </div>
    </div>
  );
}
