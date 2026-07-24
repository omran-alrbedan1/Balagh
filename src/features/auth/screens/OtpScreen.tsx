import { useEffect, useState } from 'react';
import { Text } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';

import { ApiError } from '@/api/client';
import { Screen } from '@/components/layout/Screen';
import { Button } from '@/components/ui/Button';
import { ErrorState } from '@/components/ui/ErrorState';
import { OtpInput } from '@/features/auth/components/OtpInput';
import { useVerifyOtp } from '@/features/auth/hooks/useVerifyOtp';

export function OtpScreen() {
  const { userId, purpose, devOtp } = useLocalSearchParams<{
    userId: string;
    purpose: 'register' | 'login';
    devOtp?: string;
  }>();
  const [otp, setOtp] = useState('');
  const [countdown, setCountdown] = useState(60);
  const verifyOtpMutation = useVerifyOtp();
  const requestError =
    verifyOtpMutation.error instanceof ApiError
      ? verifyOtpMutation.error.message
      : verifyOtpMutation.error?.message;

  useEffect(() => {
    if (countdown <= 0) return;
    const timer = setTimeout(() => setCountdown((prev) => prev - 1), 1000);
    return () => clearTimeout(timer);
  }, [countdown]);

  const onSubmit = () => {
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
    <Screen title="Verify your code">
      <Text style={{ color: '#475569', marginBottom: 16 }}>
        Enter the 6-digit code sent to your {purpose === 'register' ? 'phone' : 'device'}.
      </Text>
      {devOtp ? (
        <Text style={{ color: '#60a5fa', marginBottom: 16 }}>Dev OTP: {devOtp}</Text>
      ) : null}
      {requestError ? <ErrorState message={requestError} /> : null}
      <OtpInput value={otp} onChangeText={setOtp} />
      <Button
        label="Verify"
        onPress={onSubmit}
        loading={verifyOtpMutation.isPending}
        disabled={otp.length !== 6}
      />
      <Text style={{ textAlign: 'center', color: '#64748b', marginTop: 16 }}>
        {countdown > 0 ? `Resend code in ${countdown}s` : "Didn't get it? Resend code"}
      </Text>
    </Screen>
  );
}
