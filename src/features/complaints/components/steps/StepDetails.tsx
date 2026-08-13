import { zodResolver } from '@hookform/resolvers/zod';
import { FileText } from 'lucide-react-native';
import { useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { ControlledInput } from '@/components/ui/ControlledInput';
import { SubmitButton } from '@/components/ui/SubmitButton';
import { StepBackButton } from '@/features/complaints/components/StepBackButton';
import { useDraftComplaintStore } from '@/features/complaints/store/draftComplaintStore';
import {
  ComplaintDetailsValues,
  getComplaintDetailsSchema,
} from '@/features/complaints/utils/validation';
import { colors } from '@/theme/colors';

interface StepDetailsProps {
  onBack: () => void;
  onNext: () => void;
}

export function StepDetails({ onBack, onNext }: StepDetailsProps) {
  const { i18n, t } = useTranslation();
  const complaintDetailsSchema = useMemo(() => getComplaintDetailsSchema(), [i18n.language]);
  const title = useDraftComplaintStore((state) => state.title);
  const description = useDraftComplaintStore((state) => state.description);
  const setTitleDescription = useDraftComplaintStore((state) => state.setTitleDescription);
  const { control, handleSubmit } = useForm<ComplaintDetailsValues>({
    defaultValues: { description, title },
    resolver: zodResolver(complaintDetailsSchema),
  });

  const onSubmit = (values: ComplaintDetailsValues) => {
    setTitleDescription(values.title, values.description);
    onNext();
  };

  return (
    <View className="gap-6">
      <View>
        <Text className="text-[22px] font-black text-base-900">
          {t('complaints.describeIssue')}
        </Text>
        <Text className="text-[15px] leading-[21px] text-base-500">
          {t('complaints.describeIssueSubtitle')}
        </Text>
      </View>

      <ControlledInput
        control={control}
        label={t('complaints.title')}
        leftIcon={<FileText color={colors.textMuted} size={20} />}
        name="title"
        placeholder={t('complaints.titlePlaceholder')}
        type="text"
      />
      <ControlledInput
        control={control}
        label={t('complaints.description')}
        name="description"
        placeholder={t('complaints.descriptionPlaceholder')}
        type="textarea"
      />

      <View className="flex-row gap-4">
        <StepBackButton label={t('common.back')} onPress={onBack} />
        <SubmitButton
          fullWidth={false}
          handleSubmit={handleSubmit}
          label={t('common.continue')}
          onSubmit={onSubmit}
        />
      </View>
    </View>
  );
}
