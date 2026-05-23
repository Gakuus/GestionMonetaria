import type { IPendingBillRepository } from '@/application/ports/out/IPendingBillRepository';
import type { PendingBill } from '@/shared/types';
import { createSupabaseClient } from './client';

export class SupabasePendingBillRepository implements IPendingBillRepository {
  private client = createSupabaseClient();

  async list(householdId: string): Promise<PendingBill[]> {
    const { data, error } = await this.client
      .from('pending_bills')
      .select('*, category:expense_categories(*), member:household_members!inner(*)')
      .eq('household_id', householdId)
      .order('due_date', { ascending: true });
    if (error) throw new Error(error.message);
    return (data as unknown as PendingBill[]) || [];
  }

  async create(input: Omit<PendingBill, 'id' | 'created_at' | 'category' | 'member'>): Promise<PendingBill> {
    const { data, error } = await this.client
      .from('pending_bills')
      .insert(input)
      .select('*, category:expense_categories(*), member:household_members!inner(*)')
      .single();
    if (error) throw new Error(error.message);
    return data as unknown as PendingBill;
  }

  async update(id: string, input: Partial<Omit<PendingBill, 'id' | 'created_at' | 'category' | 'member'>>): Promise<PendingBill> {
    const { data, error } = await this.client
      .from('pending_bills')
      .update(input)
      .eq('id', id)
      .select('*, category:expense_categories(*), member:household_members!inner(*)')
      .single();
    if (error) throw new Error(error.message);
    return data as unknown as PendingBill;
  }

  async remove(id: string): Promise<void> {
    const { error } = await this.client.from('pending_bills').delete().eq('id', id);
    if (error) throw new Error(error.message);
  }
}
