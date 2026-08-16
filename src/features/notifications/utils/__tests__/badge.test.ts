import { formatUnreadBadge } from '@/features/notifications/utils/badge';

describe('formatUnreadBadge', () => {
  it.each([
    [0, undefined],
    [1, '1'],
    [9, '9'],
    [10, '10'],
    [99, '99'],
    [100, '99+'],
    [214, '99+'],
  ])('formats %i as %s', (count, expected) => {
    expect(formatUnreadBadge(count)).toBe(expected);
  });
});
