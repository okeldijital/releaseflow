'use client';

import { useState, useMemo } from 'react';
import type { WorkOption } from '@/hooks/useWork';
import { useWorks } from '@/hooks/useWork';


interface WorkFieldPickerProps {
  value?: WorkOption | null;
  onChange: (work: WorkOption | null) => void;
  excludeIds?: string[];
  placeholder?: string;
  label?: string;
}

export function WorkFieldPicker({
  value, onChange, excludeIds, placeholder, label,
}: WorkFieldPickerProps) {
  const [open, setOpen] = useState(false);
  const { workOptions } = useWorks();
  const excludeSet = useMemo(() => new Set(excludeIds ?? []), [excludeIds]);
  const filtered = useMemo(() => workOptions.filter((w) => !excludeSet.has(w.id)), [workOptions, excludeSet]);

  return (
    <div className="relative">
      {label && <p className="text-xs font-medium text-text-400 mb-1.5">{label}</p>}
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full flex items-center gap-2.5 h-9 px-3 text-sm rounded-md border border-surface-700/60 bg-surface-900 text-left hover:border-primary-500/50 transition-colors"
      >
        {value ? (
          <span className="text-surface-100 truncate flex-1">{value.title}</span>
        ) : (
          <span className="text-text-500">{placeholder ?? 'Select a work...'}</span>
        )}
        {value?.iswc && <span className="text-xs text-text-500 shrink-0">{value.iswc}</span>}
        <svg className="h-4 w-4 text-text-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {open && (
        <div className="absolute z-20 mt-1 w-full rounded-lg border border-surface-700/60 bg-surface-900 p-2 shadow-lg">
          {filtered.length === 0 ? (
            <p className="text-xs text-text-500 py-2 text-center">No works available.</p>
          ) : (
            <div className="max-h-60 overflow-y-auto space-y-0.5">
              {filtered.map((w) => (
                <button
                  key={w.id}
                  type="button"
                  onClick={() => { onChange(w); setOpen(false); }}
                  className={`w-full flex items-center justify-between gap-2 px-2.5 py-2 rounded-md hover:bg-surface-800 transition-colors text-left ${
                    value?.id === w.id ? 'bg-primary-500/10' : ''
                  }`}
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-surface-100 truncate">{w.title}</p>
                    <div className="flex items-center gap-2 text-xs text-text-500">
                      {w.iswc && <span>{w.iswc}</span>}
                      {w.pro && <span>{w.pro}</span>}
                    </div>
                  </div>
                  {w.status === 'archived' && (
                    <span className="text-[10px] uppercase text-text-500 bg-surface-800 px-1.5 py-0.5 rounded shrink-0">Archived</span>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
