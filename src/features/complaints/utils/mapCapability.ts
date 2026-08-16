import Constants from 'expo-constants';

export function isMapSelectionEnabled(): boolean {
  return Constants.expoConfig?.extra?.mapsEnabled === true;
}
