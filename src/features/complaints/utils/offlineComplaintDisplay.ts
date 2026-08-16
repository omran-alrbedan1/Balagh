import { Complaint } from '@/api/types/complaint.types';
import { OfflineComplaintQueueItem } from '@/features/complaints/utils/offlineQueue';

export function removeServerDuplicatesOfLocalComplaints(
  complaints: Complaint[],
  offlineItems: OfflineComplaintQueueItem[],
) {
  const localIdentifiers = new Set(
    offlineItems.flatMap((item) => [item.client_uuid, item.payload.client_ref]),
  );

  return complaints.filter(
    (complaint) =>
      !localIdentifiers.has(complaint.client_uuid ?? '') &&
      !localIdentifiers.has(complaint.client_ref),
  );
}
