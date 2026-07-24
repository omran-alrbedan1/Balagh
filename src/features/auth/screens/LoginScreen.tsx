import { View, Text } from 'react-native';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { router } from 'expo-router';
import { LockKeyhole, Mail } from 'lucide-react-native';

import { ApiError } from '@/api/client';
import { Screen } from '@/components/layout/Screen';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { ControlledInput } from '@/components/ui/ControlledInput';
import { ErrorState } from '@/components/ui/ErrorState';
import { SubmitButton } from '@/components/ui/SubmitButton';
import { Config } from '@/constants/config';
import { loginSchema, LoginFormValues } from '@/features/auth/utils/validation';
import { useLogin } from '@/features/auth/hooks/useLogin';
import { useAuthStore } from '@/features/auth/store/authStore';
import { colors } from '@/theme/colors';

export function LoginScreen() {
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
          setFlowError(
            'Login succeeded, but the server did not return the user ID needed for OTP.',
          );
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
    <Screen title="Welcome back">
      <View>
        <Text style={{ marginBottom: 16, color: '#475569' }}>Log in to continue.</Text>
        {__DEV__ ? (
          <Text style={{ marginBottom: 16, color: '#64748b', fontSize: 12 }}>
            API: {Config.API_BASE_URL}
          </Text>
        ) : null}
      </View>
      <Card>
        {requestError ? <ErrorState message={requestError} /> : null}
        <ControlledInput
          control={control}
          name="login"
          label="Email or phone"
          leftIcon={<Mail color={colors.textMuted} size={20} />}
          type="email"
        />
        <ControlledInput
          control={control}
          name="password"
          label="Password"
          leftIcon={<LockKeyhole color={colors.textMuted} size={20} />}
          type="password"
        />
        <SubmitButton
          label="Log in"
          handleSubmit={handleSubmit}
          isSubmitting={loginMutation.isPending}
          onSubmit={onSubmit}
        />
      </Card>
      <Button label="Need an account? Register" variant="secondary" href="/(auth)/register" />
    </Screen>
  );
}
