import { z } from 'zod';

import i18next from '@/lib/i18n';

export function getLoginSchema() {
  return z.object({
    login: z.string().min(1, { message: i18next.t('errors.requiredField') }),
    password: z.string().min(8, { message: i18next.t('errors.passwordTooShort') }),
  });
}

export function getRegisterSchema() {
  return z
    .object({
      name: z
        .string()
        .min(1, { message: i18next.t('errors.requiredField') })
        .min(2, { message: i18next.t('errors.nameTooShort') })
        .max(120, { message: i18next.t('errors.nameTooLong') }),
      email: z
        .string()
        .min(1, { message: i18next.t('errors.emailRequired') })
        .email({ message: i18next.t('errors.invalidEmail') }),
      phone: z
        .string()
        .min(1, { message: i18next.t('errors.requiredField') })
        .min(8, { message: i18next.t('errors.phoneTooShort') })
        .max(20, { message: i18next.t('errors.phoneTooLong') }),
      national_id: z.string().optional(),
      password: z.string().min(8, { message: i18next.t('errors.passwordTooShort') }),
      password_confirmation: z.string().min(8, { message: i18next.t('errors.passwordTooShort') }),
    })
    .refine((data) => data.password === data.password_confirmation, {
      message: i18next.t('errors.passwordMismatch'),
      path: ['password_confirmation'],
    });
}

export function getOtpSchema() {
  return z.object({
    otp: z.string().regex(/^\d{6}$/, { message: i18next.t('errors.otpInvalid') }),
  });
}

export function getChangePasswordSchema() {
  return z
    .object({
      current_password: z.string().min(1, { message: i18next.t('errors.requiredField') }),
      password: z.string().min(8, { message: i18next.t('errors.passwordTooShort') }),
      password_confirmation: z.string().min(8, { message: i18next.t('errors.passwordTooShort') }),
    })
    .refine((data) => data.password === data.password_confirmation, {
      message: i18next.t('errors.passwordMismatch'),
      path: ['password_confirmation'],
    })
    .refine((data) => data.current_password !== data.password, {
      message: i18next.t('errors.passwordMustDiffer'),
      path: ['password'],
    });
}

export function getForgotPasswordSchema() {
  return z.object({
    email: z
      .string()
      .min(1, { message: i18next.t('errors.emailRequired') })
      .email({ message: i18next.t('errors.invalidEmail') }),
  });
}

export function getResetPasswordSchema() {
  return z
    .object({
      email: z
        .string()
        .min(1, { message: i18next.t('errors.emailRequired') })
        .email({ message: i18next.t('errors.invalidEmail') }),
      token: z.string().min(1, { message: i18next.t('errors.requiredField') }),
      password: z.string().min(8, { message: i18next.t('errors.passwordTooShort') }),
      password_confirmation: z.string().min(8, { message: i18next.t('errors.passwordTooShort') }),
    })
    .refine((data) => data.password === data.password_confirmation, {
      message: i18next.t('errors.passwordMismatch'),
      path: ['password_confirmation'],
    });
}

export const loginSchema = getLoginSchema();
export const registerSchema = getRegisterSchema();
export const otpSchema = getOtpSchema();
export const changePasswordSchema = getChangePasswordSchema();
export const forgotPasswordSchema = getForgotPasswordSchema();
export const resetPasswordSchema = getResetPasswordSchema();

export type LoginFormValues = z.infer<typeof loginSchema>;
export type RegisterFormValues = z.infer<typeof registerSchema>;
export type OtpFormValues = z.infer<typeof otpSchema>;
export type ChangePasswordFormValues = z.infer<typeof changePasswordSchema>;
export type ForgotPasswordFormValues = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordFormValues = z.infer<typeof resetPasswordSchema>;
