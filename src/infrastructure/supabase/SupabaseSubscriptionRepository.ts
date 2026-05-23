import type { ISubscriptionRepository } from '@/application/ports/out/ISubscriptionRepository';
import type { Subscription } from '@/shared/types';
import { createSupabaseClient } from './client';

export class SupabaseSubscriptionRepository implements ISubscriptionRepository {
  private client = createSupabaseClient();

  async list(householdId: string): Promise<Subscription[]> {
    const { data, error } = await this.client
      .from('subscriptions')
      .select('*, category:expense_categories(*)')
      .eq('household_id', householdId);
    if (error) throw new Error(error.message);
    return (data as unknown as Subscription[]) || [];
  }

  async create(input: Omit<Subscription, 'id' | 'created_at' | 'category'>): Promise<Subscription> {
    const { data, error } = await this.client
      .from('subscriptions')
      .insert(input)
      .select('*, category:expense_categories(*)')
      .single();
    if (error) throw new Error(error.message);
    return data as unknown as Subscription;
  }

  async update(id: string, input: Partial<Omit<Subscription, 'id' | 'created_at' | 'category'>>): Promise<Subscription> {
    const { data, error } = await this.client
      .from('subscriptions')
      .update(input)
      .eq('id', id)
      .select('*, category:expense_categories(*)')
      .single();
    if (error) throw new Error(error.message);
    return data as unknown as Subscription;
  }

  async remove(id: string): Promise<void> {
    const { error } = await this.client.from('subscriptions').delete().eq('id', id);
    if (error) throw new Error(error.message);
  }
}
