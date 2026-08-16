/* eslint-disable @typescript-eslint/no-require-imports */
import { fireEvent, render } from '@testing-library/react-native';

import { router } from 'expo-router';
import { useUnreadCount } from '@/features/notifications/hooks/useUnreadCount';

import ProfileScreen from '../profile';

jest.mock('expo-router', () => ({ router: { push: jest.fn() } }));
jest.mock('expo-constants', () => ({
  __esModule: true,
  default: { expoConfig: { version: '1.0.0' }, nativeAppVersion: '1.0.0' },
}));
jest.mock('expo-notifications', () => ({ setBadgeCountAsync: jest.fn() }));
jest.mock('react-i18next', () => ({ useTranslation: () => ({ t: (key: string) => key }) }));
jest.mock('@/lib/i18n', () => ({ __esModule: true, default: { language: 'en' } }));
jest.mock('lucide-react-native', () => ({
  Bell: () => null,
  ChevronRight: () => null,
  Globe2: () => null,
  LogOut: () => null,
  Mail: () => null,
  Phone: () => null,
  ShieldCheck: () => null,
}));
jest.mock('@/components/layout/Screen', () => ({
  Screen: ({ children }: any) => {
    const { View } = require('react-native');
    return <View>{children}</View>;
  },
}));
jest.mock('@/components/ui/Card', () => ({
  Card: ({ children }: any) => {
    const { View } = require('react-native');
    return <View>{children}</View>;
  },
}));
jest.mock('@/components/ui/Button', () => ({ Button: () => null }));
jest.mock('@/features/auth/store/authStore', () => ({
  useAuthStore: (
    selector: (state: {
      user: { email: string; name: string; phone: string; role: string };
    }) => unknown,
  ) =>
    selector({
      user: {
        email: 'amina@example.test',
        name: 'Amina',
        phone: '+963900000000',
        role: 'citizen',
      },
    }),
}));
jest.mock('@/features/auth/hooks/useLogout', () => ({
  useLogout: () => ({ isPending: false, mutate: jest.fn() }),
}));
jest.mock('@/features/auth/hooks/useLogoutAll', () => ({
  useLogoutAll: () => ({ isPending: false, mutate: jest.fn() }),
}));
jest.mock('@/features/settings/components/LanguageSwitcher', () => ({
  LanguageSwitcher: () => null,
}));
jest.mock('@/features/notifications/components/NotificationPreferencesCard', () => ({
  NotificationPreferencesCard: () => null,
}));
jest.mock('@/features/notifications/hooks/useUnreadCount');

beforeEach(() => {
  jest.clearAllMocks();
});

it('keeps the Notifications row navigable and displays the shared unread badge', () => {
  (useUnreadCount as jest.MockedFunction<typeof useUnreadCount>).mockReturnValue({
    data: { data: { count: 3 } },
  } as ReturnType<typeof useUnreadCount>);

  const view = render(<ProfileScreen />);
  fireEvent.press(view.getByText('profile.notifications'));

  expect(router.push).toHaveBeenCalledWith('/(app)/(tabs)/notifications');
  expect(view.getByText('3')).toBeTruthy();
});

it('hides the profile notification badge when there are no unread notifications', () => {
  (useUnreadCount as jest.MockedFunction<typeof useUnreadCount>).mockReturnValue({
    data: { data: { count: 0 } },
  } as ReturnType<typeof useUnreadCount>);

  const view = render(<ProfileScreen />);
  expect(view.queryByText('3')).toBeNull();
});

it('displays account identity from the authenticated user cache and the Expo app version', () => {
  (useUnreadCount as jest.MockedFunction<typeof useUnreadCount>).mockReturnValue({
    data: { data: { count: 0 } },
  } as ReturnType<typeof useUnreadCount>);

  const view = render(<ProfileScreen />);

  expect(view.getByText('Amina')).toBeTruthy();
  expect(view.getByText('amina@example.test')).toBeTruthy();
  expect(view.getByText('+963900000000')).toBeTruthy();
  expect(view.getByText('1.0.0')).toBeTruthy();
});
