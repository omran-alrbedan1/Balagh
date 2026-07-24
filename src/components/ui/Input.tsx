import { Eye, EyeOff } from 'lucide-react-native';
import { ReactNode, useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, TextInputProps, View } from 'react-native';

import { colors } from '@/theme/colors';
import { spacing } from '@/theme/spacing';

export type InputType =
  'text' | 'email' | 'phone' | 'password' | 'number' | 'otp' | 'textarea' | 'search' | 'url';

interface InputProps extends Omit<TextInputProps, 'secureTextEntry'> {
  disabled?: boolean;
  error?: string;
  helperText?: string;
  label?: string;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
  type?: InputType;
}

function getInputTypeProps(type: InputType): TextInputProps {
  switch (type) {
    case 'email':
      return {
        autoCapitalize: 'none',
        autoComplete: 'email',
        keyboardType: 'email-address',
        textContentType: 'emailAddress',
      };
    case 'phone':
      return {
        autoComplete: 'tel',
        keyboardType: 'phone-pad',
        textContentType: 'telephoneNumber',
      };
    case 'password':
      return {
        autoCapitalize: 'none',
        autoComplete: 'password',
        textContentType: 'password',
      };
    case 'number':
      return {
        keyboardType: 'numeric',
      };
    case 'otp':
      return {
        autoComplete: 'one-time-code',
        keyboardType: 'number-pad',
        maxLength: 6,
        textContentType: 'oneTimeCode',
      };
    case 'textarea':
      return {
        multiline: true,
        textAlignVertical: 'top',
      };
    case 'search':
      return {
        autoCapitalize: 'none',
        returnKeyType: 'search',
      };
    case 'url':
      return {
        autoCapitalize: 'none',
        autoComplete: 'url',
        keyboardType: 'url',
        textContentType: 'URL',
      };
    case 'text':
    default:
      return {};
  }
}

export function Input({
  disabled = false,
  error,
  helperText,
  label,
  leftIcon,
  rightIcon,
  style,
  type = 'text',
  ...props
}: InputProps) {
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const typeProps = useMemo(() => getInputTypeProps(type), [type]);
  const isPassword = type === 'password';
  const feedback = error ?? helperText;

  return (
    <View style={inputStyles.container}>
      {label ? <Text style={inputStyles.label}>{label}</Text> : null}
      <View
        style={[
          inputStyles.inputFrame,
          props.multiline || type === 'textarea' ? inputStyles.textareaFrame : null,
          error ? inputStyles.inputError : null,
          disabled ? inputStyles.disabledFrame : null,
        ]}
      >
        {leftIcon ? <View style={inputStyles.icon}>{leftIcon}</View> : null}
        <TextInput
          {...typeProps}
          {...props}
          accessibilityLabel={props.accessibilityLabel ?? label}
          cursorColor={colors.primary}
          editable={!disabled}
          placeholderTextColor={colors.textMuted}
          selectionColor={colors.primaryLight}
          secureTextEntry={isPassword && !isPasswordVisible}
          style={[
            inputStyles.input,
            props.multiline || type === 'textarea' ? inputStyles.textarea : null,
            style,
          ]}
          value={props.value ?? ''}
        />
        {isPassword ? (
          <Pressable
            accessibilityLabel={isPasswordVisible ? 'Hide password' : 'Show password'}
            accessibilityRole="button"
            hitSlop={10}
            onPress={() => setIsPasswordVisible((current) => !current)}
            style={inputStyles.iconButton}
          >
            {isPasswordVisible ? (
              <EyeOff color={colors.textMuted} size={20} />
            ) : (
              <Eye color={colors.textMuted} size={20} />
            )}
          </Pressable>
        ) : rightIcon ? (
          <View style={inputStyles.icon}>{rightIcon}</View>
        ) : null}
      </View>
      {feedback ? (
        <Text style={[inputStyles.feedback, error ? inputStyles.error : inputStyles.helper]}>
          {feedback}
        </Text>
      ) : null}
    </View>
  );
}

export const inputStyles = StyleSheet.create({
  container: {
    gap: spacing.xs,
  },
  disabledFrame: {
    backgroundColor: colors.surfaceMuted,
    opacity: 0.8,
  },
  error: {
    color: colors.danger,
  },
  feedback: {
    fontSize: 13,
    lineHeight: 18,
  },
  helper: {
    color: colors.textMuted,
  },
  icon: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 24,
  },
  iconButton: {
    alignItems: 'center',
    height: 40,
    justifyContent: 'center',
    width: 40,
  },
  input: {
    color: colors.text,
    flex: 1,
    fontSize: 16,
    minHeight: 48,
    paddingVertical: 0,
  },
  inputError: {
    borderColor: colors.danger,
  },
  inputFrame: {
    alignItems: 'center',
    backgroundColor: colors.card,
    borderColor: colors.border,
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: 'row',
    gap: spacing.sm,
    minHeight: 52,
    paddingHorizontal: spacing.md,
  },
  label: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '700',
  },
  textarea: {
    minHeight: 104,
    paddingTop: spacing.md,
  },
  textareaFrame: {
    alignItems: 'flex-start',
    minHeight: 124,
  },
});
