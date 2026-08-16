import { apiClient } from '@/api/client';
import { ApiEnvelope } from '@/api/types/api-envelope.types';
import { ComplaintStatus } from '@/api/types/lookups.types';

export interface DashboardComplaint {
  id: string;
  complaint_number?: string;
  title: string;
  status: ComplaintStatus;
  department?: { id: string; name: string; code?: string } | null;
  category?: { id: string; name: string; code?: string } | null;
  priority?: { id: string; name: string; code?: string; color?: string; level?: number } | null;
  created_at: string;
  updated_at?: string;
  due_at?: string;
  is_sla_breached?: boolean;
}

export interface HomeDashboard {
  counts: {
    total: number;
    active: number;
    waiting_citizen: number;
    completed: number;
  };
  recent_complaints: DashboardComplaint[];
  action_required: DashboardComplaint[];
}

export type HomeDashboardEnvelope = ApiEnvelope<HomeDashboard>;

function normalizeDashboardComplaint(complaint: DashboardComplaint): DashboardComplaint {
  return {
    ...complaint,
    id: String(complaint.id),
    category: complaint.category
      ? { ...complaint.category, id: String(complaint.category.id) }
      : complaint.category,
    department: complaint.department
      ? { ...complaint.department, id: String(complaint.department.id) }
      : complaint.department,
    priority: complaint.priority
      ? { ...complaint.priority, id: String(complaint.priority.id) }
      : complaint.priority,
  };
}

export async function getHomeDashboard(): Promise<HomeDashboardEnvelope> {
  const response = await apiClient.get<HomeDashboardEnvelope>('/citizen/dashboard');
  const dashboard = response.data.data;

  return {
    ...response.data,
    data: {
      ...dashboard,
      action_required: dashboard.action_required.map(normalizeDashboardComplaint),
      recent_complaints: dashboard.recent_complaints.map(normalizeDashboardComplaint),
    },
  };
}
