import { useRef } from 'react';
import { Pressable, StyleSheet, Text, TextInput, TextInputProps, View } from 'react-native';

import { colors } from '@/theme/colors';
import { spacing } from '@/theme/spacing';

export function OtpInput(props: TextInputProps) {
  const inputRef = useRef<TextInput>(null);
  const value = typeof props.value === 'string' ? props.value : '';
  const digits = Array.from({ length: 6 }, (_, index) => value[index] ?? '');
  const activeIndex = Math.min(value.length, 5);

  const handleChangeText = (text: string) => {
    props.onChangeText?.(text.replace(/\D/g, '').slice(0, 6));
  };

  return (
    <Pressable
      accessibilityLabel="One-time password"
      accessibilityRole="button"
      onPress={() => inputRef.current?.focus()}
      style={styles.wrapper}
    >
      <TextInput
        {...props}
        ref={inputRef}
        accessibilityLabel="One-time password"
        keyboardType="number-pad"
        maxLength={6}
        onChangeText={handleChangeText}
        style={styles.hiddenInput}
        textContentType="oneTimeCode"
        value={value}
      />
      <View style={styles.row}>
        {digits.map((digit, index) => (
          <View
            key={index}
            style={[
              styles.box,
              index === activeIndex && value.length < 6 ? styles.activeBox : null,
              digit ? styles.filledBox : null,
            ]}
          >
            <Text style={styles.digit}>{digit}</Text>
          </View>
        ))}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  activeBox: {
    borderColor: colors.primary,
  },
  box: {
    alignItems: 'center',
    aspectRatio: 1,
    backgroundColor: colors.card,
    borderColor: colors.border,
    borderRadius: 8,
    borderWidth: 1,
    flex: 1,
    justifyContent: 'center',
    maxWidth: 52,
    minWidth: 0,
  },
  digit: {
    color: colors.text,
    fontSize: 22,
    fontWeight: '800',
    lineHeight: 28,
  },
  filledBox: {
    borderColor: colors.borderStrong,
  },
  hiddenInput: {
    height: 1,
    opacity: 0,
    position: 'absolute',
    width: 1,
  },
  row: {
    flexDirection: 'row',
    gap: spacing.sm,
    justifyContent: 'space-between',
    width: '100%',
  },
  wrapper: {
    marginBottom: spacing.md,
    width: '100%',
  },
});
