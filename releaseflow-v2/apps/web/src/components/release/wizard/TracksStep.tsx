'use client';

import { type Dispatch, type SetStateAction } from 'react';
import type { WizardTrack, PersonOption, SectionStatusMap, AssignerField } from './release-wizard-types';
import { uid } from './release-wizard-types';
import { suggestRemixDisplayTitle } from '@/lib/recording-type';
import { Nav } from './wizard-ui';
import { ArtistFieldPicker, FeaturedArtistsPicker, RepeatableArtistPicker, type ArtistOption, type RepeatableArtistEntry } from '@/components/artist-field-picker';

export function TracksStep({ tracks, artists, activeOrgId, addTrack, updateTrack, removeTrack, addFeaturedArtist, removeFeaturedArtist, onArtistCreated, openAssigner, validateRemixTracks, people, setSectionStatus, currentStepKey, back, next }: {
  tracks: WizardTrack[];
  artists: ArtistOption[];
  activeOrgId: string | null;
  addTrack: () => void;
  updateTrack: (id: string, f: string, v: string | boolean | string[] | RepeatableArtistEntry[]) => void;
  removeTrack: (id: string) => void;
  addFeaturedArtist: (trackId: string, artistId: string) => void;
  removeFeaturedArtist: (trackId: string, artistId: string) => void;
  onArtistCreated: (artist: ArtistOption) => void;
  openAssigner: (label: string, role: string, trackId: string, field: AssignerField, cb?: (r: { personId?: string }) => void) => void;
  validateRemixTracks: () => boolean;
  people?: PersonOption[];
  setSectionStatus?: Dispatch<SetStateAction<SectionStatusMap>>;
  currentStepKey?: string;
  back: () => void;
  next: () => void;
}) {
  function handleNext() {
    if (!validateRemixTracks()) return;
    next();
  }

  return (
    <>
      <div className="mt-8 space-y-4">
        {tracks.map((t, i) => (
          <div key={t.id} className="rounded-xl border border-surface-700 bg-surface-900 p-5 space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold text-text-500 uppercase tracking-wider">Track {i + 1}</p>
              {tracks.length > 1 && <button onClick={() => removeTrack(t.id)} className="text-xs text-danger-400">Remove</button>}
            </div>
            <input type="text" value={t.title} onChange={(e) => updateTrack(t.id, 'title', e.target.value)} placeholder="Song title" className="block w-full h-12 rounded-xl border border-surface-700 bg-surface-950 px-4 text-body text-surface-50 placeholder-text-500 focus:border-primary-500/60 focus:outline-none" />

            <div>
              <p className="text-xs font-semibold text-text-500 uppercase tracking-wider mb-2">Recording Type</p>
              <div className="flex flex-col gap-2">
                <label className="flex items-center gap-2 text-sm text-text-300">
                  <input type="radio" name={`recording-${t.id}`} checked={t.recordingType === 'original'} onChange={() => updateTrack(t.id, 'recordingType', 'original')} />
                  Original Recording
                </label>
                <label className="flex items-center gap-2 text-sm text-text-300">
                  <input type="radio" name={`recording-${t.id}`} checked={t.recordingType === 'remix'} onChange={() => updateTrack(t.id, 'recordingType', 'remix')} />
                  Remix
                </label>
              </div>
            </div>

            {t.recordingType === 'original' ? (
              <div key={`${t.id}-original-artists`} className="space-y-3">
                <ArtistFieldPicker
                  key={`${t.id}-primary-artist`}
                  instanceId={`${t.id}-primary-artist`}
                  label="Primary Artist"
                  value={t.primaryArtistId}
                  onChange={(v) => updateTrack(t.id, 'primaryArtistId', v)}
                  artists={artists}
                  organizationId={activeOrgId}
                  onArtistCreated={onArtistCreated}
                />
                <div className="space-y-2">
                  <p className="text-xs font-semibold text-text-500 uppercase tracking-wider">Featuring Artists</p>
                  {t.featuredArtistIds.map((aid) => {
                    const name = artists.find((a) => a.id === aid)?.name ?? aid;
                    return (
                      <div key={aid} className="flex items-center justify-between rounded-xl border border-surface-700 bg-surface-950 px-3 py-2">
                        <span className="text-sm text-surface-100">{name}</span>
                        <button type="button" onClick={() => removeFeaturedArtist(t.id, aid)} className="text-xs text-danger-400">Remove</button>
                      </div>
                    );
                  })}
                  <FeaturedArtistsPicker
                    key={`${t.id}-featuring-artists`}
                    instanceId={`${t.id}-featuring-artists`}
                    artists={artists}
                    organizationId={activeOrgId}
                    primaryArtistId={t.primaryArtistId}
                    featuredArtistIds={t.featuredArtistIds}
                    onAdd={(artistId) => addFeaturedArtist(t.id, artistId)}
                    onArtistCreated={onArtistCreated}
                  />
                </div>
              </div>
            ) : (
              <div key={`${t.id}-remix-artists`} className="space-y-3">
                <RepeatableArtistPicker
                  instanceId={`${t.id}-original-artists`}
                  label="Original Artists"
                  addLabel="+ Add Original Artist"
                  entries={t.originalArtists}
                  artists={artists}
                  organizationId={activeOrgId}
                  onAdd={(artistId) => updateTrack(t.id, 'originalArtists', [...t.originalArtists, { id: uid(), artistId }])}
                  onRemove={(entryId) => updateTrack(t.id, 'originalArtists', t.originalArtists.filter((e) => e.id !== entryId))}
                  onReorder={(entries) => updateTrack(t.id, 'originalArtists', entries)}
                  onArtistCreated={onArtistCreated}
                />
                {t.remixErrors.originalArtists ? <p className="text-xs text-danger-400">{t.remixErrors.originalArtists}</p> : null}
                <RepeatableArtistPicker
                  instanceId={`${t.id}-remix-artists`}
                  label="Remix Artists"
                  addLabel="+ Add Remix Artist"
                  entries={t.remixArtists}
                  artists={artists}
                  organizationId={activeOrgId}
                  onAdd={(artistId) => updateTrack(t.id, 'remixArtists', [...t.remixArtists, { id: uid(), artistId }])}
                  onRemove={(entryId) => updateTrack(t.id, 'remixArtists', t.remixArtists.filter((e) => e.id !== entryId))}
                  onReorder={(entries) => updateTrack(t.id, 'remixArtists', entries)}
                  onArtistCreated={onArtistCreated}
                />
                {t.remixErrors.remixArtists ? <p className="text-xs text-danger-400">{t.remixErrors.remixArtists}</p> : null}
                <div className="rounded-xl border border-surface-700 bg-surface-950 p-3 space-y-2">
                  <p className="text-xs font-semibold text-text-500 uppercase tracking-wider">Suggested Display Title</p>
                  <input
                    type="text"
                    value={t.displayTitle}
                    onChange={(e) => updateTrack(t.id, 'displayTitle', e.target.value)}
                    placeholder={suggestRemixDisplayTitle(t.title, artists.find((a) => a.id === (t.remixArtists[0]?.artistId ?? ''))?.name ?? '')}
                    className="block w-full h-10 rounded-xl border border-surface-700 bg-surface-900 px-3 text-sm text-surface-50 placeholder-text-500 focus:border-primary-500/60 focus:outline-none"
                  />
                </div>
              </div>
            )}

            <div className="space-y-3">
              <div>
                <label className="text-sm text-text-400 flex items-center gap-2"><input type="checkbox" checked={t.mixed} onChange={(e) => updateTrack(t.id, 'mixed', e.target.checked)} /> Have you mixed it?</label>
                {!t.mixed && (
                  <button onClick={() => openAssigner('Assign Mixing Engineer', 'Mixing Engineer', t.id, 'mixingEngineer')}
                    className="mt-2 w-full h-10 rounded-xl border border-surface-700 bg-surface-950 px-4 text-sm text-left text-text-500 hover:border-surface-600 hover:text-surface-200 transition-all">
                    {t.mixingEngineer ? people?.find((p) => p.id === t.mixingEngineer)?.displayName || t.mixingEngineer : 'Assign Mixing Engineer'}
                  </button>
                )}
              </div>
              <div>
                <label className="text-sm text-text-400 flex items-center gap-2"><input type="checkbox" checked={t.mastered} onChange={(e) => updateTrack(t.id, 'mastered', e.target.checked)} /> Has it been mastered?</label>
                {!t.mastered && (
                  <button onClick={() => openAssigner('Assign Mastering Engineer', 'Mastering Engineer', t.id, 'masteringEngineer')}
                    className="mt-2 w-full h-10 rounded-xl border border-surface-700 bg-surface-950 px-4 text-sm text-left text-text-500 hover:border-surface-600 hover:text-surface-200 transition-all">
                    {t.masteringEngineer ? people?.find((p) => p.id === t.masteringEngineer)?.displayName || t.masteringEngineer : 'Assign Mastering Engineer'}
                  </button>
                )}
              </div>
            </div>
            <button onClick={() => updateTrack(t.id, 'pubOpen', !t.pubOpen)}
              className="w-full text-left flex items-center justify-between text-xs font-semibold text-text-500 uppercase tracking-wider hover:text-text-300 transition-colors">
              <span>Publishing Information</span>
              <svg className={`h-3.5 w-3.5 transition-transform ${t.pubOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
            </button>
             {t.pubOpen && (
               <div className="space-y-3 pt-2">
                 <input type="text" value={t.isrc} onChange={(e) => updateTrack(t.id, 'isrc', e.target.value)} placeholder="ISRC"
                   className="block w-full h-10 rounded-xl border border-surface-700 bg-surface-950 px-4 text-sm text-surface-50 placeholder-text-500 focus:border-primary-500/60 focus:outline-none" />
                 <input type="text" value={t.composer} onChange={(e) => updateTrack(t.id, 'composer', e.target.value)} placeholder="Composer(s)"
                   className="block w-full h-10 rounded-xl border border-surface-700 bg-surface-950 px-4 text-sm text-surface-50 placeholder-text-500 focus:border-primary-500/60 focus:outline-none" />
                 <input type="text" value={t.lyricist} onChange={(e) => updateTrack(t.id, 'lyricist', e.target.value)} placeholder="Lyricist(s)"
                   className="block w-full h-10 rounded-xl border border-surface-700 bg-surface-950 px-4 text-sm text-surface-50 placeholder-text-500 focus:border-primary-500/60 focus:outline-none" />
                 <input type="text" value={t.iswc} onChange={(e) => updateTrack(t.id, 'iswc', e.target.value)} placeholder="ISWC (optional)"
                   className="block w-full h-10 rounded-xl border border-surface-700 bg-surface-950 px-4 text-sm text-surface-50 placeholder-text-500 focus:border-primary-500/60 focus:outline-none" />
              </div>
            )}
          </div>
        ))}
        <button onClick={addTrack} className="w-full h-12 rounded-xl border border-dashed border-surface-600 bg-transparent text-sm font-medium text-text-500 hover:text-text-300 active:scale-[0.98] transition-all">+ Add another track</button>
      </div>
      <Nav back={back} next={handleNext} canNext={tracks.some((t) => t.title.trim())} optional onLater={() => setSectionStatus?.((p) => ({ ...p, [currentStepKey ?? '']: 'skipped' }))} />
    </>
  );
}
