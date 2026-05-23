import type { IIncomeRepository } from '@/application/ports/out/IIncomeRepository';
import type { Income, IncomeCategory } from '@/shared/types';
import { createSupabaseClient } from './client';

export class SupabaseIncomeRepository implements IIncomeRepository {
  private client = createSupabaseClient();

  async list(
    householdId: string,
    page = 1,
    pageSize = 20,
    dateFrom?: string,
    dateTo?: string,
  ): Promise<{ data: Income[]; total: number }> {
    let query = this.client
      .from('incomes')
      .select('*, category:income_categories(*), member:household_members(profile:profiles(*))', { count: 'exact' })
      .eq('household_id', householdId);

    if (dateFrom) query = query.gte('date', dateFrom);
    if (dateTo) query = query.lte('date', dateTo);

    const { data, error, count } = await query
      .order('date', { ascending: false })
      .order('created_at', { ascending: false })
      .range((page - 1) * pageSize, page * pageSize - 1);

    if (error) throw new Error(error.message);
    return { data: (data as unknown as Income[]) || [], total: count ?? 0 };
  }

  async getById(id: string): Promise<Income | null> {
    const { data, error } = await this.client
      .from('incomes')
      .select('*, category:income_categories(*)')
      .eq('id', id)
      .single();
    if (error) return null;
    return data as unknown as Income;
  }

  async create(input: Omit<Income, 'id' | 'created_at' | 'category' | 'member'>): Promise<Income> {
    const { data, error } = await this.client
      .from('incomes')
      .insert(input)
      .select('*, category:income_categories(*)')
      .single();
    if (error) throw new Error(error.message);
    return data as unknown as Income;
  }

  async update(id: string, input: Partial<Income>): Promise<Income> {
    const { data, error } = await this.client
      .from('incomes')
      .update(input)
      .eq('id', id)
      .select('*, category:income_categories(*)')
      .single();
    if (error) throw new Error(error.message);
    return data as unknown as Income;
  }

  async delete(id: string): Promise<void> {
    const { error } = await this.client.from('incomes').delete().eq('id', id);
    if (error) throw new Error(error.message);
  }

  async getCategories(): Promise<IncomeCategory[]> {
    const { data, error } = await this.client.from('income_categories').select('*').order('name');
    if (error) throw new Error(error.message);
    return data;
  }

  async getMonthlyTotal(householdId: string, year: number, month: number): Promise<number> {
    const { data, error } = await this.client
      .rpc('get_monthly_summary', { p_household_id: householdId, p_year: year, p_month: month })
      .single();
    if (error) throw new Error(error.message);
    return (data as { total_incomes: number }).total_incomes ?? 0;
  }
}
