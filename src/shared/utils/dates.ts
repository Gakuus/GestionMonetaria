export function today(): string {
  return new Date().toISOString().split('T')[0];
}

export function currentMonth(): { year: number; month: number } {
  const now = new Date();
  return { year: now.getFullYear(), month: now.getMonth() + 1 };
}

export function formatMonth(year: number, month: number): string {
  return `${year}-${String(month).padStart(2, '0')}-01`;
}

export function monthsBetween(start: Date, end: Date): string[] {
  const months: string[] = [];
  const current = new Date(start.getFullYear(), start.getMonth(), 1);
  while (current <= end) {
    months.push(formatMonth(current.getFullYear(), current.getMonth() + 1));
    current.setMonth(current.getMonth() + 1);
  }
  return months;
}
