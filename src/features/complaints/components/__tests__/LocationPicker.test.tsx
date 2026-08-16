/* eslint-disable @typescript-eslint/no-require-imports */
import { act, fireEvent, render, waitFor } from '@testing-library/react-native';
import Constants from 'expo-constants';

import { useDraftComplaintStore } from '@/features/complaints/store/draftComplaintStore';

import { LocationPicker } from '../LocationPicker';

jest.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));
jest.mock('expo-constants', () => ({
  __esModule: true,
  default: { expoConfig: { extra: { mapsEnabled: false } } },
}));
jest.mock('expo-location', () => ({
  getCurrentPositionAsync: jest.fn(),
  requestForegroundPermissionsAsync: jest.fn(),
  reverseGeocodeAsync: jest.fn(),
}));
jest.mock('lucide-react-native', () => ({ MapPin: () => null }));
jest.mock('react-native-maps', () => ({
  __esModule: true,
  default: () => {
    const { View } = require('react-native');
    return <View testID="native-map-view" />;
  },
  Marker: () => null,
}));
jest.mock('@/components/ui/Input', () => ({
  Input: ({ label, onBlur, onChangeText, value }: any) => {
    const { TextInput } = require('react-native');
    return (
      <TextInput
        accessibilityLabel={label}
        onBlur={onBlur}
        onChangeText={onChangeText}
        value={value}
      />
    );
  },
}));

const locationModule = jest.requireMock('expo-location') as {
  getCurrentPositionAsync: jest.Mock;
  requestForegroundPermissionsAsync: jest.Mock;
  reverseGeocodeAsync: jest.Mock;
};

beforeEach(() => {
  jest.clearAllMocks();
  Constants.expoConfig = {
    extra: { mapsEnabled: false },
  } as unknown as typeof Constants.expoConfig;
  act(() => useDraftComplaintStore.getState().reset());
});

it('does not mount MapView and shows the localized fallback when maps are unavailable', () => {
  const view = render(<LocationPicker />);

  expect(view.queryByTestId('native-map-view')).toBeNull();
  expect(() => fireEvent.press(view.getByText('complaints.chooseOnMap'))).not.toThrow();
  expect(view.getByText('complaints.mapUnavailable')).toBeTruthy();
  expect(view.queryByTestId('native-map-view')).toBeNull();
});

it('keeps manual address entry usable when maps are unavailable', () => {
  const view = render(<LocationPicker />);
  fireEvent.press(view.getByText('complaints.chooseOnMap'));

  const address = view.getByLabelText('common.address');
  fireEvent.changeText(address, 'Damascus, Old City');
  fireEvent(address, 'blur');

  expect(useDraftComplaintStore.getState().location).toEqual({
    address: 'Damascus, Old City',
    lat: 0,
    lng: 0,
  });
});

it('keeps current-location selection available and falls back safely after permission denial', async () => {
  locationModule.requestForegroundPermissionsAsync.mockResolvedValue({ granted: false });
  const view = render(<LocationPicker />);

  expect(view.getByText('complaints.useCurrentLocation')).toBeTruthy();
  fireEvent.press(view.getByText('complaints.useCurrentLocation'));

  await waitFor(() => {
    expect(locationModule.getCurrentPositionAsync).not.toHaveBeenCalled();
    expect(view.getByLabelText('common.address')).toBeTruthy();
  });
});

it('renders the map selector only when the build capability is enabled', () => {
  Constants.expoConfig = { extra: { mapsEnabled: true } } as unknown as typeof Constants.expoConfig;
  const view = render(<LocationPicker />);

  fireEvent.press(view.getByText('complaints.chooseOnMap'));

  expect(view.getByTestId('native-map-view')).toBeTruthy();
});

it('stores usable coordinates and a fallback address when reverse geocoding fails', async () => {
  locationModule.requestForegroundPermissionsAsync.mockResolvedValue({ granted: true });
  locationModule.getCurrentPositionAsync.mockResolvedValue({
    coords: { latitude: 33.5, longitude: 36.3 },
  });
  locationModule.reverseGeocodeAsync.mockRejectedValue(new Error('unavailable'));
  const view = render(<LocationPicker />);

  fireEvent.press(view.getByText('complaints.useCurrentLocation'));

  await waitFor(() =>
    expect(useDraftComplaintStore.getState().location).toEqual({
      address: '33.50000, 36.30000',
      lat: 33.5,
      lng: 36.3,
    }),
  );
});
