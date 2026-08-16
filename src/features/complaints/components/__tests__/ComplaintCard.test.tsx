/* eslint-disable @typescript-eslint/no-require-imports */
import { fireEvent, render } from '@testing-library/react-native';
import { router } from 'expo-router';

import { Complaint } from '@/api/types/complaint.types';
import { ComplaintCard } from '@/features/complaints/components/ComplaintCard';

jest.mock('expo-router', () => ({ router: { push: jest.fn() } }));
jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, values?: { title?: string }) =>
      values?.title ? `${key}:${values.title}` : key,
  }),
}));
jest.mock('lucide-react-native', () => ({
  AlertTriangle: () => null,
  CalendarDays: () => null,
  ChevronRight: () => null,
  Clock3: () => null,
  Flag: () => null,
  MapPin: () => null,
}));
jest.mock('@/features/complaints/components/StatusBadge', () => ({
  StatusBadge: ({ status }: { status: string }) => {
    const { Text } = require('react-native');
    return <Text>{status}</Text>;
  },
}));
jest.mock('@/features/complaints/utils/complaintDisplay', () => ({
  formatDate: (value: string) => value,
  getDepartmentCategoryLabel: () => 'Roads',
  getPriorityLabel: () => 'Normal',
  getSlaCountdown: () => null,
}));

const complaint = {
  id: '123',
  client_ref: 'stable-client-uuid',
  title: 'Pothole',
  description: 'Description',
  department_id: '1',
  category_id: '2',
  status: 'submitted',
  attachments: [],
  timeline: [],
  created_at: '2026-08-01T00:00:00Z',
} as Complaint;

beforeEach(() => jest.clearAllMocks());

it('navigates with the exact normalized server complaint ID', () => {
  const view = render(<ComplaintCard complaint={complaint} />);

  fireEvent.press(view.getByLabelText('home.openComplaint:Pothole'));

  expect(router.push).toHaveBeenCalledWith({
    pathname: '/(app)/(tabs)/complaints/[id]',
    params: { id: '123' },
  });
});

it('never treats a local queue ID or route segment as a backend complaint ID', () => {
  const view = render(
    <ComplaintCard complaint={{ ...complaint, id: 'index' } as unknown as Complaint} />,
  );

  fireEvent.press(view.getByLabelText('home.openComplaint:Pothole'));

  expect(router.push).not.toHaveBeenCalled();
});
