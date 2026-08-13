import { z } from 'zod';

import i18next from '@/lib/i18n';

export function getEditProfileSchema() {
  return z.object({
    name: z
      .string()
      .min(1, { message: i18next.t('errors.requiredField') })
      .min(2, { message: i18next.t('errors.nameTooShort') })
      .max(120, { message: i18next.t('errors.nameTooLong') }),
    email: z
      .string()
      .min(1, { message: i18next.t('errors.emailRequired') })
      .email({ message: i18next.t('errors.invalidEmail') }),
    phone: z
      .string()
      .min(1, { message: i18next.t('errors.requiredField') })
      .min(8, { message: i18next.t('errors.phoneTooShort') })
      .max(20, { message: i18next.t('errors.phoneTooLong') }),
    national_id: z.string().optional(),
  });
}

export const editProfileSchema = getEditProfileSchema();

export type EditProfileFormValues = z.infer<typeof editProfileSchema>;
