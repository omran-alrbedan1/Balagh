import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import i18next from '@/lib/i18n';
import { AppLanguage, APP_LANGUAGES } from '@/features/settings/utils/languagePreference';
import { useLanguageStore } from '@/features/settings/store/languageStore';
import { colors } from '@/theme/colors';
import { spacing } from '@/theme/spacing';

export function LanguageSwitcher() {
  const storeLanguage = useLanguageStore((state) => state.language);
  const selectLanguage = useLanguageStore((state) => state.selectLanguage);
  const [current, setCurrent] = useState(storeLanguage ?? i18next.language);

  const handleSelect = async (code: AppLanguage) => {
    await selectLanguage(code);
    setCurrent(code);
  };

  return (
    <View style={styles.container}>
      {APP_LANGUAGES.map((language) => {
        const isSelected = current === language.code;

        return (
          <Pressable
            accessibilityRole="button"
            accessibilityState={{ selected: isSelected }}
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
