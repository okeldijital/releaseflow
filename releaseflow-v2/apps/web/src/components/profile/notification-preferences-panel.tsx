'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/auth-context';
import {
  getNotificationPreferences,
  updateNotificationPreferences,
  type NotificationPreferencesRecord,
} from '@/lib/notification-preferences-repository';
import {
  PREFERENCE_LABELS,
  type PreferenceKey,
} from '@/lib/notification-type-registry';
import { Button, LoadingState } from '@releaseflow/ui';
import { toast } from '@/stores/toast-store';

const PREF_KEYS = Object.keys(PREFERENCE_LABELS) as PreferenceKey[];

export function NotificationPreferencesPanel() {
  const { user } = useAuth();
  const [prefs, setPrefs] = useState<NotificationPreferencesRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!user?.uid) { setLoading(false); return; }
    void getNotificationPreferences(user.uid)
      .then(setPrefs)
      .catch(() => setPrefs(null))
      .finally(() => setLoading(false));
  }, [user?.uid]);

  const save = async (next: NotificationPreferencesRecord) => {
    if (!user?.uid) return;
    setSaving(true);
    try {
      const updated = await updateNotificationPreferences(user.uid, {
        emailEnabled: next.emailEnabled,
        pushEnabled: next.pushEnabled,
        inAppEnabled: next.inAppEnabled,
        preferences: next.preferences,
      });
      setPrefs(updated);
      toast.success('Notification preferences saved');
    } catch (e) {
      toast.error((e as Error).message || 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <LoadingState />;
  if (!prefs) return <p className="text-sm text-text-500">Unable to load preferences.</p>;

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs text-text-500 uppercase tracking-widest mb-3">Channels</p>
        <div className="space-y-3">
          {([
            ['inAppEnabled', 'In-App'] as const,
            ['emailEnabled', 'Email'] as const,
            ['pushEnabled', 'Push'] as const,
          ]).map(([key, label]) => (
            <label key={key} className="flex items-center justify-between gap-3 text-sm text-surface-100">
              <span>{label}</span>
              <input
                type="checkbox"
                className="h-4 w-4 rounded border-surface-600"
                checked={prefs[key]}
                disabled={saving}
                onChange={(e) => {
                  const next = { ...prefs, [key]: e.target.checked };
                  setPrefs(next);
                  void save(next);
                }}
              />
            </label>
          ))}
        </div>
        <p className="text-xs text-text-500 mt-2">
          In-app is your Inbox. Email is sent only for important events when enabled.
          Push is queued for FCM delivery when enabled and a device is registered.
        </p>
      </div>

      <div>
        <p className="text-xs text-text-500 uppercase tracking-widest mb-3">Categories</p>
        <div className="space-y-3">
          {PREF_KEYS.map((key) => (
            <label key={key} className="flex items-center justify-between gap-3 text-sm text-surface-100">
              <span>{PREFERENCE_LABELS[key]}</span>
              <input
                type="checkbox"
                className="h-4 w-4 rounded border-surface-600"
                checked={prefs.preferences[key] !== false}
                disabled={saving}
                onChange={(e) => {
                  const next = {
                    ...prefs,
                    preferences: { ...prefs.preferences, [key]: e.target.checked },
                  };
                  setPrefs(next);
                  void save(next);
                }}
              />
            </label>
          ))}
        </div>
      </div>

      <Button size="sm" variant="ghost" loading={saving} onClick={() => prefs && void save(prefs)}>
        Save preferences
      </Button>
    </div>
  );
}
