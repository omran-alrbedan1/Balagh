import { ApiEnvelope, PaginatedEnvelope } from '@/api/types/api-envelope.types';
import { Complaint, CreateComplaintPayload } from '@/api/types/complaint.types';

function randomId() {
  return Math.random().toString(36).slice(2, 10);
}

export const mockComplaints: PaginatedEnvelope<Complaint[]> = {
  success: true,
  data: [
    {
      id: 'cmp-1001',
      client_ref: 'draft-sample-1001',
      title: 'Broken streetlight near City Hall',
      description:
        'The streetlight on the corner has been off for several nights and the walkway is dark.',
      department_id: 'roads',
      category_id: 'street-lighting',
      priority_id: 'medium',
      priority: {
        id: 'medium',
        code: 'medium',
        color: '#F59E0B',
        level: 2,
        name: 'Medium',
      },
      status: 'in_progress',
      attachments: [],
      created_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
      sla_due_at: new Date(Date.now() + 18 * 60 * 60 * 1000).toISOString(),
      timeline: [
        {
          id: 'tl-1001-1',
          status: 'submitted',
          created_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
        },
        {
          id: 'tl-1001-2',
          status: 'in_review',
          created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
          note: 'Complaint reviewed and routed to roads team.',
        },
        {
          id: 'tl-1001-3',
          status: 'in_progress',
          created_at: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString(),
        },
      ],
    },
    {
      id: 'cmp-1002',
      client_ref: 'draft-sample-1002',
      title: 'Overflowing public waste bin',
      description: 'The waste bin beside the park entrance is overflowing and needs collection.',
      department_id: 'waste',
      category_id: 'collection',
      priority_id: 'low',
      priority: {
        id: 'low',
        code: 'low',
        color: '#60A5FA',
        level: 1,
        name: 'Low',
      },
      status: 'resolved',
      attachments: [],
      created_at: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString(),
      updated_at: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString(),
      timeline: [
        {
          id: 'tl-1002-1',
          status: 'submitted',
          created_at: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString(),
        },
        {
          id: 'tl-1002-2',
          status: 'resolved',
          created_at: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString(),
          note: 'Collection completed.',
        },
      ],
    },
  ],
  meta: {
    current_page: 1,
    last_page: 1,
    per_page: 20,
    total: 2,
  },
};

export async function mockCreateComplaint(
  payload: CreateComplaintPayload,
  attachmentUris: string[],
): Promise<ApiEnvelope<Complaint>> {
  await new Promise((resolve) => setTimeout(resolve, 900));

  const now = new Date().toISOString();
  const complaint: Complaint = {
    id: randomId(),
    client_ref: payload.client_ref,
    title: payload.title,
    description: payload.description,
    department_id: payload.department_id,
    category_id: payload.category_id,
    status: 'submitted',
    location: payload.location,
    attachments: attachmentUris.map((uri, index) => ({
      id: `${payload.client_ref}-${index}`,
      uri,
      type: 'image',
      fileName: `photo-${index + 1}.jpg`,
      fileSize: 0,
      uploaded: true,
    })),
    created_at: now,
    timeline: [{ id: randomId(), status: 'submitted', created_at: now }],
  };

  mockComplaints.data.unshift(complaint);
  mockComplaints.meta.total += 1;

  return {
    success: true,
    message: 'Complaint submitted successfully.',
    data: complaint,
  };
}
