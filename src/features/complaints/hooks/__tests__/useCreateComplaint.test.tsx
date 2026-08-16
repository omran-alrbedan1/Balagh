import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook, waitFor } from '@testing-library/react-native';
import { PropsWithChildren } from 'react';

import { createComplaint, extractComplaint } from '@/api/endpoints/complaints.api';
import { useDraftComplaintStore } from '@/features/complaints/store/draftComplaintStore';
import { useOfflineQueueStore } from '@/features/complaints/store/offlineQueueStore';
import { useNetworkStatus } from '@/hooks/useNetworkStatus';

import { useCreateComplaint } from '../useCreateComplaint';

jest.mock('@/api/endpoints/complaints.api', () => ({
  createComplaint: jest.fn(),
  extractComplaint: jest.fn(),
}));
jest.mock('@/hooks/useNetworkStatus', () => ({ useNetworkStatus: jest.fn() }));
jest.mock('i18next', () => ({ __esModule: true, default: { t: (key: string) => key } }));
jest.mock('@/features/complaints/store/offlineQueueStore', () => ({
  useOfflineQueueStore: jest.fn(),
}));
jest.mock('@/features/auth/store/authStore', () => ({
  useAuthStore: (selector: any) => selector({ user: { id: 'user-1' } }),
}));

const mockedCreateComplaint = createComplaint as jest.MockedFunction<typeof createComplaint>;
const mockedExtractComplaint = extractComplaint as jest.MockedFunction<typeof extractComplaint>;
const mockedNetworkStatus = useNetworkStatus as jest.MockedFunction<typeof useNetworkStatus>;
const mockedOfflineQueueStore = useOfflineQueueStore as jest.MockedFunction<
  typeof useOfflineQueueStore
>;
const enqueue = jest.fn();

let queryClient: QueryClient;

function wrapper({ children }: PropsWithChildren) {
  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}

function fillDraft() {
  useDraftComplaintStore.setState({
    attachments: [],
    categoryId: 'category-1',
    departmentId: 'department-1',
    description: 'Description',
    location: { address: 'Damascus', lat: 33.5, lng: 36.3 },
    title: 'Title',
  });
}

beforeEach(() => {
  jest.clearAllMocks();
  queryClient = new QueryClient({
    defaultOptions: {
      mutations: { gcTime: 0, retry: false },
      queries: { gcTime: 0 },
    },
  });
  useDraftComplaintStore.getState().reset();
  mockedNetworkStatus.mockReturnValue({ isOnline: true } as ReturnType<typeof useNetworkStatus>);
  mockedOfflineQueueStore.mockImplementation((selector: any) => selector({ enqueue }));
  enqueue.mockResolvedValue({});
});

afterEach(() => {
  queryClient.clear();
});

it('resets a submitted online draft and creates a fresh client reference', async () => {
  fillDraft();
  const previousClientRef = useDraftComplaintStore.getState().clientRef;
  mockedCreateComplaint.mockResolvedValue({} as Awaited<ReturnType<typeof createComplaint>>);
  mockedExtractComplaint.mockReturnValue({ id: 'complaint-1' } as ReturnType<
    typeof extractComplaint
  >);
  const { result } = renderHook(() => useCreateComplaint(), { wrapper });

  await act(async () => result.current.mutateAsync());
  await waitFor(() => expect(result.current.isSuccess).toBe(true));

  expect(mockedCreateComplaint).toHaveBeenCalledWith(
    expect.objectContaining({ client_ref: previousClientRef, title: 'Title' }),
    [],
  );
  expect(useDraftComplaintStore.getState()).toEqual(
    expect.objectContaining({
      attachments: [],
      categoryId: undefined,
      departmentId: undefined,
      description: '',
      location: undefined,
      title: '',
    }),
  );
  expect(useDraftComplaintStore.getState().clientRef).not.toBe(previousClientRef);
});

it('resets a successfully queued offline draft', async () => {
  fillDraft();
  mockedNetworkStatus.mockReturnValue({ isOnline: false } as ReturnType<typeof useNetworkStatus>);
  const { result } = renderHook(() => useCreateComplaint(), { wrapper });

  await act(async () => result.current.mutateAsync());
  await waitFor(() => expect(result.current.isSuccess).toBe(true));

  expect(enqueue).toHaveBeenCalledWith(
    expect.objectContaining({ ownerUserId: 'user-1', payload: expect.any(Object) }),
  );
  expect(useDraftComplaintStore.getState().title).toBe('');
  expect(useDraftComplaintStore.getState().clientRef).not.toBe('');
});

it('queues an unclassified offline complaint for backend classification', async () => {
  fillDraft();
  useDraftComplaintStore.setState({ departmentId: undefined, categoryId: undefined });
  mockedNetworkStatus.mockReturnValue({ isOnline: false } as ReturnType<typeof useNetworkStatus>);
  const { result } = renderHook(() => useCreateComplaint(), { wrapper });

  await act(async () => result.current.mutateAsync());
  await waitFor(() => expect(result.current.isSuccess).toBe(true));

  expect(enqueue).toHaveBeenCalledWith({
    attachments: [],
    ownerUserId: 'user-1',
    payload: expect.objectContaining({ department_id: '', category_id: '' }),
  });
  expect(mockedCreateComplaint).not.toHaveBeenCalled();
});

it('preserves the draft when online submission fails', async () => {
  fillDraft();
  mockedCreateComplaint.mockRejectedValue(new Error('Request failed'));
  const { result } = renderHook(() => useCreateComplaint(), { wrapper });

  await expect(act(async () => result.current.mutateAsync())).rejects.toThrow('Request failed');
  await waitFor(() => expect(result.current.isError).toBe(true));

  expect(useDraftComplaintStore.getState()).toEqual(
    expect.objectContaining({ description: 'Description', title: 'Title' }),
  );
});

it('preserves the draft when durable offline enqueue fails', async () => {
  fillDraft();
  mockedNetworkStatus.mockReturnValue({ isOnline: false } as ReturnType<typeof useNetworkStatus>);
  enqueue.mockRejectedValue(new Error('storage full'));
  const { result } = renderHook(() => useCreateComplaint(), { wrapper });

  await expect(act(async () => result.current.mutateAsync())).rejects.toThrow(
    'offline.queueSaveError',
  );

  expect(useDraftComplaintStore.getState()).toEqual(
    expect.objectContaining({ description: 'Description', title: 'Title' }),
  );
});
