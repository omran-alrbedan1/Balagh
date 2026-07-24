export interface Department {
  id: string;
  name: string;
  code: string;
  description?: string;
  is_active: boolean;
}

export interface Category {
  id: string;
  department_id: string;
  name: string;
  code: string;
  description?: string;
  keywords?: string[];
  is_active: boolean;
  department?: Department;
}

export interface Priority {
  id: string;
  name: string;
  code: string;
  level: number;
  color: string;
  description?: string;
}

export type ComplaintStatus =
  | 'submitted'
  | 'in_review'
  | 'under_review'
  | 'assigned'
  | 'in_progress'
  | 'waiting_citizen'
  | 'resolved'
  | 'rejected'
  | 'closed'
  | 'escalated';

export interface StatusLookup {
  id: string;
  name: string;
  value: ComplaintStatus;
}

export interface DepartmentsResponseData {
  departments: Department[];
}

export interface CategoriesResponseData {
  categories: Category[];
}

export interface PrioritiesResponseData {
  priorities: Priority[];
}

export interface ComplaintStatusesResponseData {
  statuses: ComplaintStatus[];
}
