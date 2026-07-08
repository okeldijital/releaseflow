'use client';

import { useState, useMemo } from 'react';
import type { PersonOption } from '@/hooks/usePerson';
import { usePeople } from '@/hooks/usePerson';

interface PersonFieldPickerProps {
  value?: PersonOption | null;
  onChange: (person: PersonOption | null) => void;
  excludeIds?: string[];
  placeholder?: string;
  label?: string;
}

export function PersonFieldPicker({
  value, onChange, excludeIds, placeholder, label,
}: PersonFieldPickerProps) {
  const [open, setOpen] = useState(false);
  const { personOptions } = usePeople();
  const excludeSet = useMemo(() => new Set(excludeIds ?? []), [excludeIds]);
  const filtered = useMemo(() => personOptions.filter((p) => !excludeSet.has(p.id)), [personOptions, excludeSet]);

  return (
    <div className="relative">
      {label && <p className="text-xs font-medium text-text-400 mb-1.5">{label}</p>}
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full flex items-center gap-2.5 h-9 px-3 text-sm rounded-md border border-surface-700/60 bg-surface-900 text-left hover:border-primary-500/50 transition-colors"
      >
        {value ? (
          <>
            {value.avatarUrl ? (
              <img src={value.avatarUrl} alt="" className="h-5 w-5 rounded-full object-cover shrink-0" />
            ) : (
              <span className="h-5 w-5 rounded-full bg-primary-500/10 flex items-center justify-center text-xs font-semibold text-primary-400 shrink-0">
                {value.name.charAt(0).toUpperCase()}
              </span>
            )}
            <span className="text-surface-100 truncate flex-1">{value.name}</span>
          </>
        ) : (
          <span className="text-text-500">{placeholder ?? 'Select a person...'}</span>
        )}
        <svg className="h-4 w-4 text-text-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {open && (
        <div className="absolute z-20 mt-1 w-full rounded-lg border border-surface-700/60 bg-surface-900 p-2 shadow-lg">
          {filtered.length === 0 ? (
            <p className="text-xs text-text-500 py-2 text-center">No people available.</p>
          ) : (
            <div className="max-h-60 overflow-y-auto space-y-0.5">
              {filtered.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => { onChange(p); setOpen(false); }}
                  className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-md hover:bg-surface-800 transition-colors text-left ${
                    value?.id === p.id ? 'bg-primary-500/10' : ''
                  }`}
                >
                  {p.avatarUrl ? (
                    <img src={p.avatarUrl} alt="" className="h-7 w-7 rounded-full object-cover shrink-0" />
                  ) : (
                    <span className="h-7 w-7 rounded-full bg-primary-500/10 flex items-center justify-center text-xs font-semibold text-primary-400 shrink-0">
                      {p.name.charAt(0).toUpperCase()}
                    </span>
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-surface-100 truncate">{p.name}</p>
                    <p className="text-xs text-text-500 truncate">
                      {p.primaryRole}{p.department ? ` · ${p.department}` : ''}
                    </p>
                  </div>
                  {p.status === 'archived' && (
                    <span className="text-[10px] uppercase text-text-500 bg-surface-800 px-1.5 py-0.5 rounded">Archived</span>
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
