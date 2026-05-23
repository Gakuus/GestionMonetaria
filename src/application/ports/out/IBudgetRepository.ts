import type { Budget } from '@/shared/types';

export interface IBudgetRepository {
  list(householdId: string, month: string): Promise<Budget[]>;
  upsert(data: { household_id: string; category_id: string; month: string; amount: number }): Promise<Budget>;
  remove(id: string): Promise<void>;
}
