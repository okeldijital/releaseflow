import { create } from 'zustand';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { getDb } from '@/lib/firebase';

export type AppRole = 'owner' | 'admin' | 'release_manager' | 'contributor' | 'viewer';

function mapRoleIdToAppRole(roleId: string): AppRole {
  switch (roleId) {
    case 'owner': return 'owner';
    case 'admin': return 'admin';
    case 'release_manager': return 'release_manager';
    default: return 'contributor';
  }
}

interface RoleState {
  role: AppRole;
  loading: boolean;
  resolveRole: (userId: string) => Promise<void>;
  reset: () => void;
}

export const useRoleStore = create<RoleState>((set) => ({
  role: 'viewer',
  loading: true,
  resolveRole: async (userId: string) => {
    const db = getDb();
    if (!db) { set({ role: 'contributor', loading: false }); return; }
    try {
      const snap = await getDocs(
        query(collection(db, 'memberships'), where('userId', '==', userId), where('status', '==', 'active')),
      );
      if (!snap.empty) {
        const firstDoc = snap.docs[0];
        if (firstDoc) {
          const membership = firstDoc.data() as { roleId: string };
          set({ role: mapRoleIdToAppRole(membership.roleId), loading: false });
          return;
        }
      }
      set({ role: 'contributor', loading: false });
    } catch {
      set({ role: 'contributor', loading: false });
    }
  },
  reset: () => set({ role: 'viewer', loading: true }),
}));

export const ROLE_DEFAULT_ROUTES: Record<AppRole, string> = {
  owner: '/dashboard',
  admin: '/dashboard',
  release_manager: '/dashboard',
  contributor: '/contributor',
  viewer: '/dashboard',
};
