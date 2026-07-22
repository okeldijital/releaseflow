'use client';

import type { WizardTrack, PersonOption, AssignerField } from './release-wizard-types';
import { Nav } from './wizard-ui';
import { TrackEditor, type TrackEditorValue } from '@/components/track-editor';
import type { ArtistOption } from '@/components/artist-field-picker';

export function TracksStep({
  tracks,
  artists,
  activeOrgId,
  addTrack,
  updateTrackFields,
  removeTrack,
  onArtistCreated,
  openAssigner,
  validateRemixTracks,
  people,
  back,
  next,
}: {
  tracks: WizardTrack[];
  artists: ArtistOption[];
  activeOrgId: string | null;
  addTrack: () => void;
  /** Apply a partial track field update (TrackEditor owns field UI). */
  updateTrackFields: (id: string, patch: Partial<WizardTrack>) => void;
  removeTrack: (id: string) => void;
  onArtistCreated: (artist: ArtistOption) => void;
  openAssigner: (
    label: string,
    role: string,
    trackId: string,
    field: AssignerField,
    cb?: (r: { personId?: string }) => void,
  ) => void;
  validateRemixTracks: () => boolean;
  people?: PersonOption[];
  back: () => void;
  next: () => void;
}) {
  function handleNext() {
    if (!validateRemixTracks()) return;
    next();
  }

  function toEditorValue(t: WizardTrack): TrackEditorValue {
    return {
      title: t.title,
      version: t.version,
      recordingType: t.recordingType,
      originalWorkTitle: t.originalWorkTitle,
      originalWorkPrimaryArtistId: t.originalWorkPrimaryArtistId,
      originalWorkFeaturedArtists: t.originalWorkFeaturedArtists,
      primaryArtistId: t.primaryArtistId,
      featuredArtists: t.featuredArtists,
      displayTitle: t.displayTitle,
      displayTitleEdited: t.displayTitleEdited,
      durationDisplay: t.durationDisplay,
      duration: t.duration,
      genre: t.genre,
      mixed: t.mixed,
      mastered: t.mastered,
      mixingEngineer: t.mixingEngineer,
      masteringEngineer: t.masteringEngineer,
      isrc: t.isrc,
      composers: t.composers,
      lyricists: t.lyricists,
      iswc: t.iswc,
      pubOpen: t.pubOpen,
    };
  }

  return (
    <>
      <div className="mt-8 space-y-4">
        {tracks.map((t, i) => (
          <div key={t.id} className="rounded-xl border border-surface-700 bg-surface-900 p-5 space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold text-text-500 uppercase tracking-wider">
                Track {i + 1}
              </p>
              {tracks.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeTrack(t.id)}
                  className="text-xs text-danger-400"
                >
                  Remove
                </button>
              )}
            </div>

            <TrackEditor
              instanceId={t.id}
              value={toEditorValue(t)}
              onChange={(patch) => updateTrackFields(t.id, patch)}
              errors={t.remixErrors}
              onClearError={(key) =>
                updateTrackFields(t.id, {
                  remixErrors: { ...t.remixErrors, [key]: undefined },
                })
              }
              artists={artists}
              organizationId={activeOrgId}
              onArtistCreated={onArtistCreated}
              variant="dark"
              titlePlaceholder="Song title"
              showProduction
              showPublishing
              people={people}
              onAssignMixing={() =>
                openAssigner('Assign Mixing Engineer', 'Mixing Engineer', t.id, 'mixingEngineer')
              }
              onAssignMastering={() =>
                openAssigner(
                  'Assign Mastering Engineer',
                  'Mastering Engineer',
                  t.id,
                  'masteringEngineer',
                )
              }
            />
          </div>
        ))}
        <button
          type="button"
          onClick={addTrack}
          className="w-full h-12 rounded-xl border border-dashed border-surface-600 bg-transparent text-sm font-medium text-text-500 hover:text-text-300 active:scale-[0.98] transition-all"
        >
          + Add another track
        </button>
      </div>
      <Nav back={back} next={handleNext} canNext={tracks.some((t) => t.title.trim())} />
    </>
  );
}
