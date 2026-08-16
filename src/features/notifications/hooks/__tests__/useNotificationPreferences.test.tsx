import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook, waitFor } from '@testing-library/react-native';
import { PropsWithChildren } from 'react';

import { updateNotificationPreferences } from '@/api/endpoints/notifications.api';
import { NotificationPreferences } from '@/api/types/notification.types';
import { queryKeys } from '@/constants/queryKeys';

import { useUpdateNotificationPreferences } from '../useNotificationPreferences';

jest.mock('@/api/endpoints/notifications.api', () => ({
  getNotificationPreferences: jest.fn(),
  updateNotificationPreferences: jest.fn(),
}));

const updatePreferences = updateNotificationPreferences as jest.MockedFunction<
  typeof updateNotificationPreferences
>;

const preferences: NotificationPreferences = {
  id: 1,
  database_enabled: true,
  email_enabled: true,
  push_enabled: true,
  sms_enabled: false,
  complaint_created: true,
  complaint_assigned: true,
  complaint_status_updated: true,
  sla_breached: true,
  complaint_resolved: true,
  complaint_closed: true,
  created_at: null,
  updated_at: null,
};

function setup() {
  const client = new QueryClient({
    defaultOptions: {
      mutations: { gcTime: Infinity, retry: false },
      queries: { gcTime: Infinity },
    },
  });
  client.setQueryData(queryKeys.notificationPreferences, { success: true, data: preferences });
  const wrapper = ({ children }: PropsWithChildren) => (
    <QueryClientProvider client={client}>{children}</QueryClientProvider>
  );
  return { client, ...renderHook(() => useUpdateNotificationPreferences(), { wrapper }) };
}

beforeEach(() => jest.resetAllMocks());

it('serializes rapid changes so an older response cannot overwrite the newest state', async () => {
  let finishFirst!: (value: Awaited<ReturnType<typeof updateNotificationPreferences>>) => void;
  const firstRequest = new Promise<Awaited<ReturnType<typeof updateNotificationPreferences>>>(
    (resolve) => {
      finishFirst = resolve;
    },
  );
  const firstResponse = { success: true, data: { ...preferences, push_enabled: false } };
  const latestResponse = { success: true, data: { ...preferences, push_enabled: true } };
  updatePreferences.mockReturnValueOnce(firstRequest).mockResolvedValueOnce(latestResponse);
  const { client, result } = setup();

  let first!: Promise<unknown>;
  let second!: Promise<unknown>;
  act(() => {
    first = result.current.mutateAsync({ push_enabled: false });
    second = result.current.mutateAsync({ push_enabled: true });
  });

  await waitFor(() => expect(updatePreferences).toHaveBeenCalledTimes(1));
  await act(async () => {
    finishFirst(firstResponse);
    await Promise.all([first, second]);
  });
  await waitFor(() => expect(result.current.isSuccess).toBe(true));

  expect(updatePreferences.mock.calls).toEqual([
    [{ push_enabled: false }],
    [{ push_enabled: true }],
  ]);
  expect(client.getQueryData(queryKeys.notificationPreferences)).toEqual(latestResponse);
});

it('does not replace cached server state when a mutation fails', async () => {
  updatePreferences.mockRejectedValue(new Error('offline'));
  const { client, result } = setup();

  await act(async () => {
    await expect(result.current.mutateAsync({ sms_enabled: true })).rejects.toThrow('offline');
  });

  await waitFor(() => expect(result.current.isError).toBe(true));
  expect(client.getQueryData(queryKeys.notificationPreferences)).toEqual({
    success: true,
    data: preferences,
  });
});
