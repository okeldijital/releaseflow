'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useOrgStore } from '@/stores/org-store';
import { useReleases } from '@/hooks/useRelease';
import { getAssetsByOrg, createAsset, updateAsset, archiveAsset } from '@/lib/asset-entity-repository';
import type { AssetRecord, CreateAssetFields, AssetType } from '@/lib/asset-entity-repository';
import { Button, EmptyState, LoadingState, Input, Select, Badge, StatusBadge } from '@releaseflow/ui';

const TYPE_OPTIONS = [
  { value: 'audio', label: 'Audio' },
  { value: 'artwork', label: 'Artwork' },
  { value: 'video', label: 'Video' },
  { value: 'document', label: 'Document' },
  { value: 'other', label: 'Other' },
];

const TYPE_COLORS: Record<AssetType, string> = {
  audio: 'bg-info-50 text-info-600',
  artwork: 'bg-warning-50 text-warning-600',
  video: 'bg-purple-50 text-purple-600',
  document: 'bg-surface-100 text-text-500',
  other: 'bg-surface-100 text-text-500',
};

interface EditDialogProps {
  asset: AssetRecord;
  releases: { id: string; title: string }[];
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
}

function EditDialog({ asset, releases, open, onClose, onSaved }: EditDialogProps) {
  const [closing, setClosing] = useState(false);
  const [name, setName] = useState(asset.name);
  const [type, setType] = useState<AssetType>(asset.type);
  const [releaseId, setReleaseId] = useState(asset.releaseId ?? '');
  const [saving, setSaving] = useState(false);
  const dialogRef = useRef<HTMLDivElement>(null);

  const handleClose = useCallback(() => {
    setClosing(true);
    setTimeout(() => { setClosing(false); onClose(); }, 200);
  }, [onClose]);

  useEffect(() => {
    if (!open) return;
    setName(asset.name);
    setType(asset.type);
    setReleaseId(asset.releaseId ?? '');
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') handleClose(); };
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => { document.removeEventListener('keydown', onKey); document.body.style.overflow = ''; };
  }, [open, asset, handleClose]);

  useEffect(() => () => { document.body.style.overflow = ''; }, []);

  async function handleSave() {
    setSaving(true);
    await updateAsset(asset.id, { name, type, releaseId: releaseId || null });
    setSaving(false);
    onSaved();
  }

  async function handleArchive() {
    setSaving(true);
    await archiveAsset(asset.id);
    setSaving(false);
    onSaved();
  }

  if (!open && !closing) return null;

  return (
    <div className={`fixed inset-0 z-50 flex items-center justify-center p-4 ${closing ? 'opacity-0 transition-opacity duration-200' : ''}`}>
      <div className={`fixed inset-0 bg-surface-900/40 backdrop-blur-sm ${closing ? 'opacity-0 transition-opacity duration-200' : 'animate-fade-in'}`} onClick={handleClose} aria-hidden="true" />
      <div ref={dialogRef} role="dialog" aria-modal="true" aria-labelledby="edit-asset-title" className={`relative z-10 w-full max-w-sm bg-layer-2 dark:bg-surface-800 rounded-lg shadow-modal border border-surface-200 dark:border-surface-600 ${closing ? 'opacity-0 scale-95 transition-all duration-200' : 'animate-scale-in'}`}>
        <div className="px-6 pt-6 pb-4 space-y-4">
          <h2 id="edit-asset-title" className="text-base font-semibold text-text-900 dark:text-text-100">Edit Asset</h2>
          <Input label="Name" value={name} onChange={(e) => setName(e.target.value)} />
          <Select label="Type" options={TYPE_OPTIONS} value={type} onChange={(v) => setType(v as AssetType)} />
          <Select
            label="Release (optional)"
            options={[{ value: '', label: 'None' }, ...releases.map((r) => ({ value: r.id, label: r.title }))]}
            value={releaseId ?? ''}
            onChange={(v) => setReleaseId(v)}
          />
        </div>
        <div className="px-6 py-4 border-t border-surface-100 dark:border-surface-700 flex items-center justify-between gap-2">
          <Button variant="outline" size="sm" onClick={handleArchive} disabled={saving}>
            Archive
          </Button>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={handleClose} disabled={saving}>Cancel</Button>
            <Button variant="primary" size="sm" onClick={handleSave} disabled={saving || !name.trim()}>Save</Button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function AssetsPage() {
  const { activeOrgId } = useOrgStore();
  const { releases } = useReleases();
  const [assets, setAssets] = useState<AssetRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [editAsset, setEditAsset] = useState<AssetRecord | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);

  const [newName, setNewName] = useState('');
  const [newType, setNewType] = useState<AssetType>('audio');
  const [newReleaseId, setNewReleaseId] = useState('');
  const [newUrl, setNewUrl] = useState('');
  const [newFilename, setNewFilename] = useState('');
  const [saving, setSaving] = useState(false);

  async function loadAssets() {
    if (!activeOrgId) { setLoading(false); return; }
    const data = await getAssetsByOrg(activeOrgId);
    setAssets(data);
    setLoading(false);
  }

  useEffect(() => {
    setLoading(true);
    loadAssets();
  }, [activeOrgId]);

  async function handleAdd() {
    if (!activeOrgId || !newName.trim() || !newUrl.trim() || !newFilename.trim()) return;
    setSaving(true);
    const fields: CreateAssetFields = {
      organizationId: activeOrgId,
      name: newName.trim(),
      type: newType,
      url: newUrl.trim(),
      filename: newFilename.trim(),
      releaseId: newReleaseId || null,
    };
    await createAsset(fields);
    setNewName('');
    setNewType('audio');
    setNewReleaseId('');
    setNewUrl('');
    setNewFilename('');
    setShowAddForm(false);
    await loadAssets();
    setSaving(false);
  }

  const releaseMap = new Map(releases.map((r) => [r.id, r.title]));

  if (!activeOrgId) {
    return (
      <div className="mx-auto max-w-4xl px-5 sm:px-7 py-8 page-transition">
        <div className="mb-8">
          <p className="text-display-md font-semibold text-primary-400 tracking-tight">Assets</p>
          <p className="mt-1 text-sm text-text-400">Artwork, masters, videos and production files.</p>
        </div>
        <EmptyState title="No organization selected" description="Select an organization to view its assets." />
      </div>
    );
  }

  if (loading) {
    return <div className="flex items-center justify-center py-32"><LoadingState /></div>;
  }

  const activeReleases = releases.filter((r) => r.status !== 'archived' && r.status !== 'cancelled');

  return (
    <div className="mx-auto max-w-4xl px-5 sm:px-7 py-8 page-transition">
      <div className="mb-8 flex items-start justify-between">
        <div>
          <p className="text-display-md font-semibold text-primary-400 tracking-tight">Assets</p>
          <p className="mt-1 text-sm text-text-400">Artwork, masters, videos and production files.</p>
        </div>
        <Button variant="primary" size="sm" className="rounded-xl" onClick={() => setShowAddForm((v) => !v)}>Upload Asset</Button>
      </div>

      {showAddForm && (
        <div className="mb-6 rounded-xl border border-surface-200/80 bg-layer-2 p-5 space-y-4">
          <p className="text-sm font-semibold text-text-900 dark:text-text-100">New Asset</p>
          <div className="grid gap-4 sm:grid-cols-2">
            <Input label="Name" value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="Album Artwork Final" />
            <Select label="Type" options={TYPE_OPTIONS} value={newType} onChange={(v) => setNewType(v as AssetType)} />
          </div>
          <Select
            label="Release (optional)"
            options={[{ value: '', label: 'None' }, ...activeReleases.map((r) => ({ value: r.id, label: r.title }))]}
            value={newReleaseId}
            onChange={(v) => setNewReleaseId(v)}
          />
          <div className="grid gap-4 sm:grid-cols-2">
            <Input label="File URL" value={newUrl} onChange={(e) => setNewUrl(e.target.value)} placeholder="https://..." />
            <Input label="Filename" value={newFilename} onChange={(e) => setNewFilename(e.target.value)} placeholder="artwork.png" />
          </div>
          <div className="flex items-center gap-2">
            <Button variant="primary" size="sm" onClick={handleAdd} disabled={saving || !newName.trim() || !newUrl.trim() || !newFilename.trim()}>Save</Button>
            <Button variant="outline" size="sm" onClick={() => setShowAddForm(false)}>Cancel</Button>
          </div>
        </div>
      )}

      {assets.length === 0 && !loading ? (
        <EmptyState
          title="No assets yet"
          description="Upload your first asset to begin managing artwork and production files."
          action={{ label: 'Upload Asset', onClick: () => setShowAddForm(true) }}
        />
      ) : (
        <div className="space-y-1.5">
          {assets.map((a) => (
            <button
              key={a.id}
              type="button"
              onClick={() => setEditAsset(a)}
              className="w-full text-left flex items-center justify-between rounded-xl border border-surface-200/80 bg-layer-2 px-4 py-3.5 hover:border-primary-200 hover:shadow-sm transition-all duration-150"
            >
              <div className="flex items-center gap-3 min-w-0 flex-1">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-text-900 dark:text-text-100 truncate">{a.name}</p>
                  <p className="text-xs text-text-400 truncate">
                    {a.releaseId && releaseMap.has(a.releaseId) ? `${releaseMap.get(a.releaseId)}  ·  ` : ''}
                    {a.filename}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <Badge label={a.type} color={TYPE_COLORS[a.type] ?? 'bg-surface-100 text-text-500'} size="sm" />
                <StatusBadge status={a.status === 'archived' ? 'archived' : 'active'} />
              </div>
            </button>
          ))}
        </div>
      )}

      {editAsset && (
        <EditDialog
          asset={editAsset}
          releases={activeReleases.map((r) => ({ id: r.id, title: r.title }))}
          open={!!editAsset}
          onClose={() => setEditAsset(null)}
          onSaved={() => { setEditAsset(null); loadAssets(); }}
        />
      )}
    </div>
  );
}
