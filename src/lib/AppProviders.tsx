import { QueryClientProvider } from '@tanstack/react-query';
import { PropsWithChildren, useEffect, useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { KeyboardProvider } from 'react-native-keyboard-controller';

import '@/lib/i18n';
import { queryClient } from '@/lib/queryClient';
import { initSentry } from '@/lib/sentry';
import { ThemeProvider, useTheme } from '@/contexts/ThemeContext';
import { hydratePersistedQueries, startQueryPersistence } from '@/lib/queryPersistence';
import { configureQueryOnlineManager } from '@/lib/queryOnlineManager';

initSentry();

export function AppProviders({ children }: PropsWithChildren) {
  return (
    <KeyboardProvider preload={false}>
      <ThemeProvider>
        <ThemedProviders>{children}</ThemedProviders>
      </ThemeProvider>
    </KeyboardProvider>
  );
}

function ThemedProviders({ children }: PropsWithChildren) {
  const { isDark } = useTheme();
  const [isCacheHydrated, setIsCacheHydrated] = useState(false);

  useEffect(() => {
    let mounted = true;
    let stopPersistence: (() => void) | undefined;
    const stopOnlineManager = configureQueryOnlineManager();

    void hydratePersistedQueries(queryClient).finally(() => {
      if (mounted) {
        stopPersistence = startQueryPersistence(queryClient);
        setIsCacheHydrated(true);
      }
    });

    return () => {
      mounted = false;
      stopPersistence?.();
      stopOnlineManager();
    };
  }, []);

  if (!isCacheHydrated) {
    return null;
  }

  return (
    <QueryClientProvider client={queryClient}>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      {children}
    </QueryClientProvider>
  );
}
