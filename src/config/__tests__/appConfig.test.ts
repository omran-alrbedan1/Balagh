import type { ConfigContext } from 'expo/config';

import createConfig from '../../../app.config';

function buildConfig() {
  return createConfig({ config: {} } as ConfigContext);
}

it('configures keyless MapLibre and removes the Google Maps plugin contract', () => {
  const config = buildConfig();
  const plugins = config.plugins ?? [];

  expect(plugins).toContain('@maplibre/maplibre-react-native');
  expect(JSON.stringify(plugins)).not.toContain('react-native-maps');
  expect(JSON.stringify(config)).not.toContain('GOOGLE_MAPS_API_KEY');
  expect(config.extra).not.toEqual(expect.objectContaining({ mapsEnabled: expect.anything() }));
});

it('uses keyboard resize mode and a native fingerprint runtime for safe native updates', () => {
  const config = buildConfig();

  expect(config.android?.softwareKeyboardLayoutMode).toBe('resize');
  expect((config as unknown as { newArchEnabled?: boolean }).newArchEnabled).toBe(true);
  expect(config.runtimeVersion).toEqual({ policy: 'fingerprint' });
});
