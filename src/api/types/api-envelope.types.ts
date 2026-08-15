export interface ApiEnvelope<T> {
  success: boolean;
  message?: string;
  data: T;
}

export interface PaginationMeta {
  total: number;
  per_page: number;
  current_page: number;
  last_page: number;
  from?: number | null;
  to?: number | null;
}

export interface PaginatedEnvelope<T> extends ApiEnvelope<T> {
  meta: PaginationMeta;
}
