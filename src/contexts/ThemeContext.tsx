import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type ThemeType = 'light' | 'dark' | 'system';

interface ThemeContextType {
  theme: 'light' | 'dark';
  themeMode: ThemeType;
  setThemeMode: (mode: ThemeType) => Promise<void>;
  isDark: boolean;
  colors: Record<string, string>;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const THEME_STORAGE_KEY = 'userThemePreference';

const lightColors = {
  accent: '#009199',
  accentDark: '#006B70',
  accentLight: '#E0F5F5',
  background: '#F8FAFC',
  surface: '#FFFFFF',
  surfaceMuted: '#F1F5F9',
  card: '#FFFFFF',
  border: '#E2E8F0',
  borderStrong: '#CBD5E1',
  primary: '#082248',
  primaryDark: '#041630',
  primaryLight: '#E0E8F3',
  primaryPressed: '#0B305E',
  primarySoft: '#F1F5FA',
  shadow: '#041630',
  success: '#10B981',
  successLight: '#ECFDF5',
  danger: '#EF4444',
  dangerLight: '#FEF2F2',
  warning: '#F59E0B',
  warningLight: '#FFFBEB',
  focus: '#009199',
  text: '#0F172A',
  textMuted: '#5E7084',
};

const darkColors = {
  accent: '#00C4BE',
  accentDark: '#009199',
  accentLight: '#0A3D3C',
  background: '#0F172A',
  surface: '#1E293B',
  surfaceMuted: '#334155',
  card: '#1E293B',
  border: '#334155',
  borderStrong: '#475569',
  primary: '#00C4BE',
  primaryDark: '#009199',
  primaryLight: '#0A3D3C',
  primaryPressed: '#00D9D3',
  primarySoft: '#0A3D3C',
  shadow: '#000000',
  success: '#34D399',
  successLight: '#064E3B',
  danger: '#F87171',
  dangerLight: '#7F1D1D',
  warning: '#FBBF24',
  warningLight: '#78350F',
  focus: '#00C4BE',
  text: '#F1F5F9',
  textMuted: '#94A3B8',
};

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const systemScheme = useColorScheme();
  const [themeMode, setThemeModeState] = useState<ThemeType>('system');
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    let isMounted = true;

    AsyncStorage.getItem(THEME_STORAGE_KEY)
      .then((saved) => {
        if (isMounted && (saved === 'light' || saved === 'dark' || saved === 'system')) {
          setThemeModeState(saved);
        }
      })
      .catch((error) => {
        console.error('Theme load error:', error);
      })
      .finally(() => {
        if (isMounted) {
          setIsLoaded(true);
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const setThemeMode = useCallback(async (mode: ThemeType) => {
    setThemeModeState(mode);
    try {
      await AsyncStorage.setItem(THEME_STORAGE_KEY, mode);
    } catch (error) {
      console.error('Theme save error:', error);
    }
  }, []);

  const isDark = themeMode === 'system' ? systemScheme === 'dark' : themeMode === 'dark';

  const colors = useMemo(() => (isDark ? darkColors : lightColors), [isDark]);

  const value = useMemo(
    () => ({
      theme: (isDark ? 'dark' : 'light') as 'light' | 'dark',
      themeMode,
      setThemeMode,
      isDark,
      colors,
    }),
    [isDark, themeMode, setThemeMode, colors],
  );

  if (!isLoaded) {
    return null;
  }

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
};

export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return context;
};
