'use client';

import { useState, useEffect, useMemo } from 'react';
import { getIncomeRepository } from '@/infrastructure/config/container';
import { useHousehold } from '@/context/HouseholdContext';
import { useAuth } from '@/context/AuthContext';
import { useMonth } from '@/context/MonthContext';
import { getMonthBounds } from '@/lib/dateUtils';
import type { Income, IncomeCategory } from '@/shared/types';
import type { IncomeInput } from '@/lib/validations/expenseSchema';

const PAGE_SIZE = 20;

export function useIncomes() {
  const { user } = useAuth();
  const { household, members } = useHousehold();
  const { year, month } = useMonth();
  const repo = getIncomeRepository();

  const [incomes, setIncomes] = useState<Income[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [categories, setCategories] = useState<IncomeCategory[]>([]);

  const pageSize = PAGE_SIZE;
  const currentMember = members.find((m) => m.profile_id === user?.id);

  const { from: dateFrom, to: dateTo } = useMemo(() => getMonthBounds(year, month), [year, month]);

  useEffect(() => {
    repo.getCategories().then(setCategories).catch(() => {});
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!household) return;
    let cancelled = false;
    repo.list(household.id, page, pageSize, dateFrom, dateTo)
      .then((result) => {
        if (!cancelled) {
          setIncomes(result.data);
          setTotal(result.total);
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Error al cargar ingresos');
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, [household, page, dateFrom, dateTo]); // eslint-disable-line react-hooks/exhaustive-deps

  const loadIncomes = async () => {
    if (!household) return;
    setLoading(true);
    setError(null);
    try {
      const result = await repo.list(household.id, page, pageSize, dateFrom, dateTo);
      setIncomes(result.data);
      setTotal(result.total);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar ingresos');
    } finally {
      setLoading(false);
    }
  };

  const create = async (input: IncomeInput) => {
    if (!household || !currentMember) throw new Error('No household or member');
    await repo.create({
      household_id: household.id,
      member_id: currentMember.id,
      category_id: input.category_id,
      amount: input.amount,
      description: input.description || '',
      date: input.date,
      is_recurring: input.is_recurring,
      recurring_type: input.recurring_type || null,
    });
    await loadIncomes();
  };

  const update = async (id: string, input: Partial<IncomeInput>) => {
    await repo.update(id, input as Partial<Income>);
    await loadIncomes();
  };

  const remove = async (id: string) => {
    await repo.delete(id);
    await loadIncomes();
  };

  const nextPage = () => setPage((p) => p + 1);
  const prevPage = () => setPage((p) => Math.max(1, p - 1));
  const totalPages = Math.ceil(total / pageSize);

  return {
    incomes,
    total,
    page,
    pageSize,
    totalPages,
    loading,
    error,
    categories,
    year,
    month,
    dateFrom,
    dateTo,
    create,
    update,
    remove,
    nextPage,
    prevPage,
    refetch: loadIncomes,
  };
}
