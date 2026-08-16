import { ApiError } from '@/api/client';
import { me } from '@/api/endpoints/auth.api';
import { useAuthStore } from '@/features/auth/store/authStore';
import { fetchConnectivityStatus } from '@/hooks/useNetworkStatus';
import { clearSession, getStoredUser, getToken, saveSession } from '@/lib/secureStorage';

jest.mock('@/api/client', () => ({
  ApiError: class ApiError extends Error {
    constructor(
      message: string,
      public readonly mockStatus?: number,
    ) {
      super(message);
      Object.defineProperty(this, 'status', { value: mockStatus });
    }
  },
}));
jest.mock('@/api/endpoints/auth.api', () => ({ me: jest.fn(), extractAuthUser: jest.fn() }));
jest.mock('@/hooks/useNetworkStatus', () => ({ fetchConnectivityStatus: jest.fn() }));
jest.mock('@/lib/secureStorage', () => ({
  clearSession: jest.fn(),
  getStoredUser: jest.fn(),
  getToken: jest.fn(),
  saveSession: jest.fn(),
}));

const mockedMe = me as jest.MockedFunction<typeof me>;
const mockedConnectivity = fetchConnectivityStatus as jest.MockedFunction<
  typeof fetchConnectivityStatus
>;
const mockedGetToken = getToken as jest.MockedFunction<typeof getToken>;
const mockedGetStoredUser = getStoredUser as jest.MockedFunction<typeof getStoredUser>;

const cachedUser = { id: 'user-1', name: 'Cached Citizen' };

beforeEach(() => {
  jest.clearAllMocks();
  useAuthStore.setState({ isHydrated: false, token: null, user: null });
  mockedGetToken.mockResolvedValue('stored-token');
  mockedGetStoredUser.mockResolvedValue(cachedUser);
});

it('opens the cached authenticated session without calling /me when offline', async () => {
  mockedConnectivity.mockResolvedValue('offline');

  await useAuthStore.getState().hydrate();

  expect(useAuthStore.getState()).toEqual(
    expect.objectContaining({ isHydrated: true, token: 'stored-token', user: cachedUser }),
  );
  expect(mockedMe).not.toHaveBeenCalled();
  expect(clearSession).not.toHaveBeenCalled();
});

it('retains the cached session when the server is temporarily unreachable', async () => {
  mockedConnectivity.mockResolvedValue('online');
  mockedMe.mockRejectedValue(new ApiError('Server unavailable'));

  await useAuthStore.getState().hydrate();

  expect(useAuthStore.getState().token).toBe('stored-token');
  expect(useAuthStore.getState().user).toEqual(cachedUser);
  expect(clearSession).not.toHaveBeenCalled();
});

it('clears a definitively unauthorized session', async () => {
  mockedConnectivity.mockResolvedValue('online');
  mockedMe.mockRejectedValue(new ApiError('Unauthenticated', 401));

  await useAuthStore.getState().hydrate();

  expect(clearSession).toHaveBeenCalledTimes(1);
  expect(useAuthStore.getState()).toEqual(
    expect.objectContaining({ isHydrated: true, token: null, user: null }),
  );
});

it('hydrates to a signed-out state when there is no stored token', async () => {
  mockedGetToken.mockResolvedValue(null);
  mockedGetStoredUser.mockResolvedValue(null);

  await useAuthStore.getState().hydrate();

  expect(mockedConnectivity).not.toHaveBeenCalled();
  expect(mockedMe).not.toHaveBeenCalled();
  expect(saveSession).not.toHaveBeenCalled();
  expect(useAuthStore.getState().token).toBeNull();
});
