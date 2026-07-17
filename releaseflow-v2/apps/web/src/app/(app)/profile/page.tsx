'use client';

/**
 * PROF-001 — Mobile Profile Workspace
 *
 * Self-service account area:
 * Who am I? · Manage account · Control experience
 */

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/auth-context';
import { useOrgStore } from '@/stores/org-store';
import { signOut as firebaseSignOut } from '@firebase/auth';
import { getAuthInstance } from '@/lib/firebase';
import { useRoleStore } from '@/stores/role-store';
import { getOrganization } from '@/lib/organization-repository';
import { getPersonByOrganizationAndUserId } from '@/lib/people-repository';
import type { PersonRecord } from '@/lib/people-repository';
import { AuthorizationService } from '@/lib/auth/authorization-service';
import { platformRoleLabel } from '@/lib/people-platform';
import { Avatar, Button, Input, Skeleton, Select } from '@releaseflow/ui';
import { NotificationPreferencesPanel } from '@/components/profile/notification-preferences-panel';
import { ProfileAvatarUploader } from '@/components/profile/ProfileAvatarUploader';
import { ProfileSecurityPanel } from '@/components/profile/profile-security-panel';
import { StoragePanel } from '@/components/pwa/storage-panel';
import { InstallButton } from '@/components/pwa/install-button';
import {
  updateMyDisplayName,
  updateMyAvatar,
  removeMyAvatar,
} from '@/lib/profile-service';
import { toast } from '@/stores/toast-store';

function SectionCard({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-surface-700/60 bg-surface-900 px-4 sm:px-5 py-5">
      <header className="mb-4">
        <h2 className="text-sm font-semibold text-primary-400 tracking-tight">{title}</h2>
        {description ? (
          <p className="text-xs text-content-label mt-1 leading-relaxed">{description}</p>
        ) : null}
      </header>
      {children}
    </section>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-h-[52px] flex flex-col justify-center py-2.5 border-b border-surface-700/40 last:border-0">
      <p className="text-[11px] font-medium uppercase tracking-wider text-content-label">{label}</p>
      <p className="text-sm text-content-primary mt-0.5 break-all">{value || '—'}</p>
    </div>
  );
}

const THEME_OPTIONS = [
  { value: 'system', label: 'System' },
  { value: 'dark', label: 'Dark' },
  { value: 'light', label: 'Light (coming soon)' },
];

export default function ProfilePage() {
  const { user } = useAuth();
  const { activeOrgId } = useOrgStore();
  const router = useRouter();
  const [person, setPerson] = useState<PersonRecord | null>(null);
  const [orgName, setOrgName] = useState('');
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [nameDraft, setNameDraft] = useState('');
  const [photoURL, setPhotoURL] = useState<string | null>(null);
  const [savingName, setSavingName] = useState(false);
  const [theme, setTheme] = useState('system');
  const platformRole = AuthorizationService.getCurrentRole();

  const reload = useCallback(async () => {
    if (!user || !activeOrgId) {
      setLoading(false);
      return;
    }
    try {
      const [p, org] = await Promise.all([
        getPersonByOrganizationAndUserId(activeOrgId, user.uid),
        getOrganization(activeOrgId),
      ]);
      setPerson(p);
      setOrgName(org?.name ?? '');
      setPhotoURL(user.photoURL ?? p?.avatarUrl ?? null);
      setNameDraft(user.displayName ?? p?.displayName ?? '');
    } catch {
      setPerson(null);
      setPhotoURL(user.photoURL ?? null);
      setNameDraft(user.displayName ?? '');
    } finally {
      setLoading(false);
    }
  }, [user, activeOrgId]);

  useEffect(() => {
    void reload();
  }, [reload]);

  useEffect(() => {
    try {
      setTheme(localStorage.getItem('rf_theme') ?? 'system');
    } catch {
      setTheme('system');
    }
  }, []);

  async function handleSignOut() {
    try {
      const { clearOfflineDataOnLogout } = await import('@/lib/pwa/clear-on-logout');
      await clearOfflineDataOnLogout();
    } catch { /* ignore */ }
    const auth = getAuthInstance();
    if (auth) await firebaseSignOut(auth);
    useOrgStore.getState().setActiveOrgId(null);
    useOrgStore.getState().setOrgsLoaded(false);
    useRoleStore.getState().reset();
    router.replace('/sign-in');
  }

  async function handleSaveName() {
    if (!user) return;
    setSavingName(true);
    try {
      const name = await updateMyDisplayName(user, nameDraft, {
        personId: person?.id ?? null,
      });
      setNameDraft(name);
      setEditing(false);
      toast.success('Profile updated');
      // Auth state refreshes via Firebase; person already patched
      await reload();
    } catch (e) {
      toast.error((e as Error).message || 'Could not update name');
    } finally {
      setSavingName(false);
    }
  }

  async function handleAvatarUpload(file: File) {
    if (!user || !activeOrgId) {
      toast.error('Select an organization before uploading a photo');
      return;
    }
    try {
      const url = await updateMyAvatar(user, file, activeOrgId, {
        personId: person?.id ?? null,
      });
      setPhotoURL(url);
      toast.success('Photo updated');
      await reload();
    } catch (e) {
      toast.error((e as Error).message || 'Upload failed');
      throw e;
    }
  }

  async function handleAvatarRemove() {
    if (!user) return;
    try {
      await removeMyAvatar(user, { personId: person?.id ?? null });
      setPhotoURL(null);
      toast.success('Photo removed');
      await reload();
    } catch (e) {
      toast.error((e as Error).message || 'Could not remove photo');
      throw e;
    }
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-lg px-4 sm:px-6 py-10 page-transition">
        <div className="flex flex-col items-center gap-4 mb-8">
          <Skeleton className="h-20 w-20 rounded-full" />
          <Skeleton className="h-6 w-40" />
          <Skeleton className="h-4 w-52" />
        </div>
        <div className="space-y-4">
          <Skeleton variant="card" className="h-24" />
          <Skeleton variant="card" className="h-24" />
        </div>
      </div>
    );
  }

  const displayName =
    user?.displayName
    || person?.displayName
    || user?.email?.split('@')[0]
    || 'User';
  const roleLabel = platformRoleLabel(platformRole) || 'Member';
  const subtitle = [roleLabel, orgName].filter(Boolean).join(' · ');

  return (
    <div className="mx-auto max-w-lg px-4 sm:px-5 py-6 sm:py-8 page-transition pb-8 space-y-5">
      {/* 1 — Profile header */}
      <header className="flex flex-col items-center text-center pt-1 pb-2">
        <Avatar
          src={photoURL ?? undefined}
          name={displayName}
          size="2xl"
          className="ring-2 ring-surface-700/80"
        />
        <h1 className="text-xl sm:text-2xl font-semibold text-content-primary mt-4 tracking-tight">
          {displayName}
        </h1>
        {user?.email ? (
          <p className="text-sm text-content-secondary mt-1 break-all max-w-full px-2">
            {user.email}
          </p>
        ) : null}
        {subtitle ? (
          <p className="text-sm text-content-label mt-1.5">{subtitle}</p>
        ) : null}
        <Button
          size="sm"
          variant="outline"
          className="mt-4 min-h-[40px] px-5"
          onClick={() => {
            setNameDraft(displayName);
            setEditing((v) => !v);
          }}
        >
          {editing ? 'Close editor' : 'Edit Profile'}
        </Button>
      </header>

      {/* 2 — Edit profile */}
      {editing ? (
        <SectionCard
          title="Edit Profile"
          description="Update how you appear on assignments, comments, and activity."
        >
          <div className="space-y-5">
            <ProfileAvatarUploader
              currentImageUrl={photoURL}
              displayName={displayName}
              onUpload={handleAvatarUpload}
              onRemove={handleAvatarRemove}
            />
            <Input
              label="Display name"
              value={nameDraft}
              onChange={(e) => setNameDraft(e.target.value)}
              placeholder="Your name"
              autoComplete="name"
            />
            <Input
              label="Email"
              type="email"
              value={user?.email ?? ''}
              disabled
              hint="Email is your sign-in identity and cannot be changed here."
            />
            <Button
              variant="primary"
              className="w-full min-h-[48px]"
              loading={savingName}
              disabled={!nameDraft.trim()}
              onClick={() => void handleSaveName()}
            >
              Save changes
            </Button>
          </div>
        </SectionCard>
      ) : null}

      {/* 3 — Security */}
      {user ? (
        <SectionCard
          title="Security"
          description="Protect your account with a password change or reset email."
        >
          <ProfileSecurityPanel user={user} />
        </SectionCard>
      ) : null}

      {/* 4 — Notifications */}
      <SectionCard
        title="Notifications"
        description="Choose channels and categories for your operational inbox."
      >
        <NotificationPreferencesPanel />
      </SectionCard>

      {/* 5 — Account information */}
      <SectionCard
        title="Account Information"
        description="Read-only details linked to your membership."
      >
        <div className="-my-1">
          <InfoRow label="Email" value={user?.email ?? '—'} />
          <InfoRow label="Organisation" value={orgName || '—'} />
          <InfoRow label="Platform role" value={roleLabel} />
        </div>
      </SectionCard>

      {/* 6 — Preferences (appearance + app) */}
      <SectionCard
        title="Preferences"
        description="Appearance and app settings for this device."
      >
        <div className="space-y-5">
          <Select
            label="Theme"
            options={THEME_OPTIONS}
            value={theme}
            onChange={(v) => {
              setTheme(v);
              try {
                localStorage.setItem('rf_theme', v);
              } catch { /* ignore */ }
              if (v === 'light') {
                toast.info('Light theme is not available yet — using dark.');
              }
            }}
          />
          <div>
            <p className="text-[11px] font-medium uppercase tracking-wider text-content-label mb-2">
              Offline storage
            </p>
            <StoragePanel />
          </div>
          <div>
            <p className="text-[11px] font-medium uppercase tracking-wider text-content-label mb-2">
              Install app
            </p>
            <p className="text-xs text-content-label mb-3 leading-relaxed">
              Optional — faster launch and offline access on supported devices.
            </p>
            <InstallButton />
          </div>
        </div>
      </SectionCard>

      {/* 7 — Session */}
      <section className="pt-1 pb-2">
        <Button
          variant="danger"
          className="w-full min-h-[48px] text-base"
          onClick={() => void handleSignOut()}
        >
          Sign Out
        </Button>
        <p className="text-center text-[11px] text-content-label mt-3">
          Active sessions and device management coming later.
        </p>
      </section>
    </div>
  );
}
