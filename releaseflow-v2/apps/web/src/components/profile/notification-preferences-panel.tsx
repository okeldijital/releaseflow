'use client';

/**
 * PROF-001 / NOT-001 — Grouped notification preferences for the Profile workspace.
 */

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
import { LoadingState } from '@releaseflow/ui';
import { toast } from '@/stores/toast-store';

const CHANNELS = [
  ['inAppEnabled', 'In-App'] as const,
  ['pushEnabled', 'Push'] as const,
  ['emailEnabled', 'Email'] as const,
];

/** Grouped preference keys for scannable mobile UI. */
const PREF_GROUPS: { title: string; keys: PreferenceKey[] }[] = [
  {
    title: 'Assignments',
    keys: ['assignmentAssigned', 'assignmentLifecycle'],
  },
  {
    title: 'Comments',
    keys: ['commentReply', 'commentMention'],
  },
  {
    title: 'Reviews',
    keys: ['reviewRequested', 'reviewOutcome'],
  },
  {
    title: 'Schedule',
    keys: ['dueReminder', 'overdueReminder'],
  },
  {
    title: 'Releases',
    keys: ['releaseUpdates'],
  },
  {
    title: 'Invitations',
    keys: ['invitationAccepted', 'invitationRevoked'],
  },
];

function ToggleRow({
  label,
  checked,
  disabled,
  onChange,
}: {
  label: string;
  checked: boolean;
  disabled?: boolean;
  onChange: (next: boolean) => void;
}) {
  return (
    <label className="flex items-center justify-between gap-3 min-h-[44px] text-sm text-content-primary">
      <span className="min-w-0">{label}</span>
      <input
        type="checkbox"
        className="h-4 w-4 shrink-0 rounded border-surface-600 accent-primary-500"
        checked={checked}
        disabled={disabled}
        onChange={(e) => onChange(e.target.checked)}
      />
    </label>
  );
}

export function NotificationPreferencesPanel() {
  const { user } = useAuth();
  const [prefs, setPrefs] = useState<NotificationPreferencesRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!user?.uid) {
      setLoading(false);
      return;
    }
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
      toast.success('Preferences saved');
    } catch (e) {
      toast.error((e as Error).message || 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <LoadingState />;
  if (!prefs) {
    return <p className="text-sm text-content-secondary">Unable to load preferences.</p>;
  }

  return (
    <div className="space-y-6">
      <div>
        <p className="text-[11px] font-medium uppercase tracking-wider text-content-label mb-2">
          Channels
        </p>
        <div className="space-y-0.5">
          {CHANNELS.map(([key, label]) => (
            <ToggleRow
              key={key}
              label={label}
              checked={prefs[key]}
              disabled={saving}
              onChange={(checked) => {
                const next = { ...prefs, [key]: checked };
                setPrefs(next);
                void save(next);
              }}
            />
          ))}
        </div>
        <p className="text-xs text-content-label mt-2 leading-relaxed">
          In-app is your Inbox. Email is limited to important events. Push requires a registered device.
        </p>
      </div>

      {PREF_GROUPS.map((group) => {
        const keys = group.keys.filter((k) => k in PREFERENCE_LABELS);
        if (keys.length === 0) return null;
        return (
          <div key={group.title}>
            <p className="text-[11px] font-medium uppercase tracking-wider text-content-label mb-2">
              {group.title}
            </p>
            <div className="space-y-0.5">
              {keys.map((key) => (
                <ToggleRow
                  key={key}
                  label={PREFERENCE_LABELS[key]}
                  checked={prefs.preferences[key] !== false}
                  disabled={saving}
                  onChange={(checked) => {
                    const next = {
                      ...prefs,
                      preferences: { ...prefs.preferences, [key]: checked },
                    };
                    setPrefs(next);
                    void save(next);
                  }}
                />
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
