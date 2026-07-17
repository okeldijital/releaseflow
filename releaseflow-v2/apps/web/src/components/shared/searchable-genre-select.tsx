'use client';

import { useState, useEffect, useMemo } from 'react';
import { getGenresByOrg, createGenre, createSubgenre, getSubgenresByGenre } from '@/lib/genre-service';
import { toast } from '@/stores/toast-store';

export function SearchableGenreSelect({
  value,
  onChange,
  orgId,
  userId,
  presets,
  placeholder,
  label,
  genreId,
}: {
  value: string;
  onChange: (value: string) => void;
  orgId: string | null;
  userId: string;
  presets: string[];
  placeholder: string;
  label: string;
  genreId?: string;
}) {
  const [search, setSearch] = useState(value);
  const [open, setOpen] = useState(false);
  const [orgGenres, setOrgGenres] = useState<string[]>([]);
  const [creating, setCreating] = useState(false);

  useEffect(() => { setSearch(value); }, [value]);

  useEffect(() => {
    if (!open || !orgId) return;
    if (genreId) {
      getSubgenresByGenre(orgId, genreId).then((sg) => setOrgGenres(sg.map((s) => s.name))).catch(() => setOrgGenres([]));
    } else {
      getGenresByOrg(orgId).then((g) => setOrgGenres(g.map((x) => x.name))).catch(() => setOrgGenres([]));
    }
  }, [open, orgId, genreId]);

  const allOptions = useMemo(() => {
    const combined = new Set([...presets, ...orgGenres]);
    return Array.from(combined).sort();
  }, [presets, orgGenres]);

  const filtered = search.trim()
    ? allOptions.filter((o) => o.toLowerCase().includes(search.toLowerCase()))
    : allOptions;

  const noResults = search.trim() && filtered.length === 0;

  async function handleCreate() {
    if (!orgId || !userId || !search.trim()) return;
    setCreating(true);
    try {
      if (genreId) {
        const rec = await createSubgenre(orgId, genreId, search.trim(), userId);
        setOrgGenres((prev) => [...prev, rec.name]);
        onChange(rec.name);
        setSearch(rec.name);
      } else {
        const rec = await createGenre(orgId, search.trim(), userId);
        setOrgGenres((prev) => [...prev, rec.name]);
        onChange(rec.name);
        setSearch(rec.name);
      }
      setOpen(false);
    } catch {
      toast.error('Failed to create genre.');
    } finally {
      setCreating(false);
    }
  }

  return (
    <div className="space-y-1.5 relative">
      <label className="text-xs font-medium text-content-label">{label}</label>
      <input
        type="text"
        value={search}
        onChange={(e) => { setSearch(e.target.value); setOpen(true); }}
        onFocus={() => setOpen(true)}
        placeholder={placeholder}
        className="block w-full h-10 rounded-xl border border-surface-200 px-3 text-sm text-content-primary placeholder:text-content-label focus:border-primary-500 focus:outline-none"
      />
      {open && (
        <>
          <button
            type="button"
            className="fixed inset-0 z-10"
            onClick={() => setOpen(false)}
            aria-label="Close"
          />
          <div className="absolute z-20 top-full mt-1 left-0 right-0 max-h-48 overflow-y-auto rounded-xl border border-surface-200 bg-layer-2 shadow-lg">
            {filtered.map((option) => (
              <button
                key={option}
                type="button"
                onClick={() => { onChange(option); setSearch(option); setOpen(false); }}
                className={`w-full text-left px-3 py-2 text-sm transition-colors ${
                  value === option ? 'bg-primary-500/10 text-primary-500 font-medium' : 'text-content-primary hover:bg-surface-100'
                }`}
              >
                {option}
              </button>
            ))}
            {noResults && (
              <button
                type="button"
                onClick={handleCreate}
                disabled={creating}
                className="w-full text-left px-3 py-2 text-sm text-primary-500 hover:bg-surface-100 font-medium"
              >
                {creating ? 'Creating...' : `+ Create "${search.trim()}"`}
              </button>
            )}
          </div>
        </>
      )}
    </div>
  );
}
