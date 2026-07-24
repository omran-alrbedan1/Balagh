import { useQuery } from '@tanstack/react-query';

export interface HomeActivityItem {
  id: string;
  date: string;
  status: string;
  title: string;
}

export interface HomeStats {
  openComplaints: number;
  pendingSla: number;
  recentActivity: HomeActivityItem[];
}

async function fetchHomeStatsStub(): Promise<HomeStats> {
  return {
    openComplaints: 0,
    pendingSla: 0,
    recentActivity: [],
  };
}

export function useHomeStats() {
  return useQuery({
    queryKey: ['home', 'stats'],
    queryFn: fetchHomeStatsStub,
    staleTime: 60_000,
  });
}
