import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';

import { getDepartments } from '@/api/endpoints/lookups.api';
import { queryKeys } from '@/constants/queryKeys';

const THIRTY_MIN = 30 * 60 * 1000;

export function useDepartments() {
  const { i18n } = useTranslation();
  const language = i18n.language?.startsWith('ar') ? 'ar' : 'en';

  return useQuery({
    gcTime: 60 * 60 * 1000,
    queryKey: queryKeys.departments(language),
    queryFn: async () => (await getDepartments()).data.departments,
    staleTime: THIRTY_MIN,
  });
}
