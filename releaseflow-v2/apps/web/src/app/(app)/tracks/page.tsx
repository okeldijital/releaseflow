'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useOrgStore } from '@/stores/org-store';
import { useAuth } from '@/contexts/auth-context';
import { useTracks } from '@/hooks/useTrack';
import { createNewTrack, editTrack, archiveTrackById } from '@/lib/track-service';
import { toast } from '@/stores/toast-store';
import type { TrackRecord } from '@/lib/track-repository';
import { resolveRecordingType, recordingTypeLabel } from '@/lib/recording-type';
import { Button, EmptyState, LoadingState, Input, StatusBadge, Badge, Select } from '@releaseflow/ui';

const explicitOptions = [
  { value: 'true', label: 'Yes' },
  { value: 'false', label: 'No' },
];

function formatDuration(seconds?: number): string {
  if (!seconds || seconds <= 0) return '—';
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${String(s).padStart(2, '0')}`;
}

interface EditTrackDialogProps {
  track: TrackRecord;
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
}

function EditTrackDialog({ track, open, onClose, onSaved }: EditTrackDialogProps) {
  const [closing, setClosing] = useState(false);
  const [title, setTitle] = useState(track.title);
  const [version, setVersion] = useState(track.version ?? '');
  const [isrc, setIsrc] = useState(track.isrc ?? '');
  const [duration, setDuration] = useState(track.duration?.toString() ?? '');
  const [genre, setGenre] = useState(track.genre ?? '');
  const [explicit, setExplicit] = useState(track.explicit ? 'true' : 'false');
  const [saving, setSaving] = useState(false);
  const dialogRef = useRef<HTMLDivElement>(null);

  const handleClose = useCallback(() => {
    setClosing(true);
    setTimeout(() => { setClosing(false); onClose(); }, 200);
  }, [onClose]);

  useEffect(() => {
    if (!open) return;
    setTitle(track.title);
    setVersion(track.version ?? '');
    setIsrc(track.isrc ?? '');
    setDuration(track.duration?.toString() ?? '');
    setGenre(track.genre ?? '');
    setExplicit(track.explicit ? 'true' : 'false');
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { handleClose(); }
    };
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => { document.removeEventListener('keydown', onKey); document.body.style.overflow = ''; };
  }, [open, track, handleClose]);

  useEffect(() => () => { document.body.style.overflow = ''; }, []);

  async function handleSave() {
    setSaving(true);
    await editTrack(track.id, {
      title,
      version: version || null,
      isrc: isrc || null,
      duration: duration ? Number(duration) : null,
      genre: genre || null,
      explicit: explicit === 'true',
    });
    setSaving(false);
    onSaved();
  }

  async function handleArchive() {
    setSaving(true);
    try {
      await archiveTrackById(track.id);
      toast.success('Track archived.');
      onSaved();
    } catch (error) {
      console.error(error);
      toast.error('Unable to archive track.');
      setSaving(false);
    }
  }

  if (!open && !closing) return null;

  return (
    <div className={`fixed inset-0 z-50 flex items-center justify-center p-4 ${closing ? 'opacity-0 transition-opacity duration-200' : ''}`}>
      <div className={`fixed inset-0 bg-surface-900/40 backdrop-blur-sm ${closing ? 'opacity-0 transition-opacity duration-200' : 'animate-fade-in'}`} onClick={handleClose} aria-hidden="true" />
      <div ref={dialogRef} role="dialog" aria-modal="true" aria-labelledby="edit-track-title" className={`relative z-10 w-full max-w-sm bg-layer-2 dark:bg-surface-800 rounded-lg shadow-modal border border-surface-200 dark:border-surface-600 ${closing ? 'opacity-0 scale-95 transition-all duration-200' : 'animate-scale-in'}`}>
        <div className="px-6 pt-6 pb-4 space-y-4">
          <h2 id="edit-track-title" className="text-base font-semibold text-text-900 dark:text-text-100">Edit Track</h2>
          <Input label="Title" value={title} onChange={(e) => setTitle(e.target.value)} />
          <Input label="Version" value={version} onChange={(e) => setVersion(e.target.value)} />
          <Input label="ISRC" value={isrc} onChange={(e) => setIsrc(e.target.value)} />
          <Input label="Duration (seconds)" type="number" value={duration} onChange={(e) => setDuration(e.target.value)} />
          <Input label="Genre" value={genre} onChange={(e) => setGenre(e.target.value)} />
          <Select label="Explicit" options={explicitOptions} value={explicit} onChange={setExplicit} />
        </div>
        <div className="px-6 py-4 border-t border-surface-100 dark:border-surface-700 flex items-center justify-between gap-2">
          <Button variant="outline" size="sm" onClick={handleArchive} disabled={saving}>
            Archive
          </Button>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={handleClose} disabled={saving}>Cancel</Button>
            <Button variant="primary" size="sm" onClick={handleSave} disabled={saving || !title.trim()}>Save</Button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function TracksPage() {
  const router = useRouter();
  const { activeOrgId } = useOrgStore();
  const { user } = useAuth();
  const { tracks, loading } = useTracks();
  const [showAddForm, setShowAddForm] = useState(false);
  const [editTrackState, setEditTrackState] = useState<TrackRecord | null>(null);

  const [newTitle, setNewTitle] = useState('');
  const [newVersion, setNewVersion] = useState('');
  const [newIsrc, setNewIsrc] = useState('');
  const [newDuration, setNewDuration] = useState('');
  const [newGenre, setNewGenre] = useState('');
  const [newExplicit, setNewExplicit] = useState('false');
  const [saving, setSaving] = useState(false);

  async function handleAdd() {
    if (!activeOrgId || !newTitle.trim() || !user) return;
    setSaving(true);
    await createNewTrack({
      organizationId: activeOrgId,
      title: newTitle.trim(),
      createdBy: user.uid,
      version: newVersion.trim() || undefined,
      isrc: newIsrc.trim() || undefined,
      duration: newDuration ? Number(newDuration) : undefined,
      genre: newGenre.trim() || undefined,
      explicit: newExplicit === 'true',
    });
    setNewTitle('');
    setNewVersion('');
    setNewIsrc('');
    setNewDuration('');
    setNewGenre('');
    setNewExplicit('false');
    setShowAddForm(false);
    setSaving(false);
  }

  if (!activeOrgId) {
    return (
      <div className="mx-auto max-w-4xl px-5 sm:px-7 py-8 page-transition">
        <div className="mb-8">
          <p className="text-[1.75rem] font-semibold text-surface-50 tracking-tight">Tracks</p>
          <p className="mt-1 text-sm text-text-400">Every recording in your catalogue lives here.</p>
        </div>
        <EmptyState title="No organization selected" description="Select an organization to manage tracks." />
      </div>
    );
  }

  if (loading) {
    return <div className="flex items-center justify-center py-32"><LoadingState /></div>;
  }

  return (
    <div className="mx-auto max-w-4xl px-5 sm:px-7 py-8 page-transition">
      <div className="mb-8 flex items-start justify-between">
        <div>
          <p className="text-[1.75rem] font-semibold text-surface-50 tracking-tight">Tracks</p>
          <p className="mt-1 text-sm text-text-400">Every recording in your catalogue lives here.</p>
          {tracks.length > 0 ? (
            <p className="mt-0.5 text-sm text-text-400">{tracks.length} track{tracks.length !== 1 ? 's' : ''}</p>
          ) : null}
        </div>
        <div className="flex items-center gap-2">
          <Button variant="primary" size="sm" className="rounded-xl" onClick={() => setShowAddForm((v) => !v)}>Add Track</Button>
        </div>
      </div>

      {showAddForm && (
        <div className="mb-6 rounded-xl border border-surface-200/80 bg-layer-2 p-5 space-y-4">
          <p className="text-sm font-semibold text-text-900 dark:text-text-100">New Track</p>
          <div className="grid gap-4 sm:grid-cols-2">
            <Input label="Title" value={newTitle} onChange={(e) => setNewTitle(e.target.value)} placeholder="Track title" />
            <Input label="Version" value={newVersion} onChange={(e) => setNewVersion(e.target.value)} placeholder="e.g. Radio Edit" />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Input label="ISRC" value={newIsrc} onChange={(e) => setNewIsrc(e.target.value)} placeholder="e.g. US-ABC-12-34567" />
            <Input label="Duration (seconds)" type="number" value={newDuration} onChange={(e) => setNewDuration(e.target.value)} placeholder="e.g. 210" />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Input label="Genre" value={newGenre} onChange={(e) => setNewGenre(e.target.value)} placeholder="e.g. Pop, Electronic" />
            <Select label="Explicit" options={explicitOptions} value={newExplicit} onChange={setNewExplicit} />
          </div>
          <div className="flex items-center gap-2">
            <Button variant="primary" size="sm" onClick={handleAdd} disabled={saving || !newTitle.trim() || !user}>Save</Button>
            <Button variant="outline" size="sm" onClick={() => setShowAddForm(false)}>Cancel</Button>
          </div>
        </div>
      )}

      {tracks.length === 0 ? (
        <EmptyState
          title="No tracks yet"
          description="Add your first track to begin building your catalogue."
          action={{ label: 'Add Track', onClick: () => setShowAddForm(true) }}
        />
      ) : (
        <div className="space-y-1.5">
          {tracks.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => router.push(`/tracks/${t.id}`)}
              className="w-full text-left flex items-center justify-between rounded-xl border border-surface-200/80 bg-layer-2 px-4 py-3.5 hover:border-primary-200 hover:shadow-sm transition-all duration-150"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div>
                  <p className="text-sm font-medium text-text-900 dark:text-text-100">{t.title}</p>
                  <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                    <Badge
                      label={recordingTypeLabel(resolveRecordingType(t.recordingType), true)}
                      color={resolveRecordingType(t.recordingType) === 'remix' ? 'bg-purple-500/15 text-purple-400' : 'bg-surface-100 text-text-500'}
                      size="sm"
                    />
                    {t.version ? <span className="text-xs text-text-400">{t.version}</span> : null}
                    {t.isrc ? <span className="text-xs text-text-400">{t.isrc}</span> : null}
                    {t.duration ? <span className="text-xs text-text-400 ml-1">{formatDuration(t.duration)}</span> : null}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                {t.genre ? <Badge label={t.genre} color="bg-primary-50 text-primary-600" darkColor="dark:bg-primary-500/15 dark:text-primary-400" /> : null}
                <StatusBadge status={t.status} />
              </div>
            </button>
          ))}
        </div>
      )}

      {editTrackState && (
        <EditTrackDialog
          track={editTrackState}
          open={!!editTrackState}
          onClose={() => setEditTrackState(null)}
          onSaved={() => setEditTrackState(null)}
        />
      )}
    </div>
  );
}
