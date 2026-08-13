import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';

import { getCategories } from '@/api/endpoints/lookups.api';
import { queryKeys } from '@/constants/queryKeys';

const THIRTY_MIN = 30 * 60 * 1000;

export function useCategories(departmentId?: string) {
  const { i18n } = useTranslation();
  const language = i18n.language?.startsWith('ar') ? 'ar' : 'en';

  return useQuery({
    enabled: Boolean(departmentId),
    queryKey: queryKeys.categories(departmentId, language),
    queryFn: async () => (await getCategories(departmentId)).data.categories,
    staleTime: THIRTY_MIN,
  });
}
