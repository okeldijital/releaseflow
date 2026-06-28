import { create } from 'zustand';
import { getUserRole } from '@/lib/organization-repository';

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
    try {
      const roleId = await getUserRole(userId);
      set({ role: mapRoleIdToAppRole(roleId), loading: false });
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
