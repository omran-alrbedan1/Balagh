/* eslint-disable @typescript-eslint/no-require-imports */
import { render } from '@testing-library/react-native';

import { Complaint, ComplaintInformationRequest } from '@/api/types/complaint.types';

import { ComplaintInformationRequestSection } from '../ComplaintInformationRequestSection';

jest.mock('react-native-reanimated', () => {
  const { View } = require('react-native');
  return { __esModule: true, default: { View }, FadeIn: { duration: () => undefined } };
});
jest.mock('../AdditionalInformationRequestCard', () => ({
  AdditionalInformationRequestCard: ({ request }: { request: ComplaintInformationRequest }) => {
    const { Text } = require('react-native');
    return <Text>{`request-card:${request.message}`}</Text>;
  },
}));

const request: ComplaintInformationRequest = {
  id: 'request-1',
  message: 'Upload a clear invoice.',
  requested_at: '2026-08-15T00:00:00Z',
  status: 'pending',
};

function complaint(
  status: Complaint['status'],
  activeRequest: ComplaintInformationRequest | null,
): Complaint {
  return {
    active_information_request: activeRequest,
    attachments: [],
    category_id: 'category-1',
    client_ref: 'ref-1',
    created_at: '2026-08-01T00:00:00Z',
    department_id: 'department-1',
    description: 'Description',
    id: 'complaint-1',
    status,
    timeline: [],
    title: 'Complaint',
  };
}

const refreshComplaint = jest.fn();

it('renders no response card for a normal complaint without an active request', () => {
  const view = render(
    <ComplaintInformationRequestSection
      complaint={complaint('in_progress', null)}
      refreshComplaint={refreshComplaint}
    />,
  );
  expect(view.toJSON()).toBeNull();
});

it('renders the active backend request only while waiting on the citizen', () => {
  const view = render(
    <ComplaintInformationRequestSection
      complaint={complaint('waiting_citizen', request)}
      refreshComplaint={refreshComplaint}
    />,
  );
  expect(view.getByText('request-card:Upload a clear invoice.')).toBeTruthy();
});

it('removes stale response UI when refreshed server state completes the request', () => {
  const view = render(
    <ComplaintInformationRequestSection
      complaint={complaint('waiting_citizen', request)}
      refreshComplaint={refreshComplaint}
    />,
  );
  view.rerender(
    <ComplaintInformationRequestSection
      complaint={complaint('in_progress', null)}
      refreshComplaint={refreshComplaint}
    />,
  );
  expect(view.toJSON()).toBeNull();
});

it('does not revive a stale request payload after the complaint leaves waiting_citizen', () => {
  const view = render(
    <ComplaintInformationRequestSection
      complaint={complaint('resolved', request)}
      refreshComplaint={refreshComplaint}
    />,
  );
  expect(view.toJSON()).toBeNull();
});
