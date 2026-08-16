import { getChangePasswordSchema } from '../validation';

jest.mock('@/lib/i18n', () => ({ __esModule: true, default: { t: (key: string) => key } }));

const valid = {
  current_password: 'current-password',
  password: 'new-password',
  password_confirmation: 'new-password',
};

it('requires a current password, an eight-character new password, and confirmation', () => {
  const schema = getChangePasswordSchema();

  expect(schema.safeParse({ ...valid, current_password: '' }).success).toBe(false);
  expect(
    schema.safeParse({ ...valid, password: 'short', password_confirmation: 'short' }).success,
  ).toBe(false);
  expect(schema.safeParse({ ...valid, password_confirmation: 'different-password' }).success).toBe(
    false,
  );
});

it('does not allow the new password to match the current password', () => {
  const schema = getChangePasswordSchema();

  expect(
    schema.safeParse({
      current_password: 'same-password',
      password: 'same-password',
      password_confirmation: 'same-password',
    }).success,
  ).toBe(false);
});
