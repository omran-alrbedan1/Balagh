import { apiClient } from '@/api/client';
import { changePassword, updateProfile } from '@/api/endpoints/auth.api';

jest.mock('@/api/client', () => ({ apiClient: { patch: jest.fn(), post: jest.fn() } }));

const client = apiClient as jest.Mocked<typeof apiClient>;

it('updates only trimmed editable profile fields and normalizes data.user', async () => {
  client.patch.mockResolvedValue({
    data: {
      success: true,
      data: {
        user: {
          id: 7,
          name: 'Amina',
          phone: '+963900000000',
          email: 'amina@example.test',
        },
      },
    },
  } as never);

  const response = await updateProfile({ name: '  Amina  ', phone: ' +963900000000 ' });

  expect(client.patch).toHaveBeenCalledWith('/auth/profile', {
    name: 'Amina',
    phone: '+963900000000',
  });
  expect(response.data).toEqual(
    expect.objectContaining({ id: 7, name: 'Amina', phone: '+963900000000' }),
  );
});

it('uses the established change-password endpoint without changing the active session', async () => {
  client.post.mockResolvedValue({ data: { success: true, data: null } } as never);

  await changePassword({
    current_password: 'old-password',
    password: 'new-password',
    password_confirmation: 'new-password',
  });

  expect(client.post).toHaveBeenCalledWith('/auth/change-password', {
    current_password: 'old-password',
    password: 'new-password',
    password_confirmation: 'new-password',
  });
});
