'use client';

/**
 * BUILD-018 — Person field picker uses canonical PersonCard (compact).
 */

import { useState, useMemo } from 'react';
import type { PersonOption } from '@/hooks/usePerson';
import { usePeople } from '@/hooks/usePerson';
import { PersonCard } from '@/components/people/PersonCard';

interface PersonFieldPickerProps {
  value?: PersonOption | null;
  onChange: (person: PersonOption | null) => void;
  excludeIds?: string[];
  placeholder?: string;
  label?: string;
}

export function PersonFieldPicker({
  value,
  onChange,
  excludeIds,
  placeholder,
  label,
}: PersonFieldPickerProps) {
  const [open, setOpen] = useState(false);
  const { personOptions, pickerCardModels } = usePeople();
  const excludeSet = useMemo(() => new Set(excludeIds ?? []), [excludeIds]);

  const optionById = useMemo(() => {
    const map = new Map(personOptions.map((p) => [p.id, p]));
    return map;
  }, [personOptions]);

  const filteredCards = useMemo(
    () => pickerCardModels.filter((p) => !excludeSet.has(p.id)),
    [pickerCardModels, excludeSet],
  );

  const selectedCard = useMemo(
    () => (value ? pickerCardModels.find((c) => c.id === value.id) ?? null : null),
    [value, pickerCardModels],
  );

  return (
    <div className="relative">
      {label ? (
        <p className="text-xs font-medium text-text-400 mb-1.5">{label}</p>
      ) : null}
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full flex items-center gap-2.5 h-9 px-3 text-sm rounded-md border border-surface-700/60 bg-surface-900 text-left hover:border-primary-500/50 transition-colors"
      >
        {value ? (
          <>
            {selectedCard?.image || value.avatarUrl ? (
              <img
                src={selectedCard?.image ?? value.avatarUrl ?? ''}
                alt=""
                className="h-5 w-5 rounded-full object-cover shrink-0"
              />
            ) : (
              <span className="h-5 w-5 rounded-full bg-primary-500/10 flex items-center justify-center text-xs font-semibold text-primary-400 shrink-0">
                {value.name.charAt(0).toUpperCase()}
              </span>
            )}
            <span className="text-surface-100 truncate flex-1">{value.name}</span>
          </>
        ) : (
          <span className="text-text-500">
            {placeholder ?? 'Select a person...'}
          </span>
        )}
        <svg
          className="h-4 w-4 text-text-400 shrink-0"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </button>
      {open ? (
        <div className="absolute z-20 mt-1 w-full min-w-[16rem] rounded-lg border border-surface-700/60 bg-surface-900 p-2 shadow-lg">
          {filteredCards.length === 0 ? (
            <p className="text-xs text-text-500 py-2 text-center">
              No people available.
            </p>
          ) : (
            <div
              data-person-search-results
              className="max-h-80 overflow-y-auto grid grid-cols-1 gap-2"
            >
              {filteredCards.map((card) => (
                <PersonCard
                  key={card.id}
                  person={card}
                  size="compact"
                  showMenu={false}
                  showStats={false}
                  onSelect={(id) => {
                    const opt = optionById.get(id);
                    if (opt) onChange(opt);
                    setOpen(false);
                  }}
                />
              ))}
            </div>
          )}
        </div>
      ) : null}
    </div>
  );
}
