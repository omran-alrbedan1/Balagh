import { zodResolver } from '@hookform/resolvers/zod';
import { router } from 'expo-router';
import { ArrowLeft, Mail, Phone, UserRound, IdCard } from 'lucide-react-native';
import { useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { Image, Pressable, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ControlledInput } from '@/components/ui/ControlledInput';
import { KeyboardAwareFormScrollView } from '@/components/layout/KeyboardAwareFormScrollView';
import { useAuthStore } from '@/features/auth/store/authStore';
import { getEditProfileSchema, EditProfileFormValues } from '@/features/profile/utils/validation';
import { colors } from '@/theme/colors';
import { spacing } from '@/theme/spacing';

export function EditProfileScreen() {
  const { t } = useTranslation();
  const editProfileSchema = useMemo(() => getEditProfileSchema(), []);
  const user = useAuthStore((state) => state.user);
  const { control, handleSubmit } = useForm<EditProfileFormValues>({
    defaultValues: {
      name: user?.name ?? '',
      email: user?.email ?? '',
      phone: user?.phone ?? '',
      national_id: user?.national_id ?? '',
    },
    resolver: zodResolver(editProfileSchema),
  });

  const onSubmit = (values: EditProfileFormValues) => {
    void values;
    router.back();
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAwareFormScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <ArrowLeft color={colors.text} size={24} />
        </Pressable>

        <View style={styles.header}>
          <View style={styles.logoWrap}>
            <Image
              accessibilityIgnoresInvertColors
              resizeMode="contain"
              source={require('../../../../assets/logo.png')}
              style={styles.logo}
            />
          </View>
          <View style={styles.headerText}>
            <Text style={styles.appName}>{t('appName')}</Text>
            <Text style={styles.title}>{t('profile.editProfile')}</Text>
            <Text style={styles.subtitle}>{t('profile.editProfileSubtitle')}</Text>
          </View>
        </View>

        <View style={styles.formCard}>
          <ControlledInput
            control={control}
            label={t('common.fullName')}
            leftIcon={<UserRound color={colors.textMuted} size={20} />}
            name="name"
            type="text"
          />
          <ControlledInput
            autoCapitalize="none"
            control={control}
            label={t('common.email')}
            leftIcon={<Mail color={colors.textMuted} size={20} />}
            name="email"
            type="email"
          />
          <ControlledInput
            control={control}
            label={t('common.phone')}
            leftIcon={<Phone color={colors.textMuted} size={20} />}
            name="phone"
            type="phone"
          />
          <ControlledInput
            control={control}
            label={t('common.nationalId')}
            leftIcon={<IdCard color={colors.textMuted} size={20} />}
            name="national_id"
            type="text"
          />

          <TouchableOpacity
            activeOpacity={0.86}
            accessibilityRole="button"
            onPress={() => void handleSubmit(onSubmit)()}
            style={styles.submitButton}
          >
            <Text style={styles.submitButtonText}>{t('common.save')}</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAwareFormScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  appName: {
    color: colors.primary,
    fontSize: 15,
    fontWeight: '900',
    textAlign: 'center',
  },
  backButton: {
    marginBottom: spacing.md,
    padding: spacing.sm,
  },
  content: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: spacing.lg,
    paddingBottom: spacing.xl,
  },
  formCard: {
    backgroundColor: colors.card,
    borderColor: colors.border,
    borderRadius: 12,
    borderWidth: 1,
    elevation: 3,
    gap: spacing.md,
    padding: spacing.md,
    shadowColor: colors.shadow,
    shadowOffset: { height: 10, width: 0 },
    shadowOpacity: 0.08,
    shadowRadius: 18,
  },
  header: {
    alignItems: 'center',
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  headerText: {
    alignItems: 'center',
    gap: spacing.xs,
  },
  logo: {
    height: 72,
    width: 72,
  },
  logoWrap: {
    alignItems: 'center',
    backgroundColor: colors.primarySoft,
    borderColor: colors.primaryLight,
    borderRadius: 34,
    borderWidth: 1,
    height: 104,
    justifyContent: 'center',
    width: 104,
  },
  safeArea: {
    backgroundColor: colors.background,
    flex: 1,
  },
  submitButton: {
    alignItems: 'center',
    backgroundColor: colors.primary,
    borderColor: colors.primaryPressed,
    borderWidth: 1,
    borderRadius: 12,
    elevation: 2,
    justifyContent: 'center',
    minHeight: 54,
    shadowColor: colors.primaryDark,
    shadowOffset: { height: 8, width: 0 },
    shadowOpacity: 0.18,
    shadowRadius: 14,
    width: '100%',
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
    textAlign: 'center',
    writingDirection: 'auto',
  },
  subtitle: {
    color: colors.textMuted,
    fontSize: 15,
    lineHeight: 22,
    maxWidth: 300,
    textAlign: 'center',
  },
  title: {
    color: colors.text,
    fontSize: 30,
    fontWeight: '900',
    textAlign: 'center',
  },
});
