export interface OfflineComplaintPayload {
  client_uuid: string;
  created_offline_at: string;
  complaint: {
    client_ref: string;
    department_id: string;
    category_id: string;
    title: string;
    description: string;
    priority_id?: string;
    location?: {
      lat: number;
      lng: number;
      address?: string;
    };
  };
}

export interface OfflineSubmission {
  id: string;
  client_uuid: string;
  status: 'queued' | 'syncing' | 'synced' | 'failed';
  complaint: {
    client_ref: string;
    title: string;
    department_id: string;
    category_id: string;
  };
  created_offline_at: string;
  synced_at?: string;
  error_message?: string;
  retry_count: number;
}
