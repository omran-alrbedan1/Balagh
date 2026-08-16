import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook, waitFor } from '@testing-library/react-native';
import { PropsWithChildren } from 'react';

import { updateProfile } from '@/api/endpoints/auth.api';
import { queryKeys } from '@/constants/queryKeys';
import { useAuthStore } from '@/features/auth/store/authStore';

import { useUpdateProfile } from '../useUpdateProfile';

jest.mock('@/api/endpoints/auth.api', () => ({ updateProfile: jest.fn() }));
jest.mock('@/features/auth/store/authStore', () => ({ useAuthStore: jest.fn() }));

const request = updateProfile as jest.MockedFunction<typeof updateProfile>;
const updateUser = jest.fn().mockResolvedValue(undefined);

function setup() {
  const client = new QueryClient({
    defaultOptions: {
      mutations: { gcTime: Infinity, retry: false },
      queries: { gcTime: Infinity, retry: false },
    },
  });
  const wrapper = ({ children }: PropsWithChildren) => (
    <QueryClientProvider client={client}>{children}</QueryClientProvider>
  );
  return { client, ...renderHook(() => useUpdateProfile(), { wrapper }) };
}

beforeEach(() => {
  jest.clearAllMocks();
  (useAuthStore as jest.MockedFunction<typeof useAuthStore>).mockImplementation((selector) =>
    selector({ updateUser } as never),
  );
});

it('reconciles the authenticated user and /auth/me cache from the server response', async () => {
  const response = {
    success: true,
    data: { id: 7, name: 'Updated Amina', phone: '+963900000001' },
  };
  request.mockResolvedValue(response);
  const { client, result } = setup();

  await act(async () => {
    await result.current.mutateAsync({ name: 'Updated Amina', phone: '+963900000001' });
  });

  expect(updateUser).toHaveBeenCalledWith(response.data);
  expect(client.getQueryData(queryKeys.authMe)).toEqual(response);
});

it('does not mutate authenticated user or cached profile when the request fails', async () => {
  request.mockRejectedValue(new Error('offline'));
  const { client, result } = setup();

  await act(async () => {
    await expect(
      result.current.mutateAsync({ name: 'Updated Amina', phone: '+963900000001' }),
    ).rejects.toThrow('offline');
  });
  await waitFor(() => expect(result.current.isError).toBe(true));

  expect(updateUser).not.toHaveBeenCalled();
  expect(client.getQueryData(queryKeys.authMe)).toBeUndefined();
});
