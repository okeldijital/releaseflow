'use client';

/**
 * BUILD-301D / 301E / 301F — Organization Storage Settings.
 * Locations, policies, templates, routing preview, and durable storage references.
 * Not a file browser. Not discovery. Not provider account management.
 */

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useOrgStore } from '@/stores/org-store';
import { useAuth } from '@/contexts/auth-context';
import {
  Button,
  EmptyState,
  Input,
  LoadingState,
  Select,
  StatusBadge,
} from '@releaseflow/ui';
import type {
  StorageLocationSafeDto,
  StorageProviderCatalogEntry,
  StorageLocationStatus,
} from '@/lib/storage/storage-location-types';
import type { StoragePolicySafeDto } from '@/lib/storage/storage-policy-types';
import type { FolderTemplateSafeDto } from '@/lib/storage/folder-template-types';
import type { AssetRoutingPreviewDto } from '@/lib/storage/asset-routing-types';
import type { StorageReferenceSafeDto } from '@/lib/storage/storage-reference-types';
import { ROUTABLE_ASSET_TYPES } from '@/lib/storage/storage-policy-types';
import { FOLDER_TEMPLATE_VARIABLES } from '@/lib/storage/folder-template-types';
import type { AssetType } from '@/lib/asset-entity-repository';

async function authHeaders(token: string, organizationId: string): Promise<HeadersInit> {
  return {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
    'x-organization-id': organizationId,
  };
}

const ASSET_TYPE_OPTIONS = ROUTABLE_ASSET_TYPES.map((t) => ({
  value: t,
  label: t.charAt(0).toUpperCase() + t.slice(1),
}));

export default function AdministrationStoragePage() {
  const { activeOrgId } = useOrgStore();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [locations, setLocations] = useState<StorageLocationSafeDto[]>([]);
  const [providers, setProviders] = useState<StorageProviderCatalogEntry[]>([]);
  const [policies, setPolicies] = useState<StoragePolicySafeDto[]>([]);
  const [templates, setTemplates] = useState<FolderTemplateSafeDto[]>([]);
  const [references, setReferences] = useState<StorageReferenceSafeDto[]>([]);

  // Location form
  const [name, setName] = useState('');
  const [providerId, setProviderId] = useState('cloudinary');
  const [rootPath, setRootPath] = useState('/ReleaseFlow');
  const [isDefault, setIsDefault] = useState(false);

  // Template form
  const [tplName, setTplName] = useState('');
  const [tplStructure, setTplStructure] = useState('/{Artist}/{Release}/{AssetType}');
  const [tplDescription, setTplDescription] = useState('');

  // Policy form
  const [polName, setPolName] = useState('');
  const [polAssetType, setPolAssetType] = useState<AssetType>('audio');
  const [polLocationId, setPolLocationId] = useState('');
  const [polTemplateId, setPolTemplateId] = useState('');
  const [polVersioning, setPolVersioning] = useState(false);
  const [polAutoCreate, setPolAutoCreate] = useState(true);

  // Routing preview
  const [previewAssetType, setPreviewAssetType] = useState<AssetType>('audio');
  const [previewArtist, setPreviewArtist] = useState('Lua');
  const [previewRelease, setPreviewRelease] = useState('Lua');
  const [previewResult, setPreviewResult] = useState<AssetRoutingPreviewDto | null>(null);
  const [previewError, setPreviewError] = useState('');

  const load = useCallback(async () => {
    if (!activeOrgId || !user) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError('');
    try {
      const token = await user.getIdToken();
      const headers = await authHeaders(token, activeOrgId);
      const qs = `?organizationId=${encodeURIComponent(activeOrgId)}`;
      const [locRes, provRes, polRes, tplRes, refRes] = await Promise.all([
        fetch(`/api/storage/locations${qs}`, { headers }),
        fetch(`/api/storage/providers${qs}`, { headers }),
        fetch(`/api/storage/policies${qs}`, { headers }),
        fetch(`/api/storage/folder-templates${qs}`, { headers }),
        fetch(`/api/storage/references${qs}`, { headers }),
      ]);
      if (
        locRes.status === 401 ||
        provRes.status === 401 ||
        polRes.status === 401 ||
        tplRes.status === 401 ||
        refRes.status === 401
      ) {
        setError('Unauthorized');
        return;
      }
      if (
        locRes.status === 403 ||
        provRes.status === 403 ||
        polRes.status === 403 ||
        tplRes.status === 403 ||
        refRes.status === 403
      ) {
        setError('You do not have permission to view storage settings.');
        return;
      }
      if (!locRes.ok || !provRes.ok || !polRes.ok || !tplRes.ok || !refRes.ok) {
        setError('Storage configuration could not be loaded.');
        return;
      }
      const locJson = (await locRes.json()) as { locations: StorageLocationSafeDto[] };
      const provJson = (await provRes.json()) as { providers: StorageProviderCatalogEntry[] };
      const polJson = (await polRes.json()) as { policies: StoragePolicySafeDto[] };
      const tplJson = (await tplRes.json()) as { templates: FolderTemplateSafeDto[] };
      const refJson = (await refRes.json()) as { references: StorageReferenceSafeDto[] };
      setLocations(locJson.locations ?? []);
      setProviders(provJson.providers ?? []);
      setPolicies(polJson.policies ?? []);
      setTemplates(tplJson.templates ?? []);
      setReferences(refJson.references ?? []);
      if (provJson.providers?.[0]) {
        setProviderId(provJson.providers[0].providerId);
      }
      const activeLocs = (locJson.locations ?? []).filter((l) => l.status === 'active');
      if (activeLocs[0]) {
        setPolLocationId((prev) => prev || activeLocs[0]!.id);
      }
      const activeTpls = (tplJson.templates ?? []).filter((t) => t.active);
      if (activeTpls[0]) {
        setPolTemplateId((prev) => prev || activeTpls[0]!.id);
      }
    } catch {
      setError('Storage configuration could not be loaded.');
    } finally {
      setLoading(false);
    }
  }, [activeOrgId, user]);

  useEffect(() => {
    void load();
  }, [load]);

  async function handleCreateLocation() {
    if (!activeOrgId || !user) return;
    setSaving(true);
    setError('');
    try {
      const token = await user.getIdToken();
      const res = await fetch('/api/storage/locations', {
        method: 'POST',
        headers: await authHeaders(token, activeOrgId),
        body: JSON.stringify({
          organizationId: activeOrgId,
          name,
          providerId,
          rootPath,
          isDefault,
        }),
      });
      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { error?: string };
        setError(data.error || 'Storage configuration could not be saved.');
        return;
      }
      setName('');
      setIsDefault(false);
      setRootPath('/ReleaseFlow');
      await load();
    } catch {
      setError('Storage configuration could not be saved.');
    } finally {
      setSaving(false);
    }
  }

  async function patchLocation(
    id: string,
    body: { status?: StorageLocationStatus; isDefault?: boolean },
  ) {
    if (!activeOrgId || !user) return;
    setSaving(true);
    setError('');
    try {
      const token = await user.getIdToken();
      const res = await fetch(
        `/api/storage/locations/${id}?organizationId=${encodeURIComponent(activeOrgId)}`,
        {
          method: 'PATCH',
          headers: await authHeaders(token, activeOrgId),
          body: JSON.stringify({ organizationId: activeOrgId, ...body }),
        },
      );
      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { error?: string };
        setError(data.error || 'Storage location could not be updated.');
        return;
      }
      await load();
    } catch {
      setError('Storage location could not be updated.');
    } finally {
      setSaving(false);
    }
  }

  async function removeLocation(id: string) {
    if (!activeOrgId || !user) return;
    setSaving(true);
    setError('');
    try {
      const token = await user.getIdToken();
      const res = await fetch(
        `/api/storage/locations/${id}?organizationId=${encodeURIComponent(activeOrgId)}`,
        {
          method: 'DELETE',
          headers: await authHeaders(token, activeOrgId),
        },
      );
      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { error?: string };
        setError(data.error || 'Storage location could not be updated.');
        return;
      }
      await load();
    } catch {
      setError('Storage location could not be updated.');
    } finally {
      setSaving(false);
    }
  }

  async function handleCreateTemplate() {
    if (!activeOrgId || !user) return;
    setSaving(true);
    setError('');
    try {
      const token = await user.getIdToken();
      const res = await fetch('/api/storage/folder-templates', {
        method: 'POST',
        headers: await authHeaders(token, activeOrgId),
        body: JSON.stringify({
          organizationId: activeOrgId,
          name: tplName,
          structure: tplStructure,
          description: tplDescription || null,
          active: true,
        }),
      });
      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { error?: string };
        setError(data.error || 'Folder template could not be saved.');
        return;
      }
      setTplName('');
      setTplDescription('');
      setTplStructure('/{Artist}/{Release}/{AssetType}');
      await load();
    } catch {
      setError('Folder template could not be saved.');
    } finally {
      setSaving(false);
    }
  }

  async function patchTemplate(id: string, body: { active?: boolean }) {
    if (!activeOrgId || !user) return;
    setSaving(true);
    setError('');
    try {
      const token = await user.getIdToken();
      const res = await fetch(
        `/api/storage/folder-templates/${id}?organizationId=${encodeURIComponent(activeOrgId)}`,
        {
          method: 'PATCH',
          headers: await authHeaders(token, activeOrgId),
          body: JSON.stringify({ organizationId: activeOrgId, ...body }),
        },
      );
      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { error?: string };
        setError(data.error || 'Folder template could not be updated.');
        return;
      }
      await load();
    } catch {
      setError('Folder template could not be updated.');
    } finally {
      setSaving(false);
    }
  }

  async function removeTemplate(id: string) {
    if (!activeOrgId || !user) return;
    setSaving(true);
    setError('');
    try {
      const token = await user.getIdToken();
      const res = await fetch(
        `/api/storage/folder-templates/${id}?organizationId=${encodeURIComponent(activeOrgId)}`,
        {
          method: 'DELETE',
          headers: await authHeaders(token, activeOrgId),
        },
      );
      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { error?: string };
        setError(data.error || 'Folder template could not be deleted.');
        return;
      }
      await load();
    } catch {
      setError('Folder template could not be deleted.');
    } finally {
      setSaving(false);
    }
  }

  const activeLocations = useMemo(
    () => locations.filter((l) => l.status === 'active'),
    [locations],
  );
  const activeTemplates = useMemo(
    () => templates.filter((t) => t.active),
    [templates],
  );

  function canSavePolicy(): boolean {
    if (!polName.trim()) return false;
    if (!polLocationId || !polTemplateId) return false;
    const loc = locations.find((l) => l.id === polLocationId);
    const tpl = templates.find((t) => t.id === polTemplateId);
    if (!loc || loc.status === 'disabled') return false;
    if (!tpl || !tpl.active) return false;
    const conflict = policies.some(
      (p) => p.active && p.assetType === polAssetType,
    );
    if (conflict) return false;
    return true;
  }

  async function handleCreatePolicy() {
    if (!activeOrgId || !user || !canSavePolicy()) return;
    setSaving(true);
    setError('');
    try {
      const token = await user.getIdToken();
      const res = await fetch('/api/storage/policies', {
        method: 'POST',
        headers: await authHeaders(token, activeOrgId),
        body: JSON.stringify({
          organizationId: activeOrgId,
          name: polName,
          assetType: polAssetType,
          storageLocationId: polLocationId,
          folderTemplateId: polTemplateId,
          versioningEnabled: polVersioning,
          autoCreateFolders: polAutoCreate,
          active: true,
        }),
      });
      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { error?: string };
        setError(data.error || 'Storage policy could not be saved.');
        return;
      }
      setPolName('');
      setPolVersioning(false);
      setPolAutoCreate(true);
      await load();
    } catch {
      setError('Storage policy could not be saved.');
    } finally {
      setSaving(false);
    }
  }

  async function patchPolicy(id: string, body: { active?: boolean }) {
    if (!activeOrgId || !user) return;
    setSaving(true);
    setError('');
    try {
      const token = await user.getIdToken();
      const res = await fetch(
        `/api/storage/policies/${id}?organizationId=${encodeURIComponent(activeOrgId)}`,
        {
          method: 'PATCH',
          headers: await authHeaders(token, activeOrgId),
          body: JSON.stringify({ organizationId: activeOrgId, ...body }),
        },
      );
      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { error?: string };
        setError(data.error || 'Storage policy could not be updated.');
        return;
      }
      await load();
    } catch {
      setError('Storage policy could not be updated.');
    } finally {
      setSaving(false);
    }
  }

  async function removePolicy(id: string) {
    if (!activeOrgId || !user) return;
    setSaving(true);
    setError('');
    try {
      const token = await user.getIdToken();
      const res = await fetch(
        `/api/storage/policies/${id}?organizationId=${encodeURIComponent(activeOrgId)}`,
        {
          method: 'DELETE',
          headers: await authHeaders(token, activeOrgId),
        },
      );
      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { error?: string };
        setError(data.error || 'Storage policy could not be deleted.');
        return;
      }
      await load();
    } catch {
      setError('Storage policy could not be deleted.');
    } finally {
      setSaving(false);
    }
  }

  async function handlePreview() {
    if (!activeOrgId || !user) return;
    setPreviewError('');
    setPreviewResult(null);
    try {
      const token = await user.getIdToken();
      const res = await fetch('/api/storage/routing/preview', {
        method: 'POST',
        headers: await authHeaders(token, activeOrgId),
        body: JSON.stringify({
          organizationId: activeOrgId,
          assetType: previewAssetType,
          artistName: previewArtist,
          releaseName: previewRelease,
        }),
      });
      const data = (await res.json().catch(() => ({}))) as {
        preview?: AssetRoutingPreviewDto;
        error?: string;
      };
      if (!res.ok) {
        setPreviewError(data.error || 'Routing preview failed.');
        return;
      }
      setPreviewResult(data.preview ?? null);
    } catch {
      setPreviewError('Routing preview failed.');
    }
  }

  async function syncReference(id: string) {
    if (!activeOrgId || !user) return;
    setSaving(true);
    setError('');
    try {
      const token = await user.getIdToken();
      const res = await fetch(
        `/api/storage/references/${id}/sync?organizationId=${encodeURIComponent(activeOrgId)}`,
        {
          method: 'POST',
          headers: await authHeaders(token, activeOrgId),
          body: JSON.stringify({ organizationId: activeOrgId }),
        },
      );
      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { error?: string };
        setError(data.error || 'Storage metadata synchronization failed.');
        return;
      }
      await load();
    } catch {
      setError('Storage metadata synchronization failed.');
    } finally {
      setSaving(false);
    }
  }

  async function removeReference(id: string) {
    if (!activeOrgId || !user) return;
    setSaving(true);
    setError('');
    try {
      const token = await user.getIdToken();
      const res = await fetch(
        `/api/storage/references/${id}?organizationId=${encodeURIComponent(activeOrgId)}`,
        {
          method: 'DELETE',
          headers: await authHeaders(token, activeOrgId),
        },
      );
      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { error?: string };
        setError(data.error || 'Storage reference could not be deleted.');
        return;
      }
      await load();
    } catch {
      setError('Storage reference could not be deleted.');
    } finally {
      setSaving(false);
    }
  }

  if (!activeOrgId) {
    return (
      <div className="mx-auto max-w-4xl px-5 sm:px-7 py-8">
        <EmptyState
          title="No organisation selected"
          description="Select an organisation to manage storage settings."
        />
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex justify-center py-24">
        <LoadingState />
      </div>
    );
  }

  const providerOptions = providers.map((p) => ({
    value: p.providerId,
    label: p.displayName,
  }));

  const locationOptions = activeLocations.map((l) => ({
    value: l.id,
    label: `${l.name} (${l.providerId})`,
  }));

  const templateOptions = activeTemplates.map((t) => ({
    value: t.id,
    label: t.name,
  }));

  const locById = Object.fromEntries(locations.map((l) => [l.id, l]));
  const tplById = Object.fromEntries(templates.map((t) => [t.id, t]));

  return (
    <div className="mx-auto max-w-4xl px-5 sm:px-7 py-8 page-transition">
      <div className="mb-8">
        <p className="text-display-md font-semibold text-primary-400 tracking-tight">
          Storage
        </p>
        <p className="mt-1 text-sm text-text-400">
          Configure organisation storage locations, folder templates, and routing
          policies. Existing Cloudinary media workflows remain the product default
          until upload routing is wired by a later build.
        </p>
      </div>

      {error ? (
        <p className="mb-4 text-sm text-danger-500" role="alert">
          {error}
        </p>
      ) : null}

      {/* Provider catalog */}
      <section className="mb-10">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-content-label mb-3">
          Connected Storage
        </h2>
        <div className="space-y-2">
          {providers.map((p) => (
            <div
              key={p.providerId}
              className="flex items-center justify-between rounded-xl border border-surface-200/80 bg-layer-2 px-4 py-3"
            >
              <div>
                <p className="text-sm font-medium text-content-primary">
                  {p.displayName}
                </p>
                <p className="text-xs text-content-secondary mt-0.5">
                  providerId: {p.providerId}
                  {p.providerId !== 'cloudinary'
                    ? ' · env credentials (server)'
                    : ' · platform default'}
                </p>
              </div>
              <StatusBadge
                status={
                  p.connectionStatus === 'connected' ? 'active' : 'not_started'
                }
              />
            </div>
          ))}
        </div>
        <p className="mt-3 text-xs text-content-secondary">
          Connection status reflects server environment configuration, not
          organisation-specific OAuth accounts. Durable object binding uses
          org-scoped Storage References (below); the shared provider account
          remains an infrastructure limitation.
        </p>
      </section>

      {/* Locations */}
      <section className="mb-10">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-content-label mb-3">
          Storage Locations
        </h2>
        {locations.length === 0 ? (
          <p className="text-sm text-content-secondary mb-4">
            No storage locations configured yet.
          </p>
        ) : (
          <ul className="space-y-2 mb-6">
            {locations.map((loc) => (
              <li
                key={loc.id}
                className="rounded-xl border border-surface-200/80 bg-layer-2 px-4 py-3"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <p className="text-sm font-medium text-content-primary">
                      {loc.name}
                      {loc.isDefault ? (
                        <span className="ml-2 text-xs text-primary-400">
                          Default
                        </span>
                      ) : null}
                    </p>
                    <p className="text-xs text-content-secondary mt-0.5">
                      {loc.providerId} · root {loc.rootPath} · {loc.status}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {loc.status === 'active' ? (
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={saving}
                        onClick={() => void patchLocation(loc.id, { status: 'disabled' })}
                      >
                        Disable
                      </Button>
                    ) : (
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={saving}
                        onClick={() => void patchLocation(loc.id, { status: 'active' })}
                      >
                        Enable
                      </Button>
                    )}
                    {!loc.isDefault ? (
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={saving}
                        onClick={() => void patchLocation(loc.id, { isDefault: true })}
                      >
                        Set default
                      </Button>
                    ) : null}
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={saving}
                      onClick={() => void removeLocation(loc.id)}
                    >
                      Delete
                    </Button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}

        <div className="rounded-xl border border-surface-200/80 bg-layer-2 p-5 space-y-4">
          <p className="text-sm font-semibold text-content-primary">
            Add Storage Location
          </p>
          <Input
            label="Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Production Storage"
          />
          <Select
            label="Provider"
            options={providerOptions}
            value={providerId}
            onChange={setProviderId}
          />
          <Input
            label="Root path"
            value={rootPath}
            onChange={(e) => setRootPath(e.target.value)}
            placeholder="/ReleaseFlow"
          />
          <label className="flex items-center gap-2 text-sm text-content-secondary">
            <input
              type="checkbox"
              checked={isDefault}
              onChange={(e) => setIsDefault(e.target.checked)}
            />
            Mark as default location (configuration only; does not change current uploads)
          </label>
          <Button
            variant="primary"
            size="sm"
            loading={saving}
            disabled={!name.trim() || saving}
            onClick={() => void handleCreateLocation()}
          >
            Add Storage Location
          </Button>
        </div>
      </section>

      {/* Folder Templates — BUILD-301E */}
      <section className="mb-10">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-content-label mb-3">
          Folder Templates
        </h2>
        <p className="text-xs text-content-secondary mb-3">
          Logical folder structures with variables:{' '}
          {FOLDER_TEMPLATE_VARIABLES.map((v) => `{${v}}`).join(', ')}.
          Provider-neutral — not Dropbox or OneDrive paths.
        </p>
        {templates.length === 0 ? (
          <p className="text-sm text-content-secondary mb-4">
            No folder templates configured yet.
          </p>
        ) : (
          <ul className="space-y-2 mb-6">
            {templates.map((tpl) => (
              <li
                key={tpl.id}
                className="rounded-xl border border-surface-200/80 bg-layer-2 px-4 py-3"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <p className="text-sm font-medium text-content-primary">
                      {tpl.name}
                      {!tpl.active ? (
                        <span className="ml-2 text-xs text-content-secondary">
                          Inactive
                        </span>
                      ) : null}
                    </p>
                    <p className="text-xs text-content-secondary mt-0.5 font-mono">
                      {tpl.structure}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {tpl.active ? (
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={saving}
                        onClick={() => void patchTemplate(tpl.id, { active: false })}
                      >
                        Disable
                      </Button>
                    ) : (
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={saving}
                        onClick={() => void patchTemplate(tpl.id, { active: true })}
                      >
                        Enable
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={saving}
                      onClick={() => void removeTemplate(tpl.id)}
                    >
                      Delete
                    </Button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}

        <div className="rounded-xl border border-surface-200/80 bg-layer-2 p-5 space-y-4">
          <p className="text-sm font-semibold text-content-primary">
            Add Folder Template
          </p>
          <Input
            label="Name"
            value={tplName}
            onChange={(e) => setTplName(e.target.value)}
            placeholder="Release Asset Layout"
          />
          <Input
            label="Structure"
            value={tplStructure}
            onChange={(e) => setTplStructure(e.target.value)}
            placeholder="/{Artist}/{Release}/{AssetType}"
          />
          <Input
            label="Description (optional)"
            value={tplDescription}
            onChange={(e) => setTplDescription(e.target.value)}
            placeholder="Masters under artist/release"
          />
          <Button
            variant="primary"
            size="sm"
            loading={saving}
            disabled={!tplName.trim() || !tplStructure.trim() || saving}
            onClick={() => void handleCreateTemplate()}
          >
            Add Folder Template
          </Button>
        </div>
      </section>

      {/* Storage Policies — BUILD-301E */}
      <section className="mb-10">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-content-label mb-3">
          Storage Policies
        </h2>
        <p className="text-xs text-content-secondary mb-3">
          Routing is determined by active policy for organisation + asset type —
          not by the default storage location flag.
        </p>
        {policies.length === 0 ? (
          <p className="text-sm text-content-secondary mb-4">
            No storage policies configured yet.
          </p>
        ) : (
          <ul className="space-y-2 mb-6">
            {policies.map((pol) => (
              <li
                key={pol.id}
                className="rounded-xl border border-surface-200/80 bg-layer-2 px-4 py-3"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <p className="text-sm font-medium text-content-primary">
                      {pol.name}
                      {!pol.active ? (
                        <span className="ml-2 text-xs text-content-secondary">
                          Inactive
                        </span>
                      ) : null}
                    </p>
                    <p className="text-xs text-content-secondary mt-0.5">
                      {pol.assetType}
                      {' · '}
                      {locById[pol.storageLocationId]?.name ?? pol.storageLocationId}
                      {' · '}
                      {tplById[pol.folderTemplateId]?.name ?? pol.folderTemplateId}
                      {pol.versioningEnabled ? ' · versioning' : ''}
                      {pol.autoCreateFolders ? ' · auto-folders' : ''}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {pol.active ? (
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={saving}
                        onClick={() => void patchPolicy(pol.id, { active: false })}
                      >
                        Disable
                      </Button>
                    ) : (
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={saving}
                        onClick={() => void patchPolicy(pol.id, { active: true })}
                      >
                        Enable
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={saving}
                      onClick={() => void removePolicy(pol.id)}
                    >
                      Delete
                    </Button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}

        <div className="rounded-xl border border-surface-200/80 bg-layer-2 p-5 space-y-4">
          <p className="text-sm font-semibold text-content-primary">
            Add Storage Policy
          </p>
          <Input
            label="Name"
            value={polName}
            onChange={(e) => setPolName(e.target.value)}
            placeholder="Production Audio"
          />
          <Select
            label="Asset Type"
            options={ASSET_TYPE_OPTIONS}
            value={polAssetType}
            onChange={(v) => setPolAssetType(v as AssetType)}
          />
          <Select
            label="Storage Location"
            options={
              locationOptions.length
                ? locationOptions
                : [{ value: '', label: 'No active locations' }]
            }
            value={polLocationId}
            onChange={setPolLocationId}
          />
          <Select
            label="Folder Template"
            options={
              templateOptions.length
                ? templateOptions
                : [{ value: '', label: 'No active templates' }]
            }
            value={polTemplateId}
            onChange={setPolTemplateId}
          />
          <label className="flex items-center gap-2 text-sm text-content-secondary">
            <input
              type="checkbox"
              checked={polVersioning}
              onChange={(e) => setPolVersioning(e.target.checked)}
            />
            Versioning enabled (metadata only in 301E)
          </label>
          <label className="flex items-center gap-2 text-sm text-content-secondary">
            <input
              type="checkbox"
              checked={polAutoCreate}
              onChange={(e) => setPolAutoCreate(e.target.checked)}
            />
            Auto-create folders (routing metadata; provider create is later)
          </label>
          {policies.some((p) => p.active && p.assetType === polAssetType) ? (
            <p className="text-xs text-danger-500">
              An active policy already exists for asset type “{polAssetType}”.
            </p>
          ) : null}
          <Button
            variant="primary"
            size="sm"
            loading={saving}
            disabled={!canSavePolicy() || saving}
            onClick={() => void handleCreatePolicy()}
          >
            Add Storage Policy
          </Button>
        </div>
      </section>

      {/* Routing preview — BUILD-301E */}
      <section className="mb-10">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-content-label mb-3">
          Routing Preview
        </h2>
        <p className="text-xs text-content-secondary mb-3">
          Preview where ReleaseFlow would route an asset. Does not upload.
        </p>
        <div className="rounded-xl border border-surface-200/80 bg-layer-2 p-5 space-y-4">
          <Select
            label="Asset Type"
            options={ASSET_TYPE_OPTIONS}
            value={previewAssetType}
            onChange={(v) => setPreviewAssetType(v as AssetType)}
          />
          <Input
            label="Artist name"
            value={previewArtist}
            onChange={(e) => setPreviewArtist(e.target.value)}
          />
          <Input
            label="Release name"
            value={previewRelease}
            onChange={(e) => setPreviewRelease(e.target.value)}
          />
          <Button
            variant="outline"
            size="sm"
            onClick={() => void handlePreview()}
          >
            Preview route
          </Button>
          {previewError ? (
            <p className="text-sm text-danger-500" role="alert">
              {previewError}
            </p>
          ) : null}
          {previewResult ? (
            <div className="text-sm text-content-secondary space-y-1 border-t border-surface-200/60 pt-3">
              <p>
                <span className="text-content-primary font-medium">Asset Type:</span>{' '}
                {previewResult.assetType}
              </p>
              <p>
                <span className="text-content-primary font-medium">Policy:</span>{' '}
                {previewResult.policy.name}
              </p>
              <p>
                <span className="text-content-primary font-medium">Location:</span>{' '}
                {previewResult.location.name}
              </p>
              <p>
                <span className="text-content-primary font-medium">Provider:</span>{' '}
                {previewResult.providerId}
              </p>
              <p className="font-mono text-xs">
                <span className="text-content-primary font-medium font-sans text-sm">
                  Resolved Path:
                </span>{' '}
                {previewResult.resolvedPath}
              </p>
            </div>
          ) : null}
        </div>
      </section>

      {/* Storage References — BUILD-301F */}
      <section className="mb-10">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-content-label mb-3">
          Storage References
        </h2>
        <p className="text-xs text-content-secondary mb-3">
          Durable RF ↔ provider object bindings (organisation + location + provider +
          providerFileId). Not a file browser. Sync refreshes metadata for one known
          reference only.
        </p>
        {references.length === 0 ? (
          <p className="text-sm text-content-secondary">
            No storage references recorded yet. References are created when uploads
            bind to a configured location (or via API).
          </p>
        ) : (
          <ul className="space-y-2">
            {references.map((ref) => (
              <li
                key={ref.id}
                className="rounded-xl border border-surface-200/80 bg-layer-2 px-4 py-3"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <p className="text-sm font-medium text-content-primary">
                      {ref.assetType} · {ref.status}
                      <span className="ml-2 text-xs text-content-secondary">
                        v{ref.currentVersion}
                      </span>
                    </p>
                    <p className="text-xs text-content-secondary mt-0.5">
                      {ref.providerId}
                      {' · '}
                      {locById[ref.storageLocationId]?.name ?? ref.storageLocationId}
                      {ref.providerPath ? ` · ${ref.providerPath}` : ''}
                    </p>
                    <p className="text-xs text-content-secondary mt-0.5 font-mono">
                      file: {ref.providerFileId}
                      {ref.lastSyncedAt
                        ? ` · synced ${ref.lastSyncedAt}`
                        : ' · never synced'}
                      {ref.syncStatus ? ` · ${ref.syncStatus}` : ''}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={saving || ref.status === 'detached'}
                      onClick={() => void syncReference(ref.id)}
                    >
                      Sync
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={saving}
                      onClick={() => void removeReference(ref.id)}
                    >
                      Delete
                    </Button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
