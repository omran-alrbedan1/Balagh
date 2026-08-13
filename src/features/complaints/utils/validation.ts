import { z } from 'zod';

import i18next from '@/lib/i18n';

export function getComplaintDetailsSchema() {
  return z.object({
    title: z
      .string()
      .min(5, i18next.t('errors.titleTooShort'))
      .max(120, i18next.t('errors.titleTooLong')),
    description: z
      .string()
      .min(20, i18next.t('errors.descriptionTooShort'))
      .max(2000, i18next.t('errors.descriptionTooLong')),
  });
}

export const complaintDetailsSchema = getComplaintDetailsSchema();

export type ComplaintDetailsValues = z.infer<typeof complaintDetailsSchema>;
