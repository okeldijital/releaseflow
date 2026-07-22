import type { RecordingType } from '@/lib/recording-type';
import type { ArtistOption, RepeatableArtistEntry } from '@/components/artist-field-picker';

/** Controlled track metadata edited by TrackEditor (BUILD-011C–012D). */
export type TrackEditorValue = {
  title: string;
  version: string;
  recordingType: RecordingType;
  /** Group A — Original Work (in-memory retained when type is not remix) */
  originalWorkTitle: string;
  originalWorkPrimaryArtistId: string;
  originalWorkFeaturedArtists: RepeatableArtistEntry[];
  /** BUILD-012D — composition creators + ISWC (Original Work only) */
  originalWorkComposers: RepeatableArtistEntry[];
  originalWorkLyricists: RepeatableArtistEntry[];
  originalWorkIswc: string;
  /** Group B — recording being released */
  primaryArtistId: string;
  featuredArtists: RepeatableArtistEntry[];
  displayTitle: string;
  displayTitleEdited: boolean;
  /** BUILD-012C — Recording Metadata (track.duration seconds, track.genre) */
  durationDisplay: string;
  duration: number | null;
  genre: string;
  /** Production (optional sections) */
  mixed: boolean;
  mastered: boolean;
  mixingEngineer: string;
  masteringEngineer: string;
  /** Recording identifiers (ISRC — sound recording) */
  isrc: string;
  pubOpen: boolean;
};

export type TrackEditorErrors = {
  featuredArtists?: string;
  originalWorkTitle?: string;
  originalWorkPrimaryArtist?: string;
  duration?: string;
  genre?: string;
  originalWorkComposers?: string;
  originalWorkLyricists?: string;
};

export type TrackEditorPersonOption = { id: string; displayName: string };

export type TrackEditorVariant = 'dark' | 'light';

export type TrackEditorProps = {
  /** Unique prefix for radio names and picker instanceIds */
  instanceId: string;
  value: TrackEditorValue;
  onChange: (patch: Partial<TrackEditorValue>) => void;
  errors?: TrackEditorErrors;
  onClearError?: (key: keyof TrackEditorErrors) => void;
  artists: ArtistOption[];
  organizationId: string | null;
  onArtistCreated?: (artist: ArtistOption) => void;
  /** Visual tokens: dark = wizard/create; light = workspace edit */
  variant?: TrackEditorVariant;
  /** Title field presentation */
  titlePlaceholder?: string;
  titleAutoFocus?: boolean;
  titleCentered?: boolean;
  /** Optional sections beyond identity + original work + recording metadata */
  showProduction?: boolean;
  /** Recording identifiers (ISRC) */
  showPublishing?: boolean;
  people?: TrackEditorPersonOption[];
  onAssignMixing?: () => void;
  onAssignMastering?: () => void;
  /** When false, only Original Work fields (for embedding in edit forms) */
  showIdentity?: boolean;
  showRecordingType?: boolean;
  /** Group B: artists / version / display title */
  showRecordingMetadata?: boolean;
  /** BUILD-012C — Duration + Genre (always on for full create editor) */
  showDescriptiveMetadata?: boolean;
  showOriginalWork?: boolean;
};

export function emptyTrackEditorValue(
  overrides: Partial<TrackEditorValue> = {},
): TrackEditorValue {
  return {
    title: '',
    version: '',
    recordingType: 'original',
    originalWorkTitle: '',
    originalWorkPrimaryArtistId: '',
    originalWorkFeaturedArtists: [],
    originalWorkComposers: [],
    originalWorkLyricists: [],
    originalWorkIswc: '',
    primaryArtistId: '',
    featuredArtists: [],
    displayTitle: '',
    displayTitleEdited: false,
    durationDisplay: '',
    duration: null,
    genre: '',
    mixed: true,
    mastered: true,
    mixingEngineer: '',
    masteringEngineer: '',
    isrc: '',
    pubOpen: false,
    ...overrides,
  };
}

export type { ArtistOption, RepeatableArtistEntry, RecordingType };
