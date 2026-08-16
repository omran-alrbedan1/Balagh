import { zodResolver } from '@hookform/resolvers/zod';
import { router } from 'expo-router';
import { ArrowLeft, Mail } from 'lucide-react-native';
import { useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { Image, Pressable, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ApiError } from '@/api/client';
import { KeyboardAwareFormScrollView } from '@/components/layout/KeyboardAwareFormScrollView';
import { ControlledInput } from '@/components/ui/ControlledInput';
import { ErrorState } from '@/components/ui/ErrorState';
import { useForgotPassword } from '@/features/auth/hooks/useForgotPassword';
import {
  getForgotPasswordSchema,
  ForgotPasswordFormValues,
} from '@/features/auth/utils/validation';
import { colors } from '@/theme/colors';
import { spacing } from '@/theme/spacing';

export function ForgotPasswordScreen() {
  const { t } = useTranslation();
  const forgotPasswordSchema = useMemo(() => getForgotPasswordSchema(), []);
  const { control, handleSubmit, setError } = useForm<ForgotPasswordFormValues>({
    defaultValues: {
      email: '',
    },
    resolver: zodResolver(forgotPasswordSchema),
  });
  const forgotPasswordMutation = useForgotPassword();
  const requestError =
    forgotPasswordMutation.error instanceof ApiError
      ? forgotPasswordMutation.error.message
      : forgotPasswordMutation.error?.message;

  const onSubmit = (values: ForgotPasswordFormValues) => {
    forgotPasswordMutation.mutate(values, {
      onSuccess: () => {
        router.replace('/(auth)/login');
      },
      onError: (error: unknown) => {
        if (error instanceof ApiError && error.fieldErrors) {
          Object.entries(error.fieldErrors).forEach(([field, messages]) => {
            setError(field as keyof ForgotPasswordFormValues, {
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
            <Text style={styles.title}>{t('auth.forgotPassword')}</Text>
            <Text style={styles.subtitle}>{t('auth.forgotPasswordSubtitle')}</Text>
          </View>
        </View>

        <View style={styles.formCard}>
          {requestError ? <ErrorState message={requestError} /> : null}

          <ControlledInput
            autoCapitalize="none"
            control={control}
            label={t('common.email')}
            leftIcon={<Mail color={colors.textMuted} size={20} />}
            name="email"
            placeholder={t('auth.emailPlaceholder')}
            type="email"
          />

          <TouchableOpacity
            activeOpacity={0.86}
            accessibilityRole="button"
            accessibilityState={{
              busy: forgotPasswordMutation.isPending,
              disabled: forgotPasswordMutation.isPending,
            }}
            disabled={forgotPasswordMutation.isPending}
            onPress={() => void handleSubmit(onSubmit)()}
            style={[
              styles.submitButton,
              forgotPasswordMutation.isPending ? styles.submitButtonDisabled : null,
            ]}
          >
            <Text style={styles.submitButtonText}>
              {forgotPasswordMutation.isPending
                ? t('auth.sendingResetLink')
                : t('auth.sendResetLink')}
            </Text>
          </TouchableOpacity>
        </View>

        <Pressable
          accessibilityRole="button"
          onPress={() => router.push('/(auth)/login')}
          style={({ pressed }) => [styles.loginLink, pressed ? styles.linkPressed : null]}
        >
          <Text style={styles.loginMuted}>{t('auth.rememberPassword')} </Text>
          <Text style={styles.loginText}>{t('auth.login')}</Text>
        </Pressable>
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
  linkPressed: {
    opacity: 0.72,
  },
  loginLink: {
    alignItems: 'center',
    alignSelf: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: spacing.md,
    minHeight: 44,
    paddingHorizontal: spacing.md,
  },
  loginMuted: {
    color: colors.textMuted,
    fontSize: 14,
    fontWeight: '700',
  },
  loginText: {
    color: colors.primary,
    fontSize: 14,
    fontWeight: '900',
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
