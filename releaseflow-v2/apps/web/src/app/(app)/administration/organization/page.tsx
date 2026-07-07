'use client';

import { useState, useEffect } from 'react';
import { useOrgStore } from '@/stores/org-store';
import { getOrganization, updateOrganization } from '@/lib/organization-repository';
import type { OrganizationRecord } from '@/lib/organization-repository';
import {
  getOrganizationSettings,
  createOrganizationSettings,
  updateOrganizationSettings,
} from '@/lib/organization-settings-repository';
import type { OrganizationSettingsRecord } from '@/lib/organization-settings-repository';
import {
  getOrganizationPreferences,
  createOrganizationPreferences,
  updateOrganizationPreferences,
} from '@/lib/organization-preferences-repository';
import type { OrganizationPreferencesRecord } from '@/lib/organization-preferences-repository';
import { Button, Input, Select, Checkbox } from '@releaseflow/ui';

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

const LANGUAGE_OPTIONS = [
  { value: 'en-US', label: 'English (US)' },
  { value: 'en-GB', label: 'English (UK)' },
  { value: 'fr', label: 'Français' },
  { value: 'de', label: 'Deutsch' },
  { value: 'es', label: 'Español' },
  { value: 'ja', label: '日本語' },
  { value: 'pt-BR', label: 'Português (BR)' },
  { value: 'zh-CN', label: '中文 (简体)' },
];

const RELEASE_TYPE_OPTIONS = [
  { value: 'single', label: 'Single' },
  { value: 'ep', label: 'EP' },
  { value: 'album', label: 'Album' },
  { value: 'mixtape', label: 'Mixtape' },
  { value: 'compilation', label: 'Compilation' },
];

const SPEC_TEMPLATE_OPTIONS = [
  { value: 'mastering', label: 'Mastering' },
  { value: 'mixing', label: 'Mixing' },
  { value: 'artwork', label: 'Artwork' },
];

export default function AdministrationOrganizationPage() {
  const { activeOrgId } = useOrgStore();
  const [org, setOrg] = useState<OrganizationRecord | null>(null);
  const [settings, setSettings] = useState<OrganizationSettingsRecord | null>(null);
  const [prefs, setPrefs] = useState<OrganizationPreferencesRecord | null>(null);

  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');

  const [logoUrl, setLogoUrl] = useState('');
  const [brandColor, setBrandColor] = useState('');
  const [timezone, setTimezone] = useState('UTC');
  const [defaultLanguage, setDefaultLanguage] = useState('en-US');
  const [label, setLabel] = useState('');

  const [distChannel, setDistChannel] = useState('');
  const [distReleaseDate, setDistReleaseDate] = useState('');

  const [defaultReleaseType, setDefaultReleaseType] = useState('single');
  const [defaultSpecTemplates, setDefaultSpecTemplates] = useState<string[]>(['mastering']);
  const [namingConvention, setNamingConvention] = useState('');
  const [defaultDueDateOffset, setDefaultDueDateOffset] = useState(14);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (!activeOrgId) { setLoading(false); return; }
    let cancelled = false;
    async function load() {
      const orgData = await getOrganization(activeOrgId!);
      const settingsData = await getOrganizationSettings(activeOrgId!);
      const prefsData = await getOrganizationPreferences(activeOrgId!);
      if (cancelled) return;
      setOrg(orgData);
      setSettings(settingsData);
      setPrefs(prefsData);
      if (orgData) {
        setName(orgData.name);
        setSlug(orgData.slug);
      }
      if (settingsData) {
        setLogoUrl(settingsData.logoUrl ?? '');
        setBrandColor(settingsData.brandColor ?? '');
        setTimezone(settingsData.timezone);
        setDefaultLanguage(settingsData.defaultLanguage);
        setLabel(settingsData.label ?? '');
        setDistChannel(settingsData.distributionDefaults?.channel ?? '');
        setDistReleaseDate(settingsData.distributionDefaults?.releaseDate ?? '');
      }
      if (prefsData) {
        setDefaultReleaseType(prefsData.defaultReleaseType);
        setDefaultSpecTemplates(prefsData.defaultSpecTemplates);
        setNamingConvention(prefsData.namingConvention ?? '');
        setDefaultDueDateOffset(prefsData.defaultDueDateOffset);
      }
      setLoading(false);
    }
    load();
    return () => { cancelled = true; };
  }, [activeOrgId]);

  async function handleSave() {
    if (!activeOrgId) return;
    setSaving(true);
    setSaved(false);

    const orgSlug = slug.trim() || name.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    await updateOrganization(activeOrgId, { name: name.trim(), slug: orgSlug });

    const settingsFields = {
      name: name.trim(),
      logoUrl: logoUrl || null,
      brandColor: brandColor || null,
      timezone,
      defaultLanguage,
      label: label || null,
      distributionDefaults: distChannel || distReleaseDate
        ? { channel: distChannel || undefined, releaseDate: distReleaseDate || undefined }
        : null,
    };

    if (settings) {
      await updateOrganizationSettings(activeOrgId, settingsFields);
    } else {
      await createOrganizationSettings({ orgId: activeOrgId, ...settingsFields });
      setSettings(await getOrganizationSettings(activeOrgId));
    }

    const prefsFields = {
      defaultReleaseType,
      defaultSpecTemplates,
      namingConvention: namingConvention || null,
      defaultDueDateOffset,
    };

    if (prefs) {
      await updateOrganizationPreferences(activeOrgId, prefsFields);
    } else {
      await createOrganizationPreferences({ orgId: activeOrgId, ...prefsFields });
      setPrefs(await getOrganizationPreferences(activeOrgId));
    }

    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  function toggleSpecTemplate(value: string) {
    setDefaultSpecTemplates((prev) =>
      prev.includes(value) ? prev.filter((v) => v !== value) : [...prev, value],
    );
  }

  if (!activeOrgId) {
    return (
      <div className="mx-auto max-w-4xl px-5 sm:px-7 py-8 page-transition">
        <div className="mb-8">
          <p className="text-display-md font-semibold text-text-900 tracking-tight">Organization</p>
          <p className="text-sm text-text-500 mt-1">Organization details, branding, and logo</p>
        </div>
        <div className="text-center py-20 text-sm text-text-400">No organization selected.</div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-4xl px-5 sm:px-7 py-8 page-transition">
        <div className="mb-8">
          <p className="text-display-md font-semibold text-text-900 tracking-tight">Organization</p>
          <p className="text-sm text-text-500 mt-1">Organization details, branding, and logo</p>
        </div>
        <div className="text-center py-20 text-sm text-text-400">Loading&hellip;</div>
      </div>
    );
  }

  if (!org) {
    return (
      <div className="mx-auto max-w-4xl px-5 sm:px-7 py-8 page-transition">
        <div className="mb-8">
          <p className="text-display-md font-semibold text-text-900 tracking-tight">Organization</p>
          <p className="text-sm text-text-500 mt-1">Organization details, branding, and logo</p>
        </div>
        <div className="text-center py-20 text-sm text-text-400">Organization not found.</div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-5 sm:px-7 py-8 page-transition">
      <div className="mb-8">
        <p className="text-display-md font-semibold text-text-900 tracking-tight">Organization</p>
        <p className="text-sm text-text-500 mt-1">Organization details, branding, and logo</p>
      </div>

      <div className="space-y-6">
        <div className="rounded-xl border border-surface-200/80 bg-layer-2 px-6 py-6 space-y-5">
          <Input label="Name" type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="Organization name" />
          <Input label="Slug" type="text" value={slug} onChange={(e) => setSlug(e.target.value)} placeholder="org-slug" hint="Used in URLs and identifiers" />

          <Input label="Logo URL" type="url" value={logoUrl} onChange={(e) => setLogoUrl(e.target.value)} placeholder="https://..." hint="Organization logo image URL" />

          <Input label="Brand Color" type="text" value={brandColor} onChange={(e) => setBrandColor(e.target.value)} placeholder="#FF5733" hint="Hex color code (e.g. #FF5733)" />

          <Input label="Label / Record Label" type="text" value={label} onChange={(e) => setLabel(e.target.value)} placeholder="Optional record label name" />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Select label="Timezone" options={TIMEZONE_OPTIONS} value={timezone} onChange={setTimezone} />
            <Select label="Default Language" options={LANGUAGE_OPTIONS} value={defaultLanguage} onChange={setDefaultLanguage} />
          </div>

          <div className="border-t border-surface-100 pt-5 space-y-4">
            <p className="text-xs font-semibold text-text-400 uppercase tracking-wider">Distribution Defaults</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input label="Default Channel" type="text" value={distChannel} onChange={(e) => setDistChannel(e.target.value)} placeholder="e.g. Spotify, Apple Music" />
              <Input label="Default Release Date" type="date" value={distReleaseDate} onChange={(e) => setDistReleaseDate(e.target.value)} />
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-surface-200/80 bg-layer-2 px-6 py-6 space-y-5">
          <div>
            <p className="text-sm font-semibold text-text-900">Workspace Preferences</p>
            <p className="text-xs text-text-400 mt-1">Default settings for new releases and workflows</p>
          </div>

          <Select label="Default Release Type" options={RELEASE_TYPE_OPTIONS} value={defaultReleaseType} onChange={setDefaultReleaseType} />

          <div>
            <p className="mb-2 block text-sm font-medium text-text-700 dark:text-text-300">Default Specification Templates</p>
            <div className="flex flex-wrap gap-4">
              {SPEC_TEMPLATE_OPTIONS.map((opt) => (
                <Checkbox
                  key={opt.value}
                  label={opt.label}
                  checked={defaultSpecTemplates.includes(opt.value)}
                  onChange={() => toggleSpecTemplate(opt.value)}
                />
              ))}
            </div>
          </div>

          <Input label="Naming Convention" type="text" value={namingConvention} onChange={(e) => setNamingConvention(e.target.value)} placeholder="e.g. {artist} - {title} (Version)" hint="Template for release naming across the workspace." />

          <Input label="Default Due Date Offset (days)" type="number" value={String(defaultDueDateOffset)} onChange={(e) => setDefaultDueDateOffset(Number(e.target.value) || 0)} hint="Default number of days from creation to due date" />
        </div>

        <div className="flex items-center gap-3">
          <Button variant="primary" onClick={handleSave} loading={saving}>Save changes</Button>
          {saved && <span className="text-sm text-success-600">Saved</span>}
        </div>
      </div>
    </div>
  );
}
