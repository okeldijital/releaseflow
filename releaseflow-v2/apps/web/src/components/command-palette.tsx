'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Badge } from '@releaseflow/ui';
import { useOrgStore } from '@/stores/org-store';
import { useGlobalSearch } from '@/hooks/use-global-search';

interface DisplayItem {
  id: string;
  title: string;
  type: string;
  url: string;
  subtitle?: string;
}

export interface CommandPaletteProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
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
  const [selected, setSelected] = useState(0);
  const { activeOrgId } = useOrgStore();
  const { results, searching, error } = useGlobalSearch(queryText, activeOrgId);
  const router = useRouter();

  useEffect(() => {
    if (open && initialQuery) {
      setQueryText(initialQuery);
    }
  }, [open, initialQuery]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setOpen((prev) => {
          const next = !prev;
          if (next) {
            setQueryText('');
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

  const navigate = (url: string) => {
    setOpen(false);
    router.push(url);
  };

  const navItems: DisplayItem[] = [
    { id: 'nav-dash', title: 'Dashboard', type: 'dashboard', url: '/dashboard' },
    { id: 'nav-rel', title: 'Releases', type: 'release', url: '/releases' },
    { id: 'nav-art', title: 'Artists', type: 'artist', url: '/artists' },
    { id: 'nav-camp', title: 'Campaigns', type: 'campaign', url: '/campaigns' },
    { id: 'nav-ops', title: 'Operations Center', type: 'dashboard', url: '/dashboard' },
    { id: 'nav-app', title: 'Approvals', type: 'dashboard', url: '/approvals' },
    { id: 'nav-con', title: 'Contributor', type: 'dashboard', url: '/contributor' },
  ];

  const display: DisplayItem[] = queryText
    ? results.map((r) => ({
        id: r.id,
        title: r.title,
        type: r.type,
        url: r.url,
        subtitle: r.subtitle,
      }))
    : navItems;

  return (
    <>
      <div className="fixed inset-0 z-[90] bg-surface-900/40 backdrop-blur-sm" onClick={() => setOpen(false)} aria-hidden="true" />
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
              if (e.key === 'Enter') { const item = display[selected]; if (item) navigate(item.url); }
            }}
            placeholder="Search releases, tracks, artists..."
            className="flex-1 bg-transparent text-sm text-content-primary placeholder:text-content-label outline-none"
            role="combobox"
            aria-expanded={true}
            aria-controls="palette-results"
            aria-activedescendant={display[selected] ? `palette-option-${selected}` : undefined}
          />
          <kbd className="text-xs text-content-label bg-layer-2 border border-surface-200 rounded px-1.5 py-0.5">ESC</kbd>
        </div>

        {searching ? (
          <div className="p-4 text-sm text-content-label text-center" role="status">Searching...</div>
        ) : error ? (
          <div className="p-4 text-sm text-content-label text-center" role="alert">Unable to search. Please try again.</div>
        ) : display.length === 0 ? (
          <div className="p-4 text-sm text-content-label text-center" role="status">{queryText ? 'No results found. Try another search.' : 'No results found.'}</div>
        ) : (
          <div className="max-h-64 overflow-y-auto py-2" id="palette-results" role="listbox">
            {!queryText ? <p className="px-4 py-1 text-xs font-medium text-content-label uppercase">Navigate</p> : null}
            {display.map((item, i) => (
              <button
                key={item.id}
                id={`palette-option-${i}`}
                onClick={() => navigate(item.url)}
                role="option"
                aria-selected={i === selected}
                className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500/30 ${i === selected ? 'bg-primary-500/10' : 'hover:bg-layer-3'}`}
              >
                <Badge
                  label={item.type}
                  color={
                    item.type === 'release' ? 'bg-primary-50 text-primary-600' :
                    item.type === 'artist' ? 'bg-info-50 text-info-600' :
                    item.type === 'campaign' ? 'bg-success-50 text-success-600' :
                    item.type === 'track' ? 'bg-warning-50 text-warning-700' :
                    item.type === 'person' ? 'bg-secondary-50 text-secondary-600' :
                    item.type === 'task' ? 'bg-danger-50 text-danger-600' :
                     'bg-surface-100 text-text-600'
                  }
                  size="sm"
                />
                <span className="min-w-0 flex-1">
                  <span className="truncate text-content-primary block">{item.title}</span>
                  {item.subtitle ? (
                    <span className="truncate text-xs text-content-label block">{item.subtitle}</span>
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
