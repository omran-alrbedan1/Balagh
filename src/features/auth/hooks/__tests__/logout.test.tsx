import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook, waitFor } from '@testing-library/react-native';
import { router } from 'expo-router';
import { PropsWithChildren } from 'react';

import { logout, logoutAll } from '@/api/endpoints/auth.api';
import { useAuthStore } from '@/features/auth/store/authStore';
import { cleanupDeviceTokenForUser } from '@/features/notifications/utils/deviceTokenLifecycle';
import { clearPersistedPrivateQueries } from '@/lib/queryPersistence';

import { useLogout } from '../useLogout';
import { useLogoutAll } from '../useLogoutAll';

jest.mock('expo-router', () => ({ router: { replace: jest.fn() } }));
jest.mock('@/api/endpoints/auth.api', () => ({ logout: jest.fn(), logoutAll: jest.fn() }));
jest.mock('@/features/notifications/utils/deviceTokenLifecycle', () => ({
  cleanupDeviceTokenForUser: jest.fn(),
}));
jest.mock('@/lib/queryPersistence', () => ({ clearPersistedPrivateQueries: jest.fn() }));

const logoutRequest = logout as jest.MockedFunction<typeof logout>;
const logoutAllRequest = logoutAll as jest.MockedFunction<typeof logoutAll>;
const cleanup = cleanupDeviceTokenForUser as jest.MockedFunction<typeof cleanupDeviceTokenForUser>;
const clearPersisted = clearPersistedPrivateQueries as jest.MockedFunction<
  typeof clearPersistedPrivateQueries
>;
const replace = router.replace as jest.MockedFunction<typeof router.replace>;
const clearSession = jest.fn().mockResolvedValue(undefined);

function wrapper({ children }: PropsWithChildren) {
  return (
    <QueryClientProvider
      client={
        new QueryClient({
          defaultOptions: {
            mutations: { gcTime: Infinity },
            queries: { gcTime: Infinity },
          },
        })
      }
    >
      {children}
    </QueryClientProvider>
  );
}

beforeEach(() => {
  jest.clearAllMocks();
  cleanup.mockResolvedValue();
  clearPersisted.mockResolvedValue();
  useAuthStore.setState({
    clear: clearSession,
    isHydrated: true,
    token: 'token',
    user: { id: 'citizen-1', name: 'Citizen' },
  });
});

it('logs out the current device locally even when the remote session is unreachable', async () => {
  logoutRequest.mockRejectedValue(new Error('offline'));
  const { result } = renderHook(() => useLogout(), { wrapper });

  await act(async () => {
    await expect(result.current.mutateAsync()).rejects.toThrow('offline');
  });
  await waitFor(() => expect(result.current.isError).toBe(true));

  expect(cleanup).toHaveBeenCalledWith('citizen-1');
  expect(clearPersisted).toHaveBeenCalledWith('citizen-1');
  expect(clearSession).toHaveBeenCalledTimes(1);
  expect(replace).toHaveBeenCalledWith('/(auth)/login');
});

it('does not pretend logout-all succeeded when its server request fails', async () => {
  logoutAllRequest.mockRejectedValue(new Error('offline'));
  const { result } = renderHook(() => useLogoutAll(), { wrapper });

  await act(async () => {
    await expect(result.current.mutateAsync()).rejects.toThrow('offline');
  });
  await waitFor(() => expect(result.current.isError).toBe(true));

  expect(clearPersisted).not.toHaveBeenCalled();
  expect(clearSession).not.toHaveBeenCalled();
  expect(replace).not.toHaveBeenCalled();
});

it('clears protected state and persistent user cache after logout-all succeeds', async () => {
  logoutAllRequest.mockResolvedValue({ success: true, data: null });
  const { result } = renderHook(() => useLogoutAll(), { wrapper });

  await act(async () => {
    await result.current.mutateAsync();
  });
  await waitFor(() => expect(result.current.isSuccess).toBe(true));

  expect(clearPersisted).toHaveBeenCalledWith('citizen-1');
  expect(clearSession).toHaveBeenCalledTimes(1);
  expect(replace).toHaveBeenCalledWith('/(auth)/login');
});
