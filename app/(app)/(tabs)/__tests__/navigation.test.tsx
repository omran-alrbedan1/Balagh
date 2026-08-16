/* eslint-disable @typescript-eslint/no-require-imports, react/display-name */
import { render } from '@testing-library/react-native';

import TabsLayout from '../_layout';

const screens: { name: string; options: Record<string, unknown> }[] = [];

jest.mock('expo-router', () => {
  const React = require('react');
  const { View } = require('react-native');
  const Tabs = ({ children }: { children: React.ReactNode }) => <View>{children}</View>;
  Tabs.Screen = ({ name, options }: { name: string; options: Record<string, unknown> }) => {
    screens.push({ name, options });
    return null;
  };
  return { Tabs };
});
jest.mock('react-i18next', () => ({ useTranslation: () => ({ t: (key: string) => key }) }));
jest.mock('expo-notifications', () => ({ setBadgeCountAsync: jest.fn() }));
jest.mock('react-native-safe-area-context', () => ({ useSafeAreaInsets: () => ({ bottom: 0 }) }));
jest.mock('lucide-react-native', () => ({
  FileText: () => null,
  Home: () => null,
  PlusCircle: () => null,
  UserRound: () => null,
}));
jest.mock('@/contexts/ThemeContext', () => ({
  useTheme: () => ({
    colors: { border: '#ddd', card: '#fff', primary: '#00f', textMuted: '#777', danger: '#f00' },
  }),
}));
jest.mock('@/features/notifications/hooks/useUnreadCount', () => ({
  useUnreadCount: () => ({ data: { data: { count: 3 } } }),
}));

beforeEach(() => {
  screens.splice(0, screens.length);
});

it('makes Profile the fourth visible tab and keeps Notifications programmatically routable but hidden', () => {
  render(<TabsLayout />);

  const visible = screens
    .filter((screen) => screen.options.href !== null)
    .map((screen) => screen.name);
  expect(visible).toEqual(['index', 'complaints/index', 'complaints/new', 'profile']);
  expect(screens.find((screen) => screen.name === 'complaints/index')?.options.href).toBe(
    '/(app)/(tabs)/complaints',
  );
  expect(screens.find((screen) => screen.name === 'complaints/[id]')?.options.href).toBeNull();
  expect(screens.find((screen) => screen.name === 'notifications')?.options.href).toBeNull();
  expect(screens.find((screen) => screen.name === 'profile')?.options.tabBarBadge).toBe('3');
});
