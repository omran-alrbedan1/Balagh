export interface OfflineComplaintPayload {
  client_uuid: string;
  created_offline_at: string;
  client_ref?: string;
  department_id?: string;
  category_id?: string;
  title: string;
  description: string;
  priority_id?: string;
  latitude?: number;
  longitude?: number;
  address?: string;
  source?: 'offline_sync';
}

export interface OfflineSubmission {
  id: string;
  client_uuid: string;
  status: 'pending' | 'synced' | 'failed';
  submitted_offline_at?: string;
  synced_at?: string;
  error_message?: string;
  synced_complaint?: {
    id: string;
    complaint_number?: string;
    title: string;
    status: string;
  };
  created_at: string;
  updated_at?: string;
}
