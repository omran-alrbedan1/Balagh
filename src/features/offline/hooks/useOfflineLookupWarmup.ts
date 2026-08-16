import { useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';

import { getCategories, getDepartments } from '@/api/endpoints/lookups.api';
import { queryKeys } from '@/constants/queryKeys';
import { useNetworkStatus } from '@/hooks/useNetworkStatus';

const LOOKUP_STALE_TIME = 30 * 60 * 1000;

export function useOfflineLookupWarmup() {
  const queryClient = useQueryClient();
  const { i18n } = useTranslation();
  const { status } = useNetworkStatus();
  const language = i18n.language?.startsWith('ar') ? 'ar' : 'en';

  useEffect(() => {
    if (status !== 'online') {
      return;
    }

    void Promise.all([
      queryClient.ensureQueryData({
        queryKey: queryKeys.departments(language),
        queryFn: async () => (await getDepartments()).data.departments,
        staleTime: LOOKUP_STALE_TIME,
      }),
      queryClient.ensureQueryData({
        queryKey: queryKeys.categories(undefined, language),
        queryFn: async () => (await getCategories()).data.categories,
        staleTime: LOOKUP_STALE_TIME,
      }),
    ])
      .then(([departments, categories]) => {
        for (const department of departments) {
          queryClient.setQueryData(
            queryKeys.categories(department.id, language),
            categories.filter((category) => category.department_id === department.id),
          );
        }
      })
      .catch(() => {
        // The ordinary lookup queries remain available; warmup is best-effort.
      });
  }, [language, queryClient, status]);
}
