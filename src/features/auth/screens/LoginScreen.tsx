import { zodResolver } from '@hookform/resolvers/zod';
import { router } from 'expo-router';
import { LockKeyhole, Mail } from 'lucide-react-native';
import { useMemo, useState } from 'react';
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
import { useLogin } from '@/features/auth/hooks/useLogin';
import { useAuthStore } from '@/features/auth/store/authStore';
import { getLoginSchema, LoginFormValues } from '@/features/auth/utils/validation';
import { colors } from '@/theme/colors';

export function LoginScreen() {
  const { t } = useTranslation();
  const loginSchema = useMemo(() => getLoginSchema(), []);
  const [flowError, setFlowError] = useState<string | null>(null);
  const setSession = useAuthStore((state) => state.setSession);
  const { control, handleSubmit } = useForm<LoginFormValues>({
    defaultValues: {
      login: '',
      password: '',
    },
    resolver: zodResolver(loginSchema),
  });
  const loginMutation = useLogin();
  const requestError =
    flowError ??
    (loginMutation.error instanceof ApiError
      ? loginMutation.error.message
      : loginMutation.error?.message);

  const onSubmit = (values: LoginFormValues) => {
    setFlowError(null);
    loginMutation.mutate(values, {
      onSuccess: async (result) => {
        if ('token' in result.data) {
          await setSession(result.data.token, result.data.user);
          router.replace('/(app)/(tabs)');
          return;
        }

        if (!result.data.user_id) {
          setFlowError(t('auth.loginFlowMissingUser'));
          return;
        }

        router.push({
          pathname: '/(auth)/verify-otp',
          params: {
            userId: result.data.user_id,
            purpose: 'login',
            devOtp: result.data.otp ?? '',
          },
        });
      },
    });
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        className="flex-1"
      >
        <ScrollView
          contentContainerStyle={{
            flexGrow: 1,
            paddingHorizontal: 32,
            paddingTop: 20,
            paddingBottom: 40,
          }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View className="items-center mt-5 mb-8">
            <View className="w-32 h-32 rounded-full bg-primary-50 justify-center items-center mb-3">
              <Image
                accessibilityIgnoresInvertColors
                resizeMode="contain"
                source={require('../../../../assets/logo.png')}
                className="h-24 w-24"
              />
            </View>
          </View>

          <View className="items-center mb-8">
            <Text className="text-3xl font-bold text-base-900 mb-1">{t('auth.loginTitle')}</Text>
            <Text className="text-base text-base-500 font-normal">{t('auth.loginContinue')}</Text>
          </View>

          {requestError ? <ErrorState message={requestError} /> : null}

          <View className="gap-5">
            <View>
              <ControlledInput
                autoCapitalize="none"
                control={control}
                label={t('common.username')}
                leftIcon={<Mail color={colors.textMuted} size={20} />}
                name="login"
                placeholder={t('auth.usernamePlaceholder')}
                type="email"
              />
            </View>

            <View>
              <ControlledInput
                autoCapitalize="none"
                control={control}
                label={t('common.password')}
                leftIcon={<LockKeyhole color={colors.textMuted} size={20} />}
                name="password"
                placeholder={t('auth.passwordPlaceholder')}
                type="password"
              />
            </View>
            <View>
              <TouchableOpacity
                activeOpacity={0.86}
                accessibilityRole="button"
                accessibilityState={{
                  busy: loginMutation.isPending,
                  disabled: loginMutation.isPending,
                }}
                disabled={loginMutation.isPending}
                onPress={() => void handleSubmit(onSubmit)()}
                style={[
                  styles.submitButton,
                  loginMutation.isPending ? styles.submitButtonDisabled : null,
                ]}
              >
                <Text style={styles.submitButtonText}>
                  {loginMutation.isPending ? t('auth.signingIn') : t('auth.signIn')}
                </Text>
              </TouchableOpacity>
            </View>

            <View className="flex-row justify-center items-center">
              <Pressable
                accessibilityRole="button"
                onPress={() => router.push('/(auth)/forgot-password')}
              >
                <Text className="text-sm font-semibold text-primary-600">
                  {t('auth.forgotPassword')}
                </Text>
              </Pressable>
            </View>

            <View className="flex-row justify-center items-center mt-2">
              <Text className="text-sm text-base-500 font-normal">{t('auth.noAccount')} </Text>
              <Pressable accessibilityRole="button" onPress={() => router.push('/(auth)/register')}>
                <Text className="text-sm font-semibold text-primary-600">{t('auth.signUp')}</Text>
              </Pressable>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
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
});
