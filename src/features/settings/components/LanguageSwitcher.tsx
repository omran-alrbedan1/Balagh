import * as Updates from 'expo-updates';
import { useState } from 'react';
import { I18nManager, Pressable, StyleSheet, Text, View } from 'react-native';

import i18next from '@/lib/i18n';
import { colors } from '@/theme/colors';
import { spacing } from '@/theme/spacing';

const LANGUAGES = [
  { code: 'en', label: 'English', rtl: false },
  { code: 'ar', label: 'Arabic', rtl: true },
] as const;

export function LanguageSwitcher() {
  const [current, setCurrent] = useState(i18next.language);

  const handleSelect = async (code: string, rtl: boolean) => {
    await i18next.changeLanguage(code);
    setCurrent(code);

    if (I18nManager.isRTL !== rtl) {
      I18nManager.forceRTL(rtl);

      try {
        await Updates.reloadAsync();
      } catch {
        // Reload is unavailable in some web/dev contexts.
      }
    }
  };

  return (
    <View style={styles.container}>
      {LANGUAGES.map((language) => {
        const isSelected = current === language.code;

        return (
          <Pressable
            accessibilityRole="button"
            accessibilityState={{ selected: isSelected }}
            key={language.code}
            onPress={() => void handleSelect(language.code, language.rtl)}
            style={[styles.option, isSelected ? styles.selected : null]}
          >
            <Text style={[styles.optionText, isSelected ? styles.selectedText : null]}>
              {language.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    gap: spacing.sm,
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
