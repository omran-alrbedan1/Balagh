import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import { router } from 'expo-router';

import { Config } from '@/constants/config';
import i18next from '@/lib/i18n';
import { clearSession, getToken } from '@/lib/secureStorage';

const MAX_RETRIES = 2;
const RETRY_DELAY_MS = 1500;

interface RetryableRequestConfig extends InternalAxiosRequestConfig {
  __retryCount?: number;
  skipNetworkRetry?: boolean;
}

function isRetryableNetworkError(error: unknown): boolean {
  if (!axios.isAxiosError(error)) {
    return false;
  }

  if (error.response) {
    return false;
  }

  return error.message === 'Network Error' || error.code === 'ECONNABORTED';
}

function delay(ms: number) {
  return new Promise<void>((resolve) => setTimeout(resolve, ms));
}

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
    const isProductionUrl =
      Config.API_BASE_URL.includes('https://') &&
      (Config.API_BASE_URL.includes('.com') || Config.API_BASE_URL.includes('.app'));

    if (isProductionUrl) {
      return new ApiError(
        `Cannot reach the server at ${Config.API_BASE_URL}. Please check your internet connection and try again.`,
      );
    }

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
  const language = i18next.language?.startsWith('ar') ? 'ar' : 'en';

  request.headers['Accept-Language'] = language;

  if (token) {
    request.headers.Authorization = `Bearer ${token}`;
  }

  return request;
});

apiClient.interceptors.response.use(
  (response) => response,
  async (error: unknown) => {
    if (isRetryableNetworkError(error)) {
      const config = axios.isAxiosError(error)
        ? (error.config as RetryableRequestConfig | undefined)
        : undefined;
      const retryCount = config?.__retryCount ?? 0;

      if (config && !config.skipNetworkRetry && retryCount < MAX_RETRIES) {
        config.__retryCount = retryCount + 1;
        await delay(RETRY_DELAY_MS * (retryCount + 1));
        return apiClient.request(config);
      }
    }

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
