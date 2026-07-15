import type { RecordingType } from '@/lib/recording-type';

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

export type WizardTrack = {
  id: string;
  title: string;
  version: string;
  recordingType: RecordingType;
  primaryArtistId: string;
  featuredArtistIds: string[];
  originalArtists: { id: string; artistId: string }[];
  remixArtists: { id: string; artistId: string }[];
  displayTitle: string;
  displayTitleEdited: boolean;
  mixed: boolean;
  mastered: boolean;
  mixingEngineer: string;
  masteringEngineer: string;
  isrc: string;
  composer: string;
  lyricist: string;
  iswc: string;
  pubOpen: boolean;
  remixErrors: { originalArtists?: string; remixArtists?: string };
};

export function createEmptyTrack(id = String(Date.now())): WizardTrack {
  return {
    id,
    title: '',
    version: '',
    recordingType: 'original',
    primaryArtistId: '',
    featuredArtistIds: [],
    originalArtists: [],
    remixArtists: [],
    displayTitle: '',
    displayTitleEdited: false,
    mixed: true,
    mastered: true,
    mixingEngineer: '',
    masteringEngineer: '',
    isrc: '',
    composer: '',
    lyricist: '',
    iswc: '',
    pubOpen: false,
    remixErrors: {},
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
