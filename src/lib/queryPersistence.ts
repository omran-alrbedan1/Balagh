import AsyncStorage from '@react-native-async-storage/async-storage';
import { dehydrate, DehydratedState, hydrate, QueryClient, QueryKey } from '@tanstack/react-query';

import { getStoredUser } from '@/lib/secureStorage';

const PUBLIC_STORAGE_KEY = 'balagh.queryCache.public.v1';
const PRIVATE_STORAGE_PREFIX = 'balagh.queryCache.user.v1';
const PRIVATE_CACHE_SCHEMA_VERSION = 2;

interface PersistedPrivateCache {
  version: number;
  state: DehydratedState;
}

export async function clearPersistedPrivateQueries(userId: string | number | undefined) {
  if (userId == null) return;
  await AsyncStorage.removeItem(`${PRIVATE_STORAGE_PREFIX}.${userId}`).catch(() => undefined);
}

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

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function isDehydratedState(value: unknown): value is DehydratedState {
  return isRecord(value) && Array.isArray(value.mutations) && Array.isArray(value.queries);
}

function removeComplaintQueries(state: DehydratedState): DehydratedState {
  return {
    ...state,
    queries: state.queries.filter((query) => query.queryKey[0] !== 'complaints'),
  };
}

async function readAndHydratePrivateQueries(queryClient: QueryClient, key: string) {
  const raw = await AsyncStorage.getItem(key);
  if (!raw) return;

  try {
    const parsed: unknown = JSON.parse(raw);
    const envelope: PersistedPrivateCache | undefined =
      isRecord(parsed) && typeof parsed.version === 'number' && isDehydratedState(parsed.state)
        ? { version: parsed.version, state: parsed.state }
        : undefined;
    const isCurrent = envelope?.version === PRIVATE_CACHE_SCHEMA_VERSION;
    const storedState = envelope?.state ?? (isDehydratedState(parsed) ? parsed : undefined);

    if (!storedState) {
      await AsyncStorage.removeItem(key);
      return;
    }

    const state = isCurrent ? storedState : removeComplaintQueries(storedState);
    hydrate(queryClient, state);

    if (!isCurrent) {
      const migrated: PersistedPrivateCache = {
        version: PRIVATE_CACHE_SCHEMA_VERSION,
        state,
      };
      await AsyncStorage.setItem(key, JSON.stringify(migrated));
    }
  } catch {
    // Private query data is disposable and must not poison every app startup.
    await AsyncStorage.removeItem(key).catch(() => undefined);
  }
}

export async function hydratePersistedQueries(queryClient: QueryClient) {
  try {
    await readAndHydrate(queryClient, PUBLIC_STORAGE_KEY);
  } catch {
    // Public query data is disposable; authentication and queued writes are stored separately.
    await AsyncStorage.removeItem(PUBLIC_STORAGE_KEY).catch(() => undefined);
  }

  const user = await getStoredUser();
  if (!user) return;

  const ownerUserId = String(user.id);
  await readAndHydratePrivateQueries(queryClient, `${PRIVATE_STORAGE_PREFIX}.${ownerUserId}`);
  queryClient.removeQueries({
    predicate: (query) =>
      query.queryKey[0] === 'complaints' && !isComplaintQuery(query.queryKey, ownerUserId),
  });
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
          const persisted: PersistedPrivateCache = {
            version: PRIVATE_CACHE_SCHEMA_VERSION,
            state: privateState,
          };
          return AsyncStorage.setItem(
            `${PRIVATE_STORAGE_PREFIX}.${user.id}`,
            JSON.stringify(persisted),
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
