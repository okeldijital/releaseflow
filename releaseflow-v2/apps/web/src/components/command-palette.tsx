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
  type: 'release' | 'artist' | 'campaign' | 'contributor';
  href: string;
}

export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const [queryText, setQueryText] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [selected, setSelected] = useState(0);
  const [searching, setSearching] = useState(false);
  const { activeOrgId } = useOrgStore();
  const router = useRouter();

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
        limit(5),
      ));
      relSnap.docs.forEach((d) => {
        const data = d.data();
        if ((data.title as string)?.toLowerCase().includes(q.toLowerCase())) {
          all.push({ id: d.id, title: data.title as string, type: 'release', href: `/releases/${d.id}` });
        }
      });
    }

    if (activeOrgId) {
      const artists = await fetchArtistSearch(activeOrgId, q);
      artists.slice(0, 5).forEach((a) => {
        all.push({ id: a.id, title: a.name, type: 'artist', href: `/artists/${a.id}` });
      });
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

    setResults(all.slice(0, 8));
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
        setOpen((prev) => !prev);
        setQueryText('');
        setResults([]);
        setSelected(0);
      }
      if (e.key === 'Escape' && open) {
        e.preventDefault();
        setOpen(false);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open]);

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
            placeholder="Search releases, artists, campaigns..."
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
                   'bg-surface-100 text-content-secondary'
                }`}>{item.type}</span>
                <span className="truncate text-content-primary">{item.title}</span>
              </button>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
