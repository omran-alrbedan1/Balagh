import { router } from 'expo-router';
import { FileText } from 'lucide-react-native';
import { Image, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { Card } from '@/components/ui/Card';
import { ErrorState } from '@/components/ui/ErrorState';
import { SubmitButton } from '@/components/ui/SubmitButton';
import { StepBackButton } from '@/features/complaints/components/StepBackButton';
import { useCreateComplaint } from '@/features/complaints/hooks/useCreateComplaint';
import { useDraftComplaintStore } from '@/features/complaints/store/draftComplaintStore';
import { useCategories } from '@/features/lookups/hooks/useCategories';
import { useDepartments } from '@/features/lookups/hooks/useDepartments';
import { normalizeComplaintId } from '@/features/complaints/utils/complaintId';

interface StepReviewProps {
  onBack: () => void;
  onSubmissionSuccess: () => void;
}

export function StepReview({ onBack, onSubmissionSuccess }: StepReviewProps) {
  const { t } = useTranslation();
  const draft = useDraftComplaintStore();
  const { data: departments } = useDepartments();
  const { data: categories } = useCategories(draft.departmentId);
  const createComplaintMutation = useCreateComplaint();
  const departmentName =
    departments?.find((department) => department.id === draft.departmentId)?.name ?? '-';
  const categoryName =
    categories?.find((category) => category.id === draft.categoryId)?.name ?? '-';

  const handleSubmit = () => {
    createComplaintMutation.mutate(undefined, {
      onSuccess: (result) => {
        onSubmissionSuccess();

        if (result.queued) {
          router.replace('/(app)/(tabs)/complaints');
          return;
        }

        const complaintId = normalizeComplaintId(result.complaint?.id);
        if (!complaintId) {
          router.replace('/(app)/(tabs)/complaints');
          return;
        }

        router.replace({
          pathname: '/(app)/(tabs)/complaints/[id]',
          params: { id: complaintId },
        });
      },
    });
  };

  return (
    <View className="gap-4">
      <View>
        <Text className="text-[22px] font-black text-base-900">{t('complaints.reviewSubmit')}</Text>
        <Text className="text-[15px] leading-[21px] text-base-500">
          {t('complaints.reviewSubmitSubtitle')}
        </Text>
      </View>

      {createComplaintMutation.error ? (
        <ErrorState message={createComplaintMutation.error.message} />
      ) : null}

      <Card>
        <Text className="text-xs font-black text-base-500">
          {t('complaintReview.departmentCategory')}
        </Text>
        <Text className="mt-1 text-base font-extrabold text-base-900">
          {t('complaintReview.to', { department: departmentName, category: categoryName })}
        </Text>
      </Card>

      <Card>
        <Text className="text-xs font-black text-base-500">{t('complaintReview.title')}</Text>
        <Text className="mt-1 text-base font-extrabold text-base-900">{draft.title}</Text>
        <Text className="mt-4 text-xs font-black text-base-500">
          {t('complaintReview.description')}
        </Text>
        <Text className="text-[15px] leading-[21px] text-base-900">{draft.description}</Text>
      </Card>

      {draft.attachments.length > 0 ? (
        <Card>
          <Text className="text-xs font-black text-base-500">
            {t('complaints.photos', { count: draft.attachments.length })}
          </Text>
          <View className="mt-2 flex-row flex-wrap gap-2">
            {draft.attachments.map((attachment) =>
              attachment.kind === 'image' ? (
                <Image
                  className="h-[68px] w-[68px] rounded-lg"
                  key={attachment.id}
                  source={{ uri: attachment.uri }}
                />
              ) : (
                <View
                  className="flex-row items-center gap-1.5 rounded-lg bg-primary-50 px-3 py-2"
                  key={attachment.id}
                >
                  <FileText className="text-primary-600" color="#082248" size={16} />
                  <Text className="max-w-[180px] text-[13px] font-bold text-primary-700">
                    {attachment.name ?? t('complaints.document')}
                  </Text>
                </View>
              ),
            )}
          </View>
        </Card>
      ) : null}

      <Card>
        <Text className="text-xs font-black text-base-500">{t('complaintReview.location')}</Text>
        <Text className="mt-1 text-base font-extrabold text-base-900">
          {draft.location?.address ?? t('common.notProvided')}
        </Text>
      </Card>

      <View className="flex-row gap-4">
        <StepBackButton label={t('common.back')} onPress={onBack} />
        <SubmitButton
          fullWidth={false}
          isSubmitting={createComplaintMutation.isPending}
          label={t('complaints.submitComplaint')}
          onPress={handleSubmit}
        />
      </View>
    </View>
  );
}
