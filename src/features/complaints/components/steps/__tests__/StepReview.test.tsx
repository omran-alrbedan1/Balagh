/* eslint-disable @typescript-eslint/no-require-imports */
import { fireEvent, render } from '@testing-library/react-native';
import { router } from 'expo-router';

import { useCreateComplaint } from '@/features/complaints/hooks/useCreateComplaint';
import { useDraftComplaintStore } from '@/features/complaints/store/draftComplaintStore';
import { useCategories } from '@/features/lookups/hooks/useCategories';
import { useDepartments } from '@/features/lookups/hooks/useDepartments';

import { StepReview } from '../StepReview';

jest.mock('react-i18next', () => ({ useTranslation: () => ({ t: (key: string) => key }) }));
jest.mock('expo-router', () => ({ router: { replace: jest.fn() } }));
jest.mock('lucide-react-native', () => ({ FileText: () => null }));
jest.mock('@/features/complaints/hooks/useCreateComplaint', () => ({
  useCreateComplaint: jest.fn(),
}));
jest.mock('@/features/lookups/hooks/useCategories', () => ({ useCategories: jest.fn() }));
jest.mock('@/features/lookups/hooks/useDepartments', () => ({ useDepartments: jest.fn() }));
jest.mock('@/components/ui/Card', () => ({
  Card: ({ children }: any) => {
    const { View } = require('react-native');
    return <View>{children}</View>;
  },
}));
jest.mock('@/components/ui/ErrorState', () => ({
  ErrorState: ({ message }: any) => {
    const { Text } = require('react-native');
    return <Text>{message}</Text>;
  },
}));
jest.mock('@/components/ui/SubmitButton', () => ({
  SubmitButton: ({ label, onPress }: any) => {
    const { Pressable, Text } = require('react-native');
    return (
      <Pressable onPress={onPress} testID="submit">
        <Text>{label}</Text>
      </Pressable>
    );
  },
}));
jest.mock('@/features/complaints/components/StepBackButton', () => ({
  StepBackButton: () => null,
}));

const mockedCreate = useCreateComplaint as jest.MockedFunction<typeof useCreateComplaint>;
const mockedCategories = useCategories as jest.MockedFunction<typeof useCategories>;
const mockedDepartments = useDepartments as jest.MockedFunction<typeof useDepartments>;
const mutate = jest.fn();

beforeEach(() => {
  jest.clearAllMocks();
  useDraftComplaintStore.getState().reset();
  useDraftComplaintStore.getState().setTitleDescription('Title', 'Description');
  mockedDepartments.mockReturnValue({ data: [] } as unknown as ReturnType<typeof useDepartments>);
  mockedCategories.mockReturnValue({ data: [] } as unknown as ReturnType<typeof useCategories>);
  mockedCreate.mockReturnValue({
    error: null,
    isPending: false,
    mutate,
  } as unknown as ReturnType<typeof useCreateComplaint>);
});

it.each([
  [{ complaint: { id: 'complaint-1' }, queued: false }, 'detail'],
  [{ queued: true }, 'index'],
  [{ complaint: undefined, queued: false }, 'index'],
] as const)(
  'resets the wizard before routing after every successful result branch',
  (result, route) => {
    mutate.mockImplementationOnce((_value, options) => options.onSuccess(result));
    const onSubmissionSuccess = jest.fn();
    const view = render(
      <StepReview onBack={jest.fn()} onSubmissionSuccess={onSubmissionSuccess} />,
    );

    fireEvent.press(view.getByTestId('submit'));

    expect(onSubmissionSuccess).toHaveBeenCalledTimes(1);
    expect(router.replace).toHaveBeenCalledWith(
      route === 'detail'
        ? { pathname: '/(app)/(tabs)/complaints/[id]', params: { id: 'complaint-1' } }
        : '/(app)/(tabs)/complaints/index',
    );
  },
);

it('does not reset the wizard callback when submission fails', () => {
  const onSubmissionSuccess = jest.fn();
  mutate.mockImplementationOnce(() => undefined);
  const view = render(<StepReview onBack={jest.fn()} onSubmissionSuccess={onSubmissionSuccess} />);

  fireEvent.press(view.getByTestId('submit'));

  expect(onSubmissionSuccess).not.toHaveBeenCalled();
  expect(useDraftComplaintStore.getState().title).toBe('Title');
});
