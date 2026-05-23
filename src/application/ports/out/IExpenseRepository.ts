import type { Expense, ExpenseCategory } from '@/shared/types';

export interface ExpenseFilters {
  dateFrom?: string;
  dateTo?: string;
  categoryId?: string;
  memberId?: string;
  paymentMethod?: string;
  search?: string;
  isRecurring?: boolean;
  isAntExpense?: boolean;
}

export interface MonthlySummary {
  total_incomes: number;
  total_expenses: number;
  balance: number;
}

export interface MonthlyEvolution {
  year: number;
  month: number;
  label: string;
  incomes: number;
  expenses: number;
  balance: number;
}

export interface DailyTotal {
  date: string;
  incomes: number;
  expenses: number;
  is_weekend: boolean;
}

export interface PaymentMethodTotal {
  payment_method: string;
  total: number;
  transaction_count: number;
}

export interface IExpenseRepository {
  list(householdId: string, filters?: ExpenseFilters, page?: number, pageSize?: number): Promise<{ data: Expense[]; total: number }>;
  getById(id: string): Promise<Expense | null>;
  create(data: Omit<Expense, 'id' | 'created_at' | 'category' | 'member'>): Promise<Expense>;
  update(id: string, data: Partial<Expense>): Promise<Expense>;
  delete(id: string): Promise<void>;
  getCategories(): Promise<ExpenseCategory[]>;
  getSummary(householdId: string, year: number, month: number): Promise<MonthlySummary>;
  getByCategory(householdId: string, year: number, month: number): Promise<Array<{ category_name: string; total: number; percentage: number }>>;
  getEvolution(householdId: string, months?: number): Promise<MonthlyEvolution[]>;
  getDailyTotals(householdId: string, year: number, month: number): Promise<DailyTotal[]>;
  getByPaymentMethod(householdId: string, year: number, month: number): Promise<PaymentMethodTotal[]>;
  getAntExpensesTotal(householdId: string, year: number, month: number): Promise<number>;
  markAntExpenses(householdId: string, threshold: number): Promise<number>;
}
