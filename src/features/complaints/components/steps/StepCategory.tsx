import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { Button } from '@/components/ui/Button';
import { useDraftComplaintStore } from '@/features/complaints/store/draftComplaintStore';
import { DepartmentCategoryPicker } from '@/features/lookups/components/DepartmentCategoryPicker';
import { colors } from '@/theme/colors';
import { spacing } from '@/theme/spacing';

export function StepCategory({ onNext }: { onNext: () => void }) {
  const departmentId = useDraftComplaintStore((state) => state.departmentId);
  const categoryId = useDraftComplaintStore((state) => state.categoryId);
  const setDepartment = useDraftComplaintStore((state) => state.setDepartment);
  const setCategory = useDraftComplaintStore((state) => state.setCategory);
  const [touched, setTouched] = useState(false);
  const canContinue = Boolean(departmentId && categoryId);

  return (
    <View style={styles.container}>
      <View>
        <Text style={styles.title}>What is this about?</Text>
        <Text style={styles.subtitle}>
          Choose the department and category that best matches your issue.
        </Text>
      </View>

      <DepartmentCategoryPicker
        categoryError={
          touched && departmentId && !categoryId ? 'Please choose a category.' : undefined
        }
        categoryId={categoryId}
        departmentError={touched && !departmentId ? 'Please choose a department.' : undefined}
        departmentId={departmentId}
        onCategoryChange={setCategory}
        onDepartmentChange={setDepartment}
      />

      <Button
        label="Continue"
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

const styles = StyleSheet.create({
  container: {
    gap: spacing.lg,
  },
  subtitle: {
    color: colors.textMuted,
    fontSize: 15,
    lineHeight: 21,
  },
  title: {
    color: colors.text,
    fontSize: 22,
    fontWeight: '900',
  },
});
