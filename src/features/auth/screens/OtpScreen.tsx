import { useEffect, useState } from 'react';
import { useLocalSearchParams, router } from 'expo-router';
import { RefreshCw, ShieldCheck } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import {
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ApiError } from '@/api/client';
import { ErrorState } from '@/components/ui/ErrorState';
import { SubmitButton } from '@/components/ui/SubmitButton';
import { OtpInput } from '@/features/auth/components/OtpInput';
import { useResendOtp } from '@/features/auth/hooks/useResendOtp';
import { useVerifyOtp } from '@/features/auth/hooks/useVerifyOtp';
import { colors } from '@/theme/colors';
import { spacing } from '@/theme/spacing';

export function OtpScreen() {
  const { t } = useTranslation();
  const { userId, purpose, devOtp } = useLocalSearchParams<{
    userId: string;
    purpose: 'register' | 'login';
    devOtp?: string;
  }>();
  const [otp, setOtp] = useState('');
  const [countdown, setCountdown] = useState(60);
  const verifyOtpMutation = useVerifyOtp();
  const resendOtpMutation = useResendOtp();
  const requestError =
    verifyOtpMutation.error instanceof ApiError
      ? verifyOtpMutation.error.message
      : verifyOtpMutation.error?.message;

  useEffect(() => {
    if (countdown <= 0) return;
    const timer = setTimeout(() => setCountdown((prev) => prev - 1), 1000);
    return () => clearTimeout(timer);
  }, [countdown]);

  const handleResendOtp = () => {
    if (!userId || resendOtpMutation.isPending) return;

    resendOtpMutation.mutate(
      { user_id: userId, purpose },
      {
        onSuccess: (result) => {
          setCountdown(60);
          if (result.data.otp) {
            // In dev mode, update the dev OTP display
          }
        },
      },
    );
  };

  const onSubmit = () => {
    if (otp.length !== 6 || verifyOtpMutation.isPending) return;

    verifyOtpMutation.mutate(
      { user_id: userId, otp, purpose },
      {
        onSuccess: () => {
          router.replace('/(app)/(tabs)');
        },
      },
    );
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
          <View style={styles.header}>
            <View style={styles.logoWrap}>
              <Image
                accessibilityIgnoresInvertColors
                resizeMode="contain"
                source={require('../../../../assets/logo.png')}
                style={styles.logo}
              />
            </View>
            <Text style={styles.appName}>{t('appName')}</Text>
            <Text style={styles.title}>{t('auth.verifyCode')}</Text>
            <Text style={styles.subtitle}>
              {t('auth.verifyCodeBody', {
                target: purpose === 'register' ? t('auth.verifyPhone') : t('auth.verifyDevice'),
              })}
            </Text>
          </View>

          <View style={styles.formCard}>
            <View style={styles.iconBadge}>
              <ShieldCheck color={colors.primary} size={28} />
            </View>

            {devOtp ? (
              <View style={styles.devOtpBox}>
                <Text style={styles.devOtpText}>{t('auth.devOtp', { otp: devOtp })}</Text>
              </View>
            ) : null}

            {requestError ? <ErrorState message={requestError} /> : null}

            <OtpInput
              onChangeText={setOtp}
              onSubmitEditing={onSubmit}
              returnKeyType="done"
              value={otp}
            />

            <SubmitButton
              disabled={otp.length !== 6}
              isSubmitting={verifyOtpMutation.isPending}
              label={t('auth.verify')}
              onPress={onSubmit}
            />

            {countdown > 0 ? (
              <Text style={styles.resendText}>{t('auth.resendIn', { seconds: countdown })}</Text>
            ) : (
              <Pressable
                onPress={handleResendOtp}
                disabled={resendOtpMutation.isPending}
                style={({ pressed }) => [
                  styles.resendButton,
                  pressed ? styles.resendButtonPressed : null,
                  resendOtpMutation.isPending ? styles.resendButtonDisabled : null,
                ]}
              >
                <RefreshCw
                  color={resendOtpMutation.isPending ? colors.textMuted : colors.primary}
                  size={16}
                  style={styles.resendIcon}
                />
                <Text style={styles.resendButtonText}>
                  {resendOtpMutation.isPending ? t('auth.resending') : t('auth.resendCode')}
                </Text>
              </Pressable>
            )}
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
  content: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: spacing.lg,
    paddingBottom: spacing.xl,
  },
  devOtpBox: {
    backgroundColor: colors.primarySoft,
    borderColor: colors.primaryLight,
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  devOtpText: {
    color: colors.primaryDark,
    fontSize: 14,
    fontWeight: '800',
    textAlign: 'center',
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
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  iconBadge: {
    alignItems: 'center',
    alignSelf: 'center',
    backgroundColor: colors.primarySoft,
    borderColor: colors.primaryLight,
    borderRadius: 24,
    borderWidth: 1,
    height: 56,
    justifyContent: 'center',
    width: 56,
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
  resendText: {
    color: colors.textMuted,
    fontSize: 14,
    fontWeight: '700',
    lineHeight: 20,
    textAlign: 'center',
  },
  resendButton: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.sm,
  },
  resendButtonPressed: {
    opacity: 0.7,
  },
  resendButtonDisabled: {
    opacity: 0.5,
  },
  resendIcon: {
    transform: [{ rotate: '0deg' }],
  },
  resendButtonText: {
    color: colors.primary,
    fontSize: 14,
    fontWeight: '800',
  },
  safeArea: {
    backgroundColor: colors.background,
    flex: 1,
  },
  subtitle: {
    color: colors.textMuted,
    fontSize: 15,
    lineHeight: 22,
    maxWidth: 310,
    textAlign: 'center',
  },
  title: {
    color: colors.text,
    fontSize: 30,
    fontWeight: '900',
    textAlign: 'center',
  },
});
