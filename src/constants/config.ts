import { Platform } from 'react-native';

// Notes:
// - When running on Android emulators, use 10.0.2.2 to reach the host machine.
// - For physical devices, set `EXPO_PUBLIC_API_BASE_URL` to your machine IP
//   (e.g. "http://192.168.1.12:8000/api/v1") before starting Expo.
export const Config = {
  API_BASE_URL:
    process.env.EXPO_PUBLIC_API_BASE_URL ??
    (Platform.OS === 'android'
      ? 'http://10.77.251.8:8000/api/v1'
      : 'http://10.77.251.8:8000/api/v1'),
  API_TIMEOUT_MS: 15_000,
  USE_MOCKS: process.env.EXPO_PUBLIC_USE_MOCKS === 'true',
} as const;
