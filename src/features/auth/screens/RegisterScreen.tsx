import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { router } from 'expo-router';
import { LockKeyhole, Mail, Phone, UserRound } from 'lucide-react-native';

import { ApiError } from '@/api/client';
import { Screen } from '@/components/layout/Screen';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { ControlledInput } from '@/components/ui/ControlledInput';
import { ErrorState } from '@/components/ui/ErrorState';
import { SubmitButton } from '@/components/ui/SubmitButton';
import { registerSchema, RegisterFormValues } from '@/features/auth/utils/validation';
import { useRegister } from '@/features/auth/hooks/useRegister';
import { colors } from '@/theme/colors';

export function RegisterScreen() {
  const { control, handleSubmit, setError } = useForm<RegisterFormValues>({
    defaultValues: {
      email: '',
      name: '',
      password: '',
      password_confirmation: '',
      phone: '',
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
        email: values.email || undefined,
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
    <Screen title="Create account">
      <Card>
        {requestError ? <ErrorState message={requestError} /> : null}
        <ControlledInput
          control={control}
          name="name"
          label="Full name"
          leftIcon={<UserRound color={colors.textMuted} size={20} />}
          type="text"
        />
        <ControlledInput
          control={control}
          name="email"
          helperText="Optional"
          label="Email"
          leftIcon={<Mail color={colors.textMuted} size={20} />}
          type="email"
        />
        <ControlledInput
          control={control}
          name="phone"
          label="Phone"
          leftIcon={<Phone color={colors.textMuted} size={20} />}
          type="phone"
        />
        <ControlledInput
          control={control}
          name="password"
          label="Password"
          leftIcon={<LockKeyhole color={colors.textMuted} size={20} />}
          type="password"
        />
        <ControlledInput
          control={control}
          name="password_confirmation"
          label="Confirm password"
          leftIcon={<LockKeyhole color={colors.textMuted} size={20} />}
          type="password"
        />
        <SubmitButton
          label="Create account"
          handleSubmit={handleSubmit}
          isSubmitting={registerMutation.isPending}
          onSubmit={onSubmit}
        />
      </Card>
      <Button label="Already have an account? Log in" variant="secondary" href="/(auth)/login" />
    </Screen>
  );
}
