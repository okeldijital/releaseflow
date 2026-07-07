'use client';

import { VERSION_TEMPLATES } from './release-wizard-types';
import { Nav } from './wizard-ui';

export function DetailsStep({ releaseTitle, setReleaseTitle, version, setVersion, releaseNotes, setReleaseNotes, estimatedReleaseDate, setEstimatedReleaseDate, back, next }: {
  releaseTitle: string;
  setReleaseTitle: (v: string) => void;
  version: string;
  setVersion: (v: string) => void;
  releaseNotes: string;
  setReleaseNotes: (v: string) => void;
  estimatedReleaseDate: string;
  setEstimatedReleaseDate: (v: string) => void;
  back: () => void;
  next: () => void;
}) {
  const displayTitle = [releaseTitle.trim(), version.trim()].filter(Boolean).join(' · ');

  return (
    <>
      <input type="text" value={releaseTitle} onChange={(e) => setReleaseTitle(e.target.value)} placeholder="Release title" autoFocus
        className="mt-8 block w-full h-14 rounded-xl border border-surface-700 bg-surface-900 px-5 text-body-large text-surface-50 placeholder-text-500 text-center focus:border-primary-500/60 focus:outline-none" />
      {displayTitle ? (
        <p className="mt-2 text-xs text-text-400 text-center">Display: <span className="text-primary-400 font-medium">{displayTitle}</span></p>
      ) : null}

      <div className="mt-3">
        <input type="text" value={version} onChange={(e) => setVersion(e.target.value)} placeholder="Version (optional)"
          className="block w-full h-12 rounded-xl border border-surface-700 bg-surface-900 px-5 text-sm text-surface-50 placeholder-text-500 text-center focus:border-primary-500/60 focus:outline-none" />
        {version.trim() ? null : (
          <div className="mt-2 flex flex-wrap gap-1.5">
            {VERSION_TEMPLATES.map((vt) => (
              <button
                key={vt}
                type="button"
                onClick={() => setVersion(vt)}
                className="px-2.5 py-1 rounded-md border border-surface-700 bg-surface-950 text-caption text-text-400 hover:text-surface-100 hover:border-primary-500/40 transition-colors"
              >
                {vt}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="mt-3">
        <p className="text-xs font-semibold text-text-500 uppercase tracking-wider mb-2">Estimated Release Date *</p>
        <input type="date" value={estimatedReleaseDate} onChange={(e) => setEstimatedReleaseDate(e.target.value)}
          className="block w-full h-12 rounded-xl border border-surface-700 bg-surface-900 px-4 text-sm text-surface-50 focus:border-primary-500/60 focus:outline-none [color-scheme:dark]" />
      </div>

      <textarea value={releaseNotes} onChange={(e) => setReleaseNotes(e.target.value)} rows={2} placeholder="Release notes (optional)"
        className="mt-3 block w-full rounded-xl border border-surface-700 bg-surface-900 px-4 py-3 text-sm text-surface-50 placeholder-text-500 focus:border-primary-500/60 focus:outline-none resize-none" />
      <Nav back={back} next={next} canNext={!!releaseTitle.trim() && !!estimatedReleaseDate} />
    </>
  );
}
