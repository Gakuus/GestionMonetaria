import type { IExpenseRepository, ExpenseFilters, MonthlySummary, MonthlyEvolution, DailyTotal, PaymentMethodTotal } from '@/application/ports/out/IExpenseRepository';
import type { Expense, ExpenseCategory } from '@/shared/types';
import { createSupabaseClient } from './client';

export class SupabaseExpenseRepository implements IExpenseRepository {
  private client = createSupabaseClient();

  async list(
    householdId: string,
    filters?: ExpenseFilters,
    page = 1,
    pageSize = 20,
  ): Promise<{ data: Expense[]; total: number }> {
    let query = this.client
      .from('expenses')
      .select('*, category:expense_categories(*), member:household_members(profile:profiles(*))', { count: 'exact' })
      .eq('household_id', householdId)
      .order('date', { ascending: false })
      .order('created_at', { ascending: false })
      .range((page - 1) * pageSize, page * pageSize - 1);

    if (filters?.dateFrom) query = query.gte('date', filters.dateFrom);
    if (filters?.dateTo) query = query.lte('date', filters.dateTo);
    if (filters?.categoryId) query = query.eq('category_id', filters.categoryId);
    if (filters?.memberId) query = query.eq('member_id', filters.memberId);
    if (filters?.paymentMethod) query = query.eq('payment_method', filters.paymentMethod);
    if (filters?.search) query = query.ilike('description', `%${filters.search}%`);
    if (filters?.isRecurring !== undefined) query = query.eq('is_recurring', filters.isRecurring);
    if (filters?.isAntExpense !== undefined) query = query.eq('is_ant_expense', filters.isAntExpense);

    const { data, error, count } = await query;
    if (error) throw new Error(error.message);
    return { data: (data as unknown as Expense[]) || [], total: count ?? 0 };
  }

  async getById(id: string): Promise<Expense | null> {
    const { data, error } = await this.client
      .from('expenses')
      .select('*, category:expense_categories(*)')
      .eq('id', id)
      .single();
    if (error) return null;
    return data as unknown as Expense;
  }

  async create(input: Omit<Expense, 'id' | 'created_at' | 'category' | 'member'>): Promise<Expense> {
    const { data, error } = await this.client
      .from('expenses')
      .insert(input)
      .select('*, category:expense_categories(*)')
      .single();
    if (error) throw new Error(error.message);
    return data as unknown as Expense;
  }

  async update(id: string, input: Partial<Expense>): Promise<Expense> {
    const { data, error } = await this.client
      .from('expenses')
      .update(input)
      .eq('id', id)
      .select('*, category:expense_categories(*)')
      .single();
    if (error) throw new Error(error.message);
    return data as unknown as Expense;
  }

  async delete(id: string): Promise<void> {
    const { error } = await this.client.from('expenses').delete().eq('id', id);
    if (error) throw new Error(error.message);
  }

  async getCategories(): Promise<ExpenseCategory[]> {
    const { data, error } = await this.client.from('expense_categories').select('*').order('name');
    if (error) throw new Error(error.message);
    return data;
  }

  async getSummary(householdId: string, year: number, month: number): Promise<MonthlySummary> {
    const { data, error } = await this.client
      .rpc('get_monthly_summary', { p_household_id: householdId, p_year: year, p_month: month })
      .single();
    if (error) throw new Error(error.message);
    return (data as unknown as MonthlySummary) ?? { total_incomes: 0, total_expenses: 0, balance: 0 };
  }

  async getByCategory(householdId: string, year: number, month: number): Promise<Array<{ category_name: string; total: number; percentage: number }>> {
    const { data, error } = await this.client
      .rpc('get_expenses_by_category', { p_household_id: householdId, p_year: year, p_month: month });
    if (error) throw new Error(error.message);
    return (data as Array<{ category_name: string; total: number; percentage: number }>) || [];
  }

  async getEvolution(householdId: string, months = 6): Promise<MonthlyEvolution[]> {
    const { data, error } = await this.client
      .rpc('get_monthly_evolution', { p_household_id: householdId, p_months: months });
    if (error) throw new Error(error.message);
    return (data as MonthlyEvolution[]) || [];
  }

  async getDailyTotals(householdId: string, year: number, month: number): Promise<DailyTotal[]> {
    const { data, error } = await this.client
      .rpc('get_daily_totals', { p_household_id: householdId, p_year: year, p_month: month });
    if (error) throw new Error(error.message);
    return (data as DailyTotal[]) || [];
  }

  async getByPaymentMethod(householdId: string, year: number, month: number): Promise<PaymentMethodTotal[]> {
    const { data, error } = await this.client
      .rpc('get_expenses_by_payment_method', { p_household_id: householdId, p_year: year, p_month: month });
    if (error) throw new Error(error.message);
    return (data as PaymentMethodTotal[]) || [];
  }

  async getAntExpensesTotal(householdId: string, year: number, month: number): Promise<number> {
    const lastDay = new Date(year, month, 0).getDate();
    const { data, error } = await this.client
      .from('expenses')
      .select('amount')
      .eq('household_id', householdId)
      .eq('is_ant_expense', true)
      .gte('date', `${year}-${String(month).padStart(2, '0')}-01`)
      .lte('date', `${year}-${String(month).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`);
    if (error) throw new Error(error.message);
    return (data as { amount: number }[]).reduce((sum, e) => sum + Number(e.amount), 0);
  }

  async markAntExpenses(householdId: string, threshold: number): Promise<number> {
    const { data, error } = await this.client
      .rpc('detect_ant_expenses', { p_household_id: householdId, p_threshold: threshold });
    if (error) throw new Error(error.message);
    return (data as number) ?? 0;
  }
}
