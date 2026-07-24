import { StyleSheet, Text, View } from 'react-native';

import { Button } from '@/components/ui/Button';
import { LocationPicker } from '@/features/complaints/components/LocationPicker';
import { colors } from '@/theme/colors';
import { spacing } from '@/theme/spacing';

interface StepLocationProps {
  onBack: () => void;
  onNext: () => void;
}

export function StepLocation({ onBack, onNext }: StepLocationProps) {
  return (
    <View style={styles.container}>
      <View>
        <Text style={styles.title}>Where is this happening?</Text>
        <Text style={styles.subtitle}>
          Location helps route your complaint to the right team. It never blocks submission.
        </Text>
      </View>

      <LocationPicker />

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
