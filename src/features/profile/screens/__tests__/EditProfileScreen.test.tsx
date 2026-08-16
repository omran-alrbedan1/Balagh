import { fireEvent, render, waitFor } from '@testing-library/react-native';

import { router } from 'expo-router';
import { useUpdateProfile } from '@/features/profile/hooks/useUpdateProfile';
import { useNetworkStatus } from '@/hooks/useNetworkStatus';

import { EditProfileScreen } from '../EditProfileScreen';

jest.mock('expo-router', () => ({ router: { back: jest.fn() } }));
jest.mock('react-i18next', () => ({ useTranslation: () => ({ t: (key: string) => key }) }));
jest.mock('@/lib/i18n', () => ({
  __esModule: true,
  default: { language: 'en', t: (key: string) => key },
}));
jest.mock('@/api/client', () => ({
  ApiError: class MockApiError extends Error {
    fieldErrors?: Record<string, string[]>;

    constructor(message: string, mockStatus?: number, mockFieldErrors?: Record<string, string[]>) {
      super(message);
      void mockStatus;
      this.fieldErrors = mockFieldErrors;
    }
  },
}));
jest.mock('lucide-react-native', () => ({
  ArrowLeft: () => null,
  IdCard: () => null,
  Mail: () => null,
  Phone: () => null,
  UserRound: () => null,
}));
jest.mock('@/components/layout/KeyboardAwareFormScrollView', () => ({
  KeyboardAwareFormScrollView: ({ children }: any) => children,
}));
jest.mock('@/features/auth/store/authStore', () => ({
  useAuthStore: (selector: (state: unknown) => unknown) =>
    selector({
      user: {
        email: 'amina@example.test',
        name: 'Amina',
        national_id: 'N-12345',
        phone: '+963900000000',
      },
    }),
}));
jest.mock('@/features/profile/hooks/useUpdateProfile', () => ({ useUpdateProfile: jest.fn() }));
jest.mock('@/hooks/useNetworkStatus', () => ({ useNetworkStatus: jest.fn() }));

const mutation = useUpdateProfile as jest.MockedFunction<typeof useUpdateProfile>;
const network = useNetworkStatus as jest.MockedFunction<typeof useNetworkStatus>;
const mutate = jest.fn();

beforeEach(() => {
  jest.clearAllMocks();
  network.mockReturnValue({ isOffline: false } as ReturnType<typeof useNetworkStatus>);
  mutation.mockReturnValue({
    error: null,
    isPending: false,
    mutate,
  } as unknown as ReturnType<typeof useUpdateProfile>);
});

it('initializes editable fields from the authenticated user and distinguishes read-only identity fields', () => {
  const view = render(<EditProfileScreen />);

  expect(view.getByDisplayValue('Amina')).toBeTruthy();
  expect(view.getByDisplayValue('+963900000000')).toBeTruthy();
  expect(view.getByLabelText('profile.emailReadOnly').props.editable).toBe(false);
  expect(view.getByLabelText('profile.nationalIdReadOnly').props.editable).toBe(false);
  expect(view.getByDisplayValue('amina@example.test')).toBeTruthy();
  expect(view.getByDisplayValue('N-12345')).toBeTruthy();
});

it('submits only editable values and returns to Profile after server success', async () => {
  mutate.mockImplementation((_payload, options) => options?.onSuccess?.());
  const view = render(<EditProfileScreen />);

  fireEvent.changeText(view.getByLabelText('common.fullName'), 'Updated Amina');
  fireEvent.changeText(view.getByLabelText('common.phone'), '+963900000001');
  fireEvent.press(view.getByText('common.save'));

  await waitFor(() =>
    expect(mutate).toHaveBeenCalledWith(
      { name: 'Updated Amina', phone: '+963900000001' },
      expect.any(Object),
    ),
  );
  expect(router.back).toHaveBeenCalledTimes(1);
});

it('keeps typed values and maps a backend validation error', async () => {
  const ApiError = (
    jest.requireMock('@/api/client') as {
      ApiError: new (
        message: string,
        status?: number,
        fieldErrors?: Record<string, string[]>,
      ) => Error;
    }
  ).ApiError;
  mutate.mockImplementation((_payload, options) =>
    options?.onError?.(
      new ApiError('Validation failed.', 422, { phone: ['Phone is already in use.'] }),
    ),
  );
  const view = render(<EditProfileScreen />);

  fireEvent.changeText(view.getByLabelText('common.phone'), '+963900000001');
  fireEvent.press(view.getByText('common.save'));

  await waitFor(() => expect(view.getByText('Phone is already in use.')).toBeTruthy());
  expect(view.getByDisplayValue('+963900000001')).toBeTruthy();
});

it('blocks save while a submission is pending or the device is offline', () => {
  mutation.mockReturnValue({
    error: null,
    isPending: true,
    mutate,
  } as unknown as ReturnType<typeof useUpdateProfile>);
  const pendingView = render(<EditProfileScreen />);
  expect(
    pendingView.getByRole('button', { name: 'profile.saving' }).props.accessibilityState.disabled,
  ).toBe(true);

  network.mockReturnValue({ isOffline: true } as ReturnType<typeof useNetworkStatus>);
  mutation.mockReturnValue({
    error: null,
    isPending: false,
    mutate,
  } as unknown as ReturnType<typeof useUpdateProfile>);
  const offlineView = render(<EditProfileScreen />);
  expect(offlineView.getByText('profile.offlineSave')).toBeTruthy();
  expect(
    offlineView.getByRole('button', { name: 'common.save' }).props.accessibilityState.disabled,
  ).toBe(true);
});
