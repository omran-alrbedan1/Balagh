import { StyleSheet, Text, View } from 'react-native';

import { Button } from '@/components/ui/Button';
import { AttachmentPicker } from '@/features/complaints/components/AttachmentPicker';
import { colors } from '@/theme/colors';
import { spacing } from '@/theme/spacing';

interface StepPhotosProps {
  onBack: () => void;
  onNext: () => void;
}

export function StepPhotos({ onBack, onNext }: StepPhotosProps) {
  return (
    <View style={styles.container}>
      <View>
        <Text style={styles.title}>Add photos</Text>
        <Text style={styles.subtitle}>
          Photos help the assigned team understand and resolve the issue faster.
        </Text>
      </View>

      <AttachmentPicker />

      <View style={styles.actions}>
        <Button fullWidth={false} label="Back" onPress={onBack} variant="secondary" />
        <Button fullWidth={false} label="Continue" onPress={onNext} />
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
