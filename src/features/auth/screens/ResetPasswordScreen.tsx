import { zodResolver } from '@hookform/resolvers/zod';
import { router, useLocalSearchParams } from 'expo-router';
import { ArrowLeft, KeyRound, LockKeyhole } from 'lucide-react-native';
import { useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import {
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ApiError } from '@/api/client';
import { ControlledInput } from '@/components/ui/ControlledInput';
import { ErrorState } from '@/components/ui/ErrorState';
import { useResetPassword } from '@/features/auth/hooks/useResetPassword';
import { getResetPasswordSchema, ResetPasswordFormValues } from '@/features/auth/utils/validation';
import { colors } from '@/theme/colors';
import { spacing } from '@/theme/spacing';

export function ResetPasswordScreen() {
  const { i18n, t } = useTranslation();
  const { email, token } = useLocalSearchParams<{
    email: string;
    token: string;
  }>();
  const resetPasswordSchema = useMemo(() => getResetPasswordSchema(), [i18n.language]);
  const { control, handleSubmit, setError } = useForm<ResetPasswordFormValues>({
    defaultValues: {
      email: email || '',
      token: token || '',
      password: '',
      password_confirmation: '',
    },
    resolver: zodResolver(resetPasswordSchema),
  });
  const resetPasswordMutation = useResetPassword();
  const requestError =
    resetPasswordMutation.error instanceof ApiError
      ? resetPasswordMutation.error.message
      : resetPasswordMutation.error?.message;

  const onSubmit = (values: ResetPasswordFormValues) => {
    resetPasswordMutation.mutate(values, {
      onError: (error: unknown) => {
        if (error instanceof ApiError && error.fieldErrors) {
          Object.entries(error.fieldErrors).forEach(([field, messages]) => {
            setError(field as keyof ResetPasswordFormValues, {
              message: messages[0],
            });
          });
        }
      },
    });
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.keyboard}
      >
        <ScrollView
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
              <Text style={styles.title}>{t('auth.resetPassword')}</Text>
              <Text style={styles.subtitle}>{t('auth.resetPasswordSubtitle')}</Text>
            </View>
          </View>

          <View style={styles.formCard}>
            {requestError ? <ErrorState message={requestError} /> : null}

            <ControlledInput
              autoCapitalize="none"
              control={control}
              label={t('common.email')}
              leftIcon={<KeyRound color={colors.textMuted} size={20} />}
              name="email"
              placeholder={t('auth.emailPlaceholder')}
              type="email"
            />
            <ControlledInput
              autoCapitalize="none"
              control={control}
              label={t('auth.resetToken')}
              leftIcon={<KeyRound color={colors.textMuted} size={20} />}
              name="token"
              placeholder={t('auth.tokenPlaceholder')}
              type="text"
            />
            <ControlledInput
              control={control}
              label={t('common.newPassword')}
              leftIcon={<LockKeyhole color={colors.textMuted} size={20} />}
              name="password"
              type="password"
            />
            <ControlledInput
              control={control}
              label={t('auth.confirmNewPassword')}
              leftIcon={<LockKeyhole color={colors.textMuted} size={20} />}
              name="password_confirmation"
              type="password"
            />

            <TouchableOpacity
              activeOpacity={0.86}
              accessibilityRole="button"
              accessibilityState={{
                busy: resetPasswordMutation.isPending,
                disabled: resetPasswordMutation.isPending,
              }}
              disabled={resetPasswordMutation.isPending}
              onPress={() => void handleSubmit(onSubmit)()}
              style={[
                styles.submitButton,
                resetPasswordMutation.isPending ? styles.submitButtonDisabled : null,
              ]}
            >
              <Text style={styles.submitButtonText}>
                {resetPasswordMutation.isPending
                  ? t('auth.resettingPassword')
                  : t('auth.resetPassword')}
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
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
  keyboard: {
    flex: 1,
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
  submitButtonDisabled: {
    opacity: 0.6,
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
