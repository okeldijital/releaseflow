'use client';

/**
 * BUILD-014B — CurrentUserProvider
 *
 * AuthProvider → CurrentUserProvider → profile (users/{uid}) → Application
 *
 * UI identity comes from profile, never Firebase Auth photoURL/displayName.
 */

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import type { User } from '@firebase/auth';
import { useAuth } from '@/contexts/auth-context';
import {
  getUserProfile,
  subscribeUserProfile,
  type UserProfileRecord,
  type UserProfilePatch,
} from '@/lib/user-profile-repository';
import {
  identityFromProfile,
  type Identity,
} from '@/lib/identity-service';
import {
  updateMyAvatar,
  removeMyAvatar,
  updateMyDisplayName,
  updateMyProfile,
} from '@/lib/profile-service';

export interface CurrentUserValue {
  /** Firebase Auth user (credentials only — not for UI identity). */
  auth: User | null | undefined;
  /** Canonical application profile from users/{uid}. */
  profile: UserProfileRecord | null;
  /** Resolved identity for Avatar / display. */
  identity: Identity | null;
  loading: boolean;
  error: string | null;
  /** Re-fetch profile (also driven by realtime listener). */
  refresh: () => Promise<void>;
  /** Patch profile via canonical profile-service. */
  update: (
    fields: UserProfilePatch,
    opts?: { personId?: string | null },
  ) => Promise<UserProfileRecord | null>;
  uploadAvatar: (
    file: File,
    organizationId: string,
    opts?: { personId?: string | null },
  ) => Promise<string>;
  removeAvatar: (opts?: { personId?: string | null }) => Promise<void>;
  updateDisplayName: (
    name: string,
    opts?: { personId?: string | null },
  ) => Promise<string>;
}

const CurrentUserContext = createContext<CurrentUserValue | null>(null);

function fallbackProfileFromAuth(user: User): UserProfileRecord {
  return {
    id: user.uid,
    displayName: user.email?.split('@')[0] || 'User',
    email: user.email ?? '',
    avatarUrl: null,
    avatarPublicId: null,
    biography: null,
    timezone: null,
    locale: null,
    onboardingCompleted: false,
    createdAt: null,
    updatedAt: null,
  };
}

export function CurrentUserProvider({ children }: { children: ReactNode }) {
  const { user: auth, loading: authLoading } = useAuth();
  const [profile, setProfile] = useState<UserProfileRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!auth?.uid) {
      setProfile(null);
      setLoading(false);
      return;
    }
    try {
      const p = await getUserProfile(auth.uid);
      if (p) {
        setProfile(p);
        setError(null);
      } else {
        // Profile missing: safe fallback (email local-part). Never Auth photoURL.
        setProfile(fallbackProfileFromAuth(auth));
        setError(null);
      }
    } catch (err) {
      console.error('[CurrentUserProvider] refresh failed', err);
      setError(err instanceof Error ? err.message : 'Failed to load profile');
      setProfile(fallbackProfileFromAuth(auth));
    } finally {
      setLoading(false);
    }
  }, [auth]);

  // Realtime users/{uid} listener — single source for current user cache
  useEffect(() => {
    if (authLoading) return;
    if (!auth?.uid) {
      setProfile(null);
      setLoading(false);
      setError(null);
      return;
    }

    setLoading(true);
    const unsub = subscribeUserProfile(
      auth.uid,
      (p) => {
        if (p) {
          setProfile(p);
          setError(null);
        } else {
          setProfile(fallbackProfileFromAuth(auth));
        }
        setLoading(false);
      },
      (err) => {
        console.error('[CurrentUserProvider] subscribe failed', err);
        setError(err.message);
        void refresh();
      },
    );
    return unsub;
  }, [auth, authLoading, refresh]);

  const update = useCallback(
    async (fields: UserProfilePatch, opts?: { personId?: string | null }) => {
      if (!auth) throw new Error('Not signed in');
      const next = await updateMyProfile(auth, fields, opts);
      if (next) setProfile(next);
      else await refresh();
      return next;
    },
    [auth, refresh],
  );

  const uploadAvatar = useCallback(
    async (
      file: File,
      organizationId: string,
      opts?: { personId?: string | null },
    ) => {
      if (!auth) throw new Error('Not signed in');
      const url = await updateMyAvatar(auth, file, organizationId, opts);
      await refresh();
      return url;
    },
    [auth, refresh],
  );

  const removeAvatar = useCallback(
    async (opts?: { personId?: string | null }) => {
      if (!auth) throw new Error('Not signed in');
      await removeMyAvatar(auth, opts);
      await refresh();
    },
    [auth, refresh],
  );

  const updateDisplayName = useCallback(
    async (name: string, opts?: { personId?: string | null }) => {
      if (!auth) throw new Error('Not signed in');
      const n = await updateMyDisplayName(auth, name, opts);
      await refresh();
      return n;
    },
    [auth, refresh],
  );

  const identity = useMemo(
    () => (profile ? identityFromProfile(profile) : null),
    [profile],
  );

  const value = useMemo<CurrentUserValue>(
    () => ({
      auth,
      profile,
      identity,
      loading: authLoading || loading,
      error,
      refresh,
      update,
      uploadAvatar,
      removeAvatar,
      updateDisplayName,
    }),
    [
      auth,
      profile,
      identity,
      authLoading,
      loading,
      error,
      refresh,
      update,
      uploadAvatar,
      removeAvatar,
      updateDisplayName,
    ],
  );

  return (
    <CurrentUserContext.Provider value={value}>
      {children}
    </CurrentUserContext.Provider>
  );
}

export function useCurrentUser(): CurrentUserValue {
  const ctx = useContext(CurrentUserContext);
  if (!ctx) {
    throw new Error('useCurrentUser must be used within CurrentUserProvider');
  }
  return ctx;
}

/** Safe optional access when provider may not wrap (e.g. public pages). */
export function useCurrentUserOptional(): CurrentUserValue | null {
  return useContext(CurrentUserContext);
}
