import { Loader2, Sparkles, Tags } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { StepBackButton } from '@/features/complaints/components/StepBackButton';
import { SubmitButton } from '@/components/ui/SubmitButton';
import { StepHeader } from '@/features/complaints/components/StepHeader';
import { useDraftComplaintStore } from '@/features/complaints/store/draftComplaintStore';
import { DepartmentCategoryPicker } from '@/features/lookups/components/DepartmentCategoryPicker';
import { colors } from '@/theme/colors';

interface StepCategoryProps {
  onBack?: () => void;
  onNext: () => void;
}

export function StepCategory({ onBack, onNext }: StepCategoryProps) {
  const { t } = useTranslation();
  const departmentId = useDraftComplaintStore((state) => state.departmentId);
  const categoryId = useDraftComplaintStore((state) => state.categoryId);
  const classification = useDraftComplaintStore((state) => state.classification);
  const setDepartment = useDraftComplaintStore((state) => state.setDepartment);
  const setCategory = useDraftComplaintStore((state) => state.setCategory);
  const [touched, setTouched] = useState(false);
  const canContinue = Boolean(departmentId && categoryId);
  const isClassifying = classification.status === 'loading';
  const isSuggestedApplied =
    classification.status === 'success' &&
    Boolean(classification.departmentId && classification.categoryId) &&
    departmentId === classification.departmentId &&
    categoryId === classification.categoryId;

  useEffect(() => {
    if (
      classification.status === 'success' &&
      classification.departmentId &&
      classification.categoryId
    ) {
      setDepartment(classification.departmentId);
      setCategory(classification.categoryId);
    }
  }, [classification.status]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <View className="gap-6">
      <StepHeader
        icon={<Tags color={colors.primary} size={24} />}
        subtitle={t('complaints.selectStepSubtitle')}
        title={t('complaints.selectStepTitle')}
      />

      {isClassifying ? (
        <View className="flex-row items-center gap-3 rounded-xl bg-primary-50 px-4 py-3">
          <Loader2 color={colors.primary} size={18} />
          <Text className="flex-1 text-[13px] font-semibold text-primary-700">
            {t('complaints.classifying')}
          </Text>
        </View>
      ) : null}

      {isSuggestedApplied ? (
        <View className="flex-row items-center gap-3 rounded-xl bg-primary-50 px-4 py-3">
          <Sparkles color={colors.primary} size={18} />
          <Text className="flex-1 text-[13px] leading-[18px] text-primary-700">
            {t('complaints.suggestedCategory', {
              department: classification.departmentName,
              category: classification.categoryName,
              confidence: Math.round(classification.confidence),
            })}
          </Text>
        </View>
      ) : null}

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

      <View className="flex-row gap-4">
        {onBack ? <StepBackButton label={t('common.back')} onPress={onBack} /> : null}
        <SubmitButton
          fullWidth={false}
          label={t('common.continue')}
          onPress={() => {
            setTouched(true);
            if (canContinue) {
              onNext();
            }
          }}
        />
      </View>
    </View>
  );
}
