import { zodResolver } from '@hookform/resolvers/zod';
import { router } from 'expo-router';
import { ArrowLeft, LockKeyhole } from 'lucide-react-native';
import { useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { Image, Pressable, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ApiError } from '@/api/client';
import { KeyboardAwareFormScrollView } from '@/components/layout/KeyboardAwareFormScrollView';
import { ControlledInput } from '@/components/ui/ControlledInput';
import { ErrorState } from '@/components/ui/ErrorState';
import { useChangePassword } from '@/features/auth/hooks/useChangePassword';
import {
  getChangePasswordSchema,
  ChangePasswordFormValues,
} from '@/features/auth/utils/validation';
import { colors } from '@/theme/colors';
import { spacing } from '@/theme/spacing';

export function ChangePasswordScreen() {
  const { t } = useTranslation();
  const changePasswordSchema = useMemo(() => getChangePasswordSchema(), []);
  const { control, handleSubmit, setError } = useForm<ChangePasswordFormValues>({
    defaultValues: {
      current_password: '',
      password: '',
      password_confirmation: '',
    },
    resolver: zodResolver(changePasswordSchema),
  });
  const changePasswordMutation = useChangePassword();
  const requestError =
    changePasswordMutation.error instanceof ApiError
      ? changePasswordMutation.error.message
      : changePasswordMutation.error?.message;

  const onSubmit = (values: ChangePasswordFormValues) => {
    changePasswordMutation.mutate(values, {
      onSuccess: () => {
        router.back();
      },
      onError: (error: unknown) => {
        if (error instanceof ApiError && error.fieldErrors) {
          Object.entries(error.fieldErrors).forEach(([field, messages]) => {
            setError(field as keyof ChangePasswordFormValues, {
              message: messages[0],
            });
          });
        }
      },
    });
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
            <Text style={styles.title}>{t('auth.changePassword')}</Text>
            <Text style={styles.subtitle}>{t('auth.changePasswordSubtitle')}</Text>
          </View>
        </View>

        <View style={styles.formCard}>
          {requestError ? <ErrorState message={requestError} /> : null}

          <ControlledInput
            control={control}
            label={t('auth.currentPassword')}
            leftIcon={<LockKeyhole color={colors.textMuted} size={20} />}
            name="current_password"
            type="password"
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
              busy: changePasswordMutation.isPending,
              disabled: changePasswordMutation.isPending,
            }}
            disabled={changePasswordMutation.isPending}
            onPress={() => void handleSubmit(onSubmit)()}
            style={[
              styles.submitButton,
              changePasswordMutation.isPending ? styles.submitButtonDisabled : null,
            ]}
          >
            <Text style={styles.submitButtonText}>
              {changePasswordMutation.isPending
                ? t('auth.changingPassword')
                : t('auth.changePassword')}
            </Text>
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
