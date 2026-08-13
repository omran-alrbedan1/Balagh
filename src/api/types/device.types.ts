export interface DeviceTokenPayload {
  token: string;
  platform: 'ios' | 'android';
  device_name?: string;
}
