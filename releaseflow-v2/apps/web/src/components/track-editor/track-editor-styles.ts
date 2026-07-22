import type { TrackEditorVariant } from './types';

/** Shared class tokens for dark (wizard) vs light (workspace) surfaces. */
export function trackEditorClasses(variant: TrackEditorVariant = 'dark') {
  if (variant === 'light') {
    return {
      sectionLabel: 'text-xs font-semibold text-content-label uppercase tracking-wider',
      helper: 'text-xs text-content-label',
      fieldLabel: 'text-xs font-medium text-content-label',
      input:
        'block w-full h-10 rounded-xl border border-surface-200 px-3 text-sm text-content-primary placeholder:text-content-label focus:border-primary-500 focus:outline-none',
      inputLg:
        'block w-full h-10 rounded-xl border border-surface-200 px-3 text-sm text-content-primary placeholder:text-content-label focus:border-primary-500 focus:outline-none',
      panel: 'rounded-xl border border-surface-200 bg-surface-50 p-5 space-y-3',
      panelMuted: 'rounded-xl border border-surface-200 bg-surface-50 p-3 space-y-2',
      // BUILD-012B — clearer break between Original Work and Remix Details (mt-8 ≈ 32px, pt-6 ≈ 24px)
      divider: 'mt-8 border-t border-surface-200 pt-6 space-y-3',
      stack: 'mt-4 space-y-3',
      radioLabel: 'flex items-center gap-2 text-sm text-content-secondary',
      error: 'text-xs text-danger-500',
      micro: 'text-[11px] text-content-label',
      assignBtn:
        'mt-2 w-full h-10 rounded-xl border border-surface-200 bg-surface-50 px-4 text-sm text-left text-content-label hover:border-surface-300 hover:text-content-secondary transition-all',
      checkLabel: 'text-sm text-content-secondary flex items-center gap-2',
      pubToggle:
        'w-full text-left flex items-center justify-between text-xs font-semibold text-content-label uppercase tracking-wider hover:text-content-secondary transition-colors',
    };
  }
  return {
    sectionLabel: 'text-xs font-semibold text-text-500 uppercase tracking-wider',
    helper: 'text-xs text-text-500',
    fieldLabel: 'text-xs font-medium text-text-400',
    input:
      'block w-full h-10 rounded-xl border border-surface-700 bg-surface-950 px-3 text-sm text-surface-50 placeholder-text-500 focus:border-primary-500/60 focus:outline-none',
    inputLg:
      'block w-full h-12 rounded-xl border border-surface-700 bg-surface-900 px-5 text-sm text-surface-50 placeholder-text-500 focus:border-primary-500/60 focus:outline-none',
    panel: 'rounded-xl border border-surface-700 bg-surface-900 p-5 space-y-3',
    panelMuted: 'rounded-xl border border-surface-700 bg-surface-950 p-3 space-y-2',
    // BUILD-012B — clearer break between Original Work and Remix Details (mt-8 ≈ 32px, pt-6 ≈ 24px)
    divider: 'mt-8 border-t border-surface-700 pt-6 space-y-3',
    stack: 'mt-4 space-y-3',
    radioLabel: 'flex items-center gap-2 text-sm text-text-300',
    error: 'text-xs text-danger-400',
    micro: 'text-[11px] text-text-500',
    assignBtn:
      'mt-2 w-full h-10 rounded-xl border border-surface-700 bg-surface-950 px-4 text-sm text-left text-text-500 hover:border-surface-600 hover:text-surface-200 transition-all',
    checkLabel: 'text-sm text-text-400 flex items-center gap-2',
    pubToggle:
      'w-full text-left flex items-center justify-between text-xs font-semibold text-text-500 uppercase tracking-wider hover:text-text-300 transition-colors',
  };
}
