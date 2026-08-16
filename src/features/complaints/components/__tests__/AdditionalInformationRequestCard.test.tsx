/* eslint-disable @typescript-eslint/no-require-imports */
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, fireEvent, render, waitFor } from '@testing-library/react-native';
import { PropsWithChildren, useState } from 'react';

import {
  addComplaintAttachments,
  respondToInformationRequest,
} from '@/api/endpoints/complaints.api';
import { Complaint, ComplaintInformationRequest } from '@/api/types/complaint.types';
import { useNetworkStatus } from '@/hooks/useNetworkStatus';

import { AdditionalInformationRequestCard } from '../AdditionalInformationRequestCard';

jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    i18n: { dir: () => 'ltr' },
    t: (key: string, values?: Record<string, unknown>) =>
      values ? `${key}:${Object.values(values).join('|')}` : key,
  }),
}));
jest.mock('lucide-react-native', () => ({
  AlertCircle: () => null,
  CheckCircle2: () => null,
  Clock3: () => null,
  Paperclip: () => null,
  UserRound: () => null,
}));
jest.mock('@/features/complaints/utils/complaintDisplay', () => ({
  formatDateTime: (value: string) => `formatted-${value}`,
}));
jest.mock('@/features/complaints/components/AttachmentPicker', () => ({
  ControlledAttachmentPicker: ({ attachments, onAdd, onRemove }: any) => {
    const { Pressable, Text, View } = require('react-native');
    return (
      <View>
        <Text>{`selected-files:${attachments.length}`}</Text>
        <Pressable
          accessibilityLabel="add-test-file"
          onPress={() =>
            onAdd({
              kind: 'document',
              mimeType: 'application/pdf',
              name: 'proof.pdf',
              uri: 'file://proof.pdf',
            })
          }
        />
        {attachments[0] ? (
          <Pressable
            accessibilityLabel="remove-test-file"
            onPress={() => onRemove(attachments[0].id)}
          />
        ) : null}
      </View>
    );
  },
}));
jest.mock('@/api/endpoints/complaints.api', () => ({
  addComplaintAttachments: jest.fn(),
  respondToInformationRequest: jest.fn(),
}));
jest.mock('@/hooks/useNetworkStatus', () => ({ useNetworkStatus: jest.fn() }));

const mockedRespond = respondToInformationRequest as jest.MockedFunction<
  typeof respondToInformationRequest
>;
const mockedAddAttachments = addComplaintAttachments as jest.MockedFunction<
  typeof addComplaintAttachments
>;
const mockedNetwork = useNetworkStatus as jest.MockedFunction<typeof useNetworkStatus>;

const pendingRequest: ComplaintInformationRequest = {
  id: 'request-1',
  message: 'Please provide the invoice number.',
  requested_at: '2026-08-15T10:30:00Z',
  requested_by: { id: 'employee-1', name: 'Case Worker' },
  status: 'pending',
};

function complaintWith(request: ComplaintInformationRequest | null): Complaint {
  return {
    active_information_request: request,
    attachments: [],
    category_id: 'category-1',
    client_ref: 'ref-1',
    created_at: '2026-08-01T00:00:00Z',
    department_id: 'department-1',
    description: 'Description',
    id: 'complaint-1',
    status: request ? 'waiting_citizen' : 'in_progress',
    timeline: [],
    title: 'Complaint',
  };
}

let queryClient: QueryClient;
let refreshComplaint: jest.MockedFunction<() => Promise<Complaint | undefined>>;

function wrapper({ children }: PropsWithChildren) {
  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}

function renderCard(request: ComplaintInformationRequest = pendingRequest) {
  return render(
    <AdditionalInformationRequestCard
      complaintId="complaint-1"
      refreshComplaint={refreshComplaint}
      request={request}
    />,
    { wrapper },
  );
}

beforeEach(() => {
  jest.clearAllMocks();
  queryClient = new QueryClient({
    defaultOptions: {
      mutations: { gcTime: 0, retry: false },
      queries: { gcTime: 0, retry: false },
    },
  });
  mockedNetwork.mockReturnValue({ isOnline: true } as ReturnType<typeof useNetworkStatus>);
  mockedRespond.mockResolvedValue({} as Awaited<ReturnType<typeof respondToInformationRequest>>);
  mockedAddAttachments.mockResolvedValue({} as Awaited<ReturnType<typeof addComplaintAttachments>>);
  refreshComplaint = jest.fn().mockResolvedValue(complaintWith(pendingRequest));
});

afterEach(() => queryClient.clear());

it('shows the exact pending request, requester, and requested date', () => {
  const view = renderCard();

  expect(view.getByText('Please provide the invoice number.')).toBeTruthy();
  expect(
    view.getByText('complaints.informationRequest.requestedOn:formatted-2026-08-15T10:30:00Z'),
  ).toBeTruthy();
  expect(view.getByText('complaints.informationRequest.requestedBy:Case Worker')).toBeTruthy();
});

it('trims text before posting it to the information-response endpoint', async () => {
  const view = renderCard();
  fireEvent.changeText(
    view.getByLabelText('complaints.informationRequest.yourResponse'),
    '  Invoice 42  ',
  );
  fireEvent.press(view.getByText('complaints.informationRequest.sendInformation'));

  await waitFor(() => expect(mockedRespond).toHaveBeenCalledWith('complaint-1', 'Invoice 42'));
  expect(mockedAddAttachments).not.toHaveBeenCalled();
});

it('blocks text longer than 2000 characters', async () => {
  const view = renderCard();
  fireEvent.changeText(
    view.getByLabelText('complaints.informationRequest.yourResponse'),
    'x'.repeat(2001),
  );
  fireEvent.press(view.getByText('complaints.informationRequest.sendInformation'));

  expect(await view.findByText('complaints.informationRequest.responseTooLong')).toBeTruthy();
  expect(mockedRespond).not.toHaveBeenCalled();
});

it('submits attachments only without calling the text endpoint', async () => {
  const view = renderCard();
  fireEvent.press(view.getByLabelText('add-test-file'));
  fireEvent.press(view.getByText('complaints.informationRequest.sendInformation'));

  await waitFor(() =>
    expect(mockedAddAttachments).toHaveBeenCalledWith('complaint-1', [
      {
        mimeType: 'application/pdf',
        name: 'proof.pdf',
        uri: 'file://proof.pdf',
      },
    ]),
  );
  expect(mockedRespond).not.toHaveBeenCalled();
});

it('submits text first and then attachments', async () => {
  const view = renderCard();
  fireEvent.changeText(
    view.getByLabelText('complaints.informationRequest.yourResponse'),
    'Invoice 42',
  );
  fireEvent.press(view.getByLabelText('add-test-file'));
  fireEvent.press(view.getByText('complaints.informationRequest.sendInformation'));

  await waitFor(() => expect(mockedAddAttachments).toHaveBeenCalledTimes(1));
  expect(mockedRespond).toHaveBeenCalledTimes(1);
  expect(mockedRespond.mock.invocationCallOrder[0]).toBeLessThan(
    mockedAddAttachments.mock.invocationCallOrder[0],
  );
});

it('blocks an empty response', async () => {
  const view = renderCard();
  fireEvent.changeText(view.getByLabelText('complaints.informationRequest.yourResponse'), '   ');
  fireEvent.press(view.getByText('complaints.informationRequest.sendInformation'));

  expect(await view.findByText('complaints.informationRequest.responseEmpty')).toBeTruthy();
  expect(mockedRespond).not.toHaveBeenCalled();
  expect(mockedAddAttachments).not.toHaveBeenCalled();
});

it('blocks rapid duplicate submission while the first request is pending', async () => {
  let resolveResponse:
    ((value: Awaited<ReturnType<typeof respondToInformationRequest>>) => void) | undefined;
  mockedRespond.mockReturnValue(
    new Promise((resolve) => {
      resolveResponse = resolve;
    }) as ReturnType<typeof respondToInformationRequest>,
  );
  const view = renderCard();
  fireEvent.changeText(
    view.getByLabelText('complaints.informationRequest.yourResponse'),
    'Invoice 42',
  );
  const submit = view.getByText('complaints.informationRequest.sendInformation');
  fireEvent.press(submit);
  await waitFor(() => expect(mockedRespond).toHaveBeenCalledTimes(1));
  fireEvent.press(view.getByLabelText('complaints.informationRequest.sending'));
  expect(mockedRespond).toHaveBeenCalledTimes(1);
  await act(async () => resolveResponse?.({ success: true, data: complaintWith(pendingRequest) }));
});

it('keeps failed attachments retryable without resubmitting accepted text', async () => {
  mockedAddAttachments.mockRejectedValueOnce(new Error('upload failed'));
  const view = renderCard();
  fireEvent.changeText(
    view.getByLabelText('complaints.informationRequest.yourResponse'),
    'Invoice 42',
  );
  fireEvent.press(view.getByLabelText('add-test-file'));
  fireEvent.press(view.getByText('complaints.informationRequest.sendInformation'));

  expect(
    await view.findByText('complaints.informationRequest.attachmentUploadFailed'),
  ).toBeTruthy();
  expect(view.getByText('selected-files:1')).toBeTruthy();
  fireEvent.press(view.getByText('complaints.informationRequest.retryAttachmentUpload'));

  await waitFor(() => expect(mockedAddAttachments).toHaveBeenCalledTimes(2));
  expect(mockedRespond).toHaveBeenCalledTimes(1);
  expect(refreshComplaint).toHaveBeenCalled();
});

it('reconciles an ambiguous attachment failure when the refreshed server has the file', async () => {
  mockedAddAttachments.mockRejectedValueOnce(new Error('network timeout'));
  refreshComplaint.mockResolvedValue({
    ...complaintWith(pendingRequest),
    attachments: [{ id: 'server-attachment-1', original_name: 'proof.pdf' }],
  });
  const view = renderCard();
  fireEvent.press(view.getByLabelText('add-test-file'));
  fireEvent.press(view.getByText('complaints.informationRequest.sendInformation'));

  expect(await view.findByText('complaints.informationRequest.informationSubmitted')).toBeTruthy();
  expect(view.getByText('selected-files:0')).toBeTruthy();
  expect(view.queryByText('complaints.informationRequest.attachmentUploadFailed')).toBeNull();
  expect(mockedAddAttachments).toHaveBeenCalledTimes(1);
});

it('allows text retry after an attachment-only response and failed text attempt', async () => {
  const respondedWithoutText: ComplaintInformationRequest = {
    ...pendingRequest,
    responded_at: '2026-08-16T10:00:00Z',
    response_message: null,
    status: 'responded',
  };
  refreshComplaint.mockResolvedValue(complaintWith(respondedWithoutText));
  const view = renderCard(respondedWithoutText);
  fireEvent.press(view.getByLabelText('add-test-file'));
  fireEvent.press(view.getByText('complaints.informationRequest.sendInformation'));
  await waitFor(() => expect(mockedAddAttachments).toHaveBeenCalledTimes(1));

  mockedRespond.mockRejectedValueOnce(new Error('text failed'));
  fireEvent.changeText(
    view.getByLabelText('complaints.informationRequest.yourResponse'),
    'Late text response',
  );
  fireEvent.press(view.getByText('complaints.informationRequest.sendInformation'));
  expect(await view.findByText('complaints.informationRequest.responseSendFailed')).toBeTruthy();
  expect(view.getByDisplayValue('Late text response')).toBeTruthy();

  fireEvent.press(view.getByText('complaints.informationRequest.sendInformation'));
  await waitFor(() => expect(mockedRespond).toHaveBeenCalledTimes(2));
  expect(mockedAddAttachments).toHaveBeenCalledTimes(1);
});

it('renders a submitted text response read-only', () => {
  const responded: ComplaintInformationRequest = {
    ...pendingRequest,
    responded_at: '2026-08-16T10:00:00Z',
    response_message: 'Invoice 42',
    status: 'responded',
  };
  const view = renderCard(responded);

  expect(view.getByText('Invoice 42')).toBeTruthy();
  expect(
    view.queryByPlaceholderText('complaints.informationRequest.responsePlaceholder'),
  ).toBeNull();
  expect(view.getByText('complaints.informationRequest.submittedWaitingReview')).toBeTruthy();
});

it('keeps optional text available after an attachment-only response', () => {
  const respondedWithoutText: ComplaintInformationRequest = {
    ...pendingRequest,
    response_message: null,
    status: 'responded',
  };
  const view = renderCard(respondedWithoutText);

  expect(view.getByLabelText('complaints.informationRequest.yourResponse')).toBeTruthy();
  expect(
    view.getByText('complaints.informationRequest.attachmentsReceivedWaitingReview'),
  ).toBeTruthy();
});

it('uploads additional attachments after a text response without overwriting it', async () => {
  const responded: ComplaintInformationRequest = {
    ...pendingRequest,
    response_message: 'Invoice 42',
    status: 'responded',
  };
  const view = renderCard(responded);
  fireEvent.press(view.getByLabelText('add-test-file'));
  fireEvent.press(view.getByText('complaints.informationRequest.sendInformation'));

  await waitFor(() => expect(mockedAddAttachments).toHaveBeenCalledTimes(1));
  expect(mockedRespond).not.toHaveBeenCalled();
});

it('retains entered text offline, enables on reconnect, and never auto-submits', async () => {
  let isOnline = false;
  mockedNetwork.mockImplementation(() => ({ isOnline }) as ReturnType<typeof useNetworkStatus>);
  const view = renderCard();
  fireEvent.changeText(
    view.getByLabelText('complaints.informationRequest.yourResponse'),
    'Keep this draft',
  );

  expect(view.getByText('complaints.informationRequest.internetRequired')).toBeTruthy();
  expect(mockedRespond).not.toHaveBeenCalled();
  isOnline = true;
  view.rerender(
    <AdditionalInformationRequestCard
      complaintId="complaint-1"
      refreshComplaint={refreshComplaint}
      request={pendingRequest}
    />,
  );
  expect(view.getByDisplayValue('Keep this draft')).toBeTruthy();
  expect(mockedRespond).not.toHaveBeenCalled();

  fireEvent.press(view.getByText('complaints.informationRequest.sendInformation'));
  await waitFor(() => expect(mockedRespond).toHaveBeenCalledTimes(1));
});

it('reconciles an ambiguous 422 to the server response instead of resending text', async () => {
  const accepted: ComplaintInformationRequest = {
    ...pendingRequest,
    response_message: 'Accepted on another device',
    status: 'responded',
  };
  mockedRespond.mockRejectedValueOnce(
    Object.assign(new Error('already responded'), { status: 422 }),
  );

  function ReconciliationHarness() {
    const [request, setRequest] = useState(pendingRequest);
    return (
      <AdditionalInformationRequestCard
        complaintId="complaint-1"
        refreshComplaint={async () => {
          setRequest(accepted);
          return complaintWith(accepted);
        }}
        request={request}
      />
    );
  }

  const view = render(<ReconciliationHarness />, { wrapper });
  fireEvent.changeText(
    view.getByLabelText('complaints.informationRequest.yourResponse'),
    'Possibly accepted',
  );
  fireEvent.press(view.getByText('complaints.informationRequest.sendInformation'));

  expect(await view.findByText('Accepted on another device')).toBeTruthy();
  expect(view.getByText('complaints.informationRequest.responseAlreadySubmitted')).toBeTruthy();
  expect(mockedRespond).toHaveBeenCalledTimes(1);
});
