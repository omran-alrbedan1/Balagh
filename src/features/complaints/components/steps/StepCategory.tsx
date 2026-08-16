import { Loader2, Sparkles, Tags } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { StepBackButton } from '@/features/complaints/components/StepBackButton';
import { SubmitButton } from '@/components/ui/SubmitButton';
import { StepHeader } from '@/features/complaints/components/StepHeader';
import { useDraftComplaintStore } from '@/features/complaints/store/draftComplaintStore';
import { DepartmentCategoryPicker } from '@/features/lookups/components/DepartmentCategoryPicker';
import { useCategories } from '@/features/lookups/hooks/useCategories';
import { useDepartments } from '@/features/lookups/hooks/useDepartments';
import { colors } from '@/theme/colors';
import { useNetworkStatus } from '@/hooks/useNetworkStatus';

interface StepCategoryProps {
  onBack?: () => void;
  onNext: () => void;
}

export function StepCategory({ onBack, onNext }: StepCategoryProps) {
  const { t } = useTranslation();
  const departmentId = useDraftComplaintStore((state) => state.departmentId);
  const categoryId = useDraftComplaintStore((state) => state.categoryId);
  const classification = useDraftComplaintStore((state) => state.classification);
  const applyClassificationCategory = useDraftComplaintStore(
    (state) => state.applyClassificationCategory,
  );
  const applyClassificationDepartment = useDraftComplaintStore(
    (state) => state.applyClassificationDepartment,
  );
  const markClassificationInvalid = useDraftComplaintStore(
    (state) => state.markClassificationInvalid,
  );
  const setDepartment = useDraftComplaintStore((state) => state.setDepartment);
  const setCategory = useDraftComplaintStore((state) => state.setCategory);
  const { isOnline } = useNetworkStatus();
  const [touched, setTouched] = useState(false);
  const allowServerClassification = !isOnline;
  const canContinue = allowServerClassification || Boolean(departmentId && categoryId);
  const isClassifying = classification.status === 'loading';
  const hasSuggestion =
    classification.status === 'success' &&
    classification.applicationStatus !== 'invalid' &&
    Boolean(classification.departmentId && classification.categoryId);
  const {
    data: departments,
    isFetching: isFetchingDepartments,
    isSuccess: hasDepartments,
  } = useDepartments();
  const {
    data: categories,
    isFetching: isFetchingCategories,
    isSuccess: hasCategories,
  } = useCategories(departmentId);

  useEffect(() => {
    if (
      classification.status !== 'success' ||
      classification.applicationStatus !== 'pending' ||
      !classification.departmentId ||
      !classification.categoryId ||
      isFetchingDepartments
    ) {
      return;
    }

    const hasSuggestedDepartment = departments?.some(
      (department) => department.id === classification.departmentId,
    );

    if (!hasDepartments || !hasSuggestedDepartment) {
      markClassificationInvalid();
      return;
    }

    if (departmentId !== classification.departmentId) {
      applyClassificationDepartment(classification.departmentId);
    }
  }, [
    applyClassificationDepartment,
    classification.applicationStatus,
    classification.categoryId,
    classification.departmentId,
    classification.status,
    departmentId,
    departments,
    hasDepartments,
    isFetchingDepartments,
    markClassificationInvalid,
  ]);

  useEffect(() => {
    if (
      classification.status !== 'success' ||
      classification.applicationStatus !== 'pending' ||
      !classification.departmentId ||
      !classification.categoryId ||
      departmentId !== classification.departmentId ||
      isFetchingCategories
    ) {
      return;
    }

    const hasSuggestedCategory = categories?.some(
      (category) =>
        category.id === classification.categoryId &&
        category.department_id === classification.departmentId,
    );

    if (!hasCategories || !hasSuggestedCategory) {
      markClassificationInvalid();
      return;
    }

    applyClassificationCategory(classification.categoryId);
  }, [
    applyClassificationCategory,
    categories,
    classification.applicationStatus,
    classification.categoryId,
    classification.departmentId,
    classification.status,
    departmentId,
    hasCategories,
    isFetchingCategories,
    markClassificationInvalid,
  ]);

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

      {hasSuggestion ? (
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

      {classification.status === 'error' ? (
        <View className="rounded-xl bg-warning-50 px-4 py-3">
          <Text className="text-[13px] font-semibold leading-[18px] text-base-900">
            {classification.error ?? t('complaints.classificationOffline')}
          </Text>
        </View>
      ) : null}

      <DepartmentCategoryPicker
        categoryError={
          touched && !allowServerClassification && departmentId && !categoryId
            ? t('complaints.selectCategoryError')
            : undefined
        }
        categoryId={categoryId}
        departmentError={
          touched && !allowServerClassification && !departmentId
            ? t('complaints.selectDepartmentError')
            : undefined
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
