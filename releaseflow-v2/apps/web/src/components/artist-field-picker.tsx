'use client';

import { useState } from 'react';
import { createNewArtist } from '@/lib/artist-service';

export type ArtistOption = { id: string; name: string };

interface ArtistFieldPickerProps {
  label: string;
  value: string;
  onChange: (artistId: string) => void;
  artists: ArtistOption[];
  organizationId: string | null;
  onArtistCreated?: (artist: ArtistOption) => void;
  error?: string;
}

export function ArtistFieldPicker({
  label,
  value,
  onChange,
  artists,
  organizationId,
  onArtistCreated,
  error,
}: ArtistFieldPickerProps) {
  const [showInvite, setShowInvite] = useState(false);
  const [inviteName, setInviteName] = useState('');
  const [inviting, setInviting] = useState(false);

  async function handleInvite() {
    if (!organizationId || !inviteName.trim()) return;
    setInviting(true);
    try {
      const id = await createNewArtist({
        name: inviteName.trim(),
        artistType: 'original_artist',
        organizationId,
      });
      const created = { id, name: inviteName.trim() };
      onArtistCreated?.(created);
      onChange(id);
      setInviteName('');
      setShowInvite(false);
    } finally {
      setInviting(false);
    }
  }

  return (
    <div className="space-y-2">
      <p className="text-xs font-semibold text-text-500 uppercase tracking-wider">{label}</p>
      <select
        value={value}
        onChange={(e) => {
          if (e.target.value === '__invite__') {
            setShowInvite(true);
            return;
          }
          onChange(e.target.value);
        }}
        className="block w-full h-10 rounded-xl border border-surface-700 bg-surface-950 px-4 text-sm text-surface-50 focus:border-primary-500/60 focus:outline-none"
      >
        <option value="">Select artist...</option>
        {artists.map((a) => (
          <option key={a.id} value={a.id}>{a.name}</option>
        ))}
        <option value="__invite__">+ Invite Artist</option>
      </select>
      {error ? <p className="text-xs text-danger-400">{error}</p> : null}
      {showInvite && (
        <div className="rounded-xl border border-surface-700 bg-surface-900 p-3 space-y-2">
          <input
            type="text"
            value={inviteName}
            onChange={(e) => setInviteName(e.target.value)}
            placeholder="Artist name"
            className="block w-full h-10 rounded-xl border border-surface-700 bg-surface-950 px-3 text-sm text-surface-50 placeholder-text-500 focus:border-primary-500/60 focus:outline-none"
          />
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleInvite}
              disabled={inviting || !inviteName.trim()}
              className="flex-1 h-9 rounded-xl bg-primary-500 text-white text-sm font-semibold disabled:opacity-40"
            >
              {inviting ? 'Adding...' : 'Add Artist'}
            </button>
            <button
              type="button"
              onClick={() => { setShowInvite(false); setInviteName(''); }}
              className="flex-1 h-9 rounded-xl border border-surface-700 text-sm text-text-400"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}