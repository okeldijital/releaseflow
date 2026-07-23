'use client';

import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useOrgStore } from '@/stores/org-store';
import { useTracks } from '@/hooks/useTrack';
import { useReleases } from '@/hooks/useRelease';
import { useAuth } from '@/contexts/auth-context';
import { getReleasesByTrack } from '@/lib/release-track-repository';
import { editTrack, archiveTrackById, duplicateTrack, removeTrack } from '@/lib/track-service';
import { fetchReleasesByOrg } from '@/lib/release-service';
import { toast } from '@/stores/toast-store';
import type { TrackRecord } from '@/lib/track-repository';
import type { ReleaseRecord } from '@/lib/release-repository';
import { ArtworkDisplay, ArtworkPlaceholder } from '@/components/release/artwork-display';
import { EntityOverflowMenu, type EntityOverflowMenuItem } from '@/components/entity-overflow-menu';
import { LinkToReleaseDialog } from '@/components/link-to-release-dialog';
import { TrackRow } from '@/components/shared/track-row';
import {
  Button, EmptyState, LoadingState, Input, StatusBadge, Badge, Select,
} from '@releaseflow/ui';
import { AuthorizationService } from '@/lib/auth/authorization-service';
import { resolveTrackDisplayTitle } from '@/lib/display-title';
import { resolveRecordingType } from '@/lib/recording-type';

/** EPIC-202A — prefer stored displayTitle; fall back to title + feat/remix from id presence only when names unavailable */
function trackListTitle(track: TrackRecord): string {
  if (track.displayTitle?.trim()) return track.displayTitle.trim();
  return resolveTrackDisplayTitle({
    title: track.title,
    displayTitle: track.displayTitle,
    displayTitleEdited: track.displayTitleEdited,
    isRemix: resolveRecordingType(track.recordingType) === 'remix',
    includeOriginalPrefix: false,
  });
}

function trackListSubtitle(track: TrackRecord): string {
  const parts: string[] = [];
  if ((track.originalArtistIds?.length ?? 0) > 0 || track.primaryArtistId || track.originalArtistId) {
    parts.push('Original');
  }
  if (track.featuredArtistIds && track.featuredArtistIds.length > 0) {
    parts.push(
      track.featuredArtistIds.length === 1
        ? '1 featured artist'
        : `${track.featuredArtistIds.length} featured artists`,
    );
  }
  if ((track.remixArtistIds?.length ?? 0) > 0 || track.remixerArtistId) {
    parts.push('Remix');
  }
  return parts.length === 0 ? '—' : parts.join(' · ');
}

function formatDuration(seconds?: number): string {
  if (!seconds || seconds <= 0) return '—';
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${String(s).padStart(2, '0')}`;
}

function formatUpdatedAt(timestamp: unknown): string {
  if (!timestamp) return '—';
  let date: Date;
  if (
    typeof timestamp === 'object' &&
    timestamp !== null &&
    'toDate' in timestamp &&
    typeof (timestamp as { toDate: () => Date }).toDate === 'function'
  ) {
    date = (timestamp as { toDate: () => Date }).toDate();
  } else {
    date = new Date(timestamp as string | number);
  }
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function presentTrackStatus(status: string): string {
  const cleaned = status.replace(/^deleted:/, '');
  const label = cleaned.replace(/_/g, ' ');
  return label.charAt(0).toUpperCase() + label.slice(1);
}

const TRACK_STATUS_CONFIG: Record<string, { color: string; dot?: boolean }> = {
  draft:    { color: 'bg-surface-100 text-text-500' },
  active:   { color: 'bg-success-50 text-success-600', dot: true },
  archived: { color: 'bg-surface-100 text-text-400' },
};

function getTrackStatusBadge(status: string) {
  const cleaned = status.replace(/^deleted:/, '');
  const config = TRACK_STATUS_CONFIG[cleaned] ?? { color: 'bg-surface-100 text-text-600' };
  const label = presentTrackStatus(status);
  return <Badge label={label} color={config.color} dot={config.dot} />;
}

const SORT_OPTIONS = [
  { value: 'newest', label: 'Newest' },
  { value: 'oldest', label: 'Oldest' },
  { value: 'title-asc', label: 'Title A–Z' },
  { value: 'title-desc', label: 'Title Z–A' },
  { value: 'updated', label: 'Recently Updated' },
];

const explicitOptions = [
  { value: 'true', label: 'Yes' },
  { value: 'false', label: 'No' },
];

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
      <div ref={dialogRef} role="dialog" aria-modal="true" aria-labelledby="edit-track-title" className={`relative z-10 w-full max-w-sm bg-layer-2 rounded-lg shadow-modal border border-surface-200 ${closing ? 'opacity-0 scale-95 transition-all duration-200' : 'animate-scale-in'}`}>
        <div className="px-6 pt-6 pb-4 space-y-4">
          <h2 id="edit-track-title" className="text-base font-semibold text-text-700">Edit Track</h2>
          <Input label="Title" value={title} onChange={(e) => setTitle(e.target.value)} />
          <Input label="Version" value={version} onChange={(e) => setVersion(e.target.value)} />
          <Input label="ISRC" value={isrc} onChange={(e) => setIsrc(e.target.value)} />
          <Input label="Duration (seconds)" type="number" value={duration} onChange={(e) => setDuration(e.target.value)} />
          <Input label="Genre" value={genre} onChange={(e) => setGenre(e.target.value)} />
          <Select label="Explicit" options={explicitOptions} value={explicit} onChange={setExplicit} />
        </div>
        <div className="px-6 py-4 border-t border-surface-100 flex items-center justify-between gap-2">
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
  const { tracks, loading: tracksLoading } = useTracks();
  const { releases, loading: releasesLoading } = useReleases();
  const [editTrackState, setEditTrackState] = useState<TrackRecord | null>(null);
  const [linkDialogTrack, setLinkDialogTrack] = useState<TrackRecord | null>(null);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [pickerLoading, setPickerLoading] = useState(false);
  const [pickerSearch, setPickerSearch] = useState('');
  const [pickerReleases, setPickerReleases] = useState<ReleaseRecord[]>([]);
  const { user } = useAuth();
  const canWriteTracks = AuthorizationService.can('artist.write');

  function getTrackMenuItems(track: TrackRecord) {
    if (!canWriteTracks) return [];
    const items: EntityOverflowMenuItem[] = [
      {
        id: 'edit',
        label: 'Edit Track',
        onClick: () => setEditTrackState(track),
      },
      {
        id: 'duplicate',
        label: 'Duplicate Track',
        onClick: async () => {
          if (!user?.uid) {
            toast.error('You must be signed in to duplicate a track.');
            return;
          }
          try {
            await duplicateTrack(track.id, user.uid);
            toast.success('Track duplicated.');
            window.location.reload();
          } catch (err) {
            console.error(err);
            toast.error('Unable to duplicate track. Track may not be linked to a release.');
          }
        },
      },
      { id: 'link-separator', label: '', separatorBefore: true },
      {
        id: 'link-release',
        label: 'Link to Release...',
        onClick: () => setLinkDialogTrack(track),
      },
      { id: 'archive-separator', label: '', separatorBefore: true },
        {
          id: 'archive',
          label: 'Archive Track',
          variant: 'secondary',
          onClick: async () => {
          await archiveTrackById(track.id);
          toast.success('Track archived.');
          window.location.reload();
        },
      },
      {
        id: 'delete',
        label: 'Delete Track',
        variant: 'danger',
        onClick: () => {
          if (window.confirm('Delete this track permanently?')) {
            removeTrack(track.id, activeOrgId ?? undefined, user?.uid).then(() => {
              toast.success('Track deleted.');
              window.location.reload();
            }).catch(() => {
              toast.error('Unable to delete track.');
            });
          }
        },
      },
    ];
    return items;
  }

  const [trackReleaseMap, setTrackReleaseMap] = useState<Record<string, string>>({});
  const [mappingsLoaded, setMappingsLoaded] = useState(false);

  const [filterRelease, setFilterRelease] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterGenre, setFilterGenre] = useState('');
  const [sort, setSort] = useState('newest');
  const [showFilters, setShowFilters] = useState(false);

  const releasesList = releases;

  useEffect(() => {
    if (!pickerOpen || !activeOrgId) return;
    setPickerLoading(true);
    fetchReleasesByOrg(activeOrgId)
      .then((data) => setPickerReleases(data))
      .finally(() => setPickerLoading(false));
  }, [pickerOpen, activeOrgId]);

  const filteredReleases = pickerReleases.filter((r) =>
    !pickerSearch || r.title.toLowerCase().includes(pickerSearch.toLowerCase()),
  );

  useEffect(() => {
    if (!activeOrgId || tracks.length === 0) {
      setMappingsLoaded(true);
      return;
    }
    let cancelled = false;
    Promise.all(tracks.map((t) => getReleasesByTrack(t.id)))
      .then((results) => {
        if (cancelled) return;
        const map: Record<string, string> = {};
        tracks.forEach((t, i) => {
          const releaseIds = results[i];
          if (releaseIds && releaseIds.length > 0) {
            const first = releaseIds[0];
            if (first) map[t.id] = first;
          }
        });
        setTrackReleaseMap(map);
        setMappingsLoaded(true);
      })
      .catch(() => {
        if (cancelled) return;
        setMappingsLoaded(true);
      });
    return () => { cancelled = true; };
  }, [activeOrgId, tracks]);

  const releaseMap = useMemo(() => {
    const map = new Map<string, ReleaseRecord>();
    releasesList.forEach((r) => map.set(r.id, r));
    return map;
  }, [releasesList]);

  const groupedTracks = useMemo(() => {
    const groups = new Map<string, { release: ReleaseRecord; tracks: TrackRecord[] }>();
    const unassigned: TrackRecord[] = [];

    tracks.forEach((track) => {
      const releaseId = trackReleaseMap[track.id];
      if (releaseId && releaseMap.has(releaseId)) {
        const release = releaseMap.get(releaseId)!;
        if (!groups.has(releaseId)) {
          groups.set(releaseId, { release, tracks: [] });
        }
        groups.get(releaseId)!.tracks.push(track);
      } else {
        unassigned.push(track);
      }
    });

    const sortedGroups = Array.from(groups.entries())
      .map(([id, data]) => ({ id, ...data }))
      .sort((a, b) => a.release.title.localeCompare(b.release.title));

    return { sortedGroups, unassigned };
  }, [tracks, trackReleaseMap, releaseMap]);

  const genreOptions = useMemo(() => {
    const genres = new Set<string>();
    tracks.forEach((t) => { if (t.genre) genres.add(t.genre); });
    return Array.from(genres).sort();
  }, [tracks]);

  const statusOptions = useMemo(() => {
    const statuses = new Set<string>();
    tracks.forEach((t) => statuses.add(t.status));
    return Array.from(statuses).map((s) => ({ value: s, label: presentTrackStatus(s) }));
  }, [tracks]);

  const releaseOptions = useMemo(() => {
    return releasesList
      .sort((a, b) => a.title.localeCompare(b.title))
      .map((r) => ({ value: r.id, label: r.title }));
  }, [releasesList]);

  const filteredGroupedTracks = useMemo(() => {
    const filteredGroups = groupedTracks.sortedGroups
      .map((group) => ({
        ...group,
        tracks: group.tracks.filter((t) => {
          if (filterRelease && trackReleaseMap[t.id] !== filterRelease) return false;
          if (filterStatus && t.status !== filterStatus) return false;
          if (filterGenre && t.genre !== filterGenre) return false;
          return true;
        }),
      }))
      .filter((group) => group.tracks.length > 0);

    const filteredUnassigned = groupedTracks.unassigned.filter((t) => {
      if (filterRelease) return false;
      if (filterStatus && t.status !== filterStatus) return false;
      if (filterGenre && t.genre !== filterGenre) return false;
      return true;
    });

    return { sortedGroups: filteredGroups, unassigned: filteredUnassigned };
  }, [groupedTracks, filterRelease, filterStatus, filterGenre, trackReleaseMap]);

  const sortedFilteredGroups = useMemo(() => {
    const groups = filteredGroupedTracks.sortedGroups.map((group) => ({
      ...group,
      tracks: [...group.tracks].sort((a, b) => {
        switch (sort) {
          case 'newest':
            return new Date(b.createdAt as unknown as string).getTime() - new Date(a.createdAt as unknown as string).getTime();
          case 'oldest':
            return new Date(a.createdAt as unknown as string).getTime() - new Date(b.createdAt as unknown as string).getTime();
          case 'title-asc':
            return a.title.localeCompare(b.title);
          case 'title-desc':
            return b.title.localeCompare(a.title);
          case 'updated':
            return new Date(b.updatedAt as unknown as string).getTime() - new Date(a.updatedAt as unknown as string).getTime();
          default:
            return 0;
        }
      }),
    }));

    const unassigned = [...filteredGroupedTracks.unassigned].sort((a, b) => {
      switch (sort) {
        case 'newest':
          return new Date(b.createdAt as unknown as string).getTime() - new Date(a.createdAt as unknown as string).getTime();
        case 'oldest':
          return new Date(a.createdAt as unknown as string).getTime() - new Date(b.createdAt as unknown as string).getTime();
        case 'title-asc':
          return a.title.localeCompare(b.title);
        case 'title-desc':
          return b.title.localeCompare(a.title);
        case 'updated':
          return new Date(b.updatedAt as unknown as string).getTime() - new Date(a.updatedAt as unknown as string).getTime();
        default:
          return 0;
      }
    });

    return { sortedGroups: groups, unassigned };
  }, [filteredGroupedTracks, sort]);

  const summaryStats = useMemo(() => {
    const total = tracks.length;
    const statusCounts: Record<string, number> = {};
    tracks.forEach((t) => {
      const cleaned = t.status.replace(/^deleted:/, '');
      statusCounts[cleaned] = (statusCounts[cleaned] || 0) + 1;
    });

    const inProduction = tracks.filter((t) => {
      const releaseId = trackReleaseMap[t.id];
      if (!releaseId) return false;
      const release = releaseMap.get(releaseId);
      return release?.status === 'in_production';
    }).length;

    const ready = tracks.filter((t) => {
      const releaseId = trackReleaseMap[t.id];
      if (!releaseId) return false;
      const release = releaseMap.get(releaseId);
      return release?.status === 'ready_for_distribution';
    }).length;

    const released = tracks.filter((t) => {
      const releaseId = trackReleaseMap[t.id];
      if (!releaseId) return false;
      const release = releaseMap.get(releaseId);
      return release?.status === 'released';
    }).length;

    return { total, inProduction, ready, released };
  }, [tracks, trackReleaseMap, releaseMap]);

  const hasActiveFilters = Boolean(filterRelease || filterStatus || filterGenre);

  function clearFilters() {
    setFilterRelease('');
    setFilterStatus('');
    setFilterGenre('');
  }

  if (!activeOrgId) {
    return (
      <div className="mx-auto max-w-4xl px-5 sm:px-7 py-8 page-transition">
        <div className="mb-8">
          <p className="text-display-md font-semibold text-primary-400 tracking-tight">Tracks</p>
          <p className="mt-1 text-sm text-text-400">Manage every recording across your releases.</p>
        </div>
        <EmptyState title="No organization selected" description="Select an organization to manage tracks." />
      </div>
    );
  }

  if (tracksLoading || releasesLoading || !mappingsLoaded) {
    return <div className="flex items-center justify-center py-32"><LoadingState /></div>;
  }

  const totalDisplay = sortedFilteredGroups.sortedGroups.reduce((sum, g) => sum + g.tracks.length, 0) + sortedFilteredGroups.unassigned.length;

  return (
    <div className="mx-auto max-w-5xl px-5 sm:px-7 py-8 page-transition">
      <div className="mb-8 flex items-start justify-between gap-4">
        <div>
          <p className="text-display-md font-semibold text-content-primary tracking-tight">Tracks</p>
          <p className="mt-1 text-sm text-content-secondary">Manage every recording across your releases.</p>
          <p className="mt-0.5 text-sm text-content-secondary">{summaryStats.total} track{summaryStats.total !== 1 ? 's' : ''} in your catalogue</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="primary" size="sm" className="rounded-xl" onClick={() => setPickerOpen(true)}>
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add Track
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        <div className="rounded-xl border border-divider bg-layer-2 p-4 shadow-card">
          <p className="text-xs font-medium text-content-label uppercase tracking-wider">Total Tracks</p>
          <p className="text-2xl font-semibold text-content-primary mt-2 leading-none">{summaryStats.total}</p>
        </div>
        <div className="rounded-xl border border-divider bg-layer-2 p-4 shadow-card">
          <p className="text-xs font-medium text-content-label uppercase tracking-wider">In Production</p>
          <p className="text-2xl font-semibold text-content-primary mt-2 leading-none">{summaryStats.inProduction}</p>
        </div>
        <div className="rounded-xl border border-divider bg-layer-2 p-4 shadow-card">
          <p className="text-xs font-medium text-content-label uppercase tracking-wider">Ready</p>
          <p className="text-2xl font-semibold text-content-primary mt-2 leading-none">{summaryStats.ready}</p>
        </div>
        <div className="rounded-xl border border-divider bg-layer-2 p-4 shadow-card">
          <p className="text-xs font-medium text-content-label uppercase tracking-wider">Released</p>
          <p className="text-2xl font-semibold text-content-primary mt-2 leading-none">{summaryStats.released}</p>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2 mb-2">
        <select
          value={sort}
          onChange={(e) => setSort(e.target.value)}
          className="h-10 rounded-xl border border-divider bg-layer-3 px-3 text-sm text-content-primary focus:border-primary-500/60 focus:outline-none"
        >
          {SORT_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
        <button
          type="button"
          onClick={() => setShowFilters(!showFilters)}
          className={`h-10 px-3 rounded-xl border transition-colors ${
            hasActiveFilters
              ? 'border-primary-500/60 bg-primary-500/10 text-primary-400'
              : 'border-divider text-content-secondary hover:text-content-primary'
          }`}
          aria-pressed={showFilters}
        >
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
          </svg>
        </button>
      </div>

      {showFilters && (
        <div className="mb-5 p-4 rounded-xl border border-divider bg-layer-2 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-content-label uppercase tracking-wider">Filters</span>
            {hasActiveFilters && (
              <button type="button" onClick={clearFilters} className="text-xs text-primary-500 hover:text-primary-400 font-medium">Clear all</button>
            )}
          </div>
          <div className="flex flex-wrap gap-3">
            <Select
              label="Release"
              options={[{ value: '', label: 'All releases' }, ...releaseOptions]}
              value={filterRelease}
              onChange={(v) => setFilterRelease(v)}
              className="w-full sm:w-56"
            />
            <Select
              label="Status"
              options={[{ value: '', label: 'All statuses' }, ...statusOptions]}
              value={filterStatus}
              onChange={(v) => setFilterStatus(v)}
              className="w-full sm:w-48"
            />
            <Select
              label="Genre"
              options={[{ value: '', label: 'All genres' }, ...genreOptions.map((g) => ({ value: g, label: g }))]}
              value={filterGenre}
              onChange={(v) => setFilterGenre(v)}
              className="w-full sm:w-48"
            />
          </div>
        </div>
      )}

      {tracks.length === 0 ? (
        <EmptyState
          title="No tracks yet"
          description="Tracks belong to releases."
          action={{ label: 'Add Track', onClick: () => setPickerOpen(true) }}
        />
      ) : totalDisplay === 0 ? (
        <EmptyState
          title="No tracks match your search"
          description="Try adjusting your filters or search terms."
          action={hasActiveFilters ? { label: 'Clear Filters', onClick: clearFilters } : undefined}
        />
      ) : (
        <div className="space-y-6">
          {sortedFilteredGroups.sortedGroups.map((group) => (
            <section key={group.id} className="rounded-xl border border-divider bg-layer-2 overflow-hidden">
              <div className="flex items-center gap-4 px-5 py-4 border-b border-divider">
                <div className="shrink-0">
                  <ArtworkDisplay
                    artwork={group.release.artwork}
                    releaseTitle={group.release.title}
                    size="sm"
                    className="rounded-lg"
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <Link href={`/releases/${group.release.id}`} className="block">
                    <p className="text-sm font-semibold text-content-primary truncate hover:text-primary-400 transition-colors">{group.release.title}</p>
                  </Link>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs text-content-secondary">{group.tracks.length} track{group.tracks.length !== 1 ? 's' : ''}</span>
                    <span className="text-content-label">·</span>
                    <StatusBadge status={group.release.status} />
                  </div>
                </div>
              </div>
              <div className="divide-y divide-divider">
                {group.tracks.map((track) => {
                  const listTitle = trackListTitle(track);
                  const artists = trackListSubtitle(track);

                  return (
                    <TrackRow
                      key={track.id}
                      onClick={() => router.push(`/tracks/${track.id}`)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          router.push(`/tracks/${track.id}`);
                        }
                      }}
                    >
                      <div className="shrink-0">
                        <ArtworkPlaceholder title={listTitle} size="sm" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 min-w-0">
                          <p className="text-sm font-medium text-content-primary truncate group-hover:text-primary-400 transition-colors">{listTitle}</p>
                          {track.version ? <span className="text-xs text-content-secondary shrink-0">{track.version}</span> : null}
                        </div>
                        <p className="text-xs text-content-secondary mt-0.5 truncate">{artists}</p>
                      </div>
                      <div className="hidden sm:flex items-center gap-4 shrink-0 text-xs text-content-secondary">
                        <span className="max-w-[180px] truncate">{group.release.title}</span>
                        <span className="w-12 text-right tabular-nums">{formatDuration(track.duration)}</span>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        {getTrackStatusBadge(track.status)}
                        <span className="hidden md:inline text-xs text-content-label tabular-nums">{formatUpdatedAt(track.updatedAt)}</span>
                        <span
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                          }}
                          onKeyDown={(e) => {
                            e.stopPropagation();
                          }}
                        >
                          <EntityOverflowMenu
                            aria-label={`Actions for ${listTitle}`}
                            items={getTrackMenuItems(track)}
                          />
                        </span>
                      </div>
                    </TrackRow>
                  );
                })}
              </div>
            </section>
          ))}

          {sortedFilteredGroups.unassigned.length > 0 && (
            <section className="rounded-xl border border-divider bg-layer-2 overflow-hidden">
              <div className="px-5 py-4 border-b border-divider">
                <p className="text-sm font-semibold text-content-primary">Unassigned Tracks</p>
                <p className="text-xs text-content-secondary mt-0.5">{sortedFilteredGroups.unassigned.length} track{sortedFilteredGroups.unassigned.length !== 1 ? 's' : ''} with no linked release</p>
              </div>
              <div className="divide-y divide-divider">
                {sortedFilteredGroups.unassigned.map((track) => {
                  const listTitle = trackListTitle(track);
                  const artists = trackListSubtitle(track);

                  return (
                    <TrackRow
                      key={track.id}
                      onClick={() => router.push(`/tracks/${track.id}`)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          router.push(`/tracks/${track.id}`);
                        }
                      }}
                    >
                      <div className="shrink-0">
                        <ArtworkPlaceholder title={listTitle} size="sm" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 min-w-0">
                          <p className="text-sm font-medium text-content-primary truncate group-hover:text-primary-400 transition-colors">{listTitle}</p>
                          {track.version ? <span className="text-xs text-content-secondary shrink-0">{track.version}</span> : null}
                        </div>
                        <p className="text-xs text-content-secondary mt-0.5 truncate">{artists}</p>
                      </div>
                      <div className="hidden sm:flex items-center gap-4 shrink-0 text-xs text-content-secondary">
                        <span className="max-w-[180px] truncate">Unassigned</span>
                        <span className="w-12 text-right tabular-nums">{formatDuration(track.duration)}</span>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        {getTrackStatusBadge(track.status)}
                        <span className="hidden md:inline text-xs text-content-label tabular-nums">{formatUpdatedAt(track.updatedAt)}</span>
                        <span
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                          }}
                          onKeyDown={(e) => {
                            e.stopPropagation();
                          }}
                        >
                          <EntityOverflowMenu
                            aria-label={`Actions for ${listTitle}`}
                            items={getTrackMenuItems(track)}
                          />
                        </span>
                      </div>
                    </TrackRow>
                  );
                })}
              </div>
            </section>
          )}
        </div>
      )}

      {pickerOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-surface-900/40 backdrop-blur-sm" onClick={() => setPickerOpen(false)} aria-hidden="true" />
          <div className="relative z-10 w-full max-w-md bg-layer-2 rounded-lg shadow-modal border border-surface-700 flex flex-col max-h-[80vh]">
            <div className="px-5 pt-5 pb-3 border-b border-divider">
              <h2 className="text-base font-semibold text-content-primary">Choose Release</h2>
              <input
                type="text"
                value={pickerSearch}
                onChange={(e) => setPickerSearch(e.target.value)}
                placeholder="Search releases..."
                autoFocus
                className="mt-3 block w-full h-10 rounded-xl border border-surface-700 px-4 text-sm text-content-primary placeholder:text-content-label bg-layer-3 focus:border-primary-500/60 focus:outline-none"
              />
            </div>
            <div className="flex-1 overflow-y-auto divide-y divide-divider">
              {pickerLoading ? (
                <div className="p-8 text-center text-sm text-content-label">Loading...</div>
              ) : filteredReleases.length === 0 ? (
                <div className="p-8 text-center text-sm text-content-label">{pickerSearch ? 'No releases match your search.' : 'No releases found.'}</div>
              ) : (
                filteredReleases.map((r) => (
                  <TrackRow
                    key={r.id}
                    onClick={() => {
                      setPickerOpen(false);
                      router.push(`/tracks/new?releaseId=${r.id}`);
                    }}
                  >
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-content-primary truncate">{r.title}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <Badge label={r.releaseType.replace(/_/g, ' ')} color="bg-primary-50 text-primary-600" size="sm" />
                        <StatusBadge status={r.status} />
                      </div>
                    </div>
                  </TrackRow>
                ))
              )}
            </div>
            <div className="px-5 py-3 border-t border-divider flex justify-end">
              <Button variant="outline" size="sm" onClick={() => setPickerOpen(false)}>Cancel</Button>
            </div>
          </div>
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

      {linkDialogTrack && (
        <LinkToReleaseDialog
          open={!!linkDialogTrack}
          onClose={() => setLinkDialogTrack(null)}
          track={linkDialogTrack}
          activeOrgId={activeOrgId}
          currentReleaseId={trackReleaseMap[linkDialogTrack.id] ?? null}
          onLinked={(newReleaseId) => {
            setTrackReleaseMap((prev) => {
              const next = { ...prev };
              if (newReleaseId) {
                next[linkDialogTrack.id] = newReleaseId;
              } else {
                delete next[linkDialogTrack.id];
              }
              return next;
            });
            setLinkDialogTrack(null);
          }}
        />
      )}
    </div>
  );
}
