import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Updates from 'expo-updates';
import { I18nManager } from 'react-native';

import { useLanguageStore } from '@/features/settings/store/languageStore';
import {
  applyLanguage,
  getStoredLanguage,
  LANGUAGE_STORAGE_KEY,
} from '@/features/settings/utils/languagePreference';
import i18next from '@/lib/i18n';

jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(),
  removeItem: jest.fn(),
  setItem: jest.fn(),
}));
jest.mock('expo-updates', () => ({ reloadAsync: jest.fn() }));
jest.mock('@/lib/i18n', () => ({
  __esModule: true,
  default: { changeLanguage: jest.fn(), language: 'en' },
}));

const getItem = AsyncStorage.getItem as jest.MockedFunction<typeof AsyncStorage.getItem>;
const setItem = AsyncStorage.setItem as jest.MockedFunction<typeof AsyncStorage.setItem>;
const removeItem = AsyncStorage.removeItem as jest.MockedFunction<typeof AsyncStorage.removeItem>;
const changeLanguage = i18next.changeLanguage as jest.MockedFunction<typeof i18next.changeLanguage>;
const reload = Updates.reloadAsync as jest.MockedFunction<typeof Updates.reloadAsync>;
const originalIsRTL = I18nManager.isRTL;

beforeEach(() => {
  jest.clearAllMocks();
  Object.defineProperty(I18nManager, 'isRTL', { configurable: true, value: false });
  jest.spyOn(I18nManager, 'allowRTL').mockImplementation(jest.fn());
  jest.spyOn(I18nManager, 'forceRTL').mockImplementation(jest.fn());
  setItem.mockResolvedValue();
  removeItem.mockResolvedValue();
  getItem.mockResolvedValue(null);
  changeLanguage.mockResolvedValue(undefined as never);
  reload.mockResolvedValue(undefined);
  useLanguageStore.setState({ isHydrated: false, language: null });
});

afterAll(() => {
  jest.restoreAllMocks();
  Object.defineProperty(I18nManager, 'isRTL', { configurable: true, value: originalIsRTL });
});

it('persists Arabic, updates i18next, applies RTL and requests a native reload', async () => {
  expect(await applyLanguage('ar')).toBe(false);

  expect(setItem).toHaveBeenCalledWith(LANGUAGE_STORAGE_KEY, 'ar');
  expect(changeLanguage).toHaveBeenCalledWith('ar');
  expect(I18nManager.allowRTL).toHaveBeenCalledWith(true);
  expect(I18nManager.forceRTL).toHaveBeenCalledWith(true);
  expect(reload).toHaveBeenCalledTimes(1);
});

it('applies English immediately without reloading when layout is already LTR', async () => {
  expect(await applyLanguage('en')).toBe(false);

  expect(setItem).toHaveBeenCalledWith(LANGUAGE_STORAGE_KEY, 'en');
  expect(changeLanguage).toHaveBeenCalledWith('en');
  expect(I18nManager.forceRTL).not.toHaveBeenCalled();
  expect(reload).not.toHaveBeenCalled();
});

it('reports when a native direction reload is unavailable instead of claiming RTL is complete', async () => {
  reload.mockRejectedValue(new Error('reload unavailable'));

  expect(await applyLanguage('ar')).toBe(true);
});

it('rolls back persistence when i18next cannot apply the selection', async () => {
  changeLanguage.mockRejectedValue(new Error('i18next failed'));

  await expect(applyLanguage('ar')).rejects.toThrow('i18next failed');

  expect(removeItem).toHaveBeenCalledWith(LANGUAGE_STORAGE_KEY);
});

it('hydrates the persisted language before app content is shown', async () => {
  getItem.mockResolvedValue('ar');

  await useLanguageStore.getState().hydrate();

  expect(getStoredLanguage).toBeDefined();
  expect(changeLanguage).toHaveBeenCalledWith('ar');
  expect(useLanguageStore.getState()).toEqual(
    expect.objectContaining({ isHydrated: true, language: 'ar' }),
  );
});

it('ignores an unsupported persisted language', async () => {
  getItem.mockResolvedValue('fr');

  expect(await getStoredLanguage()).toBeNull();
});
