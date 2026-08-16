import { apiClient } from '@/api/client';
import {
  addAttachment,
  addComplaintAttachments,
  ComplaintEnvelope,
  extractComplaint,
  extractComplaints,
  getComplaint,
  getComplaints,
  respondToInformationRequest,
  syncOfflineComplaint,
} from '@/api/endpoints/complaints.api';

jest.mock('@/api/client', () => ({
  apiClient: { get: jest.fn(), post: jest.fn() },
}));

const client = apiClient as jest.Mocked<typeof apiClient>;
const response = {
  data: {
    success: true,
    data: {
      id: 7,
      client_ref: 'ref-7',
      created_at: '2026-08-01T00:00:00Z',
      department_id: 2,
      category_id: 3,
      status: 'submitted',
      title: 'Complaint 7',
    },
  },
};
const NativeFormData = globalThis.FormData;

class InspectableFormData {
  _parts: [string, unknown][] = [];

  append(name: string, value: unknown) {
    this._parts.push([name, value]);
  }
}

beforeAll(() => {
  Object.defineProperty(globalThis, 'FormData', { configurable: true, value: InspectableFormData });
});

afterAll(() => {
  Object.defineProperty(globalThis, 'FormData', { configurable: true, value: NativeFormData });
});

beforeEach(() => {
  jest.clearAllMocks();
  client.post.mockResolvedValue(response);
});

const listComplaint = (id: unknown, overrides: Record<string, unknown> = {}) => ({
  id,
  client_ref: `ref-${String(id)}`,
  created_at: '2026-08-01T00:00:00Z',
  department_id: 2,
  category_id: 3,
  status: 'submitted',
  title: `Complaint ${String(id)}`,
  ...overrides,
});

it('normalizes numeric backend complaint IDs and deduplicates stable list keys', () => {
  const complaints = extractComplaints({
    success: true,
    data: [listComplaint(123), listComplaint(123), listComplaint(124)],
    meta: { total: 3, per_page: 15, current_page: 1, last_page: 1 },
  } as any);

  expect(complaints.map((complaint) => complaint.id)).toEqual(['123', '124']);
  expect(complaints[0]).toEqual(expect.objectContaining({ department_id: '2', category_id: '3' }));
});

it('normalizes complaint IDs before list data enters the query cache', async () => {
  client.get.mockResolvedValueOnce({
    data: {
      success: true,
      data: [listComplaint(123)],
      meta: { total: 1, per_page: 15, current_page: 1, last_page: 1 },
    },
  });

  const result = await getComplaints();

  expect(extractComplaints(result)[0].id).toBe('123');
});

it('quarantines malformed cached list records instead of throwing', () => {
  expect(() =>
    extractComplaints({ success: true, data: [null, { id: 'index' }, listComplaint(5)] } as any),
  ).not.toThrow();
  expect(
    extractComplaints({ success: true, data: [null, { id: 'index' }, listComplaint(5)] } as any),
  ).toHaveLength(1);
  expect(extractComplaints({ success: true, data: { stale: true } } as any)).toEqual([]);
});

it.each(['index', 'new', '', 'undefined', 'null', '[id]'])(
  'rejects invalid detail ID %s before an API request',
  async (id) => {
    await expect(getComplaint(id)).rejects.toThrow('Invalid complaint identifier');
    expect(client.get).not.toHaveBeenCalled();
  },
);

it('normalizes a successful offline sync response to the server complaint ID', async () => {
  client.post.mockResolvedValueOnce({
    data: {
      success: true,
      data: {
        complaint: listComplaint(123, { client_uuid: 'stable-client-uuid' }),
        offline_submission: {
          id: 9,
          client_uuid: 'stable-client-uuid',
          status: 'synced',
          created_at: '2026-08-01T00:00:00Z',
          synced_complaint: listComplaint(123, { client_uuid: 'stable-client-uuid' }),
        },
      },
    },
  });

  const result = await syncOfflineComplaint({
    client_uuid: 'stable-client-uuid',
    created_offline_at: '2026-08-01T00:00:00Z',
    title: 'Complaint 123',
    description: 'Description',
  });

  expect(result.data.complaint.id).toBe('123');
  expect(result.data.offline_submission.id).toBe('9');
  expect(result.data.offline_submission.synced_complaint?.id).toBe('123');
});

it('posts a trimmed-ready text message as JSON to information-response', async () => {
  await respondToInformationRequest('7', 'More detail');

  expect(client.post).toHaveBeenCalledWith(
    '/citizen/complaints/7/information-response',
    { message: 'More detail' },
    { skipNetworkRetry: true },
  );
});

it('uploads attachment objects with their real name and MIME type', async () => {
  await addComplaintAttachments('7', [
    {
      mimeType: 'application/pdf',
      name: 'evidence.pdf',
      uri: 'file://evidence.pdf',
    },
  ]);

  const [, body, config] = client.post.mock.calls[0];
  const parts = (body as FormData & { _parts: [string, Record<string, string>][] })._parts;
  expect(parts[0][0]).toBe('attachments[]');
  expect(parts[0][1]).toEqual(
    expect.objectContaining({
      name: 'evidence.pdf',
      type: 'application/pdf',
      uri: 'file://evidence.pdf',
    }),
  );
  expect(config).toEqual({
    headers: { 'Content-Type': 'multipart/form-data' },
    skipNetworkRetry: true,
  });
});

it('keeps the legacy URI-only attachment caller compatible', async () => {
  await addAttachment('7', ['file://legacy.jpg']);

  const body = client.post.mock.calls[0][1] as FormData & {
    _parts: [string, Record<string, string>][];
  };
  expect(body._parts[0][1]).toEqual(
    expect.objectContaining({
      name: 'photo-1.jpg',
      type: 'image/jpeg',
      uri: 'file://legacy.jpg',
    }),
  );
});

it('normalizes information-request IDs to mobile string conventions', () => {
  const complaint = extractComplaint({
    data: {
      active_information_request: {
        id: 91,
        message: 'More detail',
        requested_at: '2026-08-15T00:00:00Z',
        requested_by: { id: 12, name: 'Case Worker' },
        status: 'pending',
      },
      attachments: [],
      category_id: 'category-1',
      client_ref: 'ref-1',
      created_at: '2026-08-01T00:00:00Z',
      department_id: 'department-1',
      description: 'Description',
      id: 1,
      status: 'waiting_citizen',
      timeline: [],
      title: 'Complaint',
    },
    success: true,
  } as unknown as ComplaintEnvelope);

  expect(complaint?.active_information_request).toEqual(
    expect.objectContaining({
      id: '91',
      requested_by: { id: '12', name: 'Case Worker' },
    }),
  );
});
