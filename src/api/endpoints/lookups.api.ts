import { apiClient } from '@/api/client';
import { ApiEnvelope } from '@/api/types/api-envelope.types';
import {
  CategoriesResponseData,
  ComplaintStatusesResponseData,
  DepartmentsResponseData,
  PrioritiesResponseData,
} from '@/api/types/lookups.types';

export async function getDepartments() {
  const response =
    await apiClient.get<ApiEnvelope<DepartmentsResponseData>>('/lookups/departments');
  return response.data;
}

export async function getCategories(departmentId?: string) {
  const response = await apiClient.get<ApiEnvelope<CategoriesResponseData>>('/lookups/categories', {
    params: departmentId ? { department_id: departmentId } : undefined,
  });
  return response.data;
}

export async function getPriorities() {
  const response = await apiClient.get<ApiEnvelope<PrioritiesResponseData>>('/lookups/priorities');
  return response.data;
}

export async function getComplaintStatuses() {
  const response = await apiClient.get<ApiEnvelope<ComplaintStatusesResponseData>>(
    '/lookups/complaint-statuses',
  );
  return response.data;
}
