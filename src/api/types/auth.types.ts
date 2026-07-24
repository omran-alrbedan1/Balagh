import { Role } from '@/constants/roles';

export interface AuthUser {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  role: Role;
}

export interface RegisterPayload {
  name: string;
  email?: string;
  phone: string;
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
  purpose: 'register' | 'login';
}

export interface AuthSessionResponse {
  token: string;
  user: AuthUser;
}
