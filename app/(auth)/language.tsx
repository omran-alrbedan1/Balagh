import { Check } from 'lucide-react-native';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';

import { useLanguageStore } from '@/features/settings/store/languageStore';
import { AppLanguage, APP_LANGUAGES } from '@/features/settings/utils/languagePreference';
import { colors } from '@/theme/colors';
import { spacing } from '@/theme/spacing';

export default function LanguageScreen() {
  const { t } = useTranslation();
  const selectLanguage = useLanguageStore((state) => state.selectLanguage);
  const [pendingLanguage, setPendingLanguage] = useState<AppLanguage | null>(null);

  const handleSelect = async (language: AppLanguage) => {
    setPendingLanguage(language);

    try {
      await selectLanguage(language);
      router.replace('/(auth)');
    } finally {
      setPendingLanguage(null);
    }
  };

  return (
    <SafeAreaView style={styles.screen}>
      <View style={styles.content}>
        <Image
          accessibilityIgnoresInvertColors
          resizeMode="contain"
          source={require('../../assets/logo.png')}
          style={styles.logo}
        />

        <View style={styles.header}>
          <Text style={styles.title}>{t('language.choose')}</Text>
          <Text style={styles.subtitle}>{t('language.chooseArabic')}</Text>
        </View>

        <View style={styles.options}>
          {APP_LANGUAGES.map((language) => {
            const isPending = pendingLanguage === language.code;

            return (
              <Pressable
                accessibilityRole="button"
                disabled={pendingLanguage !== null}
                key={language.code}
                onPress={() => void handleSelect(language.code)}
                style={({ pressed }) => [
                  styles.option,
                  pressed && pendingLanguage === null ? styles.optionPressed : null,
                ]}
              >
                <View>
                  <Text style={styles.optionLabel}>{language.nativeLabel}</Text>
                  <Text style={styles.optionHint}>
                    {t(`language.${language.code === 'en' ? 'english' : 'arabic'}`)}
                  </Text>
                </View>
                {isPending ? <Check color={colors.primary} size={22} /> : null}
              </Pressable>
            );
          })}
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  content: {
    flex: 1,
    justifyContent: 'center',
    padding: spacing.lg,
  },
  header: {
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  logo: {
    alignSelf: 'center',
    height: 112,
    marginBottom: spacing.lg,
    width: 112,
  },
  option: {
    alignItems: 'center',
    backgroundColor: colors.card,
    borderColor: colors.border,
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    minHeight: 76,
    paddingHorizontal: spacing.lg,
  },
  optionHint: {
    color: colors.textMuted,
    fontSize: 14,
    fontWeight: '700',
    marginTop: 3,
  },
  optionLabel: {
    color: colors.text,
    fontSize: 19,
    fontWeight: '900',
  },
  optionPressed: {
    borderColor: colors.primary,
    transform: [{ scale: 0.99 }],
  },
  options: {
    gap: spacing.md,
  },
  screen: {
    backgroundColor: colors.background,
    flex: 1,
  },
  subtitle: {
    color: colors.primary,
    fontSize: 22,
    fontWeight: '900',
    marginTop: spacing.sm,
  },
  title: {
    color: colors.text,
    fontSize: 26,
    fontWeight: '900',
    textAlign: 'center',
  },
});
