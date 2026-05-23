import type { Subscription } from '@/shared/types';

export interface ISubscriptionRepository {
  list(householdId: string): Promise<Subscription[]>;
  create(input: Omit<Subscription, 'id' | 'created_at' | 'category'>): Promise<Subscription>;
  update(id: string, input: Partial<Omit<Subscription, 'id' | 'created_at' | 'category'>>): Promise<Subscription>;
  remove(id: string): Promise<void>;
}
