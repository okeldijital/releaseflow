'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import {
  getDocs, collection, query, where,
} from '@firebase/firestore';
import { getDb } from '@/lib/firebase';
import { fetchReleasesByOrg } from '@/lib/release-service';
import { addTrackToRelease, removeTrackFromRelease } from '@/lib/release-track-repository';
import { getArtistsByRelease } from '@/lib/artist-repository';
import { fetchArtist } from '@/lib/artist-service';
import { toast } from '@/stores/toast-store';
import { ArtworkDisplay } from '@/components/release/artwork-display';
import { Button, StatusBadge, Badge } from '@releaseflow/ui';
import { ConfirmationDialog } from '@releaseflow/ui';
import type { TrackRecord } from '@/lib/track-repository';
import type { ReleaseRecord } from '@/lib/release-repository';
import { RELEASE_TYPE_LABELS } from '@/components/release/status/release-status-config';

interface LinkToReleaseDialogProps {
  open: boolean;
  onClose: () => void;
  track: TrackRecord;
  activeOrgId: string | null;
  currentReleaseId: string | null;
  onLinked: (newReleaseId: string | null) => void;
}

async function getReleaseTrackRecordId(trackId: string, releaseId: string): Promise<string | null> {
  const db = getDb();
  if (!db) return null;
  const snap = await getDocs(
    query(
      collection(db, 'release_tracks'),
      where('trackId', '==', trackId),
      where('releaseId', '==', releaseId),
    ),
  );
  return snap.docs[0]?.id ?? null;
}

async function getNextPosition(releaseId: string): Promise<number> {
  const db = getDb();
  if (!db) return 1;
  const snap = await getDocs(
    query(collection(db, 'release_tracks'), where('releaseId', '==', releaseId)),
  );
  return snap.size + 1;
}

async function resolvePrimaryArtists(
  orgId: string,
  releases: ReleaseRecord[],
): Promise<Record<string, string>> {
  const result: Record<string, string> = {};
  await Promise.all(
    releases.map(async (r) => {
      try {
        const artistLinks = await getArtistsByRelease(r.id);
        const primary = artistLinks.find((a) => a.isPrimary);
        if (!primary) return;
        const artist = await fetchArtist(orgId, primary.artistId);
        if (artist) result[r.id] = artist.name;
      } catch {
        // skip
      }
    }),
  );
  return result;
}

export function LinkToReleaseDialog({
  open,
  onClose,
  track,
  activeOrgId,
  currentReleaseId,
  onLinked,
}: LinkToReleaseDialogProps) {
  const [closing, setClosing] = useState(false);
  const [releases, setReleases] = useState<ReleaseRecord[]>([]);
  const [primaryArtists, setPrimaryArtists] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [linking, setLinking] = useState(false);
  const [search, setSearch] = useState('');
  const [selectedReleaseId, setSelectedReleaseId] = useState<string | null>(currentReleaseId);
  const [confirmRemoveOpen, setConfirmRemoveOpen] = useState(false);
  const dialogRef = useRef<HTMLDivElement>(null);

  const handleClose = useCallback(() => {
    setClosing(true);
    setTimeout(() => { setClosing(false); onClose(); }, 200);
  }, [onClose]);

  useEffect(() => {
    if (!open) return;
    setSelectedReleaseId(currentReleaseId);
    if (!activeOrgId) return;
    setLoading(true);
    setReleases([]);
    setPrimaryArtists({});
    setSearch('');
    fetchReleasesByOrg(activeOrgId)
      .then(async (data) => {
        setReleases(data);
        const artists = await resolvePrimaryArtists(activeOrgId, data);
        setPrimaryArtists(artists);
      })
      .catch(() => toast.error('Failed to load releases'))
      .finally(() => setLoading(false));
  }, [open, activeOrgId, currentReleaseId]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') handleClose();
    };
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => { document.removeEventListener('keydown', onKey); document.body.style.overflow = ''; };
  }, [open, handleClose]);

  useEffect(() => () => { document.body.style.overflow = ''; }, []);

  const filteredReleases = releases.filter((r) =>
    !search || r.title.toLowerCase().includes(search.toLowerCase()),
  );

  async function handleLink() {
    if (!activeOrgId || !selectedReleaseId) return;
    setLinking(true);
    try {
      const position = await getNextPosition(selectedReleaseId);
      await addTrackToRelease(selectedReleaseId, track.id, position);
      toast.success('Track linked successfully.');
      onLinked(selectedReleaseId);
      handleClose();
    } catch (err) {
      console.error(err);
      toast.error('Unable to link track.');
    } finally {
      setLinking(false);
    }
  }

  async function handleRemoveLink() {
    if (!currentReleaseId) return;
    setConfirmRemoveOpen(false);
    setLinking(true);
    try {
      const recordId = await getReleaseTrackRecordId(track.id, currentReleaseId);
      if (recordId) {
        await removeTrackFromRelease(recordId);
      }
      toast.success('Track unlinked.');
      setSelectedReleaseId(null);
      onLinked(null);
      handleClose();
    } catch (err) {
      console.error(err);
      toast.error('Unable to unlink track.');
    } finally {
      setLinking(false);
    }
  }

  if (!open && !closing) return null;

  return (
    <>
      <div className={`fixed inset-0 z-50 flex items-center justify-center p-4 ${closing ? 'opacity-0 transition-opacity duration-200' : ''}`}>
        <div className={`fixed inset-0 bg-surface-900/40 backdrop-blur-sm ${closing ? 'opacity-0 transition-opacity duration-200' : 'animate-fade-in'}`} onClick={handleClose} aria-hidden="true" />
        <div ref={dialogRef} role="dialog" aria-modal="true" aria-labelledby="link-track-title" className={`relative z-10 w-full max-w-lg bg-layer-2 rounded-lg shadow-modal border border-surface-200 flex flex-col max-h-[80vh] ${closing ? 'opacity-0 scale-95 transition-all duration-200' : 'animate-scale-in'}`}>
          <div className="px-6 pt-6 pb-4 border-b border-surface-100">
            <h2 id="link-track-title" className="text-base font-semibold text-content-primary">Link Track to Release</h2>
            <p className="text-sm text-content-secondary mt-1">Choose the release this track belongs to.</p>
          </div>

          {currentReleaseId && currentReleaseId === selectedReleaseId ? (
            <div className="px-6 pt-4 pb-2 border-b border-surface-100 bg-info-50/40">
              <p className="text-xs font-medium text-info-600 uppercase tracking-wider">Currently linked to</p>
              <div className="flex items-center justify-between mt-1.5">
                <p className="text-sm font-medium text-content-primary">
                  {releases.find((r) => r.id === currentReleaseId)?.title ?? 'Unknown release'}
                </p>
                <button
                  type="button"
                  onClick={() => setConfirmRemoveOpen(true)}
                  disabled={linking}
                  className="text-xs font-medium text-danger-600 hover:text-danger-500 transition-colors disabled:opacity-50"
                >
                  Remove Link
                </button>
              </div>
            </div>
          ) : null}

          <div className="px-6 pt-4 pb-2">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search releases..."
              autoFocus
              className="block w-full h-10 rounded-xl border border-divider bg-layer-3 px-4 text-sm text-content-primary placeholder:text-content-secondary focus:border-primary-500/60 focus:outline-none"
            />
          </div>

          <div className="flex-1 overflow-y-auto divide-y divide-divider">
            {loading ? (
              <div className="p-8 text-center text-sm text-content-secondary">Loading releases...</div>
            ) : filteredReleases.length === 0 ? (
              <div className="p-8 text-center text-sm text-content-secondary">
                {search ? 'No releases match your search.' : 'No releases found.'}
              </div>
            ) : (
              filteredReleases.map((r) => {
                const isSelected = selectedReleaseId === r.id;
                const isCurrent = r.id === currentReleaseId;
                return (
                  <button
                    key={r.id}
                    type="button"
                    disabled={isCurrent}
                    onClick={() => setSelectedReleaseId(r.id)}
                    className={`w-full text-left flex items-center gap-3 px-6 py-3.5 transition-colors group outline-none focus-visible:bg-layer-3 focus-visible:ring-2 focus-visible:ring-primary-500/40 ${
                      isSelected
                        ? 'bg-primary-500/5'
                        : 'hover:bg-layer-3'
                    } ${isCurrent ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                  >
                    <div className="shrink-0">
                      <svg className={`h-5 w-5 ${isSelected ? 'text-primary-500' : 'text-content-label'}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                        {isSelected ? (
                          <circle cx="12" cy="12" r="10" fill="currentColor" />
                        ) : (
                          <circle cx="12" cy="12" r="10" />
                        )}
                        {isSelected ? <circle cx="12" cy="12" r="3" fill="white" /> : null}
                      </svg>
                    </div>
                    <ArtworkDisplay
                      artwork={r.artwork}
                      releaseTitle={r.title}
                      size="sm"
                      className="rounded-lg"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-content-primary truncate">{r.title}</p>
                      <p className="text-xs text-content-secondary truncate">
                        {primaryArtists[r.id] ?? 'Unknown Artist'}
                      </p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <Badge
                          label={RELEASE_TYPE_LABELS[r.releaseType] ?? r.releaseType.replace(/_/g, ' ')}
                          color="bg-primary-50 text-primary-600"
                          size="sm"
                        />
                        <StatusBadge status={r.status} />
                      </div>
                    </div>
                  </button>
                );
              })
            )}
          </div>

          <div className="px-6 py-4 border-t border-divider flex items-center justify-end gap-2">
            <Button variant="outline" size="sm" onClick={handleClose} disabled={linking}>Cancel</Button>
            <Button
              variant="primary"
              size="sm"
              onClick={handleLink}
              disabled={linking || !selectedReleaseId || selectedReleaseId === currentReleaseId}
            >
              {linking ? 'Linking...' : 'Link Track'}
            </Button>
          </div>
        </div>
      </div>

      <ConfirmationDialog
        open={confirmRemoveOpen}
        onClose={() => setConfirmRemoveOpen(false)}
        onConfirm={handleRemoveLink}
        title="Remove this track from the release?"
        confirmLabel="Remove"
        cancelLabel="Cancel"
        variant="danger"
        loading={linking}
      />
    </>
  );
}
