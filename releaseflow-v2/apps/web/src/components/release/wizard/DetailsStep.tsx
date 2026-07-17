'use client';

import { Nav } from './wizard-ui';

export function DetailsStep({ releaseTitle, setReleaseTitle, releaseNotes, setReleaseNotes, targetReleaseDate, setTargetReleaseDate, estimatedReleaseDate, setEstimatedReleaseDate, back, next }: {
  releaseTitle: string;
  setReleaseTitle: (v: string) => void;
  releaseNotes: string;
  setReleaseNotes: (v: string) => void;
  targetReleaseDate: string;
  setTargetReleaseDate: (v: string) => void;
  estimatedReleaseDate: string;
  setEstimatedReleaseDate: (v: string) => void;
  back: () => void;
  next: () => void;
}) {
  const displayTitle = releaseTitle.trim();

  return (
    <>
      <input type="text" value={releaseTitle} onChange={(e) => setReleaseTitle(e.target.value)} placeholder="Release title" autoFocus
        className="mt-8 block w-full h-14 rounded-xl border border-surface-700 bg-surface-900 px-5 text-body-large text-surface-50 placeholder-text-500 text-center focus:border-primary-500/60 focus:outline-none" />
      {displayTitle ? (
        <p className="mt-2 text-xs text-text-400 text-center">Display: <span className="text-primary-400 font-medium">{displayTitle}</span></p>
      ) : null}

      <div className="mt-3">
        <p className="text-xs font-semibold text-text-500 uppercase tracking-wider mb-2">Estimated Release Date *</p>
        <input type="date" value={targetReleaseDate} onChange={(e) => setTargetReleaseDate(e.target.value)}
          className="block w-full h-12 rounded-xl border border-surface-700 bg-surface-900 px-4 text-sm text-surface-50 focus:border-primary-500/60 focus:outline-none [color-scheme:dark]" />
      </div>

      <div className="mt-3">
        <p className="text-xs font-semibold text-text-500 uppercase tracking-wider mb-2">Digital Release Date</p>
        <input type="date" value={estimatedReleaseDate} onChange={(e) => setEstimatedReleaseDate(e.target.value)}
          className="block w-full h-12 rounded-xl border border-surface-700 bg-surface-900 px-4 text-sm text-surface-50 focus:border-primary-500/60 focus:outline-none [color-scheme:dark]" />
      </div>

      <textarea value={releaseNotes} onChange={(e) => setReleaseNotes(e.target.value)} rows={2} placeholder="Release notes (optional)"
        className="mt-3 block w-full rounded-xl border border-surface-700 bg-surface-900 px-4 py-3 text-sm text-surface-50 placeholder-text-500 focus:border-primary-500/60 focus:outline-none resize-none" />
      <Nav back={back} next={next} canNext={!!releaseTitle.trim() && !!targetReleaseDate} />
    </>
  );
}
