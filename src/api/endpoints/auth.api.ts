import { apiClient } from '@/api/client';
import { ApiEnvelope } from '@/api/types/api-envelope.types';
import {
  AuthSessionResponse,
  AuthUser,
  LoginPayload,
  LoginResponse,
  PendingOtpResponse,
  RegisterPayload,
  VerifyOtpPayload,
} from '@/api/types/auth.types';

export async function register(payload: RegisterPayload) {
  const response = await apiClient.post<ApiEnvelope<PendingOtpResponse>>('/auth/register', payload);
  return response.data;
}

export async function login(payload: LoginPayload) {
  const response = await apiClient.post<ApiEnvelope<LoginResponse>>('/auth/login', payload);
  return response.data;
}

export async function verifyOtp(payload: VerifyOtpPayload) {
  const response = await apiClient.post<ApiEnvelope<AuthSessionResponse>>(
    '/auth/verify-otp',
    payload,
  );
  return response.data;
}

export async function me() {
  const response = await apiClient.get<ApiEnvelope<AuthUser>>('/auth/me');
  return response.data;
}

export async function logout() {
  const response = await apiClient.post<ApiEnvelope<null>>('/auth/logout');
  return response.data;
}
