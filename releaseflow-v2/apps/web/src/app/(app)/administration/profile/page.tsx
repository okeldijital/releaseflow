'use client';

/**
 * BUILD-014B — Administration profile uses the same profile-service
 * as /profile. No Auth-only avatar writes.
 */

import { useEffect, useState } from 'react';
import { useCurrentUser } from '@/contexts/current-user-context';
import { useOrgStore } from '@/stores/org-store';
import { getPersonByOrganizationAndUserId } from '@/lib/people-repository';
import { Button, Input, Select, Checkbox, TextArea } from '@releaseflow/ui';
import { ProfileAvatarUploader } from '@/components/profile/ProfileAvatarUploader';
import { toast } from '@/stores/toast-store';

const TIMEZONE_OPTIONS = [
  { value: 'UTC', label: 'UTC' },
  { value: 'America/New_York', label: 'America/New_York' },
  { value: 'America/Chicago', label: 'America/Chicago' },
  { value: 'America/Denver', label: 'America/Denver' },
  { value: 'America/Los_Angeles', label: 'America/Los_Angeles' },
  { value: 'Europe/London', label: 'Europe/London' },
  { value: 'Europe/Berlin', label: 'Europe/Berlin' },
  { value: 'Asia/Tokyo', label: 'Asia/Tokyo' },
  { value: 'Asia/Shanghai', label: 'Asia/Shanghai' },
  { value: 'Australia/Sydney', label: 'Australia/Sydney' },
];

const LOCALE_OPTIONS = [
  { value: 'en-US', label: 'English (US)' },
  { value: 'en-GB', label: 'English (UK)' },
  { value: 'fr', label: 'Français' },
  { value: 'de', label: 'Deutsch' },
  { value: 'es', label: 'Español' },
  { value: 'ja', label: '日本語' },
  { value: 'pt-BR', label: 'Português (BR)' },
  { value: 'zh-CN', label: '中文 (简体)' },
];

export default function AdministrationProfilePage() {
  const {
    auth,
    profile,
    identity,
    update,
    uploadAvatar,
    removeAvatar,
  } = useCurrentUser();
  const { activeOrgId } = useOrgStore();
  const [personId, setPersonId] = useState<string | null>(null);
  const [displayName, setDisplayName] = useState('');
  const [biography, setBiography] = useState('');
  const [timezone, setTimezone] = useState('UTC');
  const [locale, setLocale] = useState('en-US');
  const [notifEmail, setNotifEmail] = useState(true);
  const [notifDigest, setNotifDigest] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (!profile && !identity) return;
    setDisplayName(identity?.displayName || profile?.displayName || '');
    setBiography(profile?.biography ?? '');
    setTimezone(profile?.timezone ?? 'UTC');
    setLocale(profile?.locale ?? 'en-US');
  }, [profile, identity]);

  useEffect(() => {
    if (!auth?.uid || !activeOrgId) return;
    void getPersonByOrganizationAndUserId(activeOrgId, auth.uid)
      .then((p) => setPersonId(p?.id ?? null))
      .catch(() => setPersonId(null));
  }, [auth?.uid, activeOrgId]);

  const avatarUrl = identity?.avatarUrl ?? profile?.avatarUrl ?? null;
  const email = profile?.email || identity?.email || '';

  async function handleSave() {
    if (!auth) return;
    setSaving(true);
    setSaved(false);
    try {
      await update(
        {
          displayName,
          biography: biography || null,
          timezone,
          locale,
        },
        { personId },
      );
      // Local-only notification prefs (not identity)
      try {
        localStorage.setItem('rf_user_timezone', timezone);
        localStorage.setItem('rf_user_locale', locale);
        localStorage.setItem('rf_notif_email', String(notifEmail));
        localStorage.setItem('rf_notif_digest', String(notifDigest));
      } catch { /* ignore */ }
      setSaved(true);
      toast.success('Profile saved');
      setTimeout(() => setSaved(false), 2000);
    } catch (e) {
      toast.error((e as Error).message || 'Save failed');
    } finally {
      setSaving(false);
    }
  }

  async function handleAvatarUpload(file: File) {
    if (!activeOrgId) {
      toast.error('Select an organization before uploading a photo');
      return;
    }
    try {
      await uploadAvatar(file, activeOrgId, { personId });
      toast.success('Photo updated');
    } catch (e) {
      toast.error((e as Error).message || 'Upload failed');
      throw e;
    }
  }

  async function handleAvatarRemove() {
    try {
      await removeAvatar({ personId });
      toast.success('Photo removed');
    } catch (e) {
      toast.error((e as Error).message || 'Could not remove photo');
      throw e;
    }
  }

  return (
    <div className="mx-auto max-w-4xl px-5 sm:px-7 py-8 page-transition">
      <div className="mb-8">
        <p className="text-display-md font-semibold text-primary-400 tracking-tight">Profile</p>
        <p className="text-sm text-text-500 mt-1">
          Your profile, display name, avatar, timezone, locale
        </p>
      </div>

      <div className="space-y-6">
        <div className="rounded-xl border border-surface-200/80 bg-layer-2 px-6 py-6 space-y-5">
          <ProfileAvatarUploader
            currentImageUrl={avatarUrl}
            displayName={displayName || 'User'}
            onUpload={handleAvatarUpload}
            onRemove={handleAvatarRemove}
          />

          <Input label="Email" type="email" value={email} disabled />

          <Input
            label="Display Name"
            type="text"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            placeholder="Your display name"
          />

          <TextArea
            label="Biography"
            value={biography}
            onChange={(e) => setBiography(e.target.value)}
            placeholder="Tell teammates about yourself"
            rows={4}
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Select
              label="Timezone"
              options={TIMEZONE_OPTIONS}
              value={timezone}
              onChange={setTimezone}
            />
            <Select
              label="Locale"
              options={LOCALE_OPTIONS}
              value={locale}
              onChange={setLocale}
            />
          </div>

          <div className="space-y-2">
            <Checkbox
              label="Email notifications"
              checked={notifEmail}
              onChange={setNotifEmail}
            />
            <Checkbox
              label="Daily digest"
              checked={notifDigest}
              onChange={setNotifDigest}
            />
          </div>

          <div className="flex items-center gap-3">
            <Button variant="primary" loading={saving} onClick={() => void handleSave()}>
              Save profile
            </Button>
            {saved ? (
              <span className="text-sm text-success-600">Saved</span>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
