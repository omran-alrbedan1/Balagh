import { apiClient } from '@/api/client';
import {
  addAttachment,
  addComplaintAttachments,
  ComplaintEnvelope,
  extractComplaint,
  respondToInformationRequest,
} from '@/api/endpoints/complaints.api';

jest.mock('@/api/client', () => ({
  apiClient: { post: jest.fn() },
}));

const client = apiClient as jest.Mocked<typeof apiClient>;
const response = { data: { success: true, data: {} } };
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

it('posts a trimmed-ready text message as JSON to information-response', async () => {
  await respondToInformationRequest('complaint-7', 'More detail');

  expect(client.post).toHaveBeenCalledWith(
    '/citizen/complaints/complaint-7/information-response',
    { message: 'More detail' },
    { skipNetworkRetry: true },
  );
});

it('uploads attachment objects with their real name and MIME type', async () => {
  await addComplaintAttachments('complaint-7', [
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
  await addAttachment('complaint-7', ['file://legacy.jpg']);

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
      id: 'complaint-1',
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
