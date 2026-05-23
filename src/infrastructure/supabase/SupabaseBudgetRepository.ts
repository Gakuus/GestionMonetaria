import type { IBudgetRepository } from '@/application/ports/out/IBudgetRepository';
import type { Budget } from '@/shared/types';
import { createSupabaseClient } from './client';

export class SupabaseBudgetRepository implements IBudgetRepository {
  private client = createSupabaseClient();

  async list(householdId: string, month: string): Promise<Budget[]> {
    const { data, error } = await this.client
      .from('budgets')
      .select('*, category:expense_categories(*)')
      .eq('household_id', householdId)
      .eq('month', month);

    if (error) throw new Error(error.message);
    return (data as unknown as Budget[]) || [];
  }

  async upsert(input: { household_id: string; category_id: string; month: string; amount: number }): Promise<Budget> {
    const { data, error } = await this.client
      .from('budgets')
      .upsert(input, { onConflict: 'household_id,category_id,month' })
      .select('*, category:expense_categories(*)')
      .single();
    if (error) throw new Error(error.message);
    return data as unknown as Budget;
  }

  async remove(id: string): Promise<void> {
    const { error } = await this.client.from('budgets').delete().eq('id', id);
    if (error) throw new Error(error.message);
  }
}
