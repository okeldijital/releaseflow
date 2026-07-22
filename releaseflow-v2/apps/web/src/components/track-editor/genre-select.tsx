'use client';

/**
 * BUILD-012C — searchable single-select from the shared genre catalogue.
 * No free-text create; catalogue is the sole source of options.
 */

import { useMemo, useState } from 'react';
import { RECORDING_GENRE_CATALOGUE } from '@/lib/recording-genre-catalogue';
import { trackEditorClasses } from './track-editor-styles';
import type { TrackEditorVariant } from './types';

export function GenreSelect({
  value,
  onChange,
  variant = 'dark',
  error,
  instanceId,
}: {
  value: string;
  onChange: (genre: string) => void;
  variant?: TrackEditorVariant;
  error?: string;
  instanceId: string;
}) {
  const c = trackEditorClasses(variant);
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState(value);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return [...RECORDING_GENRE_CATALOGUE];
    return RECORDING_GENRE_CATALOGUE.filter((g) => g.toLowerCase().includes(q));
  }, [search]);

  return (
    <div className="space-y-1.5 relative">
      <label className={c.fieldLabel} htmlFor={`${instanceId}-genre`}>
        Genre
      </label>
      <p className={`${c.helper} mb-1`}>Primary genre of this recording.</p>
      <input
        id={`${instanceId}-genre`}
        type="text"
        role="combobox"
        aria-expanded={open}
        aria-controls={`${instanceId}-genre-list`}
        autoComplete="off"
        value={search}
        onChange={(e) => {
          setSearch(e.target.value);
          setOpen(true);
          // Clear selection if user edits away from a catalogue value
          if (e.target.value !== value) onChange('');
        }}
        onFocus={() => {
          setSearch(value || search);
          setOpen(true);
        }}
        placeholder="Search genre"
        className={c.input}
      />
      {open ? (
        <>
          <button
            type="button"
            className="fixed inset-0 z-10"
            aria-label="Close genre list"
            onClick={() => {
              setOpen(false);
              setSearch(value);
            }}
          />
          <div
            id={`${instanceId}-genre-list`}
            role="listbox"
            className={
              variant === 'light'
                ? 'absolute z-20 top-full mt-1 left-0 right-0 max-h-48 overflow-y-auto rounded-xl border border-surface-200 bg-layer-2 shadow-lg'
                : 'absolute z-20 top-full mt-1 left-0 right-0 max-h-48 overflow-y-auto rounded-xl border border-surface-700 bg-surface-900 shadow-lg'
            }
          >
            {filtered.map((option) => (
              <button
                key={option}
                type="button"
                role="option"
                aria-selected={value === option}
                onClick={() => {
                  onChange(option);
                  setSearch(option);
                  setOpen(false);
                }}
                className={
                  value === option
                    ? 'w-full text-left px-3 py-2 text-sm bg-primary-500/10 text-primary-400 font-medium'
                    : variant === 'light'
                      ? 'w-full text-left px-3 py-2 text-sm text-content-primary hover:bg-surface-100'
                      : 'w-full text-left px-3 py-2 text-sm text-surface-100 hover:bg-surface-800'
                }
              >
                {option}
              </button>
            ))}
            {filtered.length === 0 ? (
              <p className={`px-3 py-2 text-sm ${c.helper}`}>No matching genre.</p>
            ) : null}
          </div>
        </>
      ) : null}
      {error ? <p className={c.error}>{error}</p> : null}
    </div>
  );
}
