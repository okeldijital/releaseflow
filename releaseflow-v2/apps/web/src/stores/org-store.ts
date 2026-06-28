import { create } from 'zustand';

interface OrgStore {
  activeOrgId: string | null;
  orgsLoaded: boolean;
  setActiveOrgId: (id: string | null) => void;
  setOrgsLoaded: (loaded: boolean) => void;
}

export const useOrgStore = create<OrgStore>((set) => ({
  activeOrgId: null,
  orgsLoaded: false,
  setActiveOrgId: (id) => set({ activeOrgId: id }),
  setOrgsLoaded: (loaded) => set({ orgsLoaded: loaded }),
}));
