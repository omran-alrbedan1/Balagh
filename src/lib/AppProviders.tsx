import { QueryClientProvider } from '@tanstack/react-query';
import { PropsWithChildren } from 'react';

import '@/lib/i18n';
import { queryClient } from '@/lib/queryClient';
import { initSentry } from '@/lib/sentry';

initSentry();

export function AppProviders({ children }: PropsWithChildren) {
  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}
