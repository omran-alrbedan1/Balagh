import 'axios';

declare module 'axios' {
  export interface AxiosRequestConfig {
    skipNetworkRetry?: boolean;
  }
}
