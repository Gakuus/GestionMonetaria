import type { Income, IncomeCategory } from '@/shared/types';

export interface IIncomeRepository {
  list(householdId: string, page?: number, pageSize?: number, dateFrom?: string, dateTo?: string): Promise<{ data: Income[]; total: number }>;
  getById(id: string): Promise<Income | null>;
  create(data: Omit<Income, 'id' | 'created_at' | 'category' | 'member'>): Promise<Income>;
  update(id: string, data: Partial<Income>): Promise<Income>;
  delete(id: string): Promise<void>;
  getCategories(): Promise<IncomeCategory[]>;
  getMonthlyTotal(householdId: string, year: number, month: number): Promise<number>;
}
