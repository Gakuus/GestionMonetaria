'use client';

import { useState, useEffect } from 'react';
import { getBudgetRepository, getExpenseRepository } from '@/infrastructure/config/container';
import { useHousehold } from '@/context/HouseholdContext';
import { useMonth } from '@/context/MonthContext';
import type { Budget, ExpenseCategory } from '@/shared/types';
import type { BudgetInput } from '@/lib/validations/expenseSchema';

export interface BudgetWithSpent extends Budget {
  spent: number;
  percentage: number;
}

export function useBudgets() {
  const { household } = useHousehold();
  const { year, month } = useMonth();
  const budgetRepo = getBudgetRepository();
  const expenseRepo = getExpenseRepository();

  const monthStr = `${year}-${String(month).padStart(2, '0')}-01`;

  const [budgets, setBudgets] = useState<BudgetWithSpent[]>([]);
  const [categories, setCategories] = useState<ExpenseCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    expenseRepo.getCategories().then(setCategories).catch(() => {});
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!household) return;
    let cancelled = false;

    Promise.all([
      budgetRepo.list(household.id, monthStr),
      expenseRepo.getByCategory(household.id, year, month),
    ])
      .then(([budgetList, categoryTotals]) => {
        if (!cancelled) {
          const spentMap = new Map(categoryTotals.map((c) => [c.category_name, Number(c.total)]));
          const withSpent: BudgetWithSpent[] = budgetList.map((b) => {
            const spent = spentMap.get(b.category?.name ?? '') ?? 0;
            return {
              ...b,
              spent,
              percentage: b.amount > 0 ? Math.min(100, (spent / b.amount) * 100) : 0,
            };
          });
          setBudgets(withSpent);
        }
      })
      .catch((err) => {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Error al cargar presupuestos');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => { cancelled = true; };
  }, [household, monthStr, year, month]); // eslint-disable-line react-hooks/exhaustive-deps

  const upsert = async (input: BudgetInput) => {
    if (!household) throw new Error('No household');
    await budgetRepo.upsert({
      household_id: household.id,
      category_id: input.category_id,
      month: input.month,
      amount: input.amount,
    });
  };

  const remove = async (id: string) => {
    await budgetRepo.remove(id);
  };

  return {
    budgets, categories, loading, error,
    upsert, remove,
    refetch: () => { /* will be reloaded on month change */ },
  };
}
