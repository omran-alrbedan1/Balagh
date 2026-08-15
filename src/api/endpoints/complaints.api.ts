import { apiClient } from '@/api/client';
import { ApiEnvelope, PaginatedEnvelope } from '@/api/types/api-envelope.types';
import { Complaint, CreateComplaintPayload } from '@/api/types/complaint.types';
import { OfflineComplaintPayload } from '@/api/types/offline.types';

export interface GetComplaintsParams {
  sort?: 'newest' | 'oldest' | 'sla';
  status?: string;
}

export interface AttachmentUpload {
  uri: string;
  name?: string;
  mimeType?: string;
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

function toFormDataFile(attachment: AttachmentUpload, index: number) {
  return {
    uri: attachment.uri,
    name: attachment.name || `attachment-${index + 1}`,
    type: attachment.mimeType || 'application/octet-stream',
  } as unknown as Blob;
}

export async function getComplaints(params?: GetComplaintsParams) {
  const response = await apiClient.get<ComplaintsEnvelope>('/citizen/complaints', {
    params: {
      sort: params?.sort,
      status: params?.status && params.status !== 'all' ? params.status : undefined,
    },
  });
  return response.data;
}

export async function getComplaint(id: string) {
  const response = await apiClient.get<ComplaintEnvelope>(`/citizen/complaints/${id}`);
  return response.data;
}

export async function createComplaint(
  payload: CreateComplaintPayload,
  attachments: AttachmentUpload[],
): Promise<ComplaintEnvelope> {
  const formData = new FormData();
  formData.append('client_ref', payload.client_ref);
  formData.append('department_id', payload.department_id);
  formData.append('category_id', payload.category_id);
  formData.append('title', payload.title);
  formData.append('description', payload.description);
  formData.append('source', 'mobile');

  if (payload.priority_id) {
    formData.append('priority_id', payload.priority_id);
  }

  if (typeof payload.latitude === 'number') {
    formData.append('latitude', String(payload.latitude));
  }

  if (typeof payload.longitude === 'number') {
    formData.append('longitude', String(payload.longitude));
  }

  if (payload.address) {
    formData.append('address', payload.address);
  }

  attachments.forEach((attachment, index) => {
    formData.append('attachments[]', toFormDataFile(attachment, index));
  });

  const response = await apiClient.post<ComplaintEnvelope>('/citizen/complaints', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });

  return response.data;
}

export async function addAttachment(
  complaintId: string,
  attachmentUris: string[],
): Promise<ComplaintEnvelope> {
  const formData = new FormData();

  attachmentUris.forEach((uri, index) => {
    formData.append('attachments[]', {
      uri,
      name: `photo-${index + 1}.jpg`,
      type: 'image/jpeg',
    } as unknown as Blob);
  });

  const response = await apiClient.post<ComplaintEnvelope>(
    `/citizen/complaints/${complaintId}/attachments`,
    formData,
    {
      headers: { 'Content-Type': 'multipart/form-data' },
    },
  );

  return response.data;
}

export async function syncOfflineComplaint(
  payload: OfflineComplaintPayload,
  attachments: AttachmentUpload[] = [],
) {
  const formData = new FormData();
  formData.append('client_uuid', payload.client_uuid);
  formData.append('title', payload.title);
  formData.append('description', payload.description);
  formData.append('source', 'offline_sync');

  if (payload.created_offline_at) {
    formData.append('created_offline_at', payload.created_offline_at);
  }

  if (payload.client_ref) {
    formData.append('client_ref', payload.client_ref);
  }

  if (payload.department_id) {
    formData.append('department_id', payload.department_id);
  }

  if (payload.category_id) {
    formData.append('category_id', payload.category_id);
  }

  if (payload.priority_id) {
    formData.append('priority_id', payload.priority_id);
  }

  if (typeof payload.latitude === 'number') {
    formData.append('latitude', String(payload.latitude));
  }

  if (typeof payload.longitude === 'number') {
    formData.append('longitude', String(payload.longitude));
  }

  if (payload.address) {
    formData.append('address', payload.address);
  }

  attachments.forEach((attachment, index) => {
    formData.append('attachments[]', toFormDataFile(attachment, index));
  });

  const response = await apiClient.post<ComplaintEnvelope>(
    '/citizen/offline/complaints/sync',
    formData,
    {
      headers: { 'Content-Type': 'multipart/form-data' },
    },
  );

  return response.data;
}
