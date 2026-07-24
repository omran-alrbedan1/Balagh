import { zodResolver } from '@hookform/resolvers/zod';
import { FileText } from 'lucide-react-native';
import { useForm } from 'react-hook-form';
import { StyleSheet, Text, View } from 'react-native';

import { Button } from '@/components/ui/Button';
import { ControlledInput } from '@/components/ui/ControlledInput';
import { useDraftComplaintStore } from '@/features/complaints/store/draftComplaintStore';
import {
  ComplaintDetailsValues,
  complaintDetailsSchema,
} from '@/features/complaints/utils/validation';
import { colors } from '@/theme/colors';
import { spacing } from '@/theme/spacing';

interface StepDetailsProps {
  onBack: () => void;
  onNext: () => void;
}

export function StepDetails({ onBack, onNext }: StepDetailsProps) {
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
    <View style={styles.container}>
      <View>
        <Text style={styles.title}>Describe the issue</Text>
        <Text style={styles.subtitle}>
          A clear title and description helps us route this faster.
        </Text>
      </View>

      <ControlledInput
        control={control}
        label="Title"
        leftIcon={<FileText color={colors.textMuted} size={20} />}
        name="title"
        placeholder="e.g. Broken streetlight on Main St"
        type="text"
      />
      <ControlledInput
        control={control}
        label="Description"
        name="description"
        placeholder="What's happening, since when, and any other useful detail..."
        type="textarea"
      />

      <View style={styles.actions}>
        <Button fullWidth={false} label="Back" onPress={onBack} variant="secondary" />
        <Button fullWidth={false} label="Continue" onPress={handleSubmit(onSubmit)} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  actions: {
    flexDirection: 'row',
    gap: spacing.md,
  },
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
