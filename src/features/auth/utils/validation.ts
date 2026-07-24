import { z } from 'zod';

const optionalEmail = z
  .string()
  .refine((value) => value === '' || z.string().email().safeParse(value).success, {
    message: 'Invalid email address.',
  });

export const loginSchema = z.object({
  login: z.string().min(3),
  password: z.string().min(8),
});

export const registerSchema = z
  .object({
    name: z.string().min(2).max(120),
    email: optionalEmail,
    phone: z.string().min(8).max(20),
    password: z.string().min(8),
    password_confirmation: z.string().min(8),
  })
  .refine((data) => data.password === data.password_confirmation, {
    message: 'Passwords do not match.',
    path: ['password_confirmation'],
  });

export const otpSchema = z.object({
  otp: z.string().regex(/^\d{6}$/),
});

export type LoginFormValues = z.infer<typeof loginSchema>;
export type RegisterFormValues = z.infer<typeof registerSchema>;
export type OtpFormValues = z.infer<typeof otpSchema>;
