import * as Sentry from '@sentry/react-native';

let initialized = false;

export function initSentry() {
  if (initialized || !process.env.EXPO_PUBLIC_SENTRY_DSN) {
    return;
  }

  Sentry.init({
    dsn: process.env.EXPO_PUBLIC_SENTRY_DSN,
    enableNative: true,
  });

  initialized = true;
}
