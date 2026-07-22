'use client';

/**
 * Canonical Track Editor — single source of truth for track entry field UI.
 * BUILD-011C Remix metadata: Original Work (Group A) + Recording metadata (Group B).
 * Used by: /tracks/new, /releases/new (TracksStep), and Edit Track (shared sections).
 */

import { ArtistFieldPicker } from '@/components/artist-field-picker';
import { ArtistRelationshipList } from '@/components/artists/artist-relationship-list';
import { generateSuggestedDisplayTitle, findDuplicateArtistId } from '@/lib/display-title';
import { parseDurationInput, formatDurationDisplay } from '@/lib/duration-format';
import { trackEditorClasses } from './track-editor-styles';
import { GenreSelect } from './genre-select';
import type {
  TrackEditorProps,
  TrackEditorValue,
  RepeatableArtistEntry,
} from './types';

function resolveNames(
  artists: TrackEditorProps['artists'],
  ids: string[],
): string[] {
  return ids
    .map((id) => artists.find((a) => a.id === id)?.name ?? '')
    .filter(Boolean);
}

function suggestedDisplayTitle(
  value: TrackEditorValue,
  artists: TrackEditorProps['artists'],
): string {
  return generateSuggestedDisplayTitle({
    trackTitle: value.title,
    originalArtistNames: resolveNames(
      artists,
      value.primaryArtistId ? [value.primaryArtistId] : [],
    ),
    featuredArtistNames: resolveNames(
      artists,
      value.featuredArtists.map((e) => e.artistId),
    ),
    remixArtistNames: [],
    isRemix: value.recordingType === 'remix',
  });
}

/**
 * BUILD-011C / BUILD-012D Group A — Original Work + Songwriters.
 * Songwriters/ISWC describe the composition (not the remix recording).
 */
export function OriginalWorkSection({
  instanceId,
  value,
  onChange,
  errors,
  onClearError,
  artists,
  organizationId,
  onArtistCreated,
  variant = 'dark',
}: Pick<
  TrackEditorProps,
  | 'instanceId'
  | 'value'
  | 'onChange'
  | 'errors'
  | 'onClearError'
  | 'artists'
  | 'organizationId'
  | 'onArtistCreated'
  | 'variant'
>) {
  const c = trackEditorClasses(variant);
  return (
    <div className={variant === 'dark' ? 'mt-6' : undefined}>
      <p className={`${c.sectionLabel} mb-1`}>Original Work</p>
      <p className={`${c.helper} mb-3`}>
        Information about the original song being remixed.
      </p>
      <div className="space-y-4">
        <div className="space-y-1.5">
          <label className={c.fieldLabel}>Original Song Title</label>
          <input
            type="text"
            value={value.originalWorkTitle}
            onChange={(e) => {
              onChange({ originalWorkTitle: e.target.value });
              onClearError?.('originalWorkTitle');
            }}
            placeholder="e.g. Dreams"
            autoComplete="off"
            className={c.input}
          />
          {errors?.originalWorkTitle ? (
            <p className={c.error}>{errors.originalWorkTitle}</p>
          ) : null}
        </div>
        <ArtistFieldPicker
          key={`${instanceId}-ow-primary`}
          instanceId={`${instanceId}-ow-primary`}
          label="Original Primary Artist"
          value={value.originalWorkPrimaryArtistId}
          onChange={(id) => {
            onChange({ originalWorkPrimaryArtistId: id });
            onClearError?.('originalWorkPrimaryArtist');
          }}
          artists={artists}
          organizationId={organizationId}
          onArtistCreated={onArtistCreated}
        />
        {errors?.originalWorkPrimaryArtist ? (
          <p className={c.error}>{errors.originalWorkPrimaryArtist}</p>
        ) : null}
        <ArtistRelationshipList
          instanceId={`${instanceId}-ow-featured`}
          role="featured"
          label="Original Featured Artists"
          addLabel="+ Add Featured Artist"
          entries={value.originalWorkFeaturedArtists}
          artists={artists}
          organizationId={organizationId}
          onAdd={(artistId) => {
            if (value.originalWorkFeaturedArtists.some((e) => e.artistId === artistId)) {
              return;
            }
            onChange({
              originalWorkFeaturedArtists: [
                ...value.originalWorkFeaturedArtists,
                { id: artistId, artistId },
              ],
            });
          }}
          onRemove={(entryId) =>
            onChange({
              originalWorkFeaturedArtists: value.originalWorkFeaturedArtists.filter(
                (e) => e.id !== entryId,
              ),
            })
          }
          onReorder={(entries) => onChange({ originalWorkFeaturedArtists: entries })}
          onArtistCreated={onArtistCreated}
        />
      </div>

      {/* BUILD-012D — Songwriters (composition creators) */}
      <div className={variant === 'dark' ? 'mt-8 border-t border-surface-700 pt-6' : 'mt-8 border-t border-surface-200 pt-6'}>
        <p className={`${c.sectionLabel} mb-1`}>Songwriters</p>
        <p className={`${c.helper} mb-3`}>
          Information about the creators of the original composition.
        </p>
        <div className="space-y-4">
          <div className="space-y-1">
            <p className={`${c.helper} mb-1`}>
              People who composed the original musical work.
            </p>
            <ArtistRelationshipList
              instanceId={`${instanceId}-ow-composers`}
              role="featured"
              label="Composer(s)"
              addLabel="+ Add Composer"
              entries={value.originalWorkComposers}
              artists={artists}
              organizationId={organizationId}
              onAdd={(artistId) => {
                if (value.originalWorkComposers.some((e) => e.artistId === artistId)) return;
                onChange({
                  originalWorkComposers: [
                    ...value.originalWorkComposers,
                    { id: `${Date.now()}-${artistId}`, artistId },
                  ],
                });
              }}
              onRemove={(entryId) =>
                onChange({
                  originalWorkComposers: value.originalWorkComposers.filter(
                    (e) => e.id !== entryId,
                  ),
                })
              }
              onReorder={(entries) => onChange({ originalWorkComposers: entries })}
              onArtistCreated={onArtistCreated}
              error={errors?.originalWorkComposers}
            />
          </div>
          <div className="space-y-1">
            <p className={`${c.helper} mb-1`}>
              People who wrote the lyrics for the original musical work.
            </p>
            <ArtistRelationshipList
              instanceId={`${instanceId}-ow-lyricists`}
              role="featured"
              label="Lyricist(s)"
              addLabel="+ Add Lyricist"
              entries={value.originalWorkLyricists}
              artists={artists}
              organizationId={organizationId}
              onAdd={(artistId) => {
                if (value.originalWorkLyricists.some((e) => e.artistId === artistId)) return;
                onChange({
                  originalWorkLyricists: [
                    ...value.originalWorkLyricists,
                    { id: `${Date.now()}-${artistId}`, artistId },
                  ],
                });
              }}
              onRemove={(entryId) =>
                onChange({
                  originalWorkLyricists: value.originalWorkLyricists.filter(
                    (e) => e.id !== entryId,
                  ),
                })
              }
              onReorder={(entries) => onChange({ originalWorkLyricists: entries })}
              onArtistCreated={onArtistCreated}
              error={errors?.originalWorkLyricists}
            />
          </div>
          <div className="space-y-1.5">
            <label className={c.fieldLabel} htmlFor={`${instanceId}-iswc`}>
              ISWC (optional)
            </label>
            <input
              id={`${instanceId}-iswc`}
              type="text"
              value={value.originalWorkIswc}
              onChange={(e) => onChange({ originalWorkIswc: e.target.value })}
              placeholder="ISWC"
              className={c.input}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

export function TrackEditor({
  instanceId,
  value,
  onChange,
  errors,
  onClearError,
  artists,
  organizationId,
  onArtistCreated,
  variant = 'dark',
  titlePlaceholder = 'Track title',
  titleAutoFocus = false,
  titleCentered = false,
  showProduction = false,
  showPublishing = false,
  people = [],
  onAssignMixing,
  onAssignMastering,
  showIdentity = true,
  showRecordingType = true,
  showRecordingMetadata = true,
  showDescriptiveMetadata = true,
  showOriginalWork = true,
}: TrackEditorProps) {
  const c = trackEditorClasses(variant);

  function patchWithDisplayTitle(
    patch: Partial<TrackEditorValue>,
    opts?: {
      nextTitle?: string;
      nextPrimaryId?: string;
      nextFeatured?: RepeatableArtistEntry[];
      nextType?: TrackEditorValue['recordingType'];
      forceEdited?: boolean;
    },
  ) {
    const next: Partial<TrackEditorValue> = { ...patch };
    const edited = opts?.forceEdited ? true : value.displayTitleEdited;
    if (opts?.forceEdited) next.displayTitleEdited = true;

    if (!edited && !opts?.forceEdited) {
      const merged: TrackEditorValue = { ...value, ...patch };
      if (opts?.nextTitle !== undefined) merged.title = opts.nextTitle;
      if (opts?.nextPrimaryId !== undefined) merged.primaryArtistId = opts.nextPrimaryId;
      if (opts?.nextFeatured !== undefined) merged.featuredArtists = opts.nextFeatured;
      if (opts?.nextType !== undefined) merged.recordingType = opts.nextType;
      next.displayTitle = suggestedDisplayTitle(merged, artists);
    }
    onChange(next);
  }

  return (
    <div className="space-y-0">
      {/* Identity */}
      {showIdentity ? (
        <input
          type="text"
          value={value.title}
          onChange={(e) =>
            patchWithDisplayTitle(
              { title: e.target.value },
              { nextTitle: e.target.value },
            )
          }
          placeholder={titlePlaceholder}
          autoFocus={titleAutoFocus}
          className={
            titleCentered
              ? 'mt-8 block w-full h-14 rounded-xl border border-surface-700 bg-surface-900 px-5 text-body-large text-surface-50 placeholder-text-500 text-center focus:border-primary-500/60 focus:outline-none'
              : `mt-0 ${c.inputLg}`
          }
        />
      ) : null}

      {/* Recording Type */}
      {showRecordingType ? (
        <div className={showIdentity ? `mt-6 ${c.panel}` : c.panel}>
          <p className={c.sectionLabel}>Recording Type</p>
          <label className={c.radioLabel}>
            <input
              type="radio"
              name={`${instanceId}-recording-type`}
              checked={value.recordingType === 'original'}
              onChange={() => {
                // Keep Original Work values in memory; only hide section (BUILD-011C)
                onClearError?.('originalWorkTitle');
                onClearError?.('originalWorkPrimaryArtist');
                const nextType = 'original' as const;
                onChange({
                  recordingType: nextType,
                  displayTitleEdited: false,
                  displayTitle: generateSuggestedDisplayTitle({
                    trackTitle: value.title,
                    originalArtistNames: resolveNames(
                      artists,
                      value.primaryArtistId ? [value.primaryArtistId] : [],
                    ),
                    featuredArtistNames: resolveNames(
                      artists,
                      value.featuredArtists.map((e) => e.artistId),
                    ),
                    remixArtistNames: [],
                    isRemix: false,
                  }),
                });
              }}
            />
            Original Recording
          </label>
          <label className={c.radioLabel}>
            <input
              type="radio"
              name={`${instanceId}-recording-type`}
              checked={value.recordingType === 'remix'}
              onChange={() => {
                onChange({
                  recordingType: 'remix',
                  displayTitleEdited: false,
                  displayTitle: generateSuggestedDisplayTitle({
                    trackTitle: value.title,
                    originalArtistNames: resolveNames(
                      artists,
                      value.primaryArtistId ? [value.primaryArtistId] : [],
                    ),
                    featuredArtistNames: resolveNames(
                      artists,
                      value.featuredArtists.map((e) => e.artistId),
                    ),
                    remixArtistNames: [],
                    isRemix: true,
                  }),
                });
              }}
            />
            Remix
          </label>
        </div>
      ) : null}

      {/*
        BUILD-011C Group A — Original Work (exactly three fields).
        Never merge with Remix Recording metadata.
      */}
      {showOriginalWork && value.recordingType === 'remix' ? (
        <OriginalWorkSection
          instanceId={instanceId}
          value={value}
          onChange={onChange}
          errors={errors}
          onClearError={onClearError}
          artists={artists}
          organizationId={organizationId}
          onArtistCreated={onArtistCreated}
          variant={variant}
        />
      ) : null}

      {/*
        BUILD-011C Group B — artist / version / display title.
        BUILD-012B/C — Remix Details vs Track Details section labels.
        Order: Primary Artist → Featured Artists → Version → Suggested Display Title.
      */}
      {showRecordingMetadata ? (
        <div
          className={
            value.recordingType === 'remix' && showOriginalWork ? c.divider : c.stack
          }
        >
          {value.recordingType === 'remix' ? (
            <div>
              <p className={`${c.sectionLabel} mb-1`}>Remix Details</p>
              <p className={`${c.helper} mb-3`}>
                Information about the remix recording being released.
              </p>
            </div>
          ) : (
            <div>
              <p className={`${c.sectionLabel} mb-3`}>Track Details</p>
            </div>
          )}

          <div className="space-y-3">
            <ArtistFieldPicker
              key={`${instanceId}-primary`}
              instanceId={`${instanceId}-primary`}
              label="Primary Artist"
              value={value.primaryArtistId}
              onChange={(id) =>
                patchWithDisplayTitle({ primaryArtistId: id }, { nextPrimaryId: id })
              }
              artists={artists}
              organizationId={organizationId}
              onArtistCreated={onArtistCreated}
            />

            <ArtistRelationshipList
              instanceId={`${instanceId}-featured`}
              role="featured"
              entries={value.featuredArtists}
              artists={artists}
              organizationId={organizationId}
              onAdd={(artistId) => {
                if (value.featuredArtists.some((e) => e.artistId === artistId)) {
                  return;
                }
                const next = [
                  ...value.featuredArtists,
                  { id: `${Date.now()}-${artistId}`, artistId },
                ];
                patchWithDisplayTitle({ featuredArtists: next }, { nextFeatured: next });
              }}
              onRemove={(entryId) => {
                const next = value.featuredArtists.filter((e) => e.id !== entryId);
                patchWithDisplayTitle({ featuredArtists: next }, { nextFeatured: next });
              }}
              onReorder={(entries) => {
                const dup = findDuplicateArtistId(entries.map((e) => e.artistId));
                if (dup) return;
                patchWithDisplayTitle(
                  { featuredArtists: entries },
                  { nextFeatured: entries },
                );
              }}
              onArtistCreated={onArtistCreated}
              error={errors?.featuredArtists}
            />

            <input
              type="text"
              value={value.version}
              onChange={(e) => onChange({ version: e.target.value })}
              placeholder="Version (optional)"
              className={
                titleCentered
                  ? 'block w-full h-12 rounded-xl border border-surface-700 bg-surface-900 px-5 text-sm text-surface-50 placeholder-text-500 text-center focus:border-primary-500/60 focus:outline-none'
                  : c.inputLg
              }
            />

            <div className={c.panelMuted}>
              <p className={c.sectionLabel}>Suggested Display Title</p>
              <input
                type="text"
                value={value.displayTitle}
                onChange={(e) =>
                  onChange({
                    displayTitle: e.target.value,
                    displayTitleEdited: true,
                  })
                }
                placeholder="Auto-generated from artists and title"
                className={c.input}
              />
              <p className={c.micro}>
                Uses feat. for featured artists. Edit to override automatic generation.
              </p>
            </div>
          </div>
        </div>
      ) : null}

      {/*
        BUILD-012C — Recording Metadata (always for full editor).
        Duration (seconds) + Genre (catalogue). After details, before Production.
      */}
      {showDescriptiveMetadata ? (
        <div className={c.divider}>
          <div>
            <p className={`${c.sectionLabel} mb-1`}>Recording Metadata</p>
            <p className={`${c.helper} mb-3`}>Information describing this recording.</p>
          </div>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <label className={c.fieldLabel} htmlFor={`${instanceId}-duration`}>
                Duration
              </label>
              <p className={`${c.helper} mb-1`}>Length of this recording.</p>
              <input
                id={`${instanceId}-duration`}
                type="text"
                inputMode="numeric"
                autoComplete="off"
                value={value.durationDisplay}
                onChange={(e) => {
                  const display = e.target.value;
                  const parsed = parseDurationInput(display);
                  onChange({
                    durationDisplay: display,
                    duration: parsed,
                  });
                  if (!display.trim()) {
                    onClearError?.('duration');
                  } else if (parsed !== null) {
                    onClearError?.('duration');
                  }
                }}
                onBlur={() => {
                  const trimmed = value.durationDisplay.trim();
                  if (!trimmed) {
                    onChange({ durationDisplay: '', duration: null });
                    return;
                  }
                  const parsed = parseDurationInput(trimmed);
                  if (parsed === null) {
                    // Leave display as typed; parent validation sets error message
                    onChange({ duration: null });
                    return;
                  }
                  onChange({
                    duration: parsed,
                    durationDisplay: formatDurationDisplay(parsed),
                  });
                  onClearError?.('duration');
                }}
                placeholder="MM:SS"
                className={c.input}
              />
              {errors?.duration ? <p className={c.error}>{errors.duration}</p> : null}
            </div>

            <GenreSelect
              instanceId={instanceId}
              value={value.genre}
              onChange={(genre) => {
                onChange({ genre });
                onClearError?.('genre');
              }}
              variant={variant}
              error={errors?.genre}
            />
          </div>
        </div>
      ) : null}

      {/* Production */}
      {showProduction ? (
        <div className="mt-4 space-y-3">
          <div>
            <label className={c.checkLabel}>
              <input
                type="checkbox"
                checked={value.mixed}
                onChange={(e) => onChange({ mixed: e.target.checked })}
              />{' '}
              Have you mixed it?
            </label>
            {!value.mixed && onAssignMixing ? (
              <button type="button" onClick={onAssignMixing} className={c.assignBtn}>
                {value.mixingEngineer
                  ? people.find((p) => p.id === value.mixingEngineer)?.displayName ||
                    value.mixingEngineer
                  : 'Assign Mixing Engineer'}
              </button>
            ) : null}
          </div>
          <div>
            <label className={c.checkLabel}>
              <input
                type="checkbox"
                checked={value.mastered}
                onChange={(e) => onChange({ mastered: e.target.checked })}
              />{' '}
              Has it been mastered?
            </label>
            {!value.mastered && onAssignMastering ? (
              <button type="button" onClick={onAssignMastering} className={c.assignBtn}>
                {value.masteringEngineer
                  ? people.find((p) => p.id === value.masteringEngineer)?.displayName ||
                    value.masteringEngineer
                  : 'Assign Mastering Engineer'}
              </button>
            ) : null}
          </div>
        </div>
      ) : null}

      {/*
        BUILD-012D — Recording Identifiers (ISRC identifies the sound recording).
        Songwriters / ISWC live under Original Work only.
      */}
      {showPublishing ? (
        <div className={c.divider}>
          <div>
            <p className={`${c.sectionLabel} mb-1`}>Recording Identifiers</p>
            <p className={`${c.helper} mb-3`}>
              Identifiers for this sound recording.
            </p>
          </div>
          <div className="space-y-1.5">
            <label className={c.fieldLabel} htmlFor={`${instanceId}-isrc`}>
              ISRC
            </label>
            <input
              id={`${instanceId}-isrc`}
              type="text"
              value={value.isrc}
              onChange={(e) => onChange({ isrc: e.target.value })}
              placeholder="e.g. USABC1234567"
              className={c.input}
            />
          </div>
        </div>
      ) : null}
    </div>
  );
}
