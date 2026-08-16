/* eslint-disable import/first */
const mockExistingFiles = new Set<string>(['file:///cache/photo.jpg', 'content://document/1']);
const mockDirectories = new Set<string>();
const mockDeletedDirectories: string[] = [];
let mockCopyError: Error | undefined;

jest.mock('expo-file-system', () => {
  const join = (parts: any[]) => {
    const values = parts.map((part) => (typeof part === 'string' ? part : part.uri));
    return values
      .slice(1)
      .reduce((path, value) => `${path.replace(/\/$/, '')}/${value.replace(/^\//, '')}`, values[0]);
  };

  class Directory {
    uri: string;
    constructor(...parts: any[]) {
      this.uri = join(parts).replace(/\/$/, '');
    }
    get exists() {
      return mockDirectories.has(this.uri);
    }
    create() {
      mockDirectories.add(this.uri);
    }
    delete() {
      mockDeletedDirectories.push(this.uri);
      mockDirectories.delete(this.uri);
    }
  }

  class File {
    uri: string;
    constructor(...parts: any[]) {
      this.uri = join(parts);
    }
    get exists() {
      return mockExistingFiles.has(this.uri);
    }
    get name() {
      return this.uri.split('/').pop() || 'attachment';
    }
    async copy(destination: File) {
      if (mockCopyError) throw mockCopyError;
      mockExistingFiles.add(destination.uri);
    }
  }

  return { Directory, File, Paths: { document: { uri: 'file:///documents' } } };
});

import {
  persistOfflineAttachments,
  removeOfflineAttachments,
} from '@/features/complaints/utils/offlineAttachmentStorage';

beforeEach(() => {
  mockDirectories.clear();
  mockDeletedDirectories.length = 0;
  mockCopyError = undefined;
  mockExistingFiles.add('file:///cache/photo.jpg');
  mockExistingFiles.add('content://document/1');
});

it('copies attachments into a queue-item-owned document directory with metadata', async () => {
  const result = await persistOfflineAttachments('queue-1', [
    { uri: 'file:///cache/photo.jpg', name: 'street photo.jpg', mimeType: 'image/jpeg' },
    { uri: 'content://document/1', name: 'report.pdf', mimeType: 'application/pdf' },
  ]);

  expect(result.directoryUri).toBe('file:///documents/offline-complaints/queue-1');
  expect(result.attachments).toEqual([
    expect.objectContaining({
      uri: 'file:///documents/offline-complaints/queue-1/1-street_photo.jpg',
      name: 'street photo.jpg',
      mimeType: 'image/jpeg',
    }),
    expect.objectContaining({
      uri: 'file:///documents/offline-complaints/queue-1/2-report.pdf',
      name: 'report.pdf',
      mimeType: 'application/pdf',
    }),
  ]);
});

it('cleans up the owned directory when attachment copying fails', async () => {
  mockCopyError = new Error('disk full');

  await expect(
    persistOfflineAttachments('queue-2', [
      { uri: 'file:///cache/photo.jpg', name: 'photo.jpg', mimeType: 'image/jpeg' },
    ]),
  ).rejects.toThrow('disk full');

  expect(mockDeletedDirectories).toContain('file:///documents/offline-complaints/queue-2');
});

it('only deletes directories owned by the offline queue', async () => {
  mockDirectories.add('file:///documents/offline-complaints/queue-3');
  await removeOfflineAttachments('file:///documents/offline-complaints/queue-3');
  expect(mockDeletedDirectories).toContain('file:///documents/offline-complaints/queue-3');

  await expect(removeOfflineAttachments('file:///documents/profile')).rejects.toThrow(
    'Refusing to delete',
  );
});
