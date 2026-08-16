import { render } from '@testing-library/react-native';

import { OfflineComplaintCard } from '@/features/complaints/components/OfflineComplaintCard';
import { useOfflineQueueStore } from '@/features/complaints/store/offlineQueueStore';

jest.mock('react-i18next', () => ({ useTranslation: () => ({ t: (key: string) => key }) }));
jest.mock('lucide-react-native', () => ({
  AlertTriangle: () => null,
  Clock3: () => null,
  RefreshCw: () => null,
  Trash2: () => null,
}));
jest.mock('expo-router', () => ({ Link: ({ children }: any) => children }));
jest.mock('@/features/complaints/store/offlineQueueStore', () => ({
  useOfflineQueueStore: jest.fn(),
}));

const mockedStore = useOfflineQueueStore as jest.MockedFunction<typeof useOfflineQueueStore>;
const item = {
  id: 'queue-1',
  client_uuid: 'stable-id',
  payload: {
    client_ref: 'stable-id',
    department_id: 'department-1',
    category_id: 'category-1',
    title: 'Locally queued complaint',
    description: 'Description',
  },
  attachments: [],
  status: 'queued' as const,
  createdAt: '2026-01-01T00:00:00.000Z',
  retryCount: 0,
};

beforeEach(() => {
  mockedStore.mockImplementation((selector: any) =>
    selector({ remove: jest.fn(), retry: jest.fn() }),
  );
});

it('visibly labels a locally queued complaint without a server complaint ID', () => {
  const view = render(<OfflineComplaintCard item={item} />);

  expect(view.getByText('Locally queued complaint')).toBeTruthy();
  expect(view.getByText('offline.pendingSync')).toBeTruthy();
  expect(view.queryByText(/complaint-/i)).toBeNull();
});

it('exposes manual retry and discard for a failed item', () => {
  const view = render(
    <OfflineComplaintCard item={{ ...item, status: 'failed', lastError: 'Server error' }} />,
  );

  expect(view.getByText('offline.retry')).toBeTruthy();
  expect(view.getByText('offline.discard')).toBeTruthy();
  expect(view.getByText('Server error')).toBeTruthy();
});
