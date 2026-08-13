import { Tags } from 'lucide-react-native';
import { useState } from 'react';
import { View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { SubmitButton } from '@/components/ui/SubmitButton';
import { StepHeader } from '@/features/complaints/components/StepHeader';
import { useDraftComplaintStore } from '@/features/complaints/store/draftComplaintStore';
import { DepartmentCategoryPicker } from '@/features/lookups/components/DepartmentCategoryPicker';
import { colors } from '@/theme/colors';

export function StepCategory({ onNext }: { onNext: () => void }) {
  const { t } = useTranslation();
  const departmentId = useDraftComplaintStore((state) => state.departmentId);
  const categoryId = useDraftComplaintStore((state) => state.categoryId);
  const setDepartment = useDraftComplaintStore((state) => state.setDepartment);
  const setCategory = useDraftComplaintStore((state) => state.setCategory);
  const [touched, setTouched] = useState(false);
  const canContinue = Boolean(departmentId && categoryId);

  return (
    <View className="gap-6">
      <StepHeader
        icon={<Tags color={colors.primary} size={24} />}
        subtitle={t('complaints.selectStepSubtitle')}
        title={t('complaints.selectStepTitle')}
      />

      <DepartmentCategoryPicker
        categoryError={
          touched && departmentId && !categoryId ? t('complaints.selectCategoryError') : undefined
        }
        categoryId={categoryId}
        departmentError={
          touched && !departmentId ? t('complaints.selectDepartmentError') : undefined
        }
        departmentId={departmentId}
        onCategoryChange={setCategory}
        onDepartmentChange={setDepartment}
      />

      <SubmitButton
        label={t('common.continue')}
        onPress={() => {
          setTouched(true);
          if (canContinue) {
            onNext();
          }
        }}
      />
    </View>
  );
}
