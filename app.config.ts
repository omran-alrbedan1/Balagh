import type { ConfigContext, ExpoConfig } from 'expo/config';

export default ({ config }: ConfigContext): ExpoConfig => {
  const apiBaseUrl = process.env.EXPO_PUBLIC_API_BASE_URL ?? '';
  const allowCleartext = apiBaseUrl.startsWith('http://');
  const googleMapsApiKey = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY?.trim();
  const mapsEnabled = Boolean(googleMapsApiKey);

  return {
    ...config,
    name: 'Balagh',
    slug: 'balagh',
    version: '1.0.0',
    runtimeVersion: {
      policy: 'appVersion',
    },
    orientation: 'portrait',
    icon: './assets/icon.png',
    userInterfaceStyle: 'automatic',
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
      googleServicesFile: './google-services.json',
      permissions: ['CAMERA', 'ACCESS_FINE_LOCATION', 'POST_NOTIFICATIONS'],
      adaptiveIcon: {
        foregroundImage: './assets/android-icon-foreground.png',
        backgroundImage: './assets/android-icon-background.png',
        monochromeImage: './assets/android-icon-monochrome.png',
        backgroundColor: '#082248',
      },
    },
    extra: {
      ...config.extra,
      mapsEnabled,
    },
    scheme: 'balagh',
    plugins: [
      'expo-router',
      'expo-dev-client',
      'expo-secure-store',
      [
        'expo-splash-screen',
        {
          image: './assets/splash-icon.png',
          resizeMode: 'contain',
          backgroundColor: '#082248',
        },
      ],
      [
        'expo-notifications',
        {
          icon: './assets/android-icon-monochrome.png',
          color: '#082248',
          defaultChannel: 'default',
        },
      ],
      ...(googleMapsApiKey
        ? [['react-native-maps', { androidGoogleMapsApiKey: googleMapsApiKey }]]
        : []),
      [
        'expo-build-properties',
        {
          android: { usesCleartextTraffic: allowCleartext },
        },
      ],
    ],
  } as ExpoConfig;
};
