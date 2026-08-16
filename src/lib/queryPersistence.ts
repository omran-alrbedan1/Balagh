import AsyncStorage from '@react-native-async-storage/async-storage';
import { dehydrate, hydrate, QueryClient, QueryKey } from '@tanstack/react-query';

import { getStoredUser } from '@/lib/secureStorage';

const PUBLIC_STORAGE_KEY = 'balagh.queryCache.public.v1';
const PRIVATE_STORAGE_PREFIX = 'balagh.queryCache.user.v1';

function isLookupQuery(queryKey: QueryKey) {
  return (
    queryKey[0] === 'lookups' && (queryKey[1] === 'departments' || queryKey[1] === 'categories')
  );
}

function isComplaintQuery(queryKey: QueryKey, ownerUserId?: string) {
  return queryKey[0] === 'complaints' && queryKey[1] === ownerUserId;
}

function isPrivateUserQuery(queryKey: QueryKey, ownerUserId: string) {
  return (
    isComplaintQuery(queryKey, ownerUserId) ||
    (queryKey[0] === 'home' && queryKey[1] === 'dashboard')
  );
}

async function readAndHydrate(queryClient: QueryClient, key: string) {
  const raw = await AsyncStorage.getItem(key);
  if (raw) {
    hydrate(queryClient, JSON.parse(raw));
  }
}

export async function hydratePersistedQueries(queryClient: QueryClient) {
  try {
    await readAndHydrate(queryClient, PUBLIC_STORAGE_KEY);
    const user = await getStoredUser();
    if (user) {
      await readAndHydrate(queryClient, `${PRIVATE_STORAGE_PREFIX}.${user.id}`);
      const ownerUserId = String(user.id);
      queryClient.removeQueries({
        predicate: (query) =>
          query.queryKey[0] === 'complaints' && !isComplaintQuery(query.queryKey, ownerUserId),
      });
    }
  } catch {
    // A corrupt cache is disposable; authentication and queued writes are stored separately.
    await AsyncStorage.removeItem(PUBLIC_STORAGE_KEY).catch(() => undefined);
  }
}

export function startQueryPersistence(queryClient: QueryClient) {
  let timer: ReturnType<typeof setTimeout> | undefined;

  const unsubscribe = queryClient.getQueryCache().subscribe(() => {
    clearTimeout(timer);
    timer = setTimeout(() => {
      const publicState = dehydrate(queryClient, {
        shouldDehydrateQuery: (query) =>
          query.state.status === 'success' && isLookupQuery(query.queryKey),
      });
      void AsyncStorage.setItem(PUBLIC_STORAGE_KEY, JSON.stringify(publicState)).catch(
        () => undefined,
      );

      void getStoredUser()
        .then((user) => {
          if (!user) {
            return;
          }

          const privateState = dehydrate(queryClient, {
            shouldDehydrateQuery: (query) =>
              query.state.status === 'success' &&
              isPrivateUserQuery(query.queryKey, String(user.id)),
          });
          return AsyncStorage.setItem(
            `${PRIVATE_STORAGE_PREFIX}.${user.id}`,
            JSON.stringify(privateState),
          );
        })
        .catch(() => undefined);
    }, 250);
  });

  return () => {
    clearTimeout(timer);
    unsubscribe();
  };
}
