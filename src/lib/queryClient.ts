import { QueryClient } from '@tanstack/react-query';

import { ApiError } from '@/api/client';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: (failureCount, error) => {
        const status = error instanceof ApiError ? error.status : undefined;

        if (status && status >= 400 && status < 500) {
          return false;
        }

        return failureCount < 2;
      },
      staleTime: 60_000,
    },
    mutations: {
      retry: false,
    },
  },
});
