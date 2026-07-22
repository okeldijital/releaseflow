import type { RecordingType } from '@/lib/recording-type';
import type { RepeatableArtistEntry } from '@/components/artist-field-picker';

export const RELEASE_TYPES = [
  { value: 'single', label: 'Single', description: 'One track release' },
  { value: 'ep', label: 'EP', description: '3–6 tracks' },
  { value: 'album', label: 'Album', description: '7+ tracks' },
] as const;

export const PROMO_ASSETS = [
  { key: 'cover_artwork', label: 'Cover Artwork' },
  { key: 'story', label: 'Story' },
  { key: 'reel', label: 'Reel' },
  { key: 'teaser', label: 'Teaser' },
  { key: 'banner', label: 'Banner' },
  { key: 'press_kit', label: 'Press Kit' },
];

export const SOCIAL_PLATFORMS = ['Facebook', 'Instagram', 'TikTok', 'YouTube', 'X', 'LinkedIn', 'Website'] as const;

export type ReleaseTypeVal = typeof RELEASE_TYPES[number]['value'];

/** Wizard track state — BUILD-011C + BUILD-012C (Original Work + recording metadata). */
export type WizardTrack = {
  id: string;
  title: string;
  version: string;
  recordingType: RecordingType;
  primaryArtistId: string;
  featuredArtists: RepeatableArtistEntry[];
  originalWorkTitle: string;
  originalWorkPrimaryArtistId: string;
  originalWorkFeaturedArtists: RepeatableArtistEntry[];
  displayTitle: string;
  displayTitleEdited: boolean;
  /** BUILD-012C — track.duration (seconds) + display string */
  durationDisplay: string;
  duration: number | null;
  genre: string;
  mixed: boolean;
  mastered: boolean;
  mixingEngineer: string;
  masteringEngineer: string;
  isrc: string;
  /** BUILD-012D — Artist-linked songwriting credits */
  composers: RepeatableArtistEntry[];
  lyricists: RepeatableArtistEntry[];
  iswc: string;
  pubOpen: boolean;
  remixErrors: {
    originalWorkTitle?: string;
    originalWorkPrimaryArtist?: string;
    featuredArtists?: string;
    duration?: string;
    genre?: string;
  };
};

export function createEmptyTrack(id = String(Date.now())): WizardTrack {
  return {
    id,
    title: '',
    version: '',
    recordingType: 'original',
    primaryArtistId: '',
    featuredArtists: [],
    originalWorkTitle: '',
    originalWorkPrimaryArtistId: '',
    originalWorkFeaturedArtists: [],
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
    composers: [],
    lyricists: [],
    iswc: '',
    pubOpen: false,
    remixErrors: {},
  };
}

/** Normalize draft / legacy wizard tracks into current shape. */
export function normalizeWizardTrack(raw: Partial<WizardTrack> & { id?: string; featuredArtistIds?: string[]; originalArtists?: { id: string; artistId: string }[]; remixArtists?: { id: string; artistId: string }[] }): WizardTrack {
  const base = createEmptyTrack(raw.id ?? String(Date.now()));
  const featuredArtists =
    raw.featuredArtists ??
    (raw.featuredArtistIds ?? []).map((artistId) => ({ id: artistId, artistId }));

  return {
    ...base,
    ...raw,
    featuredArtists,
    originalWorkTitle: raw.originalWorkTitle ?? '',
    originalWorkPrimaryArtistId: raw.originalWorkPrimaryArtistId ?? '',
    originalWorkFeaturedArtists: raw.originalWorkFeaturedArtists ?? [],
    durationDisplay: raw.durationDisplay ?? '',
    duration: raw.duration ?? null,
    genre: raw.genre ?? '',
    composers: raw.composers ?? [],
    lyricists: raw.lyricists ?? [],
    remixErrors: raw.remixErrors ?? {},
  };
}

export type PersonOption = { id: string; displayName: string };

export function uid() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

export type SocialRow = { id: string; platform: string; url: string; personId: string };
export type SectionStatusMap = Record<string, 'complete' | 'incomplete' | 'skipped'>;
export type AssignerField = 'mixingEngineer' | 'masteringEngineer' | 'emailManager';
export type InviteTarget = { type: string; key?: string } | null;

export interface WizardDraftData {
  currentStep: number;
  releaseType: ReleaseTypeVal;
  releaseTitle: string;
  releaseLink: string;
  releaseNotes: string;
  targetReleaseDate: string;
  estimatedReleaseDate: string;
  hasArtwork: boolean | null;
  commissionArtwork: boolean | null;
  artworkDesigner: string;
  tracks: WizardTrack[];
  promoAssets: string[];
  assetDesigners: Record<string, string>;
  socialRows: SocialRow[];
  hasEmail: boolean | null;
  emailSubject: string;
  emailPreviewText: string;
  emailBody: string;
  emailCampaignManager: string;
  emailSendDate: string;
  emailSendTime: string;
  emailTimezone: string;
  primaryArtist: string;
  featuredArtists: string[];
  recordLabel: string;
  catalogueNumber: string;
  upc: string;
  primaryGenre: string;
  secondaryGenre: string;
  language: string;
  copyrightOwner: string;
  copyrightYear: string;
  releaseOwner: string;
  inviteName: string;
  inviteEmail: string;
  inviteRole: string;
  showInviteForm: boolean;
  inviteTarget: InviteTarget;
}
