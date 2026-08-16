import { zodResolver } from '@hookform/resolvers/zod';
import { router } from 'expo-router';
import { LockKeyhole, Mail, Phone, UserRound, IdCard } from 'lucide-react-native';
import { useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { Image, Pressable, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ApiError } from '@/api/client';
import { KeyboardAwareFormScrollView } from '@/components/layout/KeyboardAwareFormScrollView';
import { ControlledInput } from '@/components/ui/ControlledInput';
import { ErrorState } from '@/components/ui/ErrorState';
import { useRegister } from '@/features/auth/hooks/useRegister';
import { getRegisterSchema, RegisterFormValues } from '@/features/auth/utils/validation';
import { colors } from '@/theme/colors';
import { spacing } from '@/theme/spacing';

export function RegisterScreen() {
  const { t } = useTranslation();
  const registerSchema = useMemo(() => getRegisterSchema(), []);
  const { control, handleSubmit, setError } = useForm<RegisterFormValues>({
    defaultValues: {
      email: '',
      name: '',
      password: '',
      password_confirmation: '',
      phone: '',
      national_id: '',
    },
    resolver: zodResolver(registerSchema),
  });
  const registerMutation = useRegister();
  const requestError =
    registerMutation.error instanceof ApiError
      ? registerMutation.error.message
      : registerMutation.error?.message;

  const onSubmit = (values: RegisterFormValues) => {
    registerMutation.mutate(
      {
        ...values,
      },
      {
        onSuccess: (result) => {
          router.push({
            pathname: '/(auth)/verify-otp',
            params: {
              userId: result.data.user_id,
              purpose: 'register',
              devOtp: result.data.otp ?? '',
            },
          });
        },
        onError: (error: unknown) => {
          if (error instanceof ApiError && error.fieldErrors) {
            Object.entries(error.fieldErrors).forEach(([field, messages]) => {
              setError(field as keyof RegisterFormValues, {
                message: messages[0],
              });
            });
          }
        },
      },
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAwareFormScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
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
            <Text style={styles.title}>{t('auth.createAccount')}</Text>
            <Text style={styles.subtitle}>{t('auth.registerSubtitle')}</Text>
          </View>
        </View>

        <View style={styles.formCard}>
          {requestError ? <ErrorState message={requestError} /> : null}

          <ControlledInput
            control={control}
            label={t('common.fullName')}
            leftIcon={<UserRound color={colors.textMuted} size={20} />}
            name="name"
            type="text"
          />
          <ControlledInput
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
          <ControlledInput
            control={control}
            label={t('common.password')}
            leftIcon={<LockKeyhole color={colors.textMuted} size={20} />}
            name="password"
            type="password"
          />
          <ControlledInput
            control={control}
            label={t('auth.confirmPassword')}
            leftIcon={<LockKeyhole color={colors.textMuted} size={20} />}
            name="password_confirmation"
            type="password"
          />

          <TouchableOpacity
            activeOpacity={0.86}
            accessibilityRole="button"
            accessibilityState={{
              busy: registerMutation.isPending,
              disabled: registerMutation.isPending,
            }}
            disabled={registerMutation.isPending}
            onPress={() => void handleSubmit(onSubmit)()}
            style={[
              styles.submitButton,
              registerMutation.isPending ? styles.submitButtonDisabled : null,
            ]}
          >
            <Text style={styles.submitButtonText}>
              {registerMutation.isPending ? t('auth.creatingAccount') : t('auth.createAccount')}
            </Text>
          </TouchableOpacity>
        </View>

        <Pressable
          accessibilityRole="button"
          onPress={() => router.push('/(auth)/login')}
          style={({ pressed }) => [styles.loginLink, pressed ? styles.linkPressed : null]}
        >
          <Text style={styles.loginMuted}>{t('auth.haveAccount')} </Text>
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
