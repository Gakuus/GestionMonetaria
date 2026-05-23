export class Amount {
  private constructor(private readonly value: number) {
    if (!Number.isFinite(value)) {
      throw new Error('Amount must be a finite number');
    }
    if (value <= 0) {
      throw new Error('Amount must be greater than zero');
    }
    if (value > 999999999.99) {
      throw new Error('Amount exceeds maximum allowed');
    }
  }

  static create(value: number): Amount {
    return new Amount(value);
  }

  getValue(): number {
    return this.value;
  }

  add(other: Amount): Amount {
    return new Amount(this.value + other.value);
  }

  subtract(other: Amount): Amount {
    const result = this.value - other.value;
    if (result < 0) throw new Error('Amount cannot be negative');
    return new Amount(result);
  }

  isLessThan(other: Amount): boolean {
    return this.value < other.value;
  }

  multiply(factor: number): Amount {
    return new Amount(this.value * factor);
  }
}
