import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import i18next from '@/lib/i18n';
import { AppLanguage, APP_LANGUAGES } from '@/features/settings/utils/languagePreference';
import { useLanguageStore } from '@/features/settings/store/languageStore';
import { colors } from '@/theme/colors';
import { spacing } from '@/theme/spacing';

export function LanguageSwitcher() {
  const { t } = useTranslation();
  const storeLanguage = useLanguageStore((state) => state.language);
  const requiresRestart = useLanguageStore((state) => state.requiresRestart);
  const selectLanguage = useLanguageStore((state) => state.selectLanguage);
  const [pendingLanguage, setPendingLanguage] = useState<AppLanguage | null>(null);
  const [error, setError] = useState<string | null>(null);
  const current: AppLanguage = storeLanguage ?? (i18next.language?.startsWith('ar') ? 'ar' : 'en');

  const handleSelect = async (code: AppLanguage) => {
    if (code === current || pendingLanguage) return;
    setPendingLanguage(code);
    setError(null);
    try {
      await selectLanguage(code);
    } catch {
      setError(t('language.changeFailed'));
    } finally {
      setPendingLanguage(null);
    }
  };

  return (
    <View style={styles.container}>
      {APP_LANGUAGES.map((language) => {
        const isSelected = current === language.code;

        return (
          <Pressable
            accessibilityRole="button"
            accessibilityState={{ disabled: pendingLanguage != null, selected: isSelected }}
            disabled={pendingLanguage != null}
            key={language.code}
            onPress={() => void handleSelect(language.code)}
            style={[styles.option, isSelected ? styles.selected : null]}
          >
            <Text style={[styles.optionText, isSelected ? styles.selectedText : null]}>
              {language.label}
            </Text>
          </Pressable>
        );
      })}
      {error ? <Text style={styles.error}>{error}</Text> : null}
      {requiresRestart ? <Text style={styles.notice}>{t('language.restartRequired')}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  error: {
    color: colors.danger,
    flexBasis: '100%',
    fontSize: 13,
  },
  notice: {
    color: colors.warning,
    flexBasis: '100%',
    fontSize: 13,
  },
  option: {
    alignItems: 'center',
    backgroundColor: colors.card,
    borderColor: colors.border,
    borderRadius: 8,
    borderWidth: 1,
    flex: 1,
    minHeight: 46,
    justifyContent: 'center',
    paddingHorizontal: spacing.md,
  },
  optionText: {
    color: colors.primary,
    fontWeight: '800',
  },
  selected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  selectedText: {
    color: '#FFFFFF',
  },
});
