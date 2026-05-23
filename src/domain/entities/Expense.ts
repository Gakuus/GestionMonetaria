import { Amount } from '@/domain/value-objects/Amount';
import { PaymentMethod } from '@/domain/value-objects/PaymentMethod';
import type { RecurringType } from '@/shared/types';

export class Expense {
  constructor(
    public readonly id: string,
    public readonly householdId: string,
    public readonly memberId: string,
    public readonly categoryId: string,
    public readonly amount: Amount,
    public readonly description: string | null,
    public readonly date: string,
    public readonly paymentMethod: PaymentMethod,
    public readonly isRecurring: boolean,
    public readonly recurringType: RecurringType | null,
    public readonly receiptUrl: string | null,
    public readonly isAntExpense: boolean,
    public readonly createdAt: string,
  ) {}

  static isAntExpense(
    amount: Amount,
    threshold: Amount,
    recentSameCategory: number,
  ): boolean {
    if (amount.isLessThan(threshold)) return true;
    if (recentSameCategory >= 3) return true;
    return false;
  }
}
