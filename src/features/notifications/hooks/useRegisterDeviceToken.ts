import { useMutation } from '@tanstack/react-query';

import { registerDeviceToken } from '@/api/endpoints/auth.api';
import { DeviceTokenPayload } from '@/api/types/device.types';

export function useRegisterDeviceToken() {
  return useMutation({
    mutationFn: (payload: DeviceTokenPayload) => registerDeviceToken(payload),
  });
}
