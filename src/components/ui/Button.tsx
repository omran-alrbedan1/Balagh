import { Href, Link } from 'expo-router';
import { ReactNode } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';

import { colors } from '@/theme/colors';
import { spacing } from '@/theme/spacing';

export interface ButtonProps {
  label: string;
  disabled?: boolean;
  fullWidth?: boolean;
  href?: Href;
  iconLeft?: ReactNode;
  iconRight?: ReactNode;
  loading?: boolean;
  onPress?: () => void;
  size?: 'md' | 'lg';
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
}

export function Button({
  disabled = false,
  fullWidth = true,
  href,
  iconLeft,
  iconRight,
  label,
  loading = false,
  onPress,
  size = 'md',
  variant = 'primary',
}: ButtonProps) {
  const isDisabled = disabled || loading;
  const button = (
    <Pressable
      accessibilityLabel={label}
      accessibilityRole="button"
      accessibilityState={{ disabled: isDisabled, busy: loading }}
      disabled={isDisabled}
      onPress={isDisabled ? undefined : onPress}
      style={({ pressed }) => [
        styles.button,
        styles[variant],
        size === 'lg' && styles.large,
        fullWidth && styles.fullWidth,
        isDisabled && styles.disabled,
        pressed && !isDisabled && styles.pressed,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={getContentColor(variant)} />
      ) : (
        <View style={styles.content}>
          {iconLeft ? <View style={styles.icon}>{iconLeft}</View> : null}
          <Text style={[styles.label, { color: getContentColor(variant) }]}>{label}</Text>
          {iconRight ? <View style={styles.icon}>{iconRight}</View> : null}
        </View>
      )}
    </Pressable>
  );

  if (href) {
    return (
      <Link asChild href={href}>
        {button}
      </Link>
    );
  }

  return button;
}

function getContentColor(variant: ButtonProps['variant']) {
  switch (variant) {
    case 'secondary':
    case 'ghost':
      return colors.primary;
    case 'danger':
    case 'primary':
    default:
      return '#FFFFFF';
  }
}

const styles = StyleSheet.create({
  button: {
    alignItems: 'center',
    alignSelf: 'flex-start',
    borderRadius: 8,
    justifyContent: 'center',
    minHeight: 48,
    paddingHorizontal: spacing.md,
  },
  content: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.sm,
    justifyContent: 'center',
  },
  danger: {
    backgroundColor: colors.danger,
  },
  disabled: {
    opacity: 0.5,
  },
  fullWidth: {
    alignSelf: 'stretch',
  },
  ghost: {
    backgroundColor: 'transparent',
  },
  icon: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    fontSize: 16,
    fontWeight: '900',
    letterSpacing: 0,
  },
  large: {
    minHeight: 54,
  },
  pressed: {
    opacity: 0.88,
    transform: [{ scale: 0.99 }],
  },
  primary: {
    backgroundColor: colors.primary,
    elevation: 2,
    shadowColor: colors.primaryDark,
    shadowOffset: { height: 8, width: 0 },
    shadowOpacity: 0.18,
    shadowRadius: 14,
  },
  secondary: {
    backgroundColor: colors.card,
    borderColor: colors.border,
    borderWidth: 1,
  },
});
