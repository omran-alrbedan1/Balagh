import axios, { AxiosError } from 'axios';
import { router } from 'expo-router';

import { Config } from '@/constants/config';
import { clearSession, getToken } from '@/lib/secureStorage';

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status?: number,
    public readonly fieldErrors?: Record<string, string[]>,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export function normalizeApiError(error: unknown) {
  if (!axios.isAxiosError(error)) {
    return new ApiError('Something went wrong.');
  }

  const axiosError = error as AxiosError<{
    message?: string;
    errors?: Record<string, string[]>;
  }>;
  const isNetworkError = axiosError.message === 'Network Error';
  const isTimeout = axiosError.code === 'ECONNABORTED';

  if (!axiosError.response && (isNetworkError || isTimeout)) {
    return new ApiError(
      `Cannot reach the server at ${Config.API_BASE_URL}. Make sure the phone and backend are on the same network, and that the backend is running/listening on the LAN IP.`,
    );
  }

  return new ApiError(
    axiosError.response?.data?.message ?? axiosError.message,
    axiosError.response?.status,
    axiosError.response?.data?.errors,
  );
}

export const apiClient = axios.create({
  baseURL: Config.API_BASE_URL,
  headers: {
    Accept: 'application/json',
  },
  timeout: Config.API_TIMEOUT_MS,
});

apiClient.interceptors.request.use(async (request) => {
  const token = await getToken();

  if (token) {
    request.headers.Authorization = `Bearer ${token}`;
  }

  return request;
});

apiClient.interceptors.response.use(
  (response) => response,
  async (error: unknown) => {
    const normalized = normalizeApiError(error);
    const requestUrl = axios.isAxiosError(error) ? error.config?.url : undefined;
    const isAuthRequest = requestUrl?.startsWith('/auth/') ?? false;

    if (normalized.status === 401 && !isAuthRequest) {
      await clearSession();
      router.replace('/(auth)/login');
    }

    return Promise.reject(normalized);
  },
);
