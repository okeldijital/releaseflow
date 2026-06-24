import { create } from 'zustand';

interface OrgStore {
  activeOrgId: string | null;
  setActiveOrgId: (id: string | null) => void;
}

export const useOrgStore = create<OrgStore>((set) => ({
  activeOrgId: null,
  setActiveOrgId: (id) => set({ activeOrgId: id }),
}));
