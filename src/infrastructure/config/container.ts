import { SupabaseAuthAdapter } from '../supabase/SupabaseAuthAdapter';
import { SupabaseExpenseRepository } from '../supabase/SupabaseExpenseRepository';
import { SupabaseIncomeRepository } from '../supabase/SupabaseIncomeRepository';
import { SupabaseBudgetRepository } from '../supabase/SupabaseBudgetRepository';
import { SupabasePendingBillRepository } from '../supabase/SupabasePendingBillRepository';
import { SupabaseSubscriptionRepository } from '../supabase/SupabaseSubscriptionRepository';
import type { IAuthPort } from '../../application/ports/out/IAuthPort';
import type { IExpenseRepository } from '../../application/ports/out/IExpenseRepository';
import type { IIncomeRepository } from '../../application/ports/out/IIncomeRepository';
import type { IBudgetRepository } from '../../application/ports/out/IBudgetRepository';
import type { IPendingBillRepository } from '../../application/ports/out/IPendingBillRepository';
import type { ISubscriptionRepository } from '../../application/ports/out/ISubscriptionRepository';

let authAdapter: IAuthPort | null = null;
let expenseRepo: IExpenseRepository | null = null;
let incomeRepo: IIncomeRepository | null = null;
let budgetRepo: IBudgetRepository | null = null;
let pendingBillRepo: IPendingBillRepository | null = null;
let subscriptionRepo: ISubscriptionRepository | null = null;

export function getAuthAdapter(): IAuthPort {
  if (!authAdapter) authAdapter = new SupabaseAuthAdapter();
  return authAdapter;
}

export function getExpenseRepository(): IExpenseRepository {
  if (!expenseRepo) expenseRepo = new SupabaseExpenseRepository();
  return expenseRepo;
}

export function getIncomeRepository(): IIncomeRepository {
  if (!incomeRepo) incomeRepo = new SupabaseIncomeRepository();
  return incomeRepo;
}

export function getBudgetRepository(): IBudgetRepository {
  if (!budgetRepo) budgetRepo = new SupabaseBudgetRepository();
  return budgetRepo;
}

export function getPendingBillRepository(): IPendingBillRepository {
  if (!pendingBillRepo) pendingBillRepo = new SupabasePendingBillRepository();
  return pendingBillRepo;
}

export function getSubscriptionRepository(): ISubscriptionRepository {
  if (!subscriptionRepo) subscriptionRepo = new SupabaseSubscriptionRepository();
  return subscriptionRepo;
}
