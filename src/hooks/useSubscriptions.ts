'use client';

import { useState, useEffect, useRef } from 'react';
import { getSubscriptionRepository } from '@/infrastructure/config/container';
import { useHousehold } from '@/context/HouseholdContext';
import type { Subscription } from '@/shared/types';

export function useSubscriptions() {
  const { household } = useHousehold();
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const mountedRef = useRef(true);

  const repo = getSubscriptionRepository();

  useEffect(() => {
    if (!household) return;
    mountedRef.current = true;
    repo.list(household.id)
      .then((d) => { if (mountedRef.current) setSubscriptions(d); })
      .catch((err) => { if (mountedRef.current) setError(err instanceof Error ? err.message : 'Error'); })
      .finally(() => { if (mountedRef.current) setLoading(false); });
    return () => { mountedRef.current = false; };
  }, [household?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const create = async (input: Parameters<typeof repo.create>[0]) => {
    const sub = await repo.create(input);
    setSubscriptions((prev) => [...prev, sub]);
    return sub;
  };

  const update = async (id: string, input: Parameters<typeof repo.update>[1]) => {
    const sub = await repo.update(id, input);
    setSubscriptions((prev) => prev.map((s) => (s.id === id ? sub : s)));
    return sub;
  };

  const remove = async (id: string) => {
    await repo.remove(id);
    setSubscriptions((prev) => prev.filter((s) => s.id !== id));
  };

  return { subscriptions, loading, error, create, update, remove };
}
