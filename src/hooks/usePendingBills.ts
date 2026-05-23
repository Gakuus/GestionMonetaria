'use client';

import { useState, useEffect, useRef } from 'react';
import { getPendingBillRepository } from '@/infrastructure/config/container';
import { useHousehold } from '@/context/HouseholdContext';
import type { PendingBill } from '@/shared/types';

export function usePendingBills() {
  const { household } = useHousehold();
  const [bills, setBills] = useState<PendingBill[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const mountedRef = useRef(true);

  const repo = getPendingBillRepository();

  useEffect(() => {
    if (!household) return;
    mountedRef.current = true;
    repo.list(household.id)
      .then((d) => { if (mountedRef.current) setBills(d); })
      .catch((err) => { if (mountedRef.current) setError(err instanceof Error ? err.message : 'Error'); })
      .finally(() => { if (mountedRef.current) setLoading(false); });
    return () => { mountedRef.current = false; };
  }, [household?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const create = async (input: Parameters<typeof repo.create>[0]) => {
    const bill = await repo.create(input);
    setBills((prev) => [...prev, bill]);
    return bill;
  };

  const update = async (id: string, input: Parameters<typeof repo.update>[1]) => {
    const bill = await repo.update(id, input);
    setBills((prev) => prev.map((b) => (b.id === id ? bill : b)));
    return bill;
  };

  const remove = async (id: string) => {
    await repo.remove(id);
    setBills((prev) => prev.filter((b) => b.id !== id));
  };

  return { bills, loading, error, create, update, remove };
}
