/* eslint-disable @typescript-eslint/no-require-imports */
import AsyncStorage from '@react-native-async-storage/async-storage';
import { QueryClient } from '@tanstack/react-query';

import { hydratePersistedQueries, startQueryPersistence } from '@/lib/queryPersistence';
import { getStoredUser } from '@/lib/secureStorage';

jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);
jest.mock('@/lib/secureStorage', () => ({ getStoredUser: jest.fn() }));

const mockedGetStoredUser = getStoredUser as jest.MockedFunction<typeof getStoredUser>;

beforeEach(async () => {
  await AsyncStorage.clear();
  jest.clearAllMocks();
  mockedGetStoredUser.mockResolvedValue({ id: 'user-1', name: 'Citizen' });
});

it('restores only last-known complaint and lookup data after restart', async () => {
  const firstClient = new QueryClient();
  const stop = startQueryPersistence(firstClient);
  firstClient.setQueryData(['lookups', 'departments', 'en'], [{ id: 'department-1' }]);
  firstClient.setQueryData(['lookups', 'categories', 'en', 'department-1'], [{ id: 'category-1' }]);
  firstClient.setQueryData(['complaints', 'all', 'newest'], { data: [{ id: 'complaint-1' }] });
  firstClient.setQueryData(['notifications', 'list'], [{ id: 'notification-1' }]);

  await new Promise((resolve) => setTimeout(resolve, 300));
  stop();

  const restartedClient = new QueryClient();
  await hydratePersistedQueries(restartedClient);

  expect(restartedClient.getQueryData(['lookups', 'departments', 'en'])).toEqual([
    { id: 'department-1' },
  ]);
  expect(restartedClient.getQueryData(['complaints', 'all', 'newest'])).toEqual({
    data: [{ id: 'complaint-1' }],
  });
  expect(restartedClient.getQueryData(['notifications', 'list'])).toBeUndefined();
  firstClient.clear();
  restartedClient.clear();
});

it('does not hydrate one user complaint data into another user session', async () => {
  const firstClient = new QueryClient();
  const stop = startQueryPersistence(firstClient);
  firstClient.setQueryData(['complaints', 'all', 'newest'], { data: [{ id: 'private-1' }] });
  await new Promise((resolve) => setTimeout(resolve, 300));
  stop();

  mockedGetStoredUser.mockResolvedValue({ id: 'user-2', name: 'Different Citizen' });
  const secondClient = new QueryClient();
  await hydratePersistedQueries(secondClient);

  expect(secondClient.getQueryData(['complaints', 'all', 'newest'])).toBeUndefined();
  firstClient.clear();
  secondClient.clear();
});
