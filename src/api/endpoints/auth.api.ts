import { apiClient } from '@/api/client';
import { ApiEnvelope } from '@/api/types/api-envelope.types';
import { DeviceToken, DeviceTokenListResponse, DeviceTokenPayload } from '@/api/types/device.types';
import {
  AuthSessionResponse,
  AuthUser,
  ChangePasswordPayload,
  ForgotPasswordPayload,
  LoginPayload,
  LoginResponse,
  PendingOtpResponse,
  RegisterPayload,
  ResetPasswordPayload,
  ResendOtpPayload,
  UpdateProfilePayload,
  VerifyOtpPayload,
} from '@/api/types/auth.types';

type AuthUserResponse = AuthUser | { user: AuthUser };

export function extractAuthUser(data: AuthUserResponse) {
  return 'user' in data ? data.user : data;
}

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
  const response = await apiClient.get<ApiEnvelope<AuthUserResponse>>('/auth/me');

  return {
    ...response.data,
    data: extractAuthUser(response.data.data),
  };
}

export async function updateProfile(payload: UpdateProfilePayload) {
  const response = await apiClient.patch<ApiEnvelope<AuthUserResponse>>('/auth/profile', {
    name: payload.name.trim(),
    phone: payload.phone.trim(),
  });

  return {
    ...response.data,
    data: extractAuthUser(response.data.data),
  };
}

export async function logout() {
  const response = await apiClient.post<ApiEnvelope<null>>('/auth/logout');
  return response.data;
}

export async function changePassword(payload: ChangePasswordPayload) {
  const response = await apiClient.post<ApiEnvelope<null>>('/auth/change-password', payload);
  return response.data;
}

export async function forgotPassword(payload: ForgotPasswordPayload) {
  const response = await apiClient.post<ApiEnvelope<null>>('/auth/forgot-password', payload);
  return response.data;
}

export async function resetPassword(payload: ResetPasswordPayload) {
  const response = await apiClient.post<ApiEnvelope<null>>('/auth/reset-password', payload);
  return response.data;
}

export async function resendOtp(payload: ResendOtpPayload) {
  const response = await apiClient.post<ApiEnvelope<PendingOtpResponse>>(
    '/auth/resend-otp',
    payload,
  );
  return response.data;
}

export async function logoutAll() {
  const response = await apiClient.post<ApiEnvelope<null>>('/auth/logout-all');
  return response.data;
}

export async function registerDeviceToken(payload: DeviceTokenPayload) {
  const response = await apiClient.post<ApiEnvelope<DeviceToken>>('/device-tokens', payload);
  return response.data;
}

export async function getDeviceTokens() {
  const response = await apiClient.get<ApiEnvelope<DeviceTokenListResponse>>('/device-tokens');
  return response.data;
}

export async function deleteDeviceToken(deviceTokenId: string | number) {
  const response = await apiClient.delete<ApiEnvelope<null>>(`/device-tokens/${deviceTokenId}`);
  return response.data;
}
