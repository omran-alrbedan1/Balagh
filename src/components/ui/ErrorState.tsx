import { StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { colors } from '@/theme/colors';
import { spacing } from '@/theme/spacing';

export function ErrorState({ message }: { message: string }) {
  const { t } = useTranslation();

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{t('errors.somethingWrong')}</Text>
      <Text style={styles.message}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.sm,
    paddingVertical: spacing.xl,
  },
  message: {
    color: colors.textMuted,
    fontSize: 16,
  },
  title: {
    color: colors.danger,
    fontSize: 20,
    fontWeight: '700',
  },
});
