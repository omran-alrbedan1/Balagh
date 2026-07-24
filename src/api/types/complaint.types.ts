import { Category, ComplaintStatus, Department, Priority } from '@/api/types/lookups.types';
import { AuthUser } from '@/api/types/auth.types';

export interface Attachment {
  id: string;
  fileName?: string;
  fileSize?: number;
  file_name?: string;
  file_size?: number;
  mime_type?: string;
  type: 'image';
  uploaded: boolean;
  url?: string;
  uri: string;
}

export interface ComplaintLocation {
  lat: number;
  lng: number;
  address?: string;
}

export interface ComplaintTimelineEntry {
  id: string;
  status: ComplaintStatus;
  from_status?: ComplaintStatus;
  to_status?: ComplaintStatus;
  changed_by?: string;
  changed_by_user?: AuthUser;
  duration_hours?: number;
  note?: string;
  created_at: string;
}

export interface Complaint {
  id: string;
  client_ref: string;
  title: string;
  description: string;
  department_id: string;
  category_id: string;
  priority_id?: string;
  status: ComplaintStatus;
  assigned_employee?: AuthUser;
  category?: Category;
  department?: Department;
  location?: ComplaintLocation;
  attachments: Attachment[];
  priority?: Priority;
  created_at: string;
  updated_at?: string;
  sla_due_at?: string;
  sla_status?: 'on_track' | 'due_soon' | 'breached';
  timeline: ComplaintTimelineEntry[];
}

export interface CreateComplaintPayload {
  client_ref: string;
  department_id: string;
  category_id: string;
  title: string;
  description: string;
  location?: ComplaintLocation;
}
