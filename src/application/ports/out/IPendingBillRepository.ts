import type { PendingBill } from '@/shared/types';

export interface IPendingBillRepository {
  list(householdId: string): Promise<PendingBill[]>;
  create(input: Omit<PendingBill, 'id' | 'created_at' | 'category' | 'member'>): Promise<PendingBill>;
  update(id: string, input: Partial<Omit<PendingBill, 'id' | 'created_at' | 'category' | 'member'>>): Promise<PendingBill>;
  remove(id: string): Promise<void>;
}
