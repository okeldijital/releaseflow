'use client';

import { useState, useMemo } from 'react';
import { createNewArtist } from '@/lib/artist-service';

export type ArtistOption = { id: string; name: string };

interface ArtistAddPanelProps {
  artists: ArtistOption[];
  organizationId: string | null;
  onSelect: (artistId: string) => void;
  onArtistCreated?: (artist: ArtistOption) => void;
  excludeIds?: string[];
  onCancel?: () => void;
}

export function ArtistAddPanel({
  artists,
  organizationId,
  onSelect,
  onArtistCreated,
  excludeIds = [],
  onCancel,
}: ArtistAddPanelProps) {
  const [search, setSearch] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState('');
  const [creating, setCreating] = useState(false);

  const available = artists.filter((a) => !excludeIds.includes(a.id));
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return available;
    return available.filter((a) => a.name.toLowerCase().includes(q));
  }, [available, search]);

  const noResults = search.trim().length > 0 && filtered.length === 0;

  async function handleCreate() {
    if (!organizationId || !newName.trim()) return;
    setCreating(true);
    try {
      const id = await createNewArtist({
        name: newName.trim(),
        artistType: 'original_artist',
        organizationId,
      });
      const created = { id, name: newName.trim() };
      onArtistCreated?.(created);
      onSelect(id);
      setNewName('');
      setShowCreate(false);
      setSearch('');
    } finally {
      setCreating(false);
    }
  }

  function handleSelect(artistId: string) {
    onSelect(artistId);
    setSearch('');
    setShowCreate(false);
    setNewName('');
  }

  return (
    <div className="rounded-xl border border-surface-700 bg-surface-900 p-3 space-y-3">
      <input
        type="text"
        value={search}
        onChange={(e) => {
          setSearch(e.target.value);
          setShowCreate(false);
        }}
        placeholder="Search artists..."
        autoFocus
        className="block w-full h-10 rounded-xl border border-surface-700 bg-surface-950 px-3 text-sm text-surface-50 placeholder-text-500 focus:border-primary-500/60 focus:outline-none"
      />

      {filtered.length > 0 ? (
        <div className="max-h-40 overflow-y-auto space-y-1">
          {filtered.map((a) => (
            <button
              key={a.id}
              type="button"
              onClick={() => handleSelect(a.id)}
              className="w-full text-left rounded-lg border border-surface-700 bg-surface-950 px-3 py-2.5 text-sm text-surface-100 hover:border-primary-500/40 hover:bg-primary-500/5 transition-colors"
            >
              <span className="text-success-400 mr-2">✓</span>
              Select Artist · {a.name}
            </button>
          ))}
        </div>
      ) : null}

      {noResults && !showCreate ? (
        <div className="space-y-2 text-center py-2">
          <p className="text-sm text-text-400">No artist found.</p>
          <button
            type="button"
            onClick={() => {
              setShowCreate(true);
              setNewName(search.trim());
            }}
            className="text-sm font-medium text-primary-400 hover:text-primary-300"
          >
            + Create New Artist
          </button>
        </div>
      ) : null}

      {showCreate ? (
        <div className="space-y-2 pt-1 border-t border-surface-700/60">
          <input
            type="text"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="Artist name"
            className="block w-full h-10 rounded-xl border border-surface-700 bg-surface-950 px-3 text-sm text-surface-50 placeholder-text-500 focus:border-primary-500/60 focus:outline-none"
          />
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleCreate}
              disabled={creating || !newName.trim()}
              className="flex-1 h-9 rounded-xl bg-primary-500 text-white text-sm font-semibold disabled:opacity-40"
            >
              {creating ? 'Adding...' : 'Add Artist'}
            </button>
            <button
              type="button"
              onClick={() => { setShowCreate(false); setNewName(''); }}
              className="flex-1 h-9 rounded-xl border border-surface-700 text-sm text-text-400"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : null}

      {!noResults && filtered.length === 0 && available.length === 0 ? (
        <div className="space-y-2 text-center py-2">
          <p className="text-sm text-text-400">No artists in catalogue yet.</p>
          <button
            type="button"
            onClick={() => setShowCreate(true)}
            className="text-sm font-medium text-primary-400 hover:text-primary-300"
          >
            + Create New Artist
          </button>
        </div>
      ) : null}

      {!noResults && filtered.length === 0 && available.length > 0 && !search.trim() ? (
        <p className="text-xs text-text-500 text-center">Search to find an artist, or create a new one.</p>
      ) : null}

      {onCancel ? (
        <button
          type="button"
          onClick={onCancel}
          className="w-full h-9 rounded-xl border border-surface-700 text-sm text-text-400"
        >
          Cancel
        </button>
      ) : null}
    </div>
  );
}

interface ArtistFieldPickerProps {
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
  label,
  value,
  onChange,
  artists,
  organizationId,
  onArtistCreated,
  error,
  excludeIds = [],
}: ArtistFieldPickerProps) {
  const [showAddPanel, setShowAddPanel] = useState(false);

  return (
    <div className="space-y-2">
      <p className="text-xs font-semibold text-text-500 uppercase tracking-wider">{label}</p>
      <select
        value={showAddPanel ? '__add__' : value}
        onChange={(e) => {
          if (e.target.value === '__add__') {
            setShowAddPanel(true);
            return;
          }
          setShowAddPanel(false);
          onChange(e.target.value);
        }}
        className="block w-full h-10 rounded-xl border border-surface-700 bg-surface-950 px-4 text-sm text-surface-50 focus:border-primary-500/60 focus:outline-none"
      >
        <option value="">Select artist...</option>
        {artists.filter((a) => !excludeIds.includes(a.id)).map((a) => (
          <option key={a.id} value={a.id}>{a.name}</option>
        ))}
        <option value="__add__">+ Add Artist</option>
      </select>
      {error ? <p className="text-xs text-danger-400">{error}</p> : null}
      {showAddPanel ? (
        <ArtistAddPanel
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
      ) : null}
    </div>
  );
}

interface FeaturedArtistsPickerProps {
  artists: ArtistOption[];
  organizationId: string | null;
  primaryArtistId: string;
  featuredArtistIds: string[];
  onAdd: (artistId: string) => void;
  onArtistCreated?: (artist: ArtistOption) => void;
}

export function FeaturedArtistsPicker({
  artists,
  organizationId,
  primaryArtistId,
  featuredArtistIds,
  onAdd,
  onArtistCreated,
}: FeaturedArtistsPickerProps) {
  const [showAddPanel, setShowAddPanel] = useState(false);
  const excludeIds = [primaryArtistId, ...featuredArtistIds].filter(Boolean);

  return (
    <div className="space-y-2">
      {!showAddPanel ? (
        <button
          type="button"
          onClick={() => setShowAddPanel(true)}
          className="block w-full h-10 rounded-xl border border-dashed border-surface-700 bg-surface-950 px-4 text-sm text-text-400 hover:text-surface-200 hover:border-surface-600 text-left transition-colors"
        >
          + Add Artist
        </button>
      ) : (
        <ArtistAddPanel
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