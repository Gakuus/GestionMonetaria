'use client';

import { useEffect } from 'react';
import { AuthProvider } from '@/context/AuthContext';
import { HouseholdProvider } from '@/context/HouseholdContext';

function BootstrapJS() {
  useEffect(() => {
    import('bootstrap/dist/js/bootstrap.bundle.min.js');
  }, []);
  return null;
}

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <HouseholdProvider>
        <BootstrapJS />
        {children}
      </HouseholdProvider>
    </AuthProvider>
  );
}
