import { removeServerDuplicatesOfLocalComplaints } from '@/features/complaints/utils/offlineComplaintDisplay';

const serverComplaint = {
  id: 'server-1',
  client_ref: 'stable-ref',
  client_uuid: 'stable-ref',
  title: 'Complaint',
  description: 'Description',
  department_id: 'department-1',
  category_id: 'category-1',
  status: 'submitted' as const,
  attachments: [],
  timeline: [],
  created_at: '2026-01-01T00:00:00.000Z',
};
const localItem = {
  id: 'local-1',
  client_uuid: 'stable-ref',
  payload: {
    client_ref: 'stable-ref',
    department_id: 'department-1',
    category_id: 'category-1',
    title: 'Complaint',
    description: 'Description',
  },
  attachments: [],
  status: 'queued' as const,
  retryCount: 0,
  createdAt: '2026-01-01T00:00:00.000Z',
};

it('avoids a duplicate server card while the local representation is pending', () => {
  expect(removeServerDuplicatesOfLocalComplaints([serverComplaint], [localItem])).toEqual([]);
});

it('shows the server complaint after successful sync removes the local representation', () => {
  expect(removeServerDuplicatesOfLocalComplaints([serverComplaint], [])).toEqual([serverComplaint]);
});
