'use client';

import { useState, useEffect } from 'react';
import { getExpenseRepository } from '@/infrastructure/config/container';
import { useHousehold } from '@/context/HouseholdContext';
import { useMonth } from '@/context/MonthContext';
import { getMonthBounds } from '@/lib/dateUtils';
import type { MonthlySummary, MonthlyEvolution, DailyTotal, PaymentMethodTotal } from '@/application/ports/out/IExpenseRepository';
import type { Expense } from '@/shared/types';

export interface CategoryBreakdown {
  category_name: string;
  total: number;
  percentage: number;
}

export interface DashboardData {
  summary: MonthlySummary;
  expenses_by_category: CategoryBreakdown[];
  evolution: MonthlyEvolution[];
  daily_totals: DailyTotal[];
  payment_methods: PaymentMethodTotal[];
  recent_expenses: Expense[];
  ant_expenses_total: number;
  ant_expenses_projection: number;
}

export function useDashboard() {
  const { household } = useHousehold();
  const { year, month } = useMonth();
  const expenseRepo = getExpenseRepository();

  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!household) return;
    let cancelled = false;

    const { from, to } = getMonthBounds(year, month);

    Promise.all([
      expenseRepo.getSummary(household.id, year, month),
      expenseRepo.getByCategory(household.id, year, month),
      expenseRepo.getEvolution(household.id, 6),
      expenseRepo.getDailyTotals(household.id, year, month),
      expenseRepo.getByPaymentMethod(household.id, year, month),
      expenseRepo.list(household.id, { dateFrom: from, dateTo: to }, 1, 5),
      expenseRepo.getAntExpensesTotal(household.id, year, month),
    ])
      .then(([summary, expenses_by_category, evolution, daily_totals, payment_methods, recent, ant_expenses_total]) => {
        if (!cancelled) {
          setData({
            summary,
            expenses_by_category,
            evolution,
            daily_totals,
            payment_methods,
            recent_expenses: recent.data,
            ant_expenses_total,
            ant_expenses_projection: ant_expenses_total * 12,
          });
        }
      })
      .catch((err) => {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Error al cargar dashboard');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => { cancelled = true; };
  }, [household, year, month]); // eslint-disable-line react-hooks/exhaustive-deps

  const refetch = async () => {
    if (!household) return;
    setLoading(true);
    setError(null);
    try {
      const { from, to } = getMonthBounds(year, month);
      const [summary, expenses_by_category, evolution, daily_totals, payment_methods, recent, ant_expenses_total] = await Promise.all([
        expenseRepo.getSummary(household.id, year, month),
        expenseRepo.getByCategory(household.id, year, month),
        expenseRepo.getEvolution(household.id, 6),
        expenseRepo.getDailyTotals(household.id, year, month),
        expenseRepo.getByPaymentMethod(household.id, year, month),
        expenseRepo.list(household.id, { dateFrom: from, dateTo: to }, 1, 5),
        expenseRepo.getAntExpensesTotal(household.id, year, month),
      ]);
      setData({
        summary,
        expenses_by_category,
        evolution,
        daily_totals,
        payment_methods,
        recent_expenses: recent.data,
        ant_expenses_total,
        ant_expenses_projection: ant_expenses_total * 12,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar dashboard');
    } finally {
      setLoading(false);
    }
  };

  return { data, loading, error, refetch };
}
