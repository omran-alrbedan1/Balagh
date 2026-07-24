import { ConfigContext, ExpoConfig } from 'expo/config';

export default ({ config }: ConfigContext): ExpoConfig =>
  ({
    ...config,
    name: 'Balagh',
    slug: 'balagh',
    version: '1.0.0',
    runtimeVersion: {
      policy: 'appVersion',
    },
    orientation: 'portrait',
    icon: './assets/icon.png',
    userInterfaceStyle: 'light',
    splash: {
      image: './assets/splash-icon.png',
      resizeMode: 'contain',
      backgroundColor: '#f7fbff',
    },
    assetBundlePatterns: ['**/*'],
    ios: {
      supportsTablet: true,
      bundleIdentifier: 'com.balagh.app',
      infoPlist: {
        NSCameraUsageDescription: 'This app needs camera access to attach photos to complaints.',
        NSLocationWhenInUseUsageDescription: 'This app uses your location to tag complaints.',
        NSPhotoLibraryUsageDescription:
          'This app needs photo access to attach images to complaints.',
      },
    },
    android: {
      package: 'com.balagh.app',
      usesCleartextTraffic: true,
      permissions: ['CAMERA', 'ACCESS_FINE_LOCATION', 'POST_NOTIFICATIONS'],
      adaptiveIcon: {
        foregroundImage: './assets/android-icon-foreground.png',
        backgroundImage: './assets/android-icon-background.png',
        backgroundColor: '#E6F4FE',
      },
    },
    scheme: 'balagh',
    plugins: ['expo-router', 'expo-dev-client', 'expo-secure-store', '@sentry/react-native'],
  }) as ExpoConfig;
