import { APP_VERSION } from '@/constants/appInfo';

jest.mock('expo-constants', () => ({
  __esModule: true,
  default: { expoConfig: { version: '9.8.7' }, nativeAppVersion: '9.8.6' },
}));

it('derives the displayed version from the Expo application config', () => {
  expect(APP_VERSION).toBe('9.8.7');
});
