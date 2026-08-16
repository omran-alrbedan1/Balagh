/* eslint-disable @typescript-eslint/no-require-imports */
import { act, fireEvent, render, waitFor } from '@testing-library/react-native';

import { useDraftComplaintStore } from '@/features/complaints/store/draftComplaintStore';

import { LocationPicker } from '../LocationPicker';

jest.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));
jest.mock('expo-location', () => ({
  getForegroundPermissionsAsync: jest.fn(),
  getCurrentPositionAsync: jest.fn(),
  getLastKnownPositionAsync: jest.fn(),
  requestForegroundPermissionsAsync: jest.fn(),
  reverseGeocodeAsync: jest.fn(),
}));
jest.mock('lucide-react-native', () => ({ MapPin: () => null }));
jest.mock('@maplibre/maplibre-react-native', () => ({
  Camera: 'MapLibreCamera',
  Map: 'MapLibreMap',
  Marker: 'MapLibreMarker',
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
  getForegroundPermissionsAsync: jest.Mock;
  getCurrentPositionAsync: jest.Mock;
  getLastKnownPositionAsync: jest.Mock;
  requestForegroundPermissionsAsync: jest.Mock;
  reverseGeocodeAsync: jest.Mock;
};

beforeEach(() => {
  jest.clearAllMocks();
  locationModule.getForegroundPermissionsAsync.mockResolvedValue({ granted: false });
  act(() => useDraftComplaintStore.getState().reset());
});

it('enables the OpenFreeMap selector without a Google Maps key', async () => {
  const view = render(<LocationPicker />);

  fireEvent.press(view.getByText('complaints.chooseOnMap'));

  await waitFor(() => expect(view.getByTestId('complaint-location-map')).toBeTruthy());
  expect(view.getByTestId('complaint-location-map').props.mapStyle).toBe(
    'https://tiles.openfreemap.org/styles/liberty',
  );
  expect(view.getByTestId('complaint-location-map').props.attribution).toBe(true);
});

it('keeps manual address entry usable', () => {
  const view = render(<LocationPicker />);
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

  fireEvent.press(view.getByText('complaints.useCurrentLocation'));

  await waitFor(() => {
    expect(locationModule.getCurrentPositionAsync).not.toHaveBeenCalled();
    expect(view.getByLabelText('common.address')).toBeTruthy();
  });
});

it('uses an existing complaint location as the initial camera and marker position', async () => {
  act(() =>
    useDraftComplaintStore.getState().setLocation({
      address: 'Existing location',
      lat: 34.25,
      lng: 36.75,
    }),
  );
  const view = render(<LocationPicker />);

  fireEvent.press(view.getByText('complaints.chooseOnMap'));

  await waitFor(() => expect(view.getByTestId('complaint-location-camera')).toBeTruthy());
  expect(view.getByTestId('complaint-location-camera').props.initialViewState).toEqual({
    center: [36.75, 34.25],
    zoom: 13,
  });
  expect(view.getByTestId('complaint-location-marker').props.lngLat).toEqual([36.75, 34.25]);
});

it('uses an already-authorized last-known device location without requesting permission', async () => {
  locationModule.getForegroundPermissionsAsync.mockResolvedValue({ granted: true });
  locationModule.getLastKnownPositionAsync.mockResolvedValue({
    coords: { latitude: 35.1, longitude: 37.2 },
  });
  const view = render(<LocationPicker />);

  fireEvent.press(view.getByText('complaints.chooseOnMap'));

  await waitFor(() =>
    expect(view.getByTestId('complaint-location-marker').props.lngLat).toEqual([37.2, 35.1]),
  );
  expect(locationModule.requestForegroundPermissionsAsync).not.toHaveBeenCalled();
});

it('moves the marker on map tap and confirms coordinates with a reverse-geocoded address', async () => {
  locationModule.reverseGeocodeAsync.mockResolvedValue([
    { street: 'Main Street', city: 'Damascus', region: 'Damascus' },
  ]);
  const view = render(<LocationPicker />);
  fireEvent.press(view.getByText('complaints.chooseOnMap'));

  await waitFor(() => expect(view.getByTestId('complaint-location-map')).toBeTruthy());

  fireEvent(view.getByTestId('complaint-location-map'), 'press', {
    nativeEvent: { lngLat: [36.31, 33.51] },
  });

  expect(view.getByTestId('complaint-location-marker').props.lngLat).toEqual([36.31, 33.51]);
  fireEvent.press(view.getByText('complaints.confirmMapLocation'));

  await waitFor(() =>
    expect(useDraftComplaintStore.getState().location).toEqual({
      address: 'Main Street, Damascus, Damascus',
      lat: 33.51,
      lng: 36.31,
    }),
  );
});

it('confirms map coordinates with a coordinate address when reverse geocoding fails', async () => {
  locationModule.reverseGeocodeAsync.mockRejectedValue(new Error('offline'));
  const view = render(<LocationPicker />);
  fireEvent.press(view.getByText('complaints.chooseOnMap'));
  await waitFor(() => expect(view.getByTestId('complaint-location-map')).toBeTruthy());
  fireEvent(view.getByTestId('complaint-location-map'), 'press', {
    nativeEvent: { lngLat: [36.3, 33.5] },
  });
  fireEvent.press(view.getByText('complaints.confirmMapLocation'));

  await waitFor(() =>
    expect(useDraftComplaintStore.getState().location).toEqual({
      address: '33.50000, 36.30000',
      lat: 33.5,
      lng: 36.3,
    }),
  );
});

it('turns a map load failure into a localized manual fallback instead of a blank map', async () => {
  const view = render(<LocationPicker />);
  fireEvent.press(view.getByText('complaints.chooseOnMap'));

  await waitFor(() => expect(view.getByTestId('complaint-location-map')).toBeTruthy());
  fireEvent(view.getByTestId('complaint-location-map'), 'didFailLoadingMap', {
    nativeEvent: null,
  });

  expect(view.queryByTestId('complaint-location-map')).toBeNull();
  expect(view.getByText('complaints.mapUnavailable')).toBeTruthy();
  expect(view.getByLabelText('common.address')).toBeTruthy();
});

it('stores usable current coordinates and a fallback address when reverse geocoding fails', async () => {
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
