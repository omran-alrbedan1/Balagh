import { zodResolver } from '@hookform/resolvers/zod';
import { FileText, Sparkles } from 'lucide-react-native';
import { useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { ControlledInput } from '@/components/ui/ControlledInput';
import { SubmitButton } from '@/components/ui/SubmitButton';
import { StepBackButton } from '@/features/complaints/components/StepBackButton';
import { useClassifyComplaint } from '@/features/complaints/hooks/useClassifyComplaint';
import { useDraftComplaintStore } from '@/features/complaints/store/draftComplaintStore';
import {
  ComplaintDetailsValues,
  getComplaintDetailsSchema,
} from '@/features/complaints/utils/validation';
import { colors } from '@/theme/colors';
import { useNetworkStatus } from '@/hooks/useNetworkStatus';

interface StepDetailsProps {
  onBack?: () => void;
  onNext: () => void;
}

export function StepDetails({ onBack, onNext }: StepDetailsProps) {
  const { t } = useTranslation();
  const complaintDetailsSchema = useMemo(() => getComplaintDetailsSchema(), []);
  const title = useDraftComplaintStore((state) => state.title);
  const description = useDraftComplaintStore((state) => state.description);
  const setTitleDescription = useDraftComplaintStore((state) => state.setTitleDescription);
  const setClassification = useDraftComplaintStore((state) => state.setClassification);
  const classifyComplaint = useClassifyComplaint();
  const { isOnline } = useNetworkStatus();
  const { control, handleSubmit } = useForm<ComplaintDetailsValues>({
    defaultValues: { description, title },
    resolver: zodResolver(complaintDetailsSchema),
  });

  const onSubmit = (values: ComplaintDetailsValues) => {
    setTitleDescription(values.title, values.description);
    if (!isOnline) {
      setClassification({
        status: 'error',
        error: t('complaints.classificationOffline'),
      });
      onNext();
      return;
    }
    setClassification({ status: 'loading', error: undefined });
    classifyComplaint.mutate({ title: values.title, description: values.description });
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

      <View className="flex-row items-center gap-2 rounded-xl bg-primary-50 px-4 py-3">
        <Sparkles color={colors.primary} size={16} />
        <Text className="flex-1 text-[13px] leading-[18px] text-primary-700">
          {t('complaints.autoClassifyHint')}
        </Text>
      </View>

      <View className="flex-row gap-4">
        {onBack ? <StepBackButton label={t('common.back')} onPress={onBack} /> : null}
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
