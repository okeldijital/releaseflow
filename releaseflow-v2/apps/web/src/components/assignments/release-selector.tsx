'use client';

/**
 * AW-001 — Searchable release selector (no IDs in UI).
 */

import { useEffect, useMemo, useState } from 'react';
import type { ReleaseRecord } from '@/lib/release-repository';
import { fetchReleasesByOrg } from '@/lib/release-service';
import { ArtworkPlaceholder } from '@/components/release/artwork-display';

function toDate(value: unknown): Date | null {
  if (!value) return null;
  if (value instanceof Date) return value;
  if (typeof value === 'object' && value && 'toDate' in value) {
    return (value as { toDate: () => Date }).toDate();
  }
  if (typeof value === 'object' && value && 'seconds' in value) {
    return new Date((value as { seconds: number }).seconds * 1000);
  }
  return null;
}

function daysUntil(date: Date | null): string | null {
  if (!date) return null;
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  const target = new Date(date);
  target.setHours(0, 0, 0, 0);
  const days = Math.round((target.getTime() - start.getTime()) / 86400000);
  if (days < 0) return `Released ${Math.abs(days)} day${Math.abs(days) === 1 ? '' : 's'} ago`;
  if (days === 0) return 'Releases today';
  return `Release in ${days} day${days === 1 ? '' : 's'}`;
}

interface ReleaseSelectorProps {
  organizationId: string;
  value: ReleaseRecord | null;
  onChange: (release: ReleaseRecord | null) => void;
  /** RW-001 — lock selection when opened from a release workspace. */
  locked?: boolean;
}

export function ReleaseSelector({
  organizationId,
  value,
  onChange,
  locked = false,
}: ReleaseSelectorProps) {
  const [releases, setReleases] = useState<ReleaseRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');

  useEffect(() => {
    if (!organizationId || locked) return;
    setLoading(true);
    fetchReleasesByOrg(organizationId)
      .then((list) => setReleases(list as ReleaseRecord[]))
      .catch(() => setReleases([]))
      .finally(() => setLoading(false));
  }, [organizationId, locked]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    let list = releases.filter((r) => r.status !== 'cancelled' && r.status !== 'archived');
    if (q) {
      list = list.filter(
        (r) =>
          r.title.toLowerCase().includes(q)
          || (r.displayTitle ?? '').toLowerCase().includes(q)
          || (r.releaseType ?? '').toLowerCase().includes(q)
          || (r.genre ?? '').toLowerCase().includes(q),
      );
    }
    return list.slice(0, 50);
  }, [releases, query]);

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-content-label">
        Release
        {locked ? (
          <span className="ml-2 text-xs font-normal text-text-500">(locked to this release)</span>
        ) : null}
      </label>
      <button
        type="button"
        onClick={() => {
          if (!locked) setOpen(true);
        }}
        disabled={locked}
        aria-disabled={locked}
        className={`w-full min-h-[48px] flex items-center gap-3 px-3 py-2.5 rounded-xl border border-surface-700/60 bg-surface-900 text-left transition-colors ${
          locked
            ? 'cursor-default opacity-95'
            : 'hover:border-primary-500/40'
        }`}
      >
        {value ? (
          <>
            {value.artwork?.secureUrl ? (
              <img src={value.artwork.secureUrl} alt="" className="h-10 w-10 rounded-lg object-cover shrink-0" />
            ) : (
              <ArtworkPlaceholder title={value.title} size="sm" />
            )}
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-surface-100 truncate">{value.title}</p>
              <p className="text-xs text-text-500 capitalize truncate">
                {value.releaseType?.replace(/_/g, ' ') || 'Release'}
              </p>
            </div>
          </>
        ) : (
          <span className="text-sm text-text-500">
            {locked ? 'Loading release…' : 'Select a release…'}
          </span>
        )}
        {!locked ? (
          <svg className="h-4 w-4 text-text-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        ) : null}
      </button>

      {value ? (
        <ReleaseContextCard release={value} />
      ) : null}

      {open && !locked ? (
        <div className="fixed inset-0 z-[60] flex flex-col sm:items-center sm:justify-center sm:p-4">
          <button type="button" className="absolute inset-0 bg-surface-950/70 backdrop-blur-sm" aria-label="Close" onClick={() => setOpen(false)} />
          <div className="relative z-10 flex flex-col w-full h-full sm:h-auto sm:max-h-[80vh] sm:max-w-lg bg-surface-900 sm:rounded-2xl border-0 sm:border border-surface-700 shadow-modal">
            <div className="flex items-center justify-between px-4 py-3 border-b border-surface-700/60 min-h-[56px]">
              <h3 className="text-base font-semibold text-surface-50">Select Release</h3>
              <button type="button" onClick={() => setOpen(false)} className="min-h-[44px] min-w-[44px] text-text-400">
                ✕
              </button>
            </div>
            <div className="p-3 border-b border-surface-700/40">
              <input
                autoFocus
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search releases…"
                className="w-full min-h-[48px] rounded-xl border border-surface-700 bg-surface-950 px-4 text-sm text-surface-100 placeholder:text-text-500 focus:outline-none focus:ring-2 focus:ring-primary-500/30"
              />
            </div>
            <div className="flex-1 overflow-y-auto p-2">
              {loading ? (
                <p className="text-sm text-text-500 p-4">Loading releases…</p>
              ) : filtered.length === 0 ? (
                <p className="text-sm text-text-500 p-4">No releases found.</p>
              ) : (
                filtered.map((r) => {
                  const releaseDate = toDate(r.targetReleaseDate ?? r.estimatedReleaseDate);
                  return (
                    <button
                      key={r.id}
                      type="button"
                      onClick={() => {
                        onChange(r);
                        setOpen(false);
                        setQuery('');
                      }}
                      className="w-full flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-surface-800 text-left min-h-[64px]"
                    >
                      {r.artwork?.secureUrl ? (
                        <img src={r.artwork.secureUrl} alt="" className="h-12 w-12 rounded-lg object-cover shrink-0" />
                      ) : (
                        <ArtworkPlaceholder title={r.title} size="sm" />
                      )}
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-surface-100 truncate">{r.title}</p>
                        <p className="text-xs text-text-500 capitalize">
                          {r.releaseType?.replace(/_/g, ' ') || 'Release'}
                          {releaseDate ? ` · ${releaseDate.toLocaleDateString()}` : ''}
                        </p>
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

export function ReleaseContextCard({ release }: { release: ReleaseRecord }) {
  const releaseDate = toDate(release.targetReleaseDate ?? release.estimatedReleaseDate);
  const countdown = daysUntil(releaseDate);

  return (
    <div className="flex items-center gap-3 rounded-xl border border-surface-700/50 bg-surface-950/50 p-3">
      {release.artwork?.secureUrl ? (
        <img src={release.artwork.secureUrl} alt="" className="h-14 w-14 rounded-lg object-cover shrink-0" />
      ) : (
        <ArtworkPlaceholder title={release.title} size="sm" />
      )}
      <div className="min-w-0">
        <p className="text-sm font-semibold text-primary-400 truncate">{release.title}</p>
        <p className="text-xs text-text-500 capitalize">
          {release.releaseType?.replace(/_/g, ' ') || 'Release'}
          {release.genre ? ` · ${release.genre}` : ''}
        </p>
        {countdown ? <p className="text-xs text-text-400 mt-0.5">{countdown}</p> : null}
      </div>
    </div>
  );
}
