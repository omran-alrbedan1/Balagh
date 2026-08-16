import { OPEN_FREE_MAP_STYLE_URL } from '@/features/complaints/utils/mapCapability';

it('enables map selection without consulting a Google API key', () => {
  const previous = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY;
  delete process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY;

  expect(OPEN_FREE_MAP_STYLE_URL).toBe('https://tiles.openfreemap.org/styles/liberty');

  if (previous === undefined) {
    delete process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY;
  } else {
    process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY = previous;
  }
});
