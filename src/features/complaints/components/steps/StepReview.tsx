import { router } from 'expo-router';
import { Image, StyleSheet, Text, View } from 'react-native';

import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { ErrorState } from '@/components/ui/ErrorState';
import { useCreateComplaint } from '@/features/complaints/hooks/useCreateComplaint';
import { useDraftComplaintStore } from '@/features/complaints/store/draftComplaintStore';
import { useCategories } from '@/features/lookups/hooks/useCategories';
import { useDepartments } from '@/features/lookups/hooks/useDepartments';
import { colors } from '@/theme/colors';
import { spacing } from '@/theme/spacing';

export function StepReview({ onBack }: { onBack: () => void }) {
  const draft = useDraftComplaintStore();
  const { data: departments } = useDepartments();
  const { data: categories } = useCategories(draft.departmentId);
  const createComplaintMutation = useCreateComplaint();
  const departmentName =
    departments?.find((department) => department.id === draft.departmentId)?.name ?? '-';
  const categoryName =
    categories?.find((category) => category.id === draft.categoryId)?.name ?? '-';

  const handleSubmit = () => {
    createComplaintMutation.mutate(undefined, {
      onSuccess: (result) => {
        if (result.queued) {
          router.replace('/(app)/(tabs)/complaints/index');
          return;
        }

        if (!result.complaint?.id) {
          router.replace('/(app)/(tabs)/complaints/index');
          return;
        }

        router.replace({
          pathname: '/(app)/(tabs)/complaints/[id]',
          params: { id: result.complaint.id },
        });
      },
    });
  };

  return (
    <View style={styles.container}>
      <View>
        <Text style={styles.title}>Review and submit</Text>
        <Text style={styles.subtitle}>Double-check the details before submitting.</Text>
      </View>

      {createComplaintMutation.error ? (
        <ErrorState message={createComplaintMutation.error.message} />
      ) : null}

      <Card>
        <Text style={styles.label}>DEPARTMENT / CATEGORY</Text>
        <Text style={styles.value}>
          {departmentName} to {categoryName}
        </Text>
      </Card>

      <Card>
        <Text style={styles.label}>TITLE</Text>
        <Text style={styles.value}>{draft.title}</Text>
        <Text style={[styles.label, styles.stackedLabel]}>DESCRIPTION</Text>
        <Text style={styles.body}>{draft.description}</Text>
      </Card>

      {draft.attachments.length > 0 ? (
        <Card>
          <Text style={styles.label}>PHOTOS ({draft.attachments.length})</Text>
          <View style={styles.photos}>
            {draft.attachments.map((attachment) => (
              <Image key={attachment.id} source={{ uri: attachment.uri }} style={styles.photo} />
            ))}
          </View>
        </Card>
      ) : null}

      <Card>
        <Text style={styles.label}>LOCATION</Text>
        <Text style={styles.value}>{draft.location?.address ?? 'Not provided'}</Text>
      </Card>

      <View style={styles.actions}>
        <Button fullWidth={false} label="Back" onPress={onBack} variant="secondary" />
        <Button
          fullWidth={false}
          label="Submit Complaint"
          loading={createComplaintMutation.isPending}
          onPress={handleSubmit}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  actions: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  body: {
    color: colors.text,
    fontSize: 15,
    lineHeight: 21,
  },
  container: {
    gap: spacing.md,
  },
  label: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: '900',
  },
  photo: {
    borderRadius: 8,
    height: 68,
    width: 68,
  },
  photos: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  stackedLabel: {
    marginTop: spacing.md,
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
  value: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '800',
    marginTop: spacing.xs,
  },
});
