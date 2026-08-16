import { apiClient } from '@/api/client';
import { ApiEnvelope, PaginatedEnvelope } from '@/api/types/api-envelope.types';
import { Complaint, CreateComplaintPayload } from '@/api/types/complaint.types';
import { OfflineComplaintPayload, OfflineSubmission } from '@/api/types/offline.types';

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
export interface OfflineSyncEnvelope extends ApiEnvelope<{
  complaint: Complaint;
  offline_submission: OfflineSubmission;
}> {
  meta?: { idempotent?: boolean };
}

export function extractComplaints(data?: ComplaintsEnvelope) {
  if (!data) {
    return [];
  }

  const complaints = Array.isArray(data.data) ? data.data : data.data.complaints;
  return complaints.map(normalizeComplaintIds);
}

export function extractComplaint(data?: ComplaintEnvelope) {
  if (!data) {
    return undefined;
  }

  return normalizeComplaintIds('complaint' in data.data ? data.data.complaint : data.data);
}

function normalizeComplaintIds(complaint: Complaint): Complaint {
  const request = complaint.active_information_request;
  if (!request) return complaint;

  return {
    ...complaint,
    active_information_request: {
      ...request,
      id: String(request.id),
      requested_by: request.requested_by
        ? { ...request.requested_by, id: String(request.requested_by.id) }
        : request.requested_by,
    },
  };
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
  attachments: (AttachmentUpload | string)[],
): Promise<ComplaintEnvelope> {
  return addComplaintAttachments(
    complaintId,
    attachments.map((attachment, index) =>
      typeof attachment === 'string'
        ? {
            uri: attachment,
            name: `photo-${index + 1}.jpg`,
            mimeType: 'image/jpeg',
          }
        : attachment,
    ),
  );
}

export async function addComplaintAttachments(
  complaintId: string,
  attachments: AttachmentUpload[],
): Promise<ComplaintEnvelope> {
  const formData = new FormData();

  attachments.forEach((attachment, index) => {
    formData.append('attachments[]', toFormDataFile(attachment, index));
  });

  const response = await apiClient.post<ComplaintEnvelope>(
    `/citizen/complaints/${complaintId}/attachments`,
    formData,
    {
      headers: { 'Content-Type': 'multipart/form-data' },
      skipNetworkRetry: true,
    },
  );

  return response.data;
}

export async function respondToInformationRequest(
  complaintId: string,
  message: string,
): Promise<ComplaintEnvelope> {
  const response = await apiClient.post<ComplaintEnvelope>(
    `/citizen/complaints/${complaintId}/information-response`,
    { message },
    { skipNetworkRetry: true },
  );

  return response.data;
}

export async function syncOfflineComplaint(
  payload: OfflineComplaintPayload,
  attachments: AttachmentUpload[] = [],
): Promise<OfflineSyncEnvelope> {
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

  const response = await apiClient.post<OfflineSyncEnvelope>(
    '/citizen/offline/complaints/sync',
    formData,
    {
      headers: { 'Content-Type': 'multipart/form-data' },
    },
  );

  return response.data;
}
