'use client';

import { useState, useMemo, useEffect, useCallback, useRef, type KeyboardEvent } from 'react';
import { createNewArtist } from '@/lib/artist-service';
import {
  filterArtistsForSearch,
  canCreateArtistFromSearch,
  type ArtistOption,
} from '@/lib/artist-field-picker-logic';

export type { ArtistOption } from '@/lib/artist-field-picker-logic';

const INITIAL_PANEL_STATE = {
  showAddPanel: false,
  panelInstance: 0,
};

interface ArtistAddPanelProps {
  instanceId: string;
  artists: ArtistOption[];
  organizationId: string | null;
  onSelect: (artistId: string) => void;
  onArtistCreated?: (artist: ArtistOption) => void;
  excludeIds?: string[];
  onCancel?: () => void;
}

export function ArtistAddPanel({
  instanceId,
  artists,
  organizationId,
  onSelect,
  onArtistCreated,
  excludeIds = [],
  onCancel,
}: ArtistAddPanelProps) {
  const [search, setSearch] = useState('');
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const resetPanelState = useCallback(() => {
    setSearch('');
    setCreating(false);
    setError(null);
  }, []);

  useEffect(() => {
    resetPanelState();
    searchInputRef.current?.focus();
  }, [instanceId, resetPanelState]);

  const available = artists.filter((a) => !excludeIds.includes(a.id));

  const searchTrimmed = search.trim();
  const normalizedSearch = searchTrimmed.toLowerCase();

  const filteredArtists = useMemo(
    () => filterArtistsForSearch(available, search),
    [available, search],
  );

  const canCreate = canCreateArtistFromSearch(artists, search);

  function finishSelection(artistId: string) {
    resetPanelState();
    onSelect(artistId);
  }

  function handleSelect(artistId: string) {
    finishSelection(artistId);
  }

  async function handleCreate(name: string) {
    const trimmedName = name.trim();
    if (!organizationId || !trimmedName) return;

    setCreating(true);
    setError(null);
    try {
      const result = await createNewArtist({
        name: trimmedName,
        artistType: 'original_artist',
        organizationId,
      });
      if (excludeIds.includes(result.id)) {
        setError('This artist is already selected.');
        setCreating(false);
        return;
      }
      const created = { id: result.id, name: result.name };
      onArtistCreated?.(created);
      finishSelection(result.id);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create artist.');
      setCreating(false);
    }
  }

  function handleCancel() {
    resetPanelState();
    onCancel?.();
  }

  function handleSearchKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter' && canCreate && !creating) {
      e.preventDefault();
      void handleCreate(searchTrimmed);
    }
  }

  return (
    <div className="rounded-xl border border-surface-700 bg-surface-900 p-3 space-y-3">
      <input
        ref={searchInputRef}
        type="search"
        value={search}
        onChange={(e) => {
          setSearch(e.target.value);
          setError(null);
        }}
        onKeyDown={handleSearchKeyDown}
        placeholder="Type to search or create an artist..."
        autoComplete="off"
        autoCorrect="off"
        autoCapitalize="off"
        spellCheck={false}
        name={`artist-search-${instanceId}`}
        data-1p-ignore
        data-lpignore="true"
        className="block w-full h-10 rounded-xl border border-surface-700 bg-surface-950 px-3 text-sm text-surface-50 placeholder-text-500 focus:border-primary-500/60 focus:outline-none"
      />

      {filteredArtists.length > 0 ? (
        <div className="max-h-40 overflow-y-auto space-y-1">
          {filteredArtists.map((artist) => (
            <button
              key={artist.id}
              type="button"
              onClick={() => handleSelect(artist.id)}
              className="w-full text-left rounded-lg border border-surface-700 bg-surface-950 px-3 py-2.5 text-sm text-surface-100 hover:border-primary-500/40 hover:bg-primary-500/5 transition-colors"
            >
              <span className="text-success-400 mr-2">✓</span>
              {artist.name}
            </button>
          ))}
        </div>
      ) : null}

      {canCreate ? (
        <div className="space-y-2 pt-1 border-t border-surface-700/60">
          <button
            type="button"
            onClick={() => handleCreate(searchTrimmed)}
            disabled={creating}
            className="w-full text-left rounded-lg border border-dashed border-primary-500/40 bg-primary-500/5 px-3 py-2.5 text-sm text-primary-300 hover:border-primary-500/60 hover:bg-primary-500/10 transition-colors disabled:opacity-40"
          >
            {creating ? 'Adding...' : `+ Create Artist "${searchTrimmed}"`}
          </button>
        </div>
      ) : null}

      {error ? <p className="text-xs text-danger-400">{error}</p> : null}

      {!normalizedSearch ? (
        <p className="text-xs text-text-500 text-center">
          {available.length > 0
            ? 'Type an artist name to search the catalogue or create a new artist.'
            : 'No artists in catalogue yet. Type a name to create one.'}
        </p>
      ) : null}

      {onCancel ? (
        <button
          type="button"
          onClick={handleCancel}
          className="w-full h-9 rounded-xl border border-surface-700 text-sm text-text-400"
        >
          Cancel
        </button>
      ) : null}
    </div>
  );
}

interface ArtistFieldPickerProps {
  instanceId: string;
  label: string;
  value: string;
  onChange: (artistId: string) => void;
  artists: ArtistOption[];
  organizationId: string | null;
  onArtistCreated?: (artist: ArtistOption) => void;
  error?: string;
  excludeIds?: string[];
}

export function ArtistFieldPicker({
  instanceId,
  label,
  value,
  onChange,
  artists,
  organizationId,
  onArtistCreated,
  error,
  excludeIds = [],
}: ArtistFieldPickerProps) {
  const [showAddPanel, setShowAddPanel] = useState(INITIAL_PANEL_STATE.showAddPanel);
  const [panelInstance, setPanelInstance] = useState(INITIAL_PANEL_STATE.panelInstance);
  const mountedInstanceId = useRef(instanceId);

  const resetPickerShell = useCallback(() => {
    setShowAddPanel(INITIAL_PANEL_STATE.showAddPanel);
    setPanelInstance(INITIAL_PANEL_STATE.panelInstance);
  }, []);

  useEffect(() => {
    if (mountedInstanceId.current !== instanceId) {
      mountedInstanceId.current = instanceId;
      resetPickerShell();
    }
  }, [instanceId, resetPickerShell]);

  function openAddPanel() {
    setPanelInstance((n) => n + 1);
    setShowAddPanel(true);
  }

  const panelKey = `${instanceId}-${panelInstance}`;

  return (
    <div className="space-y-2" data-artist-picker={instanceId}>
      <p className="text-xs font-semibold text-text-500 uppercase tracking-wider">{label}</p>
      {!showAddPanel ? (
        <div className="space-y-2">
          <select
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="block w-full h-10 rounded-xl border border-surface-700 bg-surface-950 px-4 text-sm text-surface-50 focus:border-primary-500/60 focus:outline-none"
          >
            <option value="">Select artist...</option>
            {artists.filter((a) => !excludeIds.includes(a.id)).map((a) => (
              <option key={a.id} value={a.id}>{a.name}</option>
            ))}
          </select>
          <button
            type="button"
            onClick={openAddPanel}
            className="block w-full h-10 rounded-xl border border-dashed border-surface-700 bg-surface-950 px-4 text-sm text-text-400 hover:text-surface-200 hover:border-surface-600 text-left transition-colors"
          >
            + Add Artist
          </button>
        </div>
      ) : (
        <ArtistAddPanel
          key={panelKey}
          instanceId={panelKey}
          artists={artists}
          organizationId={organizationId}
          excludeIds={excludeIds}
          onArtistCreated={onArtistCreated}
          onSelect={(id) => {
            onChange(id);
            setShowAddPanel(false);
          }}
          onCancel={() => setShowAddPanel(false)}
        />
      )}
      {error ? <p className="text-xs text-danger-400">{error}</p> : null}
    </div>
  );
}

interface FeaturedArtistsPickerProps {
  instanceId: string;
  artists: ArtistOption[];
  organizationId: string | null;
  primaryArtistId: string;
  featuredArtistIds: string[];
  onAdd: (artistId: string) => void;
  onArtistCreated?: (artist: ArtistOption) => void;
}

interface RepeatableArtistEntry {
  id: string;
  artistId: string;
}

interface RepeatableArtistPickerProps {
  instanceId: string;
  label: string;
  addLabel: string;
  entries: RepeatableArtistEntry[];
  artists: ArtistOption[];
  organizationId: string | null;
  onAdd: (artistId: string) => void;
  onRemove: (entryId: string) => void;
  onReorder: (entries: RepeatableArtistEntry[]) => void;
  onArtistCreated?: (artist: ArtistOption) => void;
  excludeIds?: string[];
  error?: string;
}

export function RepeatableArtistPicker({
  instanceId,
  label,
  addLabel,
  entries,
  artists,
  organizationId,
  onAdd,
  onRemove,
  onReorder,
  onArtistCreated,
  excludeIds = [],
  error,
}: RepeatableArtistPickerProps) {
  const [showAddPanel, setShowAddPanel] = useState(false);
  const [panelInstance, setPanelInstance] = useState(0);
  const mountedInstanceId = useRef(instanceId);

  const resetPickerShell = useCallback(() => {
    setShowAddPanel(false);
    setPanelInstance(0);
  }, []);

  useEffect(() => {
    if (mountedInstanceId.current !== instanceId) {
      mountedInstanceId.current = instanceId;
      resetPickerShell();
    }
  }, [instanceId, resetPickerShell]);

  function openAddPanel() {
    setPanelInstance((n) => n + 1);
    setShowAddPanel(true);
  }

  function moveEntry(index: number, direction: -1 | 1) {
    const target = index + direction;
    if (target < 0 || target >= entries.length) return;
    const next = [...entries];
    const moved = next.splice(index, 1)[0]!;
    next.splice(target, 0, moved);
    onReorder(next);
  }

  const allExcluded = [...new Set([...excludeIds, ...entries.map((e) => e.artistId).filter(Boolean)])];
  const panelKey = `${instanceId}-${panelInstance}`;

  return (
    <div className="space-y-2" data-artist-picker={instanceId}>
      <p className="text-xs font-semibold text-text-500 uppercase tracking-wider">{label}</p>
      {entries.map((entry, i) => (
          <div key={entry.id} className="flex items-center gap-2">
            <span className="text-xs text-text-500 w-5 shrink-0 text-right">{i + 1}.</span>
            <select
              value={entry.artistId}
              onChange={(e) => {
                const next = [...entries];
                const current = next[i]!;
                next[i] = { id: current.id, artistId: e.target.value };
                onReorder(next);
              }}
              className="block flex-1 h-10 rounded-xl border border-surface-700 bg-surface-950 px-3 text-sm text-surface-50 focus:border-primary-500/60 focus:outline-none"
            >
              <option value="">Select artist...</option>
              {artists.filter((a) => !allExcluded.includes(a.id) || a.id === entry.artistId).map((a) => (
                <option key={a.id} value={a.id}>{a.name}</option>
              ))}
            </select>
            <div className="flex items-center gap-1 shrink-0">
              <button
                type="button"
                onClick={() => moveEntry(i, -1)}
                disabled={i === 0}
                className="h-8 w-8 flex items-center justify-center rounded-lg border border-surface-700 bg-surface-950 text-text-400 hover:text-surface-200 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                aria-label="Move up"
              >
                <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" /></svg>
              </button>
              <button
                type="button"
                onClick={() => moveEntry(i, 1)}
                disabled={i === entries.length - 1}
                className="h-8 w-8 flex items-center justify-center rounded-lg border border-surface-700 bg-surface-950 text-text-400 hover:text-surface-200 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                aria-label="Move down"
              >
                <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
              </button>
              <button
                type="button"
                onClick={() => onRemove(entry.id)}
                className="h-8 w-8 flex items-center justify-center rounded-lg border border-surface-700 bg-surface-950 text-danger-400 hover:text-danger-300 transition-colors"
                aria-label="Remove"
              >
                <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
          </div>
        ))}
      {!showAddPanel ? (
        <button
          type="button"
          onClick={openAddPanel}
          className="block w-full h-10 rounded-xl border border-dashed border-surface-700 bg-surface-950 px-4 text-sm text-text-400 hover:text-surface-200 hover:border-surface-600 text-left transition-colors"
        >
          {addLabel}
        </button>
      ) : (
        <ArtistAddPanel
          key={panelKey}
          instanceId={panelKey}
          artists={artists}
          organizationId={organizationId}
          excludeIds={allExcluded}
          onArtistCreated={onArtistCreated}
          onSelect={(artistId) => {
            onAdd(artistId);
            setShowAddPanel(false);
          }}
          onCancel={() => setShowAddPanel(false)}
        />
      )}
      {error ? <p className="text-xs text-danger-400">{error}</p> : null}
    </div>
  );
}

export type { RepeatableArtistEntry };

export function FeaturedArtistsPicker({
  instanceId,
  artists,
  organizationId,
  primaryArtistId,
  featuredArtistIds,
  onAdd,
  onArtistCreated,
}: FeaturedArtistsPickerProps) {
  const [showAddPanel, setShowAddPanel] = useState(INITIAL_PANEL_STATE.showAddPanel);
  const [panelInstance, setPanelInstance] = useState(INITIAL_PANEL_STATE.panelInstance);
  const mountedInstanceId = useRef(instanceId);

  const resetPickerShell = useCallback(() => {
    setShowAddPanel(INITIAL_PANEL_STATE.showAddPanel);
    setPanelInstance(INITIAL_PANEL_STATE.panelInstance);
  }, []);

  useEffect(() => {
    if (mountedInstanceId.current !== instanceId) {
      mountedInstanceId.current = instanceId;
      resetPickerShell();
    }
  }, [instanceId, resetPickerShell]);

  const excludeIds = [primaryArtistId, ...featuredArtistIds].filter(Boolean);

  function openAddPanel() {
    setPanelInstance((n) => n + 1);
    setShowAddPanel(true);
  }

  const panelKey = `${instanceId}-${panelInstance}`;

  return (
    <div className="space-y-2" data-artist-picker={instanceId}>
      {!showAddPanel ? (
        <button
          type="button"
          onClick={openAddPanel}
          className="block w-full h-10 rounded-xl border border-dashed border-surface-700 bg-surface-950 px-4 text-sm text-text-400 hover:text-surface-200 hover:border-surface-600 text-left transition-colors"
        >
          + Add Artist
        </button>
      ) : (
        <ArtistAddPanel
          key={panelKey}
          instanceId={panelKey}
          artists={artists}
          organizationId={organizationId}
          excludeIds={excludeIds}
          onArtistCreated={onArtistCreated}
          onSelect={(id) => {
            onAdd(id);
            setShowAddPanel(false);
          }}
          onCancel={() => setShowAddPanel(false)}
        />
      )}
    </div>
  );
}