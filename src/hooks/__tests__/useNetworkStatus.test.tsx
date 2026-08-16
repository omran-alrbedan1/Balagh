import NetInfo from '@react-native-community/netinfo';
import { act, renderHook, waitFor } from '@testing-library/react-native';

import { getConnectivityStatus, useNetworkStatus } from '@/hooks/useNetworkStatus';

jest.mock('@react-native-community/netinfo', () => ({
  addEventListener: jest.fn(),
  fetch: jest.fn(),
}));

const mockedNetInfo = NetInfo as jest.Mocked<typeof NetInfo>;

it('does not optimistically report online before NetInfo resolves', () => {
  let listener: ((state: any) => void) | undefined;
  mockedNetInfo.addEventListener.mockImplementation((callback: any) => {
    listener = callback;
    return jest.fn();
  });
  mockedNetInfo.fetch.mockReturnValue(new Promise(() => undefined));

  const { result } = renderHook(() => useNetworkStatus());

  expect(result.current).toEqual(
    expect.objectContaining({ status: 'unknown', isOnline: false, isOffline: false }),
  );
  act(() => listener?.({ isConnected: true, isInternetReachable: false }));
  expect(result.current.status).toBe('offline');
});

it('requires confirmed reachability before reporting online', async () => {
  mockedNetInfo.addEventListener.mockReturnValue(jest.fn());
  mockedNetInfo.fetch.mockResolvedValue({
    isConnected: true,
    isInternetReachable: true,
  } as any);

  const { result } = renderHook(() => useNetworkStatus());
  await waitFor(() => expect(result.current.status).toBe('online'));

  expect(getConnectivityStatus({ isConnected: true, isInternetReachable: null } as any)).toBe(
    'unknown',
  );
});
