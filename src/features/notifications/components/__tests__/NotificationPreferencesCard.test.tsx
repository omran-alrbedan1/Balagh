import * as Notifications from 'expo-notifications';
import { fireEvent, render, waitFor } from '@testing-library/react-native';

import {
  useNotificationPreferences,
  useUpdateNotificationPreferences,
} from '@/features/notifications/hooks/useNotificationPreferences';

import { NotificationPreferencesCard } from '../NotificationPreferencesCard';

jest.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));
jest.mock('expo-notifications', () => ({ getPermissionsAsync: jest.fn() }));
jest.mock('@/features/notifications/hooks/useNotificationPreferences', () => ({
  useNotificationPreferences: jest.fn(),
  useUpdateNotificationPreferences: jest.fn(),
}));

const usePreferences = useNotificationPreferences as jest.MockedFunction<
  typeof useNotificationPreferences
>;
const useUpdate = useUpdateNotificationPreferences as jest.MockedFunction<
  typeof useUpdateNotificationPreferences
>;
const getPermissions = Notifications.getPermissionsAsync as jest.MockedFunction<
  typeof Notifications.getPermissionsAsync
>;
const mutate = jest.fn();
const preferences = {
  id: 1,
  database_enabled: true,
  email_enabled: true,
  push_enabled: true,
  sms_enabled: false,
  complaint_created: true,
  complaint_assigned: true,
  complaint_status_updated: true,
  sla_breached: true,
  complaint_resolved: true,
  complaint_closed: true,
  created_at: null,
  updated_at: null,
};

beforeEach(() => {
  jest.clearAllMocks();
  getPermissions.mockReturnValue(new Promise(() => {}));
  usePreferences.mockReturnValue({
    isLoading: false,
    error: null,
    data: { success: true, data: preferences },
    refetch: jest.fn(),
  } as unknown as ReturnType<typeof useNotificationPreferences>);
  useUpdate.mockReturnValue({
    isPending: false,
    error: null,
    mutate,
  } as unknown as ReturnType<typeof useUpdateNotificationPreferences>);
});

it('loads and displays backend notification preferences', () => {
  const view = render(<NotificationPreferencesCard />);
  expect(view.getByText('notificationPreferences.title')).toBeTruthy();
  expect(view.getByLabelText('notificationPreferences.fields.push_enabled')).toBeTruthy();
});

it('patches the changed preference only', () => {
  const view = render(<NotificationPreferencesCard />);
  fireEvent(view.getByLabelText('notificationPreferences.fields.sms_enabled'), 'valueChange', true);
  expect(mutate).toHaveBeenCalledWith({ sms_enabled: true });
});

it('renders a retry state when loading fails', () => {
  usePreferences.mockReturnValue({
    isLoading: false,
    error: new Error('failed'),
    refetch: jest.fn(),
  } as unknown as ReturnType<typeof useNotificationPreferences>);
  const view = render(<NotificationPreferencesCard />);
  expect(view.getByText('failed')).toBeTruthy();
  expect(view.getByText('common.tryAgain')).toBeTruthy();
});

it('separately explains denied OS push permission and offers settings', async () => {
  getPermissions.mockResolvedValue({
    granted: false,
    canAskAgain: false,
    expires: 'never',
    status: 'denied',
  } as Awaited<ReturnType<typeof Notifications.getPermissionsAsync>>);
  const view = render(<NotificationPreferencesCard />);
  await waitFor(() => expect(view.getByText('notificationPreferences.osDisabled')).toBeTruthy());
  expect(view.getByText('notificationPreferences.openSettings')).toBeTruthy();
});
