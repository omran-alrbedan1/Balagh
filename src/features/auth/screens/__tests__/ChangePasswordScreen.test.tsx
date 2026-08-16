import { fireEvent, render, waitFor } from '@testing-library/react-native';

import { router } from 'expo-router';
import { useChangePassword } from '@/features/auth/hooks/useChangePassword';

import { ChangePasswordScreen } from '../ChangePasswordScreen';

jest.mock('expo-router', () => ({ router: { back: jest.fn() } }));
jest.mock('react-i18next', () => ({ useTranslation: () => ({ t: (key: string) => key }) }));
jest.mock('@/lib/i18n', () => ({ __esModule: true, default: { t: (key: string) => key } }));
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
  Eye: () => null,
  EyeOff: () => null,
  LockKeyhole: () => null,
}));
jest.mock('@/components/layout/KeyboardAwareFormScrollView', () => ({
  KeyboardAwareFormScrollView: ({ children }: any) => children,
}));
jest.mock('@/features/auth/hooks/useChangePassword', () => ({ useChangePassword: jest.fn() }));

const mutation = useChangePassword as jest.MockedFunction<typeof useChangePassword>;
const mutate = jest.fn();

beforeEach(() => {
  jest.clearAllMocks();
  mutation.mockReturnValue({
    error: null,
    isPending: false,
    mutate,
  } as unknown as ReturnType<typeof useChangePassword>);
});

function fillValidForm(view: ReturnType<typeof render>) {
  fireEvent.changeText(view.getByLabelText('auth.currentPassword'), 'current-password');
  fireEvent.changeText(view.getByLabelText('common.newPassword'), 'new-password');
  fireEvent.changeText(view.getByLabelText('auth.confirmNewPassword'), 'new-password');
}

it('shows all three accessible password fields and blocks invalid client submissions', async () => {
  const view = render(<ChangePasswordScreen />);

  expect(view.getByLabelText('auth.currentPassword')).toBeTruthy();
  expect(view.getByLabelText('common.newPassword')).toBeTruthy();
  expect(view.getByLabelText('auth.confirmNewPassword')).toBeTruthy();
  fireEvent.press(view.getByRole('button', { name: 'auth.changePassword' }));

  await waitFor(() => expect(mutate).not.toHaveBeenCalled());
});

it('maps a backend current-password error without clearing typed values', async () => {
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
      new ApiError('Current password is incorrect.', 422, {
        current_password: ['Current password is incorrect.'],
      }),
    ),
  );
  const view = render(<ChangePasswordScreen />);
  fillValidForm(view);
  fireEvent.press(view.getByRole('button', { name: 'auth.changePassword' }));

  await waitFor(() => expect(view.getByText('Current password is incorrect.')).toBeTruthy());
  expect(view.getByDisplayValue('current-password')).toBeTruthy();
});

it('clears the form and returns to Profile after success without touching authentication state', async () => {
  mutate.mockImplementation((_payload, options) => options?.onSuccess?.());
  const view = render(<ChangePasswordScreen />);
  fillValidForm(view);
  fireEvent.press(view.getByRole('button', { name: 'auth.changePassword' }));

  await waitFor(() => expect(router.back).toHaveBeenCalledTimes(1));
  expect(view.getByLabelText('auth.currentPassword').props.value).toBe('');
  expect(view.getByLabelText('common.newPassword').props.value).toBe('');
  expect(view.getByLabelText('auth.confirmNewPassword').props.value).toBe('');
});

it('prevents duplicate submission while the password mutation is pending', () => {
  mutation.mockReturnValue({
    error: null,
    isPending: true,
    mutate,
  } as unknown as ReturnType<typeof useChangePassword>);
  const view = render(<ChangePasswordScreen />);

  expect(
    view.getByRole('button', { name: 'auth.changingPassword' }).props.accessibilityState.disabled,
  ).toBe(true);
});
