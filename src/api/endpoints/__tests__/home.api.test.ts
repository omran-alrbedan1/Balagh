import { apiClient } from '@/api/client';
import { getHomeDashboard } from '@/api/endpoints/home.api';

jest.mock('@/api/client', () => ({ apiClient: { get: jest.fn() } }));

const client = apiClient as jest.Mocked<typeof apiClient>;

it('loads the authenticated citizen dashboard and normalizes resource IDs', async () => {
  client.get.mockResolvedValue({
    data: {
      success: true,
      data: {
        counts: { total: 3, active: 2, waiting_citizen: 1, completed: 1 },
        action_required: [
          { id: 7, title: 'Send photo', status: 'waiting_citizen', created_at: '2026-08-01' },
        ],
        recent_complaints: [
          { id: 8, title: 'Broken light', status: 'submitted', created_at: '2026-08-02' },
        ],
      },
    },
  } as never);

  const dashboard = await getHomeDashboard();

  expect(client.get).toHaveBeenCalledWith('/citizen/dashboard');
  expect(dashboard.data.counts).toEqual({ total: 3, active: 2, waiting_citizen: 1, completed: 1 });
  expect(dashboard.data.action_required[0].id).toBe('7');
  expect(dashboard.data.recent_complaints[0].id).toBe('8');
});
