import { QueryClientProvider } from '@tanstack/react-query';
import { PropsWithChildren } from 'react';
import { StatusBar } from 'expo-status-bar';

import '@/lib/i18n';
import { queryClient } from '@/lib/queryClient';
import { initSentry } from '@/lib/sentry';
import { ThemeProvider, useTheme } from '@/contexts/ThemeContext';

initSentry();

export function AppProviders({ children }: PropsWithChildren) {
  return (
    <ThemeProvider>
      <ThemedProviders>{children}</ThemedProviders>
    </ThemeProvider>
  );
}

function ThemedProviders({ children }: PropsWithChildren) {
  const { isDark } = useTheme();

  return (
    <QueryClientProvider client={queryClient}>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      {children}
    </QueryClientProvider>
  );
}
