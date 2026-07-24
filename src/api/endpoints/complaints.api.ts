import { apiClient } from '@/api/client';
import { mockComplaints, mockCreateComplaint } from '@/api/__mocks__/complaints.mock';
import { ApiEnvelope, PaginatedEnvelope } from '@/api/types/api-envelope.types';
import { Complaint, CreateComplaintPayload } from '@/api/types/complaint.types';
import { Config } from '@/constants/config';

export interface GetComplaintsParams {
  sort?: 'newest' | 'oldest' | 'sla';
  status?: string;
}

export type ComplaintsEnvelope = PaginatedEnvelope<Complaint[] | { complaints: Complaint[] }>;
export type ComplaintEnvelope = ApiEnvelope<Complaint | { complaint: Complaint }>;

export function extractComplaints(data?: ComplaintsEnvelope) {
  if (!data) {
    return [];
  }

  return Array.isArray(data.data) ? data.data : data.data.complaints;
}

export function extractComplaint(data?: ComplaintEnvelope) {
  if (!data) {
    return undefined;
  }

  return 'complaint' in data.data ? data.data.complaint : data.data;
}

export async function getComplaints(params?: GetComplaintsParams) {
  if (__DEV__ && Config.USE_MOCKS) {
    return mockComplaints;
  }

  const response = await apiClient.get<ComplaintsEnvelope>('/complaints', {
    params: {
      sort: params?.sort,
      status: params?.status && params.status !== 'all' ? params.status : undefined,
    },
  });
  return response.data;
}

export async function getComplaint(id: string) {
  if (__DEV__ && Config.USE_MOCKS) {
    const complaint = extractComplaints(mockComplaints).find((item) => item.id === id);

    return {
      success: Boolean(complaint),
      data: complaint ?? extractComplaints(mockComplaints)[0],
    };
  }

  const response = await apiClient.get<ComplaintEnvelope>(`/complaints/${id}`);
  return response.data;
}

export async function createComplaint(
  payload: CreateComplaintPayload,
  attachmentUris: string[],
): Promise<ComplaintEnvelope> {
  if (__DEV__ && Config.USE_MOCKS) {
    return mockCreateComplaint(payload, attachmentUris);
  }

  const formData = new FormData();
  formData.append('client_ref', payload.client_ref);
  formData.append('department_id', payload.department_id);
  formData.append('category_id', payload.category_id);
  formData.append('title', payload.title);
  formData.append('description', payload.description);

  if (payload.location) {
    formData.append('location[lat]', String(payload.location.lat));
    formData.append('location[lng]', String(payload.location.lng));

    if (payload.location.address) {
      formData.append('location[address]', payload.location.address);
    }
  }

  attachmentUris.forEach((uri, index) => {
    formData.append('attachments[]', {
      uri,
      name: `photo-${index + 1}.jpg`,
      type: 'image/jpeg',
    } as unknown as Blob);
  });

  const response = await apiClient.post<ComplaintEnvelope>('/complaints', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });

  return response.data;
}
