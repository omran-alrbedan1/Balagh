import { Category, ComplaintStatus, Department, Priority } from '@/api/types/lookups.types';
import { AuthUser } from '@/api/types/auth.types';

export interface Attachment {
  id: string;
  file_path?: string;
  fileName?: string;
  fileSize?: number;
  file_name?: string;
  file_size?: number;
  full_url?: string;
  mime_type?: string;
  original_name?: string;
  original_url?: string;
  path?: string;
  disk?: string;
  uploaded_by?: string;
  uploaded?: boolean;
  url?: string;
  uri?: string;
  created_at?: string;
}

export interface ComplaintLocation {
  lat: number;
  lng: number;
  address?: string;
}

export interface ComplaintTimelineEntry {
  id: string;
  from_status?: ComplaintStatus;
  to_status?: ComplaintStatus;
  changed_by?: string;
  duration_minutes?: number;
  note?: string;
  created_at: string;
}

export interface ComplaintClassification {
  auto_assigned: boolean;
  confidence: number;
  method: string;
}

export interface ComplaintInformationRequest {
  id: string;
  message: string;
  status: 'pending' | 'responded';
  requested_at: string;
  responded_at?: string | null;
  response_message?: string | null;
  requested_by?: {
    id: string;
    name: string;
  } | null;
}

export interface Complaint {
  id: string;
  client_ref: string;
  complaint_number?: string;
  title: string;
  description: string;
  department_id: string;
  category_id: string;
  priority_id?: string;
  status: ComplaintStatus;
  assigned_employee?: AuthUser;
  category?: Category;
  department?: Department;
  latitude?: number;
  longitude?: number;
  address?: string;
  source?: string;
  client_uuid?: string;
  classification?: ComplaintClassification;
  active_information_request?: ComplaintInformationRequest | null;
  attachments: Attachment[];
  priority?: Priority;
  created_at: string;
  updated_at?: string;
  due_at?: string;
  is_sla_breached?: boolean;
  timeline: ComplaintTimelineEntry[];
}

export interface CreateComplaintPayload {
  client_ref: string;
  department_id: string;
  category_id: string;
  title: string;
  description: string;
  priority_id?: string;
  source?: 'mobile' | 'offline_sync';
  latitude?: number;
  longitude?: number;
  address?: string;
}
