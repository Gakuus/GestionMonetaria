import { z } from 'zod';

export const uuidSchema = z.string().uuid();

export const paymentMethodSchema = z.enum(['cash', 'debit', 'credit', 'transfer']);
export const recurringTypeSchema = z.enum(['weekly', 'monthly', 'yearly']);
export const dateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);

export const expenseSchema = z.object({
  amount: z.number().positive('El monto debe ser mayor a 0').max(999999999.99, 'Monto muy grande'),
  date: dateSchema.default(() => new Date().toISOString().split('T')[0]),
  category_id: uuidSchema,
  description: z.string().max(255).optional().default(''),
  payment_method: paymentMethodSchema,
  is_recurring: z.boolean().default(false),
  recurring_type: recurringTypeSchema.optional(),
});

export const incomeSchema = z.object({
  amount: z.number().positive('El monto debe ser mayor a 0').max(999999999.99, 'Monto muy grande'),
  date: dateSchema.default(() => new Date().toISOString().split('T')[0]),
  category_id: uuidSchema,
  description: z.string().max(255).optional().default(''),
  is_recurring: z.boolean().default(false),
  recurring_type: recurringTypeSchema.optional(),
});

export const budgetSchema = z.object({
  category_id: uuidSchema,
  month: dateSchema,
  amount: z.number().positive('El presupuesto debe ser mayor a 0').max(999999999.99),
});

export const pendingBillSchema = z.object({
  description: z.string().min(1, 'La descripción es obligatoria').max(255),
  amount: z.number().positive('El monto debe ser mayor a 0').max(999999999.99),
  due_date: dateSchema,
  category_id: uuidSchema.nullable().optional(),
  notes: z.string().max(500).optional().default(''),
});

export const subscriptionSchema = z.object({
  service_name: z.string().min(1, 'El nombre del servicio es obligatorio').max(255),
  amount: z.number().positive('El monto debe ser mayor a 0').max(999999999.99),
  billing_date: z.number().int().min(1, 'Día inválido').max(31, 'Día inválido'),
  category_id: uuidSchema,
  billing_period: z.enum(['monthly', 'yearly']),
});

export const profileSchema = z.object({
  full_name: z.string().min(1, 'El nombre es obligatorio').max(100),
});

export const householdNameSchema = z.object({
  name: z.string().min(1, 'El nombre es obligatorio').max(100),
});

export const memberInviteSchema = z.object({
  email: z.string().email('Email inválido'),
});

export type ExpenseInput = z.infer<typeof expenseSchema>;
export type IncomeInput = z.infer<typeof incomeSchema>;
export type BudgetInput = z.infer<typeof budgetSchema>;
export type PendingBillInput = z.infer<typeof pendingBillSchema>;
export type SubscriptionInput = z.infer<typeof subscriptionSchema>;
