import ar from '@/locales/ar.json';
import en from '@/locales/en.json';

function leafPaths(value: unknown, prefix = ''): string[] {
  if (typeof value === 'string') return [prefix];
  if (!value || typeof value !== 'object') return [];

  return Object.entries(value).flatMap(([key, child]) =>
    leafPaths(child, prefix ? `${prefix}.${key}` : key),
  );
}

describe('production translation coverage', () => {
  it('keeps Arabic and English leaf keys aligned', () => {
    expect(leafPaths(ar).sort()).toEqual(leafPaths(en).sort());
  });

  it.each([
    'navigation.notifications',
    'complaints.submitComplaint',
    'complaints.chooseOnMap',
    'notificationPreferences.openSettings',
    'status.in_progress',
    'errors.requiredField',
  ])('contains %s in both locales', (key) => {
    const read = (dictionary: Record<string, unknown>) =>
      key
        .split('.')
        .reduce<unknown>(
          (value, segment) =>
            value && typeof value === 'object'
              ? (value as Record<string, unknown>)[segment]
              : undefined,
          dictionary,
        );

    expect(read(en)).toEqual(expect.any(String));
    expect(read(ar)).toEqual(expect.any(String));
  });
});
