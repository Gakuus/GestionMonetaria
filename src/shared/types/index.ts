export interface Household {
  id: string;
  name: string;
  monthly_savings_goal: number | null;
  created_at: string;
}

export interface Profile {
  id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
  created_at: string;
}

export type MemberRole = 'admin' | 'member';

export interface HouseholdMember {
  id: string;
  household_id: string;
  profile_id: string;
  role: MemberRole;
  joined_at: string;
  profile?: Profile;
}

export interface ExpenseCategory {
  id: string;
  name: string;
  icon: string;
}

export interface IncomeCategory {
  id: string;
  name: string;
  icon: string;
}

export type PaymentMethod = 'cash' | 'debit' | 'credit' | 'transfer';
export type RecurringType = 'weekly' | 'monthly' | 'yearly';

export interface Expense {
  id: string;
  household_id: string;
  member_id: string;
  category_id: string;
  amount: number;
  description: string | null;
  date: string;
  payment_method: PaymentMethod;
  is_recurring: boolean;
  recurring_type: RecurringType | null;
  receipt_url: string | null;
  is_ant_expense: boolean;
  created_at: string;
  category?: ExpenseCategory;
  member?: HouseholdMember;
}

export interface Income {
  id: string;
  household_id: string;
  member_id: string;
  category_id: string;
  amount: number;
  description: string | null;
  date: string;
  is_recurring: boolean;
  recurring_type: RecurringType | null;
  created_at: string;
  category?: IncomeCategory;
  member?: HouseholdMember;
}

export interface Budget {
  id: string;
  household_id: string;
  category_id: string;
  month: string;
  amount: number;
  created_at: string;
  category?: ExpenseCategory;
  spent?: number;
  percentage?: number;
}

export interface Subscription {
  id: string;
  household_id: string;
  service_name: string;
  amount: number;
  billing_date: number;
  category_id: string;
  billing_period: 'monthly' | 'yearly';
  paid: boolean;
  last_paid_at: string | null;
  created_at: string;
  category?: ExpenseCategory;
}

export interface PendingBill {
  id: string;
  household_id: string;
  member_id: string;
  description: string;
  amount: number;
  due_date: string;
  paid: boolean;
  paid_date: string | null;
  category_id: string | null;
  notes: string | null;
  created_at: string;
  category?: ExpenseCategory;
  member?: HouseholdMember;
}

export interface MonthlySummary {
  total_incomes: number;
  total_expenses: number;
  balance: number;
}

export interface CategoryBreakdown {
  category_name: string;
  total: number;
  percentage: number;
}

export interface DashboardData {
  summary: MonthlySummary;
  expenses_by_category: CategoryBreakdown[];
  monthly_evolution: Array<{
    month: string;
    incomes: number;
    expenses: number;
  }>;
  recent_expenses: Expense[];
  ant_expenses_total: number;
  ant_expenses_projection: number;
  top_categories: CategoryBreakdown[];
}
