'use client';

import { Avatar } from '@releaseflow/ui';
import type { MentionSuggestion } from '@/lib/assignment-mentions-service';

interface MentionPickerProps {
  suggestions: MentionSuggestion[];
  activeIndex: number;
  onSelect: (suggestion: MentionSuggestion) => void;
  onHover: (index: number) => void;
  loading?: boolean;
}

export function MentionPicker({
  suggestions,
  activeIndex,
  onSelect,
  onHover,
  loading,
}: MentionPickerProps) {
  if (loading) {
    return (
      <div className="absolute bottom-full left-0 right-0 mb-2 z-20 rounded-xl border border-surface-200/80 bg-layer-2 shadow-lg p-3">
        <p className="text-xs text-text-500">Searching people…</p>
      </div>
    );
  }

  if (suggestions.length === 0) {
    return (
      <div className="absolute bottom-full left-0 right-0 mb-2 z-20 rounded-xl border border-surface-200/80 bg-layer-2 shadow-lg p-3">
        <p className="text-xs text-text-500">No organization members match.</p>
      </div>
    );
  }

  return (
    <div
      className="absolute bottom-full left-0 right-0 mb-2 z-20 max-h-56 overflow-y-auto rounded-xl border border-surface-200/80 bg-layer-2 shadow-lg py-1"
      role="listbox"
      aria-label="Mention suggestions"
    >
      {suggestions.map((s, i) => (
        <button
          key={s.personId}
          type="button"
          role="option"
          aria-selected={i === activeIndex}
          className={`w-full flex items-center gap-3 px-3 py-2 text-left transition-colors ${
            i === activeIndex ? 'bg-surface-800' : 'hover:bg-surface-800/60'
          }`}
          onMouseEnter={() => onHover(i)}
          onClick={() => onSelect(s)}
        >
          <Avatar name={s.displayName} src={s.avatarUrl ?? undefined} size="sm" />
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-surface-100 truncate">{s.displayName}</p>
            <p className="text-xs text-text-500 truncate">{s.primaryRole || 'Collaborator'}</p>
          </div>
        </button>
      ))}
    </div>
  );
}
