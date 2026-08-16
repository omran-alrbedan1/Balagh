import { normalizeComplaintId, requireComplaintId } from '@/features/complaints/utils/complaintId';

it.each([
  [1, '1'],
  [57, '57'],
  ['001032', '1032'],
] as const)('normalizes valid complaint ID %s', (input, expected) => {
  expect(normalizeComplaintId(input)).toBe(expected);
});

it.each(['', 'index', 'new', 'undefined', 'null', '[id]', '0', '-1', 0, -1, 1.5])(
  'rejects invalid complaint ID %s',
  (input) => {
    expect(normalizeComplaintId(input)).toBeNull();
    expect(() => requireComplaintId(input)).toThrow('Invalid complaint identifier');
  },
);
