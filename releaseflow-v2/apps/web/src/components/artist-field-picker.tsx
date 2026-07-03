'use client';

import { useState, useMemo, useEffect, useCallback } from 'react';
import { createNewArtist } from '@/lib/artist-service';

export type ArtistOption = { id: string; name: string };

function normalizeArtistName(name: string): string {
  return name.trim().toLowerCase();
}

function mergeArtistOptions(base: ArtistOption[], extras: ArtistOption[]): ArtistOption[] {
  const byId = new Map<string, ArtistOption>();
  for (const a of base) byId.set(a.id, a);
  for (const a of extras) byId.set(a.id, a);
  return Array.from(byId.values());
}

function findArtistByName(artists: ArtistOption[], name: string): ArtistOption | undefined {
  const norm = normalizeArtistName(name);
  if (!norm) return undefined;
  return artists.find((a) => normalizeArtistName(a.name) === norm);
}

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

  const resetPanelState = useCallback(() => {
    setSearch('');
    setCreating(false);
    setError(null);
  }, []);

  useEffect(() => {
    resetPanelState();
  }, [instanceId, resetPanelState]);

  const available = artists.filter((a) => !excludeIds.includes(a.id));

  const searchTrimmed = search.trim();
  const normalizedSearch = searchTrimmed.toLowerCase();

  const filteredArtists = useMemo(() => {
    if (!normalizedSearch) return available;
    return available.filter((artist) => artist.name.toLowerCase().includes(normalizedSearch));
  }, [available, normalizedSearch]);

  const exactMatch = searchTrimmed ? findArtistByName(artists, searchTrimmed) : undefined;
  const exactMatchExcluded = exactMatch ? excludeIds.includes(exactMatch.id) : false;
  const hasExactMatch = !!exactMatch;
  const canCreate = normalizedSearch.length > 0 && !hasExactMatch;

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

    const existing = findArtistByName(artists, trimmedName);
    if (existing) {
      if (excludeIds.includes(existing.id)) {
        setError('This artist is already selected.');
        return;
      }
      onArtistCreated?.(existing);
      finishSelection(existing.id);
      return;
    }

    setCreating(true);
    setError(null);
    try {
      const id = await createNewArtist({
        name: trimmedName,
        artistType: 'original_artist',
        organizationId,
      });
      const created = { id, name: trimmedName };
      onArtistCreated?.(created);
      finishSelection(id);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create artist.');
      setCreating(false);
    }
  }

  function handleCancel() {
    resetPanelState();
    onCancel?.();
  }

  return (
    <div className="rounded-xl border border-surface-700 bg-surface-900 p-3 space-y-3">
      <input
        type="text"
        value={search}
        onChange={(e) => {
          setSearch(e.target.value);
          setError(null);
        }}
        placeholder="Search artists..."
        autoFocus
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

      {exactMatch && exactMatchExcluded ? (
        <p className="text-sm text-text-400 text-center py-2">This artist is already selected.</p>
      ) : null}

      {exactMatch && !exactMatchExcluded && !filteredArtists.some((a) => a.id === exactMatch.id) ? (
        <button
          type="button"
          onClick={() => handleSelect(exactMatch.id)}
          className="w-full text-left rounded-lg border border-surface-700 bg-surface-950 px-3 py-2.5 text-sm text-surface-100 hover:border-primary-500/40 hover:bg-primary-500/5 transition-colors"
        >
          <span className="text-success-400 mr-2">✓</span>
          {exactMatch.name}
        </button>
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

      {!normalizedSearch && available.length > 0 ? (
        <p className="text-xs text-text-500 text-center">Search to find an artist, or type a new name to create one.</p>
      ) : null}

      {!normalizedSearch && available.length === 0 ? (
        <p className="text-xs text-text-500 text-center">No artists in catalogue yet. Type a name to create one.</p>
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
  const [extraArtists, setExtraArtists] = useState<ArtistOption[]>([]);

  const catalogue = useMemo(
    () => mergeArtistOptions(artists, extraArtists),
    [artists, extraArtists],
  );

  const resetPickerShell = useCallback(() => {
    setShowAddPanel(INITIAL_PANEL_STATE.showAddPanel);
    setPanelInstance(INITIAL_PANEL_STATE.panelInstance);
    setExtraArtists([]);
  }, []);

  useEffect(() => {
    resetPickerShell();
  }, [instanceId, resetPickerShell]);

  useEffect(() => {
    setExtraArtists((prev) => prev.filter((e) => !artists.some((a) => a.id === e.id)));
  }, [artists]);

  function handleArtistCreated(created: ArtistOption) {
    setExtraArtists((prev) => (prev.some((a) => a.id === created.id) ? prev : [...prev, created]));
    onArtistCreated?.(created);
  }

  function openAddPanel() {
    setPanelInstance((n) => n + 1);
    setShowAddPanel(true);
  }

  const panelKey = `${instanceId}-${panelInstance}`;

  return (
    <div className="space-y-2" data-artist-picker={instanceId}>
      <p className="text-xs font-semibold text-text-500 uppercase tracking-wider">{label}</p>
      <select
        value={showAddPanel ? '__add__' : value}
        onChange={(e) => {
          if (e.target.value === '__add__') {
            openAddPanel();
            return;
          }
          setShowAddPanel(false);
          onChange(e.target.value);
        }}
        className="block w-full h-10 rounded-xl border border-surface-700 bg-surface-950 px-4 text-sm text-surface-50 focus:border-primary-500/60 focus:outline-none"
      >
        <option value="">Select artist...</option>
        {catalogue.filter((a) => !excludeIds.includes(a.id)).map((a) => (
          <option key={a.id} value={a.id}>{a.name}</option>
        ))}
        <option value="__add__">+ Add Artist</option>
      </select>
      {error ? <p className="text-xs text-danger-400">{error}</p> : null}
      {showAddPanel ? (
        <ArtistAddPanel
          key={panelKey}
          instanceId={panelKey}
          artists={catalogue}
          organizationId={organizationId}
          excludeIds={excludeIds}
          onArtistCreated={handleArtistCreated}
          onSelect={(id) => {
            onChange(id);
            setShowAddPanel(false);
          }}
          onCancel={() => setShowAddPanel(false)}
        />
      ) : null}
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
  const [extraArtists, setExtraArtists] = useState<ArtistOption[]>([]);

  const catalogue = useMemo(
    () => mergeArtistOptions(artists, extraArtists),
    [artists, extraArtists],
  );

  const resetPickerShell = useCallback(() => {
    setShowAddPanel(INITIAL_PANEL_STATE.showAddPanel);
    setPanelInstance(INITIAL_PANEL_STATE.panelInstance);
    setExtraArtists([]);
  }, []);

  useEffect(() => {
    resetPickerShell();
  }, [instanceId, resetPickerShell]);

  useEffect(() => {
    setExtraArtists((prev) => prev.filter((e) => !artists.some((a) => a.id === e.id)));
  }, [artists]);

  const excludeIds = [primaryArtistId, ...featuredArtistIds].filter(Boolean);

  function handleArtistCreated(created: ArtistOption) {
    setExtraArtists((prev) => (prev.some((a) => a.id === created.id) ? prev : [...prev, created]));
    onArtistCreated?.(created);
  }

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
          artists={catalogue}
          organizationId={organizationId}
          excludeIds={excludeIds}
          onArtistCreated={handleArtistCreated}
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