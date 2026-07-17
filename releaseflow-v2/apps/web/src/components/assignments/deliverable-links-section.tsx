'use client';

import { useState } from 'react';
import { Button, Input, Select, WorkspaceCard, ConfirmationDialog } from '@releaseflow/ui';
import { toast } from '@/stores/toast-store';
import type { DeliverableLinkRecord, DeliverableLinkProvider } from '@/lib/deliverable-link-service';

const providerOptions = [
  { value: 'google_drive', label: 'Google Drive' },
  { value: 'dropbox', label: 'Dropbox' },
  { value: 'onedrive', label: 'OneDrive' },
  { value: 'frame_io', label: 'Frame.io' },
  { value: 'wetransfer', label: 'WeTransfer' },
  { value: 'other', label: 'Other' },
];

const providerLabels: Record<string, string> = {
  google_drive: 'Google Drive',
  dropbox: 'Dropbox',
  onedrive: 'OneDrive',
  frame_io: 'Frame.io',
  wetransfer: 'WeTransfer',
  other: 'Other',
};

interface DeliverableLinksSectionProps {
  links: DeliverableLinkRecord[];
  onAdd: (fields: { url: string; label: string; provider: DeliverableLinkProvider }) => Promise<void>;
  onRemove: (linkId: string) => Promise<void>;
}

export function DeliverableLinksSection({
  links,
  onAdd,
  onRemove,
}: DeliverableLinksSectionProps) {
  const [adding, setAdding] = useState(false);
  const [newUrl, setNewUrl] = useState('');
  const [newLabel, setNewLabel] = useState('');
  const [newProvider, setNewProvider] = useState<DeliverableLinkProvider>('google_drive');
  const [saving, setSaving] = useState(false);
  const [removeId, setRemoveId] = useState<string | null>(null);

  async function handleAdd() {
    if (!newUrl.trim()) { toast.error('URL is required'); return; }
    if (!newLabel.trim()) { toast.error('Label is required'); return; }
    setSaving(true);
    try {
      await onAdd({ url: newUrl.trim(), label: newLabel.trim(), provider: newProvider });
      setNewUrl('');
      setNewLabel('');
      setNewProvider('google_drive');
      setAdding(false);
      toast.success('Link added');
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to add link');
    } finally {
      setSaving(false);
    }
  }

  async function handleRemove() {
    if (!removeId) return;
    setSaving(true);
    try {
      await onRemove(removeId);
      setRemoveId(null);
      toast.success('Link removed');
    } catch {
      toast.error('Failed to remove link');
    } finally {
      setSaving(false);
    }
  }

  return (
    <WorkspaceCard title="Deliverable Links" subtitle="External resource links only — no file uploads">
      <div className="space-y-2 mt-3">
        {links.length === 0 ? (
          <p className="text-sm text-text-500">No deliverable links attached yet.</p>
        ) : (
          links.map((link) => (
            <div
              key={link.id}
              className="flex items-center justify-between gap-3 rounded-lg border border-surface-700/40 bg-surface-900/50 px-3 py-2"
            >
              <div className="min-w-0 flex-1">
                <a
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm font-medium text-primary-400 hover:text-primary-300 truncate block"
                >
                  {link.label}
                </a>
                <p className="text-xs text-text-500">{providerLabels[link.provider] ?? link.provider}</p>
              </div>
              <button
                onClick={() => setRemoveId(link.id)}
                className="text-xs text-danger-400 hover:text-danger-300 shrink-0"
              >
                Remove
              </button>
            </div>
          ))
        )}
      </div>

      {adding ? (
        <div className="mt-3 space-y-3 rounded-lg border border-surface-700/40 bg-surface-900/50 p-3">
          <Input
            label="URL"
            value={newUrl}
            onChange={(e) => setNewUrl(e.target.value)}
            placeholder="https://drive.google.com/..."
          />
          <Input
            label="Label"
            value={newLabel}
            onChange={(e) => setNewLabel(e.target.value)}
            placeholder="e.g. Mixdown WAV"
          />
          <Select
            label="Provider"
            options={providerOptions}
            value={newProvider}
            onChange={(v) => setNewProvider(v as DeliverableLinkProvider)}
          />
          <div className="flex gap-2">
            <Button size="sm" onClick={handleAdd} loading={saving}>Add Link</Button>
            <Button size="sm" variant="ghost" onClick={() => setAdding(false)}>Cancel</Button>
          </div>
        </div>
      ) : (
        <Button size="sm" variant="outline" className="mt-3" onClick={() => setAdding(true)}>
          + Add Link
        </Button>
      )}

      <ConfirmationDialog
        open={!!removeId}
        onClose={() => setRemoveId(null)}
        onConfirm={handleRemove}
        title="Remove Link"
        message="This will remove the deliverable link."
        confirmLabel="Remove"
        loading={saving}
      />
    </WorkspaceCard>
  );
}
