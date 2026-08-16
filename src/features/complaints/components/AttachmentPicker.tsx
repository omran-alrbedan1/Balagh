import * as DocumentPicker from 'expo-document-picker';
import * as ImageManipulator from 'expo-image-manipulator';
import * as ImagePicker from 'expo-image-picker';
import { Camera, FileText, ImagePlus, X } from 'lucide-react-native';
import { Alert, Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import {
  DraftAttachment,
  useDraftComplaintStore,
} from '@/features/complaints/store/draftComplaintStore';
import { colors } from '@/theme/colors';
import { spacing } from '@/theme/spacing';

export const MAX_ATTACHMENTS = 5;
export const MAX_FILE_BYTES = 5 * 1024 * 1024;
export const ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
];

async function compressImage(uri: string) {
  const result = await ImageManipulator.manipulateAsync(uri, [{ resize: { width: 1280 } }], {
    compress: 0.7,
    format: ImageManipulator.SaveFormat.JPEG,
  });

  return result.uri;
}

export function AttachmentPicker() {
  const attachments = useDraftComplaintStore((state) => state.attachments);
  const addAttachment = useDraftComplaintStore((state) => state.addAttachment);
  const removeAttachment = useDraftComplaintStore((state) => state.removeAttachment);

  return (
    <ControlledAttachmentPicker
      attachments={attachments}
      captionKey="complaints.photoCaption"
      onAdd={addAttachment}
      onRemove={removeAttachment}
    />
  );
}

export type SelectableAttachment = DraftAttachment;

interface ControlledAttachmentPickerProps {
  attachments: SelectableAttachment[];
  captionKey?: string;
  disabled?: boolean;
  onAdd: (attachment: Omit<SelectableAttachment, 'id'>) => void;
  onRemove: (id: string) => void;
}

export function ControlledAttachmentPicker({
  attachments,
  captionKey = 'complaints.responseAttachmentCaption',
  disabled = false,
  onAdd,
  onRemove,
}: ControlledAttachmentPickerProps) {
  const { t } = useTranslation();
  const canAddMore = attachments.length < MAX_ATTACHMENTS;

  const guardLimit = () => {
    if (canAddMore) {
      return true;
    }

    Alert.alert(
      t('permissions.limitReached'),
      t('permissions.photoLimit', { max: MAX_ATTACHMENTS }),
    );

    return false;
  };

  const handlePickImage = async (source: 'camera' | 'gallery') => {
    if (!guardLimit()) {
      return;
    }

    const permission =
      source === 'camera'
        ? await ImagePicker.requestCameraPermissionsAsync()
        : await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permission.granted) {
      Alert.alert(
        t('permissions.permissionNeeded'),
        t('permissions.photoAccess', {
          source: source === 'camera' ? t('permissions.camera') : t('permissions.photoLibrary'),
        }),
      );
      return;
    }

    const result =
      source === 'camera'
        ? await ImagePicker.launchCameraAsync({ quality: 0.8 })
        : await ImagePicker.launchImageLibraryAsync({
            allowsMultipleSelection: true,
            quality: 0.8,
          });

    if (result.canceled) {
      return;
    }

    const remaining = MAX_ATTACHMENTS - attachments.length;

    for (const asset of result.assets.slice(0, remaining)) {
      const compressedUri = await compressImage(asset.uri);
      onAdd({
        kind: 'image',
        mimeType: 'image/jpeg',
        name: asset.fileName ? `${asset.fileName.replace(/\.[^.]+$/, '')}.jpg` : 'image.jpg',
        uri: compressedUri,
      });
    }
  };

  const handlePickDocument = async () => {
    if (!guardLimit()) {
      return;
    }

    const result = await DocumentPicker.getDocumentAsync({
      copyToCacheDirectory: true,
      multiple: true,
      type: ALLOWED_MIME_TYPES,
    });

    if (result.canceled) {
      return;
    }

    const remaining = MAX_ATTACHMENTS - attachments.length;

    for (const asset of result.assets.slice(0, remaining)) {
      const mimeType = asset.mimeType ?? '';

      if (!ALLOWED_MIME_TYPES.includes(mimeType)) {
        Alert.alert(t('permissions.unsupportedFile'), t('permissions.unsupportedFileMessage'));
        continue;
      }

      if (asset.size != null && asset.size > MAX_FILE_BYTES) {
        Alert.alert(
          t('permissions.fileTooLarge'),
          t('permissions.fileTooLargeMessage', { max: 5 }),
        );
        continue;
      }

      const draftAttachment: Omit<DraftAttachment, 'id'> = {
        kind: 'document',
        uri: asset.uri,
        name: asset.name,
        mimeType,
        size: asset.size,
      };
      onAdd(draftAttachment);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.actions}>
        <Pressable
          accessibilityRole="button"
          disabled={disabled}
          onPress={() => void handlePickImage('camera')}
          style={[styles.pickButton, disabled && styles.disabled]}
        >
          <Camera color={colors.primary} size={18} />
          <Text style={styles.pickText}>{t('complaints.camera')}</Text>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          disabled={disabled}
          onPress={() => void handlePickImage('gallery')}
          style={[styles.pickButton, disabled && styles.disabled]}
        >
          <ImagePlus color={colors.primary} size={18} />
          <Text style={styles.pickText}>{t('complaints.gallery')}</Text>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          disabled={disabled}
          onPress={() => void handlePickDocument()}
          style={[styles.pickButton, disabled && styles.disabled]}
        >
          <FileText color={colors.primary} size={18} />
          <Text style={styles.pickText}>{t('complaints.document')}</Text>
        </Pressable>
      </View>

      <View style={styles.grid}>
        {attachments.map((attachment) =>
          attachment.kind === 'image' ? (
            <View key={attachment.id} style={styles.thumbnailWrap}>
              <Image source={{ uri: attachment.uri }} style={styles.thumbnail} />
              <Pressable
                accessibilityLabel={t('complaints.removeAttachment')}
                accessibilityRole="button"
                disabled={disabled}
                onPress={() => onRemove(attachment.id)}
                style={styles.removeButton}
              >
                <X color="#FFFFFF" size={14} />
              </Pressable>
            </View>
          ) : (
            <View key={attachment.id} style={styles.documentCard}>
              <FileText color={colors.primary} size={20} />
              <Text numberOfLines={1} style={styles.documentName}>
                {attachment.name ?? t('complaints.document')}
              </Text>
              <Pressable
                accessibilityLabel={t('complaints.removeAttachment')}
                accessibilityRole="button"
                disabled={disabled}
                onPress={() => onRemove(attachment.id)}
                style={styles.removeButton}
              >
                <X color="#FFFFFF" size={14} />
              </Pressable>
            </View>
          ),
        )}
      </View>

      <Text style={styles.caption}>
        {t(captionKey, { count: attachments.length, max: MAX_ATTACHMENTS })}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  actions: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  caption: {
    color: colors.textMuted,
    fontSize: 13,
  },
  container: {
    gap: spacing.md,
  },
  documentCard: {
    alignItems: 'center',
    backgroundColor: colors.primarySoft,
    borderColor: colors.primaryLight,
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: 'row',
    gap: spacing.sm,
    maxWidth: 220,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    position: 'relative',
  },
  documentName: {
    color: colors.text,
    flex: 1,
    fontSize: 13,
    fontWeight: '700',
  },
  disabled: {
    opacity: 0.5,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  pickButton: {
    alignItems: 'center',
    backgroundColor: colors.primarySoft,
    borderColor: colors.primaryLight,
    borderRadius: 8,
    borderWidth: 1,
    flex: 1,
    flexDirection: 'row',
    gap: spacing.sm,
    justifyContent: 'center',
    minHeight: 56,
  },
  pickText: {
    color: colors.primary,
    fontWeight: '800',
  },
  removeButton: {
    alignItems: 'center',
    backgroundColor: colors.danger,
    borderRadius: 12,
    height: 24,
    justifyContent: 'center',
    position: 'absolute',
    right: -6,
    top: -6,
    width: 24,
  },
  thumbnail: {
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: 8,
    height: 84,
    width: 84,
  },
  thumbnailWrap: {
    position: 'relative',
  },
});
