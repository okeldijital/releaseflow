'use client';

import { RELEASE_TYPES, type ReleaseTypeVal } from './release-wizard-types';

export function ReleaseTypeStep({ releaseType, setReleaseType, next }: { releaseType: string; setReleaseType: (v: ReleaseTypeVal) => void; next: () => void }) {
  return (
    <div className="mt-8 space-y-2.5">
      {RELEASE_TYPES.map((t) => (
        <button key={t.value} onClick={() => { setReleaseType(t.value); next(); }}
          className={`w-full text-left rounded-xl border px-5 py-4 transition-all duration-150 ${releaseType === t.value ? 'border-primary-500/60 bg-primary-500/10' : 'border-surface-700 bg-surface-900 hover:border-surface-600'}`}>
          <p className="text-body font-medium text-surface-100">{t.label}</p><p className="text-xs text-text-500 mt-0.5">{t.description}</p>
        </button>
      ))}
    </div>
  );
}
