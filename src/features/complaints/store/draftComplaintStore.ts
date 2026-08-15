import { create } from 'zustand';

import { ComplaintLocation } from '@/api/types/complaint.types';

export type DraftAttachmentKind = 'image' | 'document';

export interface DraftAttachment {
  id: string;
  uri: string;
  kind: DraftAttachmentKind;
  name?: string;
  mimeType?: string;
  size?: number;
}

export interface DraftClassification {
  status: 'idle' | 'loading' | 'success' | 'error';
  departmentId?: string;
  departmentName?: string;
  categoryId?: string;
  categoryName?: string;
  confidence: number;
  method?: string;
  error?: string;
}

interface DraftComplaintState {
  attachments: DraftAttachment[];
  categoryId?: string;
  clientRef: string;
  classification: DraftClassification;
  departmentId?: string;
  description: string;
  location?: ComplaintLocation;
  title: string;
  addAttachment: (attachment: Omit<DraftAttachment, 'id'>) => void;
  removeAttachment: (id: string) => void;
  reset: () => void;
  setCategory: (id: string) => void;
  setClassification: (classification: Partial<DraftClassification>) => void;
  setDepartment: (id: string) => void;
  setLocation: (location: ComplaintLocation) => void;
  setTitleDescription: (title: string, description: string) => void;
}

let idSequence = 0;

function newClientRef(prefix = 'draft') {
  idSequence += 1;

  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return `${prefix}-${crypto.randomUUID()}`;
  }

  return `${prefix}-${Date.now().toString(36)}-${idSequence.toString(36)}-${Math.random()
    .toString(36)
    .slice(2, 10)}`;
}

function createInitialState() {
  return {
    attachments: [],
    categoryId: undefined,
    clientRef: newClientRef(),
    classification: {
      confidence: 0,
      status: 'idle' as const,
    },
    departmentId: undefined,
    description: '',
    location: undefined,
    title: '',
  };
}

export const useDraftComplaintStore = create<DraftComplaintState>((set) => ({
  ...createInitialState(),
  addAttachment: (attachment) =>
    set((state) => ({
      attachments: [...state.attachments, { id: newClientRef('attachment'), ...attachment }],
    })),
  removeAttachment: (id) =>
    set((state) => ({
      attachments: state.attachments.filter((attachment) => attachment.id !== id),
    })),
  reset: () => set(createInitialState()),
  setCategory: (id) => set({ categoryId: id }),
  setClassification: (classification) =>
    set((state) => ({ classification: { ...state.classification, ...classification } })),
  setDepartment: (id) => set({ categoryId: undefined, departmentId: id }),
  setLocation: (location) => set({ location }),
  setTitleDescription: (title, description) => set({ description, title }),
}));
