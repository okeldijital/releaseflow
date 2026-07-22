export { TrackEditor, OriginalWorkSection } from './TrackEditor';
export { GenreSelect } from './genre-select';
export {
  emptyTrackEditorValue,
  type TrackEditorValue,
  type TrackEditorErrors,
  type TrackEditorProps,
  type TrackEditorVariant,
  type TrackEditorPersonOption,
} from './types';
export {
  parseDurationInput,
  parseTimeInput,
  formatDurationDisplay,
  DURATION_INVALID_MESSAGE,
  DURATION_REQUIRED_MESSAGE,
  PREVIEW_START_INVALID_MESSAGE,
  PREVIEW_START_BEFORE_DURATION_MESSAGE,
} from '@/lib/duration-format';
export { RECORDING_GENRE_CATALOGUE } from '@/lib/recording-genre-catalogue';
