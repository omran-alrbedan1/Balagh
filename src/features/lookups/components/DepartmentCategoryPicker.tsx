import { useEffect, useMemo } from 'react';
import { View } from 'react-native';

import { SelectField, SelectOption } from '@/components/ui/SelectField';
import { useCategories } from '@/features/lookups/hooks/useCategories';
import { useDepartments } from '@/features/lookups/hooks/useDepartments';
import { spacing } from '@/theme/spacing';

interface DepartmentCategoryPickerProps {
  onCategoryChange: (id: string) => void;
  onDepartmentChange: (id: string) => void;
  categoryError?: string;
  categoryId?: string;
  departmentError?: string;
  departmentId?: string;
}

export function DepartmentCategoryPicker({
  categoryError,
  categoryId,
  departmentError,
  departmentId,
  onCategoryChange,
  onDepartmentChange,
}: DepartmentCategoryPickerProps) {
  const { data: departments, isLoading: loadingDepartments } = useDepartments();
  const {
    data: categories,
    isFetching: fetchingCategories,
    isLoading: loadingCategories,
  } = useCategories(departmentId);

  const departmentOptions: SelectOption[] = useMemo(
    () =>
      (departments ?? []).map((department) => ({
        id: department.id,
        label: department.name,
        sublabel: department.description ?? department.code,
      })),
    [departments],
  );

  const categoryOptions: SelectOption[] = useMemo(
    () =>
      (categories ?? []).map((category) => ({
        id: category.id,
        label: category.name,
        sublabel: category.description ?? category.code,
      })),
    [categories],
  );

  useEffect(() => {
    if (categoryId && categories && !categories.some((category) => category.id === categoryId)) {
      onCategoryChange('');
    }
  }, [categories, categoryId, onCategoryChange]);

  return (
    <View style={{ gap: spacing.md }}>
      <SelectField
        error={departmentError}
        label="Department"
        loading={loadingDepartments}
        onChange={(id) => {
          onDepartmentChange(id);
          onCategoryChange('');
        }}
        options={departmentOptions}
        placeholder="Choose a department"
        value={departmentId}
      />
      <SelectField
        disabled={!departmentId}
        error={categoryError}
        label="Category"
        loading={loadingCategories || fetchingCategories}
        onChange={onCategoryChange}
        options={categoryOptions}
        placeholder={departmentId ? 'Choose a category' : 'Choose a department first'}
        value={categoryId}
      />
    </View>
  );
}
