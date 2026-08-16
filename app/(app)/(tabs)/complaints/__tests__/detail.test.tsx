/* eslint-disable @typescript-eslint/no-require-imports */
import { render } from '@testing-library/react-native';
import { useLocalSearchParams } from 'expo-router';

import { useComplaintDetail } from '@/features/complaints/hooks/useComplaintDetail';

import ComplaintDetailScreen from '../[id]';

jest.mock('expo-router', () => ({ useLocalSearchParams: jest.fn() }));
jest.mock('react-i18next', () => ({ useTranslation: () => ({ t: (key: string) => key }) }));
jest.mock('lucide-react-native', () => new Proxy({}, { get: () => () => null }));
jest.mock('react-native-reanimated', () => {
  const { View } = require('react-native');
  const transition = {
    delay: () => transition,
    duration: () => transition,
    springify: () => transition,
    damping: () => transition,
  };
  return {
    __esModule: true,
    default: { View },
    FadeIn: transition,
    LinearTransition: transition,
    ZoomIn: transition,
  };
});
jest.mock('@/api/endpoints/complaints.api', () => ({ extractComplaint: jest.fn() }));
jest.mock('@/components/layout/Screen', () => ({
  Screen: ({ children }: any) => {
    const { View } = require('react-native');
    return <View>{children}</View>;
  },
}));
jest.mock('@/components/ui/EmptyState', () => ({
  EmptyState: ({ title }: { title: string }) => {
    const { Text } = require('react-native');
    return <Text>{title}</Text>;
  },
}));
jest.mock('@/components/ui/ErrorState', () => ({ ErrorState: () => null }));
jest.mock('@/components/ui/LoadingSpinner', () => ({ LoadingSpinner: () => null }));
jest.mock('@/features/complaints/components/ComplaintTimeline', () => ({
  ComplaintTimeline: () => null,
}));
jest.mock('@/features/complaints/components/ComplaintInformationRequestSection', () => ({
  ComplaintInformationRequestSection: () => null,
}));
jest.mock('@/features/complaints/components/StatusBadge', () => ({ StatusBadge: () => null }));
jest.mock('@/features/complaints/hooks/useComplaintDetail', () => ({
  useComplaintDetail: jest.fn(),
}));
jest.mock('@/features/complaints/utils/complaintDisplay', () => ({}));

const mockedParams = useLocalSearchParams as jest.MockedFunction<typeof useLocalSearchParams>;
const mockedDetail = useComplaintDetail as jest.MockedFunction<typeof useComplaintDetail>;

beforeEach(() => {
  jest.clearAllMocks();
  mockedDetail.mockReturnValue({
    data: undefined,
    error: null,
    isLoading: false,
    isRefetching: false,
    refetch: jest.fn(),
  } as unknown as ReturnType<typeof useComplaintDetail>);
});

it.each(['index', 'new'])('renders a controlled local error for invalid ID %s', (id) => {
  mockedParams.mockReturnValue({ id } as any);

  const view = render(<ComplaintDetailScreen />);

  expect(mockedDetail).toHaveBeenCalledWith(null);
  expect(view.getByText('complaints.invalidIdTitle')).toBeTruthy();
  expect(view.queryByText('complaints.detailLoading')).toBeNull();
});
