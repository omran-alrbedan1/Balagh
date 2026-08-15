import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

import { AuthUser } from '@/api/types/auth.types';

const AUTH_TOKEN_KEY = 'auth_token';
const AUTH_USER_KEY = 'auth_user';
const PUSH_REGISTRATION_KEY = 'push_registration';

export interface StoredPushRegistration {
  appVersion: string;
  deviceTokenId: string | number;
  platform: 'ios' | 'android';
  token: string;
  userId: string;
}

async function getStorageItem(key: string) {
  return Platform.OS === 'web' ? localStorage.getItem(key) : SecureStore.getItemAsync(key);
}

async function setStorageItem(key: string, value: string) {
  if (Platform.OS === 'web') {
    localStorage.setItem(key, value);
    return;
  }
  await SecureStore.setItemAsync(key, value);
}

async function deleteStorageItem(key: string) {
  if (Platform.OS === 'web') {
    localStorage.removeItem(key);
    return;
  }
  await SecureStore.deleteItemAsync(key);
}

export async function getPushRegistration(): Promise<StoredPushRegistration | null> {
  const value = await getStorageItem(PUSH_REGISTRATION_KEY);
  if (!value) return null;
  try {
    return JSON.parse(value) as StoredPushRegistration;
  } catch {
    await deleteStorageItem(PUSH_REGISTRATION_KEY);
    return null;
  }
}

export async function savePushRegistration(registration: StoredPushRegistration) {
  await setStorageItem(PUSH_REGISTRATION_KEY, JSON.stringify(registration));
}

export async function clearPushRegistration() {
  await deleteStorageItem(PUSH_REGISTRATION_KEY);
}

export async function getToken() {
  if (Platform.OS === 'web') {
    return localStorage.getItem(AUTH_TOKEN_KEY);
  }

  return SecureStore.getItemAsync(AUTH_TOKEN_KEY);
}

export async function saveSession(token: string, user: AuthUser) {
  if (Platform.OS === 'web') {
    localStorage.setItem(AUTH_TOKEN_KEY, token);
    localStorage.setItem(AUTH_USER_KEY, JSON.stringify(user));
    return;
  }

  await Promise.all([
    SecureStore.setItemAsync(AUTH_TOKEN_KEY, token),
    SecureStore.setItemAsync(AUTH_USER_KEY, JSON.stringify(user)),
  ]);
}

export async function getStoredUser() {
  if (Platform.OS === 'web') {
    const value = localStorage.getItem(AUTH_USER_KEY);
    return value ? (JSON.parse(value) as AuthUser) : null;
  }

  const value = await SecureStore.getItemAsync(AUTH_USER_KEY);
  return value ? (JSON.parse(value) as AuthUser) : null;
}

export async function clearSession() {
  if (Platform.OS === 'web') {
    localStorage.removeItem(AUTH_TOKEN_KEY);
    localStorage.removeItem(AUTH_USER_KEY);
    return;
  }

  await Promise.all([
    SecureStore.deleteItemAsync(AUTH_TOKEN_KEY),
    SecureStore.deleteItemAsync(AUTH_USER_KEY),
  ]);
}
