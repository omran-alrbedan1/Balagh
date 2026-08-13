import { ArrowRight } from 'lucide-react-native';
import { ReactNode } from 'react';
import { FieldValues, SubmitHandler, UseFormHandleSubmit } from 'react-hook-form';
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { spacing } from '@/theme/spacing';

interface SubmitButtonProps<TFieldValues extends FieldValues> {
  label: string;
  disabled?: boolean;
  fullWidth?: boolean;
  handleSubmit?: UseFormHandleSubmit<TFieldValues>;
  iconLeft?: ReactNode;
  iconRight?: ReactNode;
  isSubmitting?: boolean;
  onPress?: () => void;
  onSubmit?: SubmitHandler<TFieldValues>;
}

export function SubmitButton<TFieldValues extends FieldValues = FieldValues>({
  disabled = false,
  fullWidth = true,
  handleSubmit,
  iconLeft,
  iconRight,
  isSubmitting = false,
  label,
  onPress,
  onSubmit,
}: SubmitButtonProps<TFieldValues>) {
  const isDisabled = disabled || isSubmitting;
  const submitHandler = handleSubmit && onSubmit ? handleSubmit(onSubmit) : onPress;

  return (
    <TouchableOpacity
      activeOpacity={0.86}
      accessibilityLabel={label}
      accessibilityRole="button"
      accessibilityState={{ busy: isSubmitting, disabled: isDisabled }}
      disabled={isDisabled}
      onPress={isDisabled ? undefined : submitHandler}
      style={[
        styles.button,
        fullWidth ? styles.fullWidth : null,
        isDisabled ? styles.disabled : null,
      ]}
    >
      {isSubmitting ? (
        <ActivityIndicator color="#FFFFFF" />
      ) : (
        <View style={styles.content}>
          {iconLeft ? <View style={styles.icon}>{iconLeft}</View> : null}
          <Text style={styles.label}>{label}</Text>
          <View style={styles.icon}>{iconRight ?? <ArrowRight color="#FFFFFF" size={20} />}</View>
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: '#3B82F6',
    borderColor: '#2563EB',
    borderRadius: 12,
    borderWidth: 1,
    elevation: 2,
    justifyContent: 'center',
    minHeight: 54,
    paddingHorizontal: spacing.md,
    shadowColor: '#1E40AF',
    shadowOffset: { height: 8, width: 0 },
    shadowOpacity: 0.18,
    shadowRadius: 14,
  },
  content: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.sm,
    justifyContent: 'center',
  },
  disabled: {
    opacity: 0.5,
  },
  fullWidth: {
    alignSelf: 'stretch',
  },
  icon: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 0,
    textAlign: 'center',
    writingDirection: 'auto',
  },
});
