import { create } from 'zustand';

const STORAGE_KEY = 'rf_active_org_id';

function getPersistedOrgId(): string | null {
  if (typeof window === 'undefined') return null;
  try { return localStorage.getItem(STORAGE_KEY); } catch { return null; }
}

function persistOrgId(id: string | null) {
  if (typeof window === 'undefined') return;
  try {
    if (id) localStorage.setItem(STORAGE_KEY, id);
    else localStorage.removeItem(STORAGE_KEY);
  } catch { /* quota or private mode – degrade silently */ }
}

interface OrgStore {
  activeOrgId: string | null;
  orgsLoaded: boolean;
  switchingOrg: boolean;
  orgVersion: number;
  artistCatalogueVersion: number;
  setActiveOrgId: (id: string | null) => void;
  setOrgsLoaded: (loaded: boolean) => void;
  setSwitchingOrg: (switching: boolean) => void;
  bumpArtistCatalogue: () => void;
}

export const useOrgStore = create<OrgStore>((set) => ({
  activeOrgId: getPersistedOrgId(),
  orgsLoaded: false,
  switchingOrg: false,
  orgVersion: 0,
  artistCatalogueVersion: 0,
  bumpArtistCatalogue: () => set((s) => ({ artistCatalogueVersion: s.artistCatalogueVersion + 1 })),
  setActiveOrgId: (id) => {
    persistOrgId(id);
    set((s) => ({ activeOrgId: id, switchingOrg: true, orgVersion: s.orgVersion + 1 }));
    if (typeof window !== 'undefined') {
      setTimeout(() => set({ switchingOrg: false }), 600);
    }
  },
  setOrgsLoaded: (loaded) => set({ orgsLoaded: loaded }),
  setSwitchingOrg: (switching) => set({ switchingOrg: switching }),
}));
