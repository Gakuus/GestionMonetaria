import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().trim().email('Email inválido').min(1, 'Email requerido'),
  password: z.string().min(8, 'Mínimo 8 caracteres').max(128),
});

export const registerSchema = z.object({
  full_name: z.string().trim().min(2, 'Mínimo 2 caracteres').max(100),
  email: z.string().trim().email('Email inválido').min(1, 'Email requerido'),
  password: z.string().min(8, 'Mínimo 8 caracteres').max(128),
  confirm_password: z.string(),
}).refine((data) => data.password === data.confirm_password, {
  message: 'Las contraseñas no coinciden',
  path: ['confirm_password'],
});

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
