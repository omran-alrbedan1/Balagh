export interface DeviceTokenPayload {
  token: string;
  platform: 'ios' | 'android';
  device_name?: string;
  app_version?: string;
}

export interface DeviceToken {
  id: string | number;
  platform: 'ios' | 'android';
  device_name: string | null;
  app_version: string | null;
  last_used_at: string | null;
  is_active: boolean;
  created_at: string | null;
  updated_at: string | null;
}

export interface DeviceTokenListResponse {
  device_tokens: DeviceToken[];
}
