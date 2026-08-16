import { useEffect, useMemo } from 'react';
import { View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { SelectField, SelectOption } from '@/components/ui/SelectField';
import { useCategories } from '@/features/lookups/hooks/useCategories';
import { useDepartments } from '@/features/lookups/hooks/useDepartments';
import { spacing } from '@/theme/spacing';

type LookupItem = {
  id: string;
  name: string;
  code: string;
  description?: string | null;
};

interface DepartmentCategoryPickerProps {
  onCategoryChange: (id: string) => void;
  onDepartmentChange: (id: string) => void;
  categoryError?: string;
  categoryId?: string;
  departmentError?: string;
  departmentId?: string;
}

function toSelectOption(item: LookupItem): SelectOption {
  return {
    id: item.id,
    label: item.name,
    sublabel: item.description ?? item.code,
  };
}

export function DepartmentCategoryPicker({
  categoryError,
  categoryId,
  departmentError,
  departmentId,
  onCategoryChange,
  onDepartmentChange,
}: DepartmentCategoryPickerProps) {
  const { t } = useTranslation();

  const {
    data: departments,
    isError: didDepartmentsFail,
    isLoading: isLoadingDepartments,
  } = useDepartments();

  const {
    data: categories,
    isError: didCategoriesFail,
    isFetching: isFetchingCategories,
    isLoading: isLoadingCategories,
    isSuccess: hasCategories,
  } = useCategories(departmentId);

  const departmentOptions: SelectOption[] = useMemo(
    () => (departments ?? []).map(toSelectOption),
    [departments],
  );

  const categoryOptions: SelectOption[] = useMemo(
    () => (categories ?? []).map(toSelectOption),
    [categories],
  );

  const departmentLoadError = didDepartmentsFail ? t('select.loadError') : undefined;
  const categoryLoadError = didCategoriesFail ? t('select.loadError') : undefined;
  const categoryPlaceholder = departmentId
    ? t('common.chooseCategory')
    : t('common.chooseDepartmentFirst');
  const isCategoryLoading = isLoadingCategories || isFetchingCategories;

  const handleDepartmentChange = (id: string) => {
    onDepartmentChange(id);
    onCategoryChange('');
  };

  useEffect(() => {
    const isSelectedCategoryAvailable = categories?.some(
      (category) => category.id === categoryId && category.department_id === departmentId,
    );

    if (categoryId && hasCategories && !isFetchingCategories && !isSelectedCategoryAvailable) {
      onCategoryChange('');
    }
  }, [categories, categoryId, departmentId, hasCategories, isFetchingCategories, onCategoryChange]);

  return (
    <View style={{ gap: spacing.md, marginBottom: 32 }}>
      <SelectField
        error={departmentError ?? departmentLoadError}
        label={t('common.department')}
        loading={isLoadingDepartments}
        onChange={handleDepartmentChange}
        options={departmentOptions}
        placeholder={t('common.chooseDepartment')}
        value={departmentId}
      />
      <SelectField
        disabled={!departmentId}
        error={categoryError ?? categoryLoadError}
        label={t('common.category')}
        loading={isCategoryLoading}
        onChange={onCategoryChange}
        options={categoryOptions}
        placeholder={categoryPlaceholder}
        value={categoryId}
      />
    </View>
  );
}
