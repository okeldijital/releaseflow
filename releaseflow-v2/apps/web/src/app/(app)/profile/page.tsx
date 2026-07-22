'use client';

/**
 * PROF-001 / BUILD-014B — Profile Workspace
 * Identity from CurrentUserProvider (users/{uid}), never Auth photoURL/displayName.
 */

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useCurrentUser } from '@/contexts/current-user-context';
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
  const {
    auth,
    profile,
    identity,
    loading: profileLoading,
    uploadAvatar,
    removeAvatar,
    updateDisplayName,
  } = useCurrentUser();
  const { activeOrgId } = useOrgStore();
  const router = useRouter();
  const [person, setPerson] = useState<PersonRecord | null>(null);
  const [orgName, setOrgName] = useState('');
  const [personLoading, setPersonLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [nameDraft, setNameDraft] = useState('');
  const [savingName, setSavingName] = useState(false);
  const [theme, setTheme] = useState('system');
  const platformRole = AuthorizationService.getCurrentRole();

  const reloadPerson = useCallback(async () => {
    if (!auth?.uid || !activeOrgId) {
      setPersonLoading(false);
      return;
    }
    try {
      const [p, org] = await Promise.all([
        getPersonByOrganizationAndUserId(activeOrgId, auth.uid),
        getOrganization(activeOrgId),
      ]);
      setPerson(p);
      setOrgName(org?.name ?? '');
    } catch {
      setPerson(null);
    } finally {
      setPersonLoading(false);
    }
  }, [auth?.uid, activeOrgId]);

  useEffect(() => {
    void reloadPerson();
  }, [reloadPerson]);

  useEffect(() => {
    if (identity?.displayName) setNameDraft(identity.displayName);
    else if (profile?.displayName) setNameDraft(profile.displayName);
  }, [identity?.displayName, profile?.displayName]);

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
    const authInst = getAuthInstance();
    if (authInst) await firebaseSignOut(authInst);
    useOrgStore.getState().setActiveOrgId(null);
    useOrgStore.getState().setOrgsLoaded(false);
    useRoleStore.getState().reset();
    router.replace('/sign-in');
  }

  async function handleSaveName() {
    setSavingName(true);
    try {
      const name = await updateDisplayName(nameDraft, {
        personId: person?.id ?? null,
      });
      setNameDraft(name);
      setEditing(false);
      toast.success('Profile updated');
    } catch (e) {
      toast.error((e as Error).message || 'Could not update name');
    } finally {
      setSavingName(false);
    }
  }

  async function handleAvatarUpload(file: File) {
    if (!activeOrgId) {
      toast.error('Select an organization before uploading a photo');
      return;
    }
    try {
      await uploadAvatar(file, activeOrgId, {
        personId: person?.id ?? null,
      });
      toast.success('Photo updated');
    } catch (e) {
      toast.error((e as Error).message || 'Upload failed');
      throw e;
    }
  }

  async function handleAvatarRemove() {
    try {
      await removeAvatar({ personId: person?.id ?? null });
      toast.success('Photo removed');
    } catch (e) {
      toast.error((e as Error).message || 'Could not remove photo');
      throw e;
    }
  }

  if (profileLoading || personLoading) {
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

  const displayName = identity?.displayName || profile?.displayName || 'User';
  const avatarUrl = identity?.avatarUrl ?? profile?.avatarUrl ?? null;
  const email = profile?.email || identity?.email || '';
  const roleLabel = platformRoleLabel(platformRole) || 'Member';

  return (
    <div className="mx-auto max-w-lg px-4 sm:px-5 py-6 sm:py-8 page-transition pb-8 space-y-5">
      <header className="flex flex-col items-center text-center pt-1 pb-2">
        <Avatar
          src={avatarUrl}
          name={displayName}
          size="2xl"
          className="ring-2 ring-surface-700/80"
        />
        <h1 className="text-xl sm:text-2xl font-semibold text-content-primary mt-4 tracking-tight">
          {displayName}
        </h1>
        {email ? (
          <p className="text-sm text-content-secondary mt-1 break-all max-w-full px-2">
            {email}
          </p>
        ) : null}
        {(roleLabel || orgName) ? (
          <p className="text-sm text-content-label mt-1.5">
            {[roleLabel, orgName].filter(Boolean).join(' · ')}
          </p>
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

      {editing ? (
        <SectionCard
          title="Edit Profile"
          description="Update how you appear on assignments, comments, and activity."
        >
          <div className="space-y-5">
            <ProfileAvatarUploader
              currentImageUrl={avatarUrl}
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
              value={email}
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

      {auth ? (
        <SectionCard
          title="Security"
          description="Protect your account with a password change or reset email."
        >
          <ProfileSecurityPanel user={auth} />
        </SectionCard>
      ) : null}

      <SectionCard
        title="Notifications"
        description="Choose channels and categories for your operational inbox."
      >
        <NotificationPreferencesPanel />
      </SectionCard>

      <SectionCard
        title="Account Information"
        description="Read-only details linked to your membership."
      >
        <div className="-my-1">
          <InfoRow label="Email" value={email || '—'} />
          <InfoRow label="Organisation" value={orgName || '—'} />
          <InfoRow label="Platform role" value={roleLabel} />
        </div>
      </SectionCard>

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
