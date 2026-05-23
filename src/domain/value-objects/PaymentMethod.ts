export type PaymentMethodValue = 'cash' | 'debit' | 'credit' | 'transfer';

export class PaymentMethod {
  private constructor(private readonly value: PaymentMethodValue) {}

  static readonly CASH = new PaymentMethod('cash');
  static readonly DEBIT = new PaymentMethod('debit');
  static readonly CREDIT = new PaymentMethod('credit');
  static readonly TRANSFER = new PaymentMethod('transfer');

  private static readonly ALLOWED = ['cash', 'debit', 'credit', 'transfer'] as const;

  static create(value: string): PaymentMethod {
    if (!PaymentMethod.ALLOWED.includes(value as PaymentMethodValue)) {
      throw new Error(`Invalid payment method: ${value}`);
    }
    return new PaymentMethod(value as PaymentMethodValue);
  }

  getValue(): PaymentMethodValue {
    return this.value;
  }
}
