/* eslint-disable @typescript-eslint/no-require-imports */
import AsyncStorage from '@react-native-async-storage/async-storage';
import { QueryClient } from '@tanstack/react-query';

import {
  clearPersistedPrivateQueries,
  hydratePersistedQueries,
  startQueryPersistence,
} from '@/lib/queryPersistence';
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

it('restores only last-known complaint, dashboard, and lookup data after restart', async () => {
  const firstClient = new QueryClient();
  const stop = startQueryPersistence(firstClient);
  firstClient.setQueryData(['lookups', 'departments', 'en'], [{ id: 'department-1' }]);
  firstClient.setQueryData(['lookups', 'categories', 'en', 'department-1'], [{ id: 'category-1' }]);
  firstClient.setQueryData(['complaints', 'user-1', 'list', 'all', 'newest'], {
    data: [{ id: 1 }],
  });
  firstClient.setQueryData(['home', 'dashboard'], { data: { counts: { active: 1 } } });
  firstClient.setQueryData(['notifications', 'list'], [{ id: 'notification-1' }]);

  await new Promise((resolve) => setTimeout(resolve, 300));
  stop();

  const restartedClient = new QueryClient();
  await hydratePersistedQueries(restartedClient);

  expect(restartedClient.getQueryData(['lookups', 'departments', 'en'])).toEqual([
    { id: 'department-1' },
  ]);
  expect(restartedClient.getQueryData(['complaints', 'user-1', 'list', 'all', 'newest'])).toEqual({
    data: [{ id: 1 }],
  });
  expect(restartedClient.getQueryData(['home', 'dashboard'])).toEqual({
    data: { counts: { active: 1 } },
  });
  expect(restartedClient.getQueryData(['notifications', 'list'])).toBeUndefined();
  firstClient.clear();
  restartedClient.clear();
});

it('does not hydrate one user complaint data into another user session', async () => {
  const firstClient = new QueryClient();
  const stop = startQueryPersistence(firstClient);
  firstClient.setQueryData(['complaints', 'user-1', 'list', 'all', 'newest'], {
    data: [{ id: 1 }],
  });
  firstClient.setQueryData(['home', 'dashboard'], { data: { counts: { active: 1 } } });
  await new Promise((resolve) => setTimeout(resolve, 300));
  stop();

  mockedGetStoredUser.mockResolvedValue({ id: 'user-2', name: 'Different Citizen' });
  const secondClient = new QueryClient();
  await hydratePersistedQueries(secondClient);

  expect(
    secondClient.getQueryData(['complaints', 'user-1', 'list', 'all', 'newest']),
  ).toBeUndefined();
  expect(secondClient.getQueryData(['home', 'dashboard'])).toBeUndefined();
  firstClient.clear();
  secondClient.clear();
});

it('discards legacy unscoped complaint cache entries without removing dashboard data', async () => {
  const legacyClient = new QueryClient();
  legacyClient.setQueryData(['complaints', 'all', 'newest'], { data: [{ id: 'stale' }] });
  legacyClient.setQueryData(['home', 'dashboard'], { data: { counts: { active: 2 } } });
  const { dehydrate } = require('@tanstack/react-query');
  await AsyncStorage.setItem(
    'balagh.queryCache.user.v1.user-1',
    JSON.stringify(dehydrate(legacyClient)),
  );

  const restartedClient = new QueryClient();
  await hydratePersistedQueries(restartedClient);

  expect(restartedClient.getQueryData(['complaints', 'all', 'newest'])).toBeUndefined();
  expect(restartedClient.getQueryData(['home', 'dashboard'])).toEqual({
    data: { counts: { active: 2 } },
  });
  legacyClient.clear();
  restartedClient.clear();
});

it('removes the authenticated user private cache on logout', async () => {
  await AsyncStorage.setItem('balagh.queryCache.user.v1.user-1', 'private');
  await AsyncStorage.setItem('balagh.queryCache.user.v1.user-2', 'other-user');

  await clearPersistedPrivateQueries('user-1');

  expect(await AsyncStorage.getItem('balagh.queryCache.user.v1.user-1')).toBeNull();
  expect(await AsyncStorage.getItem('balagh.queryCache.user.v1.user-2')).toBe('other-user');
});
