import Animated, { FadeIn } from 'react-native-reanimated';

import { Complaint } from '@/api/types/complaint.types';
import { AdditionalInformationRequestCard } from '@/features/complaints/components/AdditionalInformationRequestCard';

interface ComplaintInformationRequestSectionProps {
  complaint: Complaint;
  refreshComplaint: () => Promise<Complaint | undefined>;
}

export function ComplaintInformationRequestSection({
  complaint,
  refreshComplaint,
}: ComplaintInformationRequestSectionProps) {
  if (complaint.status !== 'waiting_citizen' || !complaint.active_information_request) {
    return null;
  }

  return (
    <Animated.View entering={FadeIn.duration(220)}>
      <AdditionalInformationRequestCard
        complaintId={complaint.id}
        existingAttachments={complaint.attachments}
        key={complaint.active_information_request.id}
        refreshComplaint={refreshComplaint}
        request={complaint.active_information_request}
      />
    </Animated.View>
  );
}
