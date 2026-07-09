'use client';

import { useState, useEffect } from 'react';
import { updateProfile } from '@firebase/auth';
import { doc, setDoc, getDoc, Timestamp } from '@firebase/firestore';
import { useAuth } from '@/contexts/auth-context';
import { getDb } from '@/lib/firebase';
import { Button, Input, Select, Checkbox, TextArea } from '@releaseflow/ui';

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

function getStored(key: string, fallback: string): string {
  if (typeof window === 'undefined') return fallback;
  try { return localStorage.getItem(key) ?? fallback; } catch { return fallback; }
}

async function loadUserPreferences(userId: string): Promise<Record<string, unknown>> {
  const db = getDb();
  if (!db) return {};
  const snap = await getDoc(doc(db, 'user_preferences', userId));
  if (!snap.exists()) return {};
  const data = snap.data();
  return (data.preferences ?? {}) as Record<string, unknown>;
}

async function saveUserPreferences(userId: string, preferences: Record<string, unknown>): Promise<void> {
  const db = getDb();
  if (!db) return;
  await setDoc(doc(db, 'user_preferences', userId), {
    preferences,
    updatedAt: Timestamp.now(),
  }, { merge: true });
}

export default function AdministrationProfilePage() {
  const { user } = useAuth();
  const [displayName, setDisplayName] = useState('');
  const [photoURL, setPhotoURL] = useState('');
  const [biography, setBiography] = useState('');
  const [timezone, setTimezone] = useState(() => getStored('rf_user_timezone', 'UTC'));
  const [locale, setLocale] = useState(() => getStored('rf_user_locale', 'en-US'));
  const [notifEmail, setNotifEmail] = useState(true);
  const [notifDigest, setNotifDigest] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (user) {
      setDisplayName(user.displayName ?? '');
      setPhotoURL(user.photoURL ?? '');
    }
  }, [user]);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    async function load() {
      const prefs = await loadUserPreferences(user!.uid);
      if (cancelled) return;
      if (prefs.biography) setBiography(prefs.biography as string);
      if (typeof prefs.notifEmail === 'boolean') setNotifEmail(prefs.notifEmail);
      if (typeof prefs.notifDigest === 'boolean') setNotifDigest(prefs.notifDigest);
    }
    load();
    return () => { cancelled = true; };
  }, [user]);

  async function handleSave() {
    if (!user) return;
    setSaving(true);
    setSaved(false);
    await updateProfile(user, { displayName: displayName || null, photoURL: photoURL || null });
    try { localStorage.setItem('rf_user_timezone', timezone); } catch { /* ignore */ }
    try { localStorage.setItem('rf_user_locale', locale); } catch { /* ignore */ }
    await saveUserPreferences(user.uid, { biography, notifEmail, notifDigest });
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  return (
    <div className="mx-auto max-w-4xl px-5 sm:px-7 py-8 page-transition">
      <div className="mb-8">
        <p className="text-display-md font-semibold text-text-900 tracking-tight">Profile</p>
        <p className="text-sm text-text-500 mt-1">Your profile, display name, avatar, timezone, locale</p>
      </div>

      <div className="space-y-6">
        <div className="rounded-xl border border-surface-200/80 bg-layer-2 px-6 py-6 space-y-5">
          <Input label="Email" type="email" value={user?.email ?? ''} disabled />

          <Input label="Display Name" type="text" value={displayName} onChange={(e) => setDisplayName(e.target.value)} placeholder="Your display name" />

          <Input label="Avatar URL" type="url" value={photoURL} onChange={(e) => setPhotoURL(e.target.value)} placeholder="https://..." hint="Used as avatar across ReleaseFlow" />

          <TextArea label="Biography" value={biography} onChange={(e) => setBiography(e.target.value)} placeholder="Tell teammates about yourself" rows={4} />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Select label="Timezone" options={TIMEZONE_OPTIONS} value={timezone} onChange={setTimezone} />
            <Select label="Locale" options={LOCALE_OPTIONS} value={locale} onChange={setLocale} />
          </div>
        </div>

        <div className="rounded-xl border border-surface-200/80 bg-layer-2 px-6 py-6 space-y-5">
          <div>
            <p className="text-sm font-semibold text-text-900">Notification Preferences</p>
            <p className="text-xs text-text-400 mt-1">Control how you receive notifications</p>
          </div>

          <div className="space-y-3">
            <Checkbox label="Email notifications for releases, approvals, and mentions" checked={notifEmail} onChange={setNotifEmail} />
            <Checkbox label="Daily digest summary" checked={notifDigest} onChange={setNotifDigest} />
          </div>

          <p className="text-xs text-text-400 italic">More notification options coming soon.</p>
        </div>

        <div className="flex items-center gap-3">
          <Button variant="primary" onClick={handleSave} loading={saving}>Save changes</Button>
          {saved && <span className="text-sm text-success-600">Saved</span>}
        </div>
      </div>
    </div>
  );
}
