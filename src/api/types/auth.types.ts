import { Role } from '@/constants/roles';

export interface AuthUser {
  department?: unknown;
  email?: string | null;
  id: number | string;
  is_active?: boolean;
  last_login_at?: string | null;
  name: string;
  national_id?: string | null;
  phone?: string | null;
  phone_verified_at?: string | null;
  role?: Role;
}

export interface RegisterPayload {
  name: string;
  email?: string;
  phone: string;
  national_id?: string;
  password: string;
  password_confirmation: string;
}

export interface LoginPayload {
  login: string;
  password: string;
}

export interface PendingOtpResponse {
  user_id: string;
  requires_otp: true;
  otp?: string;
}

export type LoginResponse = PendingOtpResponse | AuthSessionResponse;

export interface VerifyOtpPayload {
  user_id: string;
  otp: string;
  purpose: 'register' | 'verify_email' | 'login';
  device_name?: string;
}

export interface AuthSessionResponse {
  token: string;
  user: AuthUser;
}

export interface ChangePasswordPayload {
  current_password: string;
  password: string;
  password_confirmation: string;
}

export interface ForgotPasswordPayload {
  email: string;
}

export interface ResetPasswordPayload {
  email: string;
  token: string;
  password: string;
  password_confirmation: string;
}

export interface ResendOtpPayload {
  user_id: string;
  purpose: 'register' | 'verify_email' | 'login';
}
