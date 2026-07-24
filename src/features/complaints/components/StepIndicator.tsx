import { Check } from 'lucide-react-native';
import { StyleSheet, Text, View } from 'react-native';

import { colors } from '@/theme/colors';
import { spacing } from '@/theme/spacing';

const STEPS = ['Category', 'Details', 'Photos', 'Location', 'Review'];

export function StepIndicator({ current }: { current: number }) {
  return (
    <View style={styles.container}>
      {STEPS.map((label, index) => {
        const stepNumber = index + 1;
        const isActive = stepNumber === current;
        const isDone = stepNumber < current;

        return (
          <View key={label} style={styles.step}>
            {index > 0 ? (
              <View style={[styles.rail, isDone || isActive ? styles.railActive : null]} />
            ) : null}
            <View
              style={[styles.badge, isActive ? styles.active : null, isDone ? styles.done : null]}
            >
              {isDone ? (
                <Check color="#FFFFFF" size={15} />
              ) : (
                <Text style={[styles.badgeText, isActive ? styles.activeText : null]}>
                  {stepNumber}
                </Text>
              )}
            </View>
            <Text style={[styles.label, isActive ? styles.activeLabel : null]} numberOfLines={1}>
              {label}
            </Text>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  active: {
    backgroundColor: colors.primarySoft,
    borderColor: colors.primary,
    borderWidth: 2,
  },
  activeLabel: {
    color: colors.primary,
    fontWeight: '800',
  },
  activeText: {
    color: colors.primary,
  },
  badge: {
    alignItems: 'center',
    backgroundColor: colors.card,
    borderColor: colors.border,
    borderRadius: 16,
    borderWidth: 1,
    height: 32,
    justifyContent: 'center',
    width: 32,
  },
  badgeText: {
    color: colors.primary,
    fontSize: 12,
    fontWeight: '900',
  },
  container: {
    flexDirection: 'row',
    gap: spacing.xs,
    justifyContent: 'space-between',
    paddingTop: spacing.xs,
  },
  done: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  label: {
    color: colors.textMuted,
    fontSize: 10,
    marginTop: spacing.xs,
    textAlign: 'center',
  },
  rail: {
    backgroundColor: colors.border,
    height: 2,
    left: '-50%',
    position: 'absolute',
    right: '50%',
    top: 16,
  },
  railActive: {
    backgroundColor: colors.primary,
  },
  step: {
    alignItems: 'center',
    flex: 1,
    position: 'relative',
  },
});
