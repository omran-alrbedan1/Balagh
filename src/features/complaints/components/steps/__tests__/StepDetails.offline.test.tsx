/* eslint-disable @typescript-eslint/no-require-imports */
import { fireEvent, render } from '@testing-library/react-native';

import { StepDetails } from '@/features/complaints/components/steps/StepDetails';
import { useClassifyComplaint } from '@/features/complaints/hooks/useClassifyComplaint';
import { useDraftComplaintStore } from '@/features/complaints/store/draftComplaintStore';
import { useNetworkStatus } from '@/hooks/useNetworkStatus';

jest.mock('react-i18next', () => ({
  initReactI18next: { type: '3rdParty', init: jest.fn() },
  useTranslation: () => ({ t: (key: string) => key }),
}));
jest.mock('lucide-react-native', () => ({ FileText: () => null, Sparkles: () => null }));
jest.mock('@/hooks/useNetworkStatus', () => ({ useNetworkStatus: jest.fn() }));
jest.mock('@/features/complaints/hooks/useClassifyComplaint', () => ({
  useClassifyComplaint: jest.fn(),
}));
jest.mock('@/components/ui/ControlledInput', () => ({ ControlledInput: () => null }));
jest.mock('@/components/ui/SubmitButton', () => ({
  SubmitButton: ({ onSubmit }: any) => {
    const { Pressable, Text } = require('react-native');
    return (
      <Pressable
        onPress={() =>
          onSubmit({ title: 'Offline title', description: 'A sufficiently detailed description' })
        }
      >
        <Text>submit-details</Text>
      </Pressable>
    );
  },
}));

const mockedNetwork = useNetworkStatus as jest.MockedFunction<typeof useNetworkStatus>;
const mockedClassify = useClassifyComplaint as jest.MockedFunction<typeof useClassifyComplaint>;
const mutate = jest.fn();

beforeEach(() => {
  useDraftComplaintStore.getState().reset();
  mockedNetwork.mockReturnValue({ isOnline: false, status: 'offline' } as ReturnType<
    typeof useNetworkStatus
  >);
  mockedClassify.mockReturnValue({ mutate } as unknown as ReturnType<typeof useClassifyComplaint>);
});

it('skips AI while offline, shows manual guidance state, and continues creation', () => {
  const onNext = jest.fn();
  const view = render(<StepDetails onNext={onNext} />);

  fireEvent.press(view.getByText('submit-details'));

  expect(mutate).not.toHaveBeenCalled();
  expect(onNext).toHaveBeenCalledTimes(1);
  expect(useDraftComplaintStore.getState().classification).toEqual(
    expect.objectContaining({ status: 'error', error: 'complaints.classificationOffline' }),
  );
});
