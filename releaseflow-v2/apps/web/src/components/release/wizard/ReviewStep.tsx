'use client';

import type { WizardTrack, ReleaseTypeVal, SectionStatusMap } from './release-wizard-types';
import { releaseTypeLabel, countRecordingTypes } from '@/lib/recording-type';
import { Btn } from './wizard-ui';

export function ReviewStep({ releaseTitle, releaseType, tracks, hasArtwork, commissionArtwork, promoAssets, hasEmail, primaryArtist, primaryGenre, language, estimatedReleaseDate, sectionStatus, error, launching, back, launch }: {
  releaseTitle: string;
  releaseType: ReleaseTypeVal;
  tracks: WizardTrack[];
  hasArtwork: boolean | null;
  commissionArtwork: boolean | null;
  promoAssets: string[];
  hasEmail: boolean | null;
  primaryArtist: string;
  primaryGenre: string;
  language: string;
  estimatedReleaseDate: string;
  sectionStatus: SectionStatusMap;
  error: string;
  launching: boolean;
  back: () => void;
  launch: () => void;
}) {
  return (
    <>
      <p className="mt-2 text-sm text-text-400 text-center">Everything looks good?</p>
      <div className="mt-8 rounded-xl border border-surface-700 bg-surface-900 divide-y divide-surface-800">
        <div className="flex justify-between px-5 py-3.5"><span className="text-sm text-text-400">Release</span><span className="text-sm font-medium text-surface-100">{releaseTitle || '—'}</span></div>
        <div className="flex justify-between px-5 py-3.5"><span className="text-sm text-text-400">Est. Release Date</span><span className="text-sm font-medium text-surface-100">{estimatedReleaseDate ? new Date(estimatedReleaseDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : '—'}</span></div>
        <div className="flex justify-between px-5 py-3.5"><span className="text-sm text-text-400">Type</span><span className="text-sm font-medium text-surface-100">{releaseTypeLabel(releaseType)}</span></div>
        {(() => {
          const counts = countRecordingTypes(tracks);
          return (
            <>
              {counts.originals > 0 && (
                <div className="flex justify-between px-5 py-3.5"><span className="text-sm text-text-400">Contains</span><span className="text-sm font-medium text-surface-100">{counts.originals} Original Recording{counts.originals === 1 ? '' : 's'}</span></div>
              )}
              {counts.remixes > 0 && (
                <div className="flex justify-between px-5 py-3.5"><span className="text-sm text-text-400">Contains</span><span className="text-sm font-medium text-surface-100">{counts.remixes} Remix{counts.remixes === 1 ? '' : 'es'}</span></div>
              )}
            </>
          );
        })()}
         <div className="flex justify-between px-5 py-3.5"><span className="text-sm text-text-400">Tracks</span><span className="text-sm font-medium text-surface-100">{tracks.filter((t) => t.title.trim()).length}</span></div>
        <div className="flex justify-between px-5 py-3.5"><span className="text-sm text-text-400">Mixed</span><span className="text-sm font-medium text-surface-100">{tracks.filter((t) => t.mixed && t.title.trim()).length}</span></div>
        <div className="flex justify-between px-5 py-3.5"><span className="text-sm text-text-400">Needs Mixing</span><span className="text-sm font-medium text-surface-100">{tracks.filter((t) => !t.mixed && t.title.trim()).length}</span></div>
        <div className="flex justify-between px-5 py-3.5"><span className="text-sm text-text-400">Mastered</span><span className="text-sm font-medium text-surface-100">{tracks.filter((t) => t.mastered && t.title.trim()).length}</span></div>
        <div className="flex justify-between px-5 py-3.5"><span className="text-sm text-text-400">Needs Mastering</span><span className="text-sm font-medium text-surface-100">{tracks.filter((t) => !t.mastered && t.title.trim()).length}</span></div>
      </div>
      <div className="mt-8 rounded-xl border border-surface-700 bg-surface-900 divide-y divide-surface-800">
        <p className="px-5 py-3 text-xs font-semibold text-text-500 uppercase tracking-wider">Track Publishing</p>
        {tracks.filter((t) => t.title.trim()).map((t, i) => (
          <div key={t.id} className="flex justify-between px-5 py-3">
            <span className="text-sm text-text-400">Track {i + 1}</span>
            <span className={`text-sm font-medium ${t.isrc ? 'text-success-400' : 'text-text-500'}`}>{t.isrc ? '✓ ISRC set' : '⚠ No ISRC'}</span>
          </div>
        ))}
        {tracks.filter((t) => t.title.trim()).length === 0 && (
          <p className="px-5 py-3 text-sm text-text-500">No tracks added</p>
        )}
        <div className="flex justify-between px-5 py-3.5"><span className="text-sm text-text-400">Artwork</span><span className="text-sm font-medium text-surface-100">{hasArtwork ? 'Ready' : commissionArtwork ? 'Commissioned' : 'Later'}</span></div>
        <div className="flex justify-between px-5 py-3.5"><span className="text-sm text-text-400">Promotion</span><span className="text-sm font-medium text-surface-100">{promoAssets.length} assets</span></div>
        <div className="flex justify-between px-5 py-3.5"><span className="text-sm text-text-400">Email</span><span className="text-sm font-medium text-surface-100">{hasEmail ? 'Enabled' : 'None'}</span></div>
        <div className="flex justify-between px-5 py-3.5"><span className="text-sm text-text-400">Primary Artist</span><span className="text-sm font-medium text-surface-100">{primaryArtist || '—'}</span></div>
        <div className="flex justify-between px-5 py-3.5"><span className="text-sm text-text-400">Genre</span><span className="text-sm font-medium text-surface-100">{primaryGenre || '—'}</span></div>
        <div className="flex justify-between px-5 py-3.5"><span className="text-sm text-text-400">Language</span><span className="text-sm font-medium text-surface-100">{language || '—'}</span></div>
      </div>
      <div className="mt-8 rounded-xl border border-surface-700 bg-surface-900 divide-y divide-surface-800">
        <p className="px-5 py-3 text-xs font-semibold text-text-500 uppercase tracking-wider">Section Status</p>
        {(['artwork', 'tracks', 'release_info', 'promotion', 'email'] as const).map((s) => {
          const status = sectionStatus[s] ?? 'incomplete';
          const color = status === 'complete' ? 'text-success-400' : status === 'skipped' ? 'text-text-500' : 'text-warning-400';
          return (
            <div key={s} className="flex justify-between px-5 py-3">
              <span className="text-sm text-text-400 capitalize">{s.replace('_', ' ')}</span>
              <span className={`text-sm font-medium ${color}`}>{status}</span>
            </div>
          );
        })}
      </div>
      {error && <p className="mt-4 text-sm text-danger-400 text-center">{error}</p>}
      <div className="flex items-center gap-3 mt-8">
        <Btn label="Back" onClick={back} secondary />
        <Btn label={launching ? 'Creating...' : 'Launch Release'} onClick={launch} disabled={launching || !releaseTitle.trim()} />
      </div>
    </>
  );
}
