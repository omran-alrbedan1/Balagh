import { Directory, File, Paths } from 'expo-file-system';

import { AttachmentUpload } from '@/api/endpoints/complaints.api';

const OFFLINE_ATTACHMENTS_DIRECTORY = 'offline-complaints';

export interface PersistedAttachments {
  attachments: AttachmentUpload[];
  directoryUri?: string;
}

function safeFileName(name: string, index: number) {
  const normalized = name.replace(/[^a-zA-Z0-9._-]/g, '_').slice(-100);
  return `${index + 1}-${normalized || 'attachment'}`;
}

export async function persistOfflineAttachments(
  queueItemId: string,
  attachments: AttachmentUpload[],
): Promise<PersistedAttachments> {
  if (attachments.length === 0) {
    return { attachments: [] };
  }

  const directory = new Directory(Paths.document, OFFLINE_ATTACHMENTS_DIRECTORY, queueItemId);

  try {
    directory.create({ idempotent: true, intermediates: true });
    const persisted: AttachmentUpload[] = [];

    for (const [index, attachment] of attachments.entries()) {
      const source = new File(attachment.uri);
      const destination = new File(directory, safeFileName(attachment.name ?? source.name, index));

      if (!source.exists) {
        throw new Error(`Attachment is no longer available: ${attachment.name ?? source.name}`);
      }

      await source.copy(destination);
      if (!destination.exists) {
        throw new Error(`Attachment could not be saved: ${attachment.name ?? source.name}`);
      }

      persisted.push({
        uri: destination.uri,
        name: attachment.name ?? source.name,
        mimeType: attachment.mimeType,
      });
    }

    return { attachments: persisted, directoryUri: directory.uri };
  } catch (error) {
    if (directory.exists) {
      directory.delete();
    }
    throw error;
  }
}

export async function removeOfflineAttachments(directoryUri?: string): Promise<void> {
  if (!directoryUri) {
    return;
  }

  const ownedRoot = new Directory(Paths.document, OFFLINE_ATTACHMENTS_DIRECTORY);
  const directory = new Directory(directoryUri);
  const normalizedRoot = ownedRoot.uri.endsWith('/') ? ownedRoot.uri : `${ownedRoot.uri}/`;

  if (!directory.uri.startsWith(normalizedRoot)) {
    throw new Error('Refusing to delete attachments outside the offline queue directory.');
  }

  if (directory.exists) {
    directory.delete();
  }
}
