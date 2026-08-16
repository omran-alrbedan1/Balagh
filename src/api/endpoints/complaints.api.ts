import { apiClient } from '@/api/client';
import { ApiEnvelope, PaginatedEnvelope } from '@/api/types/api-envelope.types';
import { Complaint, CreateComplaintPayload } from '@/api/types/complaint.types';
import { OfflineComplaintPayload, OfflineSubmission } from '@/api/types/offline.types';
import { normalizeComplaintId, requireComplaintId } from '@/features/complaints/utils/complaintId';

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
  if (!data) return [];

  const payload: unknown = data.data;
  const complaints = Array.isArray(payload)
    ? payload
    : isRecord(payload) && Array.isArray(payload.complaints)
      ? payload.complaints
      : [];
  const seenIds = new Set<string>();

  return complaints.flatMap((candidate) => {
    const complaint = normalizeComplaint(candidate);
    if (!complaint || seenIds.has(complaint.id)) return [];
    seenIds.add(complaint.id);
    return [complaint];
  });
}

export function extractComplaint(data?: ComplaintEnvelope) {
  if (!data || !isRecord(data.data)) {
    return undefined;
  }

  const candidate = 'complaint' in data.data ? data.data.complaint : data.data;
  return normalizeComplaint(candidate) ?? undefined;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function normalizeRelatedId(value: unknown) {
  return typeof value === 'number' || typeof value === 'string' ? String(value) : value;
}

function normalizeComplaint(candidate: unknown): Complaint | null {
  if (!isRecord(candidate)) return null;
  const id = normalizeComplaintId(candidate.id);
  if (
    !id ||
    typeof candidate.title !== 'string' ||
    typeof candidate.status !== 'string' ||
    typeof candidate.created_at !== 'string'
  ) {
    return null;
  }

  const complaint = candidate as unknown as Complaint;
  const request = complaint.active_information_request;

  return {
    ...complaint,
    id,
    client_ref:
      typeof complaint.client_ref === 'string'
        ? complaint.client_ref
        : typeof complaint.client_uuid === 'string'
          ? complaint.client_uuid
          : '',
    department_id: String(complaint.department_id ?? ''),
    category_id: String(complaint.category_id ?? ''),
    priority_id:
      complaint.priority_id == null ? complaint.priority_id : String(complaint.priority_id),
    department: complaint.department
      ? { ...complaint.department, id: String(complaint.department.id) }
      : complaint.department,
    category: complaint.category
      ? { ...complaint.category, id: String(complaint.category.id) }
      : complaint.category,
    priority: complaint.priority
      ? { ...complaint.priority, id: String(complaint.priority.id) }
      : complaint.priority,
    assigned_employee: complaint.assigned_employee
      ? { ...complaint.assigned_employee, id: String(complaint.assigned_employee.id) }
      : complaint.assigned_employee,
    active_information_request: request
      ? {
          ...request,
          id: String(request.id),
          requested_by: request.requested_by
            ? { ...request.requested_by, id: String(request.requested_by.id) }
            : request.requested_by,
        }
      : request,
    attachments: (Array.isArray(complaint.attachments) ? complaint.attachments : []).map(
      (attachment) => ({ ...attachment, id: String(attachment.id) }),
    ),
    timeline: (Array.isArray(complaint.timeline) ? complaint.timeline : []).map((entry) => ({
      ...entry,
      id: String(entry.id),
      changed_by: normalizeRelatedId(entry.changed_by) as string | undefined,
    })),
  };
}

function normalizeComplaintEnvelope(data: ComplaintEnvelope): ComplaintEnvelope {
  const complaint = extractComplaint(data);
  if (!complaint) {
    throw new Error('Complaint API returned an invalid complaint.');
  }

  return { ...data, data: complaint };
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
  const payload: unknown = response.data.data;
  const hasExpectedShape =
    Array.isArray(payload) || (isRecord(payload) && Array.isArray(payload.complaints));
  if (!hasExpectedShape) {
    throw new Error('Complaint API returned an invalid list.');
  }

  return { ...response.data, data: extractComplaints(response.data) };
}

export async function getComplaint(id: unknown) {
  const complaintId = requireComplaintId(id);
  const response = await apiClient.get<ComplaintEnvelope>(`/citizen/complaints/${complaintId}`);
  return normalizeComplaintEnvelope(response.data);
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

  return normalizeComplaintEnvelope(response.data);
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

  const normalizedComplaintId = requireComplaintId(complaintId);
  const response = await apiClient.post<ComplaintEnvelope>(
    `/citizen/complaints/${normalizedComplaintId}/attachments`,
    formData,
    {
      headers: { 'Content-Type': 'multipart/form-data' },
      skipNetworkRetry: true,
    },
  );

  return normalizeComplaintEnvelope(response.data);
}

export async function respondToInformationRequest(
  complaintId: string,
  message: string,
): Promise<ComplaintEnvelope> {
  const normalizedComplaintId = requireComplaintId(complaintId);
  const response = await apiClient.post<ComplaintEnvelope>(
    `/citizen/complaints/${normalizedComplaintId}/information-response`,
    { message },
    { skipNetworkRetry: true },
  );

  return normalizeComplaintEnvelope(response.data);
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

  const complaint = normalizeComplaint(response.data.data.complaint);
  if (!complaint) {
    throw new Error('Offline sync returned an invalid complaint.');
  }

  const submission = response.data.data.offline_submission;
  const syncedComplaint = submission.synced_complaint
    ? (normalizeComplaint(submission.synced_complaint) ?? undefined)
    : undefined;

  return {
    ...response.data,
    data: {
      complaint,
      offline_submission: {
        ...submission,
        id: String(submission.id),
        synced_complaint: syncedComplaint,
      },
    },
  };
}
