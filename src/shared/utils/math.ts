export function sum(values: number[]): number {
  return values.reduce((acc, v) => acc + v, 0);
}

export function round(value: number, decimals: number = 2): number {
  const factor = Math.pow(10, decimals);
  return Math.round(value * factor) / factor;
}

export function percentage(value: number, total: number): number {
  if (total === 0) return 0;
  return round((value / total) * 100);
}

export function annualProjection(monthlyAmount: number): number {
  return monthlyAmount * 12;
}
