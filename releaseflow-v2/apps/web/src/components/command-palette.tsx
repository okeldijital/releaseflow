'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { collection, query, where, getDocs, orderBy, limit } from '@firebase/firestore';
import { getDb } from '@/lib/firebase';
import { fetchArtistSearch } from '@/lib/artist-service';
import { useOrgStore } from '@/stores/org-store';

interface SearchResult {
  id: string;
  title: string;
  type: 'release' | 'artist' | 'campaign' | 'contributor' | 'track';
  href: string;
  /** EPIC-202A — secondary line (e.g. Featured Artist role) */
  subtitle?: string;
}

export interface CommandPaletteProps {
  /** Controlled open state from the application shell top bar. */
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  /** Seed query when opened from the global Search field. */
  initialQuery?: string;
}

export function CommandPalette({
  open: controlledOpen,
  onOpenChange,
  initialQuery = '',
}: CommandPaletteProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const open = controlledOpen ?? internalOpen;
  const setOpen = useCallback(
    (next: boolean | ((prev: boolean) => boolean)) => {
      const value = typeof next === 'function' ? next(open) : next;
      if (controlledOpen === undefined) setInternalOpen(value);
      onOpenChange?.(value);
    },
    [controlledOpen, onOpenChange, open],
  );
  const [queryText, setQueryText] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [selected, setSelected] = useState(0);
  const [searching, setSearching] = useState(false);
  const { activeOrgId } = useOrgStore();
  const router = useRouter();

  useEffect(() => {
    if (open && initialQuery) {
      setQueryText(initialQuery);
    }
  }, [open, initialQuery]);

  const search = useCallback(async (q: string) => {
    if (q.length < 2) { setResults([]); return; }
    setSearching(true);
    const db = getDb();
    if (!db) return;

    const all: SearchResult[] = [];

    if (activeOrgId) {
      const relSnap = await getDocs(query(
        collection(db, 'releases'),
        where('organizationId', '==', activeOrgId),
        orderBy('title'),
        limit(10),
      ));
      for (const d of relSnap.docs) {
        const data = d.data();
        const title = data.title as string;
        if (!title) continue;
        const lifecycle = data.lifecycle as string;
        const actionLabel = lifecycle === 'draft' ? 'Continue Editing' : 'Open Release';
        const href = `/releases/${d.id}`;
        if ((q.toLowerCase()).length === 0 || title.toLowerCase().includes(q.toLowerCase())) {
          all.push({ id: d.id, title, type: 'release', href, subtitle: actionLabel });
        }
      }
    }

    if (activeOrgId) {
      const artists = await fetchArtistSearch(activeOrgId, q);
      artists.slice(0, 5).forEach((a) => {
        all.push({ id: a.id, title: a.name, type: 'artist', href: `/artists/${a.id}` });
      });

      // EPIC-202A — track search by title / displayTitle / linked artist names
      try {
        const { fetchTracksByOrg } = await import('@/lib/track-service');
        const { fetchArtist } = await import('@/lib/artist-service');
        const { resolveTrackDisplayTitle } = await import('@/lib/display-title');
        const { resolveRecordingType } = await import('@/lib/recording-type');
        const tracks = await fetchTracksByOrg(activeOrgId);
        const qLower = q.toLowerCase();
        const nameCache = new Map<string, string>();

        const orgId = activeOrgId;
        async function nameFor(id: string): Promise<string> {
          const cached = nameCache.get(id);
          if (cached !== undefined) return cached;
          const a = await fetchArtist(orgId, id);
          const n = a?.name ?? '';
          nameCache.set(id, n);
          return n;
        }

        for (const t of tracks) {
          if (all.filter((r) => r.type === 'track').length >= 5) break;

          const titleMatch =
            t.title.toLowerCase().includes(qLower) ||
            (t.displayTitle ?? '').toLowerCase().includes(qLower);

          const originalIds = [
            ...(t.originalArtistIds ?? []),
            t.primaryArtistId,
            t.originalArtistId,
          ].filter(Boolean) as string[];
          const featuredIds = t.featuredArtistIds ?? [];
          const remixIds = [
            ...(t.remixArtistIds ?? []),
            t.remixerArtistId,
          ].filter(Boolean) as string[];

          let roleHit: string | null = null;
          let originalNames: string[] = [];
          let featuredNames: string[] = [];
          let remixNames: string[] = [];

          if (!titleMatch) {
            for (const id of originalIds) {
              const n = await nameFor(id);
              if (n && n.toLowerCase().includes(qLower)) {
                roleHit = 'Original Artist';
                break;
              }
            }
            if (!roleHit) {
              for (const id of featuredIds) {
                const n = await nameFor(id);
                if (n && n.toLowerCase().includes(qLower)) {
                  roleHit = 'Featured Artist';
                  break;
                }
              }
            }
            if (!roleHit) {
              for (const id of remixIds) {
                const n = await nameFor(id);
                if (n && n.toLowerCase().includes(qLower)) {
                  roleHit = 'Remix Artist';
                  break;
                }
              }
            }
            if (!roleHit) continue;
          }

          originalNames = await Promise.all(originalIds.map(nameFor));
          featuredNames = await Promise.all(featuredIds.map(nameFor));
          remixNames = await Promise.all(remixIds.map(nameFor));
          originalNames = originalNames.filter(Boolean);
          featuredNames = featuredNames.filter(Boolean);
          remixNames = remixNames.filter(Boolean);

          const display = resolveTrackDisplayTitle({
            title: t.title,
            displayTitle: t.displayTitle,
            displayTitleEdited: t.displayTitleEdited,
            originalArtistNames: originalNames,
            featuredArtistNames: featuredNames,
            remixArtistNames: remixNames,
            isRemix: resolveRecordingType(t.recordingType) === 'remix',
            includeOriginalPrefix: false,
          });

          all.push({
            id: t.id,
            title: display,
            type: 'track',
            href: `/tracks/${t.id}`,
            subtitle: roleHit ?? undefined,
          });
        }
      } catch {
        /* track search best-effort */
      }
    }

    if (activeOrgId) {
      const campSnap = await getDocs(query(
        collection(db, 'campaigns'),
        orderBy('name'),
        limit(5),
      ));
      campSnap.docs.forEach((d) => {
        const data = d.data();
        if ((data.name as string)?.toLowerCase().includes(q.toLowerCase())) {
          all.push({ id: d.id, title: data.name as string, type: 'campaign', href: `/campaigns/${d.id}` });
        }
      });
    }

    setResults(all.slice(0, 10));
    setSearching(false);
  }, [activeOrgId]);

  useEffect(() => {
    const t = setTimeout(() => { search(queryText); }, 200);
    return () => clearTimeout(t);
  }, [queryText, search]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setOpen((prev) => {
          const next = !prev;
          if (next) {
            setQueryText('');
            setResults([]);
            setSelected(0);
          }
          return next;
        });
      }
      if (e.key === 'Escape' && open) {
        e.preventDefault();
        setOpen(false);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open, setOpen]);

  useEffect(() => {
    if (!open) return;
    const dialog = document.querySelector('[role="dialog"]');
    if (!dialog) return;
    const focusable = dialog.querySelectorAll<HTMLElement>(
      'input, button, [tabindex]:not([tabindex="-1"])'
    );
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    const trap = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return;
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last?.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first?.focus(); }
    };
    dialog.addEventListener('keydown', trap as EventListener);
    first?.focus();
    return () => dialog.removeEventListener('keydown', trap as EventListener);
  }, [open]);

  if (!open) return null;

  const navigate = (href: string) => {
    setOpen(false);
    router.push(href);
  };

  const navItems: SearchResult[] = [
    { id: 'nav-dash', title: 'Dashboard', type: 'contributor', href: '/dashboard' },
    { id: 'nav-rel', title: 'Releases', type: 'release', href: '/releases' },
    { id: 'nav-art', title: 'Artists', type: 'artist', href: '/artists' },
    { id: 'nav-camp', title: 'Campaigns', type: 'campaign', href: '/campaigns' },
    { id: 'nav-ops', title: 'Operations Center', type: 'contributor', href: '/dashboard' },
    { id: 'nav-app', title: 'Approvals', type: 'contributor', href: '/approvals' },
    { id: 'nav-con', title: 'Contributor', type: 'contributor', href: '/contributor' },
  ];

  const display = queryText ? results : navItems;

  return (
    <>
      <div className="fixed inset-0 z-[90] bg-black/30" onClick={() => setOpen(false)} aria-hidden="true" />
      <div
        className="fixed top-[20%] left-1/2 -translate-x-1/2 z-[91] w-full max-w-lg bg-layer-2 rounded-xl border border-surface-200 shadow-modal overflow-hidden"
        role="dialog"
        aria-modal="true"
        aria-label="Command palette"
      >
        <div className="flex items-center gap-3 px-4 py-3 border-b border-surface-200">
          <svg className="w-5 h-5 text-content-label shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
          <input
            autoFocus
            value={queryText}
            onChange={(e) => setQueryText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'ArrowDown') { e.preventDefault(); setSelected((s) => Math.min(s + 1, display.length - 1)); }
              if (e.key === 'ArrowUp') { e.preventDefault(); setSelected((s) => Math.max(s - 1, 0)); }
              if (e.key === 'Enter') { const item = display[selected]; if (item) navigate(item.href); }
            }}
            placeholder="Search releases, tracks, artists..."
            className="flex-1 bg-transparent text-sm text-content-primary placeholder:text-content-label outline-none"
            role="combobox"
            aria-expanded={true}
            aria-controls="palette-results"
            aria-activedescendant={display[selected] ? `palette-option-${selected}` : undefined}
          />
          <kbd className="text-xs text-content-label bg-surface-100 rounded px-1.5 py-0.5">ESC</kbd>
        </div>

        {searching ? (
          <div className="p-4 text-sm text-content-label text-center" role="status">Searching...</div>
        ) : display.length === 0 ? (
          <div className="p-4 text-sm text-content-label text-center" role="status">No results found.</div>
        ) : (
          <div className="max-h-64 overflow-y-auto py-2" id="palette-results" role="listbox">
            {!queryText ? <p className="px-4 py-1 text-xs font-medium text-content-label uppercase">Navigate</p> : null}
            {display.map((item, i) => (
              <button
                key={item.id}
                id={`palette-option-${i}`}
                onClick={() => navigate(item.href)}
                role="option"
                aria-selected={i === selected}
                className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm text-left transition-colors ${i === selected ? 'bg-surface-100' : 'hover:bg-surface-50'}`}
              >
                <span className={`text-xs rounded px-1.5 py-0.5 shrink-0 ${
                  item.type === 'release' ? 'bg-primary-50 text-primary-500' :
                  item.type === 'artist' ? 'bg-info-50 text-info-500' :
                  item.type === 'campaign' ? 'bg-success-50 text-success-500' :
                  item.type === 'track' ? 'bg-warning-50 text-warning-600' :
                   'bg-surface-100 text-content-secondary'
                }`}>{item.type}</span>
                <span className="min-w-0 flex-1">
                  <span className="truncate text-content-primary block">{item.title}</span>
                  {item.subtitle ? (
                    <span className="truncate text-xs text-content-label block">Role: {item.subtitle}</span>
                  ) : null}
                </span>
              </button>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
