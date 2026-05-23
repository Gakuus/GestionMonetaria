'use client';

import { useState, useEffect, useMemo } from 'react';
import { getExpenseRepository } from '@/infrastructure/config/container';
import { useHousehold } from '@/context/HouseholdContext';
import { useAuth } from '@/context/AuthContext';
import { useMonth } from '@/context/MonthContext';
import { getMonthBounds } from '@/lib/dateUtils';
import type { Expense, ExpenseCategory } from '@/shared/types';
import type { ExpenseFilters } from '@/application/ports/out/IExpenseRepository';
import type { ExpenseInput } from '@/lib/validations/expenseSchema';

const PAGE_SIZE = 20;

export function useExpenses() {
  const { user } = useAuth();
  const { household, members } = useHousehold();
  const { year, month } = useMonth();
  const repo = getExpenseRepository();

  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFiltersState] = useState<ExpenseFilters>({});
  const [categories, setCategories] = useState<ExpenseCategory[]>([]);

  const currentMember = members.find((m) => m.profile_id === user?.id);

  const { from: dateFrom, to: dateTo } = useMemo(() => getMonthBounds(year, month), [year, month]);

  const queryFilters: ExpenseFilters = useMemo(() => ({
    ...filters,
    dateFrom: filters.dateFrom || dateFrom,
    dateTo: filters.dateTo || dateTo,
  }), [filters, dateFrom, dateTo]);

  useEffect(() => {
    repo.getCategories().then(setCategories).catch(() => {});
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!household) return;
    let cancelled = false;
    repo.list(household.id, queryFilters, page, PAGE_SIZE)
      .then((result) => {
        if (!cancelled) {
          setExpenses(result.data);
          setTotal(result.total);
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Error al cargar gastos');
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, [household, queryFilters, page]); // eslint-disable-line react-hooks/exhaustive-deps

  const loadExpenses = async () => {
    if (!household) return;
    setLoading(true);
    setError(null);
    try {
      const result = await repo.list(household.id, queryFilters, page, PAGE_SIZE);
      setExpenses(result.data);
      setTotal(result.total);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar gastos');
    } finally {
      setLoading(false);
    }
  };

  const create = async (input: ExpenseInput) => {
    if (!household || !currentMember) throw new Error('No household or member');
    await repo.create({
      household_id: household.id,
      member_id: currentMember.id,
      category_id: input.category_id,
      amount: input.amount,
      description: input.description || '',
      date: input.date,
      payment_method: input.payment_method,
      is_recurring: input.is_recurring,
      recurring_type: input.recurring_type || null,
      receipt_url: null,
      is_ant_expense: false,
    });
    await repo.markAntExpenses(household.id, 5000);
    await loadExpenses();
  };

  const update = async (id: string, input: Partial<ExpenseInput>) => {
    await repo.update(id, input as Partial<Expense>);
    await loadExpenses();
  };

  const remove = async (id: string) => {
    await repo.delete(id);
    await loadExpenses();
  };

  const setFilters = (newFilters: ExpenseFilters) => {
    setFiltersState(newFilters);
    setPage(1);
  };

  const resetFilters = () => {
    setFiltersState({});
    setPage(1);
  };

  const nextPage = () => setPage((p) => p + 1);
  const prevPage = () => setPage((p) => Math.max(1, p - 1));
  const totalPages = Math.ceil(total / PAGE_SIZE);

  return {
    expenses,
    total,
    page,
    pageSize: PAGE_SIZE,
    totalPages,
    loading,
    error,
    filters: queryFilters,
    categories,
    year,
    month,
    dateFrom,
    dateTo,
    create,
    update,
    remove,
    setFilters,
    resetFilters,
    nextPage,
    prevPage,
    refetch: loadExpenses,
  };
}
