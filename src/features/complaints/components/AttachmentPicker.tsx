import * as ImageManipulator from 'expo-image-manipulator';
import * as ImagePicker from 'expo-image-picker';
import { Camera, ImagePlus, X } from 'lucide-react-native';
import { Alert, Image, Pressable, StyleSheet, Text, View } from 'react-native';

import { useDraftComplaintStore } from '@/features/complaints/store/draftComplaintStore';
import { colors } from '@/theme/colors';
import { spacing } from '@/theme/spacing';

const MAX_ATTACHMENTS = 5;

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
  const canAddMore = attachments.length < MAX_ATTACHMENTS;

  const handlePick = async (source: 'camera' | 'gallery') => {
    if (!canAddMore) {
      Alert.alert('Limit reached', `You can attach up to ${MAX_ATTACHMENTS} photos.`);
      return;
    }

    const permission =
      source === 'camera'
        ? await ImagePicker.requestCameraPermissionsAsync()
        : await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permission.granted) {
      Alert.alert(
        'Permission needed',
        `Please allow ${source === 'camera' ? 'camera' : 'photo library'} access to attach a photo.`,
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

    for (const asset of result.assets.slice(0, MAX_ATTACHMENTS - attachments.length)) {
      const compressedUri = await compressImage(asset.uri);
      addAttachment(compressedUri);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.actions}>
        <Pressable onPress={() => void handlePick('camera')} style={styles.pickButton}>
          <Camera color={colors.primary} size={18} />
          <Text style={styles.pickText}>Camera</Text>
        </Pressable>
        <Pressable onPress={() => void handlePick('gallery')} style={styles.pickButton}>
          <ImagePlus color={colors.primary} size={18} />
          <Text style={styles.pickText}>Gallery</Text>
        </Pressable>
      </View>

      <View style={styles.grid}>
        {attachments.map((attachment) => (
          <View key={attachment.id} style={styles.thumbnailWrap}>
            <Image source={{ uri: attachment.uri }} style={styles.thumbnail} />
            <Pressable
              accessibilityLabel="Remove photo"
              accessibilityRole="button"
              onPress={() => removeAttachment(attachment.id)}
              style={styles.removeButton}
            >
              <X color="#FFFFFF" size={14} />
            </Pressable>
          </View>
        ))}
      </View>

      <Text style={styles.caption}>
        {attachments.length}/{MAX_ATTACHMENTS} photos attached (optional but recommended)
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
