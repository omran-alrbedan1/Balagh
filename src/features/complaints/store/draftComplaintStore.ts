import { create } from 'zustand';

import { ComplaintLocation } from '@/api/types/complaint.types';

export interface DraftAttachment {
  id: string;
  uri: string;
}

interface DraftComplaintState {
  attachments: DraftAttachment[];
  categoryId?: string;
  clientRef: string;
  departmentId?: string;
  description: string;
  location?: ComplaintLocation;
  title: string;
  addAttachment: (uri: string) => void;
  removeAttachment: (id: string) => void;
  reset: () => void;
  setCategory: (id: string) => void;
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
    departmentId: undefined,
    description: '',
    location: undefined,
    title: '',
  };
}

export const useDraftComplaintStore = create<DraftComplaintState>((set) => ({
  ...createInitialState(),
  addAttachment: (uri) =>
    set((state) => ({
      attachments: [...state.attachments, { id: newClientRef('attachment'), uri }],
    })),
  removeAttachment: (id) =>
    set((state) => ({
      attachments: state.attachments.filter((attachment) => attachment.id !== id),
    })),
  reset: () => set(createInitialState()),
  setCategory: (id) => set({ categoryId: id }),
  setDepartment: (id) => set({ categoryId: undefined, departmentId: id }),
  setLocation: (location) => set({ location }),
  setTitleDescription: (title, description) => set({ description, title }),
}));
