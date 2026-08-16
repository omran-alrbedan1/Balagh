import { AlertCircle, CheckCircle2, Clock3, Paperclip, UserRound } from 'lucide-react-native';
import { useRef, useState } from 'react';
import { Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { AttachmentUpload } from '@/api/endpoints/complaints.api';
import { Complaint, ComplaintInformationRequest } from '@/api/types/complaint.types';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import {
  ControlledAttachmentPicker,
  SelectableAttachment,
} from '@/features/complaints/components/AttachmentPicker';
import { useAddComplaintAttachments } from '@/features/complaints/hooks/useAddComplaintAttachments';
import { useRespondToInformationRequest } from '@/features/complaints/hooks/useRespondToInformationRequest';
import { formatDateTime } from '@/features/complaints/utils/complaintDisplay';
import { useNetworkStatus } from '@/hooks/useNetworkStatus';
import { colors } from '@/theme/colors';

const MAX_RESPONSE_LENGTH = 2000;

interface AdditionalInformationRequestCardProps {
  complaintId: string;
  existingAttachments?: Complaint['attachments'];
  request: ComplaintInformationRequest;
  refreshComplaint: () => Promise<Complaint | undefined>;
}

let attachmentSequence = 0;

function createAttachmentId() {
  attachmentSequence += 1;
  return `information-attachment-${Date.now()}-${attachmentSequence}`;
}

function toUpload(attachment: SelectableAttachment): AttachmentUpload {
  return {
    mimeType: attachment.mimeType,
    name: attachment.name,
    uri: attachment.uri,
  };
}

function attachmentName(attachment: Complaint['attachments'][number]) {
  return attachment.original_name ?? attachment.file_name ?? attachment.fileName;
}

function findAttachmentsMissingFromServer(
  selected: SelectableAttachment[],
  previousServerAttachments: Complaint['attachments'],
  refreshedServerAttachments: Complaint['attachments'],
) {
  const previousCounts = new Map<string, number>();
  const refreshedCounts = new Map<string, number>();

  previousServerAttachments.forEach((attachment) => {
    const name = attachmentName(attachment);
    if (name) previousCounts.set(name, (previousCounts.get(name) ?? 0) + 1);
  });
  refreshedServerAttachments.forEach((attachment) => {
    const name = attachmentName(attachment);
    if (name) refreshedCounts.set(name, (refreshedCounts.get(name) ?? 0) + 1);
  });

  const acceptedCounts = new Map<string, number>();
  refreshedCounts.forEach((count, name) => {
    acceptedCounts.set(name, Math.max(0, count - (previousCounts.get(name) ?? 0)));
  });

  return selected.filter((attachment) => {
    if (!attachment.name) return true;
    const remainingAccepted = acceptedCounts.get(attachment.name) ?? 0;
    if (remainingAccepted === 0) return true;
    acceptedCounts.set(attachment.name, remainingAccepted - 1);
    return false;
  });
}

export function AdditionalInformationRequestCard({
  complaintId,
  existingAttachments = [],
  refreshComplaint,
  request,
}: AdditionalInformationRequestCardProps) {
  const { i18n, t } = useTranslation();
  const { isOnline } = useNetworkStatus();
  const respondMutation = useRespondToInformationRequest();
  const attachmentMutation = useAddComplaintAttachments();
  const [responseText, setResponseText] = useState('');
  const [attachments, setAttachments] = useState<SelectableAttachment[]>([]);
  const [responseError, setResponseError] = useState<string>();
  const [attachmentError, setAttachmentError] = useState<string>();
  const [notice, setNotice] = useState<string>();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const submittingRef = useRef(false);
  const responseAlreadyExists = Boolean(request.response_message);
  const canEnterText = !responseAlreadyExists;
  const isBusy = isSubmitting || respondMutation.isPending || attachmentMutation.isPending;
  const textDirection = i18n.dir() === 'rtl' ? 'rtl' : 'ltr';

  const addAttachment = (attachment: Omit<SelectableAttachment, 'id'>) => {
    setAttachments((current) => [...current, { ...attachment, id: createAttachmentId() }]);
    setAttachmentError(undefined);
  };

  const reconcileAfterFailure = async () => {
    try {
      return await refreshComplaint();
    } catch {
      return undefined;
    }
  };

  const submit = async ({ attachmentsOnly = false }: { attachmentsOnly?: boolean } = {}) => {
    if (submittingRef.current || respondMutation.isPending || attachmentMutation.isPending) {
      return;
    }

    setResponseError(undefined);
    setAttachmentError(undefined);
    setNotice(undefined);

    if (!isOnline) {
      setResponseError(t('complaints.informationRequest.internetRequired'));
      return;
    }

    const trimmedMessage = responseText.trim();
    const shouldSendText = !attachmentsOnly && canEnterText && trimmedMessage.length > 0;
    const shouldSendAttachments = attachments.length > 0;

    if (!attachmentsOnly && trimmedMessage.length > MAX_RESPONSE_LENGTH) {
      setResponseError(t('complaints.informationRequest.responseTooLong'));
      return;
    }

    if (!shouldSendText && !shouldSendAttachments) {
      setResponseError(t('complaints.informationRequest.responseEmpty'));
      return;
    }

    submittingRef.current = true;
    setIsSubmitting(true);

    try {
      // Text is intentionally first: once accepted it is immutable, while failed files can be
      // retried independently without risking a second text response.
      if (shouldSendText) {
        try {
          await respondMutation.mutateAsync({ complaintId, message: trimmedMessage });
          setResponseText('');
          setNotice(t('complaints.informationRequest.informationSubmitted'));
        } catch {
          const latestComplaint = await reconcileAfterFailure();
          const latestRequest = latestComplaint?.active_information_request;

          if (!latestRequest) {
            setResponseError(t('complaints.informationRequest.requestNoLongerActive'));
            return;
          }

          if (latestRequest.response_message) {
            setResponseText('');
            setNotice(t('complaints.informationRequest.responseAlreadySubmitted'));
          } else {
            setResponseError(t('complaints.informationRequest.responseSendFailed'));
            return;
          }
        }
      }

      if (shouldSendAttachments) {
        try {
          await attachmentMutation.mutateAsync({
            attachments: attachments.map(toUpload),
            complaintId,
          });
          setAttachments([]);
          setNotice(t('complaints.informationRequest.informationSubmitted'));
        } catch {
          const latestComplaint = await reconcileAfterFailure();
          const remainingAttachments = latestComplaint
            ? findAttachmentsMissingFromServer(
                attachments,
                existingAttachments,
                latestComplaint.attachments,
              )
            : attachments;

          setAttachments(remainingAttachments);
          if (remainingAttachments.length === 0) {
            setNotice(t('complaints.informationRequest.informationSubmitted'));
          } else {
            setAttachmentError(t('complaints.informationRequest.attachmentUploadFailed'));
          }
          return;
        }
      }

      await refreshComplaint();
    } finally {
      submittingRef.current = false;
      setIsSubmitting(false);
    }
  };

  const isResponded = request.status === 'responded';

  return (
    <Card
      style={{
        backgroundColor: colors.warningLight,
        borderColor: '#FDE68A',
        borderWidth: 2,
      }}
    >
      <View className="flex-row items-center gap-3">
        <View className="h-10 w-10 items-center justify-center rounded-xl bg-white">
          <AlertCircle color={colors.warning} size={22} />
        </View>
        <View className="flex-1 gap-1">
          <Text className="text-lg font-black text-base-900">
            {t('complaints.informationRequest.title')}
          </Text>
          <Text className="text-sm font-bold text-warning-700">
            {isResponded
              ? t('complaints.informationRequest.waitingForReview')
              : t('complaints.informationRequest.pending')}
          </Text>
        </View>
      </View>

      <Text
        className="rounded-xl bg-white px-4 py-3 text-[15px] font-bold leading-6 text-base-900"
        style={{
          textAlign: textDirection === 'rtl' ? 'right' : 'left',
          writingDirection: textDirection,
        }}
      >
        {request.message}
      </Text>

      <View className="gap-2">
        <View className="flex-row items-center gap-2">
          <Clock3 color={colors.textMuted} size={16} />
          <Text className="flex-1 text-sm text-base-600">
            {t('complaints.informationRequest.requestedOn', {
              date: formatDateTime(request.requested_at),
            })}
          </Text>
        </View>
        {request.requested_by?.name ? (
          <View className="flex-row items-center gap-2">
            <UserRound color={colors.textMuted} size={16} />
            <Text className="flex-1 text-sm text-base-600">
              {t('complaints.informationRequest.requestedBy', {
                name: request.requested_by.name,
              })}
            </Text>
          </View>
        ) : null}
      </View>

      {isResponded ? (
        <View className="flex-row items-start gap-2 rounded-xl border border-success-600 bg-success-50 px-3 py-3">
          <CheckCircle2 color={colors.success} size={18} />
          <Text className="flex-1 text-sm font-bold leading-5 text-success-700">
            {t(
              request.response_message
                ? 'complaints.informationRequest.submittedWaitingReview'
                : 'complaints.informationRequest.attachmentsReceivedWaitingReview',
            )}
          </Text>
        </View>
      ) : null}

      {request.response_message ? (
        <View className="gap-2 rounded-xl border border-base-200 bg-white px-4 py-3">
          <Text className="text-sm font-black text-base-700">
            {t('complaints.informationRequest.yourResponse')}
          </Text>
          <Text
            accessibilityLabel={t('complaints.informationRequest.responseAlreadySubmitted')}
            className="text-[15px] leading-6 text-base-900"
            style={{
              textAlign: textDirection === 'rtl' ? 'right' : 'left',
              writingDirection: textDirection,
            }}
          >
            {request.response_message}
          </Text>
        </View>
      ) : (
        <Input
          accessibilityLabel={t('complaints.informationRequest.yourResponse')}
          disabled={isBusy}
          error={responseError}
          helperText={t('complaints.informationRequest.characterCount', {
            count: responseText.length,
            max: MAX_RESPONSE_LENGTH,
          })}
          label={t('complaints.informationRequest.yourResponse')}
          multiline
          onChangeText={(value) => {
            setResponseText(value);
            setResponseError(undefined);
          }}
          placeholder={t('complaints.informationRequest.responsePlaceholder')}
          style={{
            textAlign: textDirection === 'rtl' ? 'right' : 'left',
            writingDirection: textDirection,
          }}
          type="textarea"
          value={responseText}
        />
      )}

      <View className="flex-row items-center gap-2">
        <Paperclip color={colors.primary} size={18} />
        <Text className="text-base font-black text-base-900">
          {t('complaints.informationRequest.addSupportingFiles')}
        </Text>
      </View>

      <ControlledAttachmentPicker
        attachments={attachments}
        disabled={isBusy}
        onAdd={addAttachment}
        onRemove={(id) => {
          setAttachments((current) => current.filter((attachment) => attachment.id !== id));
          setAttachmentError(undefined);
        }}
      />

      {!isOnline ? (
        <Text accessibilityLiveRegion="polite" className="text-sm font-bold text-danger-600">
          {t('complaints.informationRequest.internetRequired')}
        </Text>
      ) : null}
      {attachmentError ? (
        <View className="gap-2">
          <Text accessibilityLiveRegion="assertive" className="text-sm font-bold text-danger-600">
            {attachmentError}
          </Text>
          <Button
            disabled={!isOnline || isBusy}
            label={t('complaints.informationRequest.retryAttachmentUpload')}
            onPress={() => void submit({ attachmentsOnly: true })}
            variant="secondary"
          />
        </View>
      ) : null}
      {notice ? (
        <Text accessibilityLiveRegion="polite" className="text-sm font-bold text-success-700">
          {notice}
        </Text>
      ) : null}

      <Button
        disabled={!isOnline || isBusy || (responseAlreadyExists && attachments.length === 0)}
        label={
          isBusy
            ? t('complaints.informationRequest.sending')
            : t('complaints.informationRequest.sendInformation')
        }
        loading={isBusy}
        onPress={() => void submit()}
      />
    </Card>
  );
}
