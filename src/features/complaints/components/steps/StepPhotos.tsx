import { Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { SubmitButton } from '@/components/ui/SubmitButton';
import { AttachmentPicker } from '@/features/complaints/components/AttachmentPicker';
import { StepBackButton } from '@/features/complaints/components/StepBackButton';

interface StepPhotosProps {
  onBack: () => void;
  onNext: () => void;
}

export function StepPhotos({ onBack, onNext }: StepPhotosProps) {
  const { t } = useTranslation();

  return (
    <View className="gap-6">
      <View>
        <Text className="text-[22px] font-black text-base-900">{t('complaints.addPhotos')}</Text>
        <Text className="text-[15px] leading-[21px] text-base-500">
          {t('complaints.addPhotosSubtitle')}
        </Text>
      </View>

      <AttachmentPicker />

      <View className="flex-row gap-4">
        <StepBackButton label={t('common.back')} onPress={onBack} />
        <SubmitButton fullWidth={false} label={t('common.continue')} onPress={onNext} />
      </View>
    </View>
  );
}
