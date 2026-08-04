import type { RecordingType } from '@/lib/recording-type';
import type { RepeatableArtistEntry } from '@/components/artist-field-picker';
import type { RichTextDocument } from '@/lib/rich-text';

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

/** Legacy global social platforms (pre–BUILD-029). */
export const SOCIAL_PLATFORMS = ['Facebook', 'Instagram', 'TikTok', 'YouTube', 'X', 'LinkedIn', 'Website'] as const;

/**
 * BUILD-029 — Publish destinations owned by each promotional asset.
 * Keys are stable in draft state; labels are UI-only.
 */
export const PUBLISH_DESTINATIONS = [
  { key: 'instagram', label: 'Instagram' },
  { key: 'instagram_story', label: 'Instagram Stories' },
  { key: 'instagram_reels', label: 'Instagram Reels' },
  { key: 'facebook', label: 'Facebook' },
  { key: 'tiktok', label: 'TikTok' },
  { key: 'youtube', label: 'YouTube' },
  { key: 'x', label: 'X' },
  { key: 'linkedin', label: 'LinkedIn' },
  { key: 'website', label: 'Website' },
] as const;

export type PublishDestinationKey = (typeof PUBLISH_DESTINATIONS)[number]['key'];

/** BUILD-029 — one production deliverable in the Promotion step. */
export type PromotionAssetEntry = {
  type: string;
  enabled: boolean;
  designerId: string | null;
  publishDestinations: string[];
  // Future: dueDate, approvalStatus, upload, notes, completionStatus
};

/** Legacy global social row (pre–BUILD-029). */
export type SocialRow = { id: string; platform: string; url: string; personId: string };

export function defaultPromotionAssets(): PromotionAssetEntry[] {
  return PROMO_ASSETS.map((a) => ({
    type: a.key,
    enabled: false,
    designerId: null,
    publishDestinations: [],
  }));
}

/** Map legacy SOCIAL_PLATFORMS labels → PUBLISH_DESTINATIONS keys. */
function legacyPlatformToDestination(platform: string): string | null {
  const p = platform.trim().toLowerCase();
  if (!p) return null;
  const map: Record<string, string> = {
    facebook: 'facebook',
    instagram: 'instagram',
    tiktok: 'tiktok',
    youtube: 'youtube',
    x: 'x',
    twitter: 'x',
    linkedin: 'linkedin',
    website: 'website',
    'instagram stories': 'instagram_story',
    'instagram story': 'instagram_story',
    'instagram reels': 'instagram_reels',
    'instagram reel': 'instagram_reels',
  };
  return map[p] ?? (PUBLISH_DESTINATIONS.some((d) => d.key === p) ? p : null);
}

/** Draft slice used to hydrate promotion assets (avoids forward-ref to WizardDraftData). */
export type PromotionDraftSlice = {
  promotionAssets?: PromotionAssetEntry[];
  promoAssets?: string[];
  assetDesigners?: Record<string, string>;
  socialRows?: SocialRow[];
};

/**
 * BUILD-029 — hydrate promotion assets from draft.
 * Prefers `promotionAssets`; migrates from promoAssets + assetDesigners + socialRows.
 */
export function hydratePromotionAssets(wd: PromotionDraftSlice): PromotionAssetEntry[] {
  if (Array.isArray(wd.promotionAssets) && wd.promotionAssets.length > 0) {
    return PROMO_ASSETS.map((a) => {
      const found = wd.promotionAssets!.find((x) => x.type === a.key);
      return {
        type: a.key,
        enabled: Boolean(found?.enabled),
        designerId: found?.designerId?.trim() ? found.designerId : null,
        publishDestinations: Array.isArray(found?.publishDestinations)
          ? [...new Set(found.publishDestinations.filter(Boolean))]
          : [],
      };
    });
  }

  const enabled = new Set(wd.promoAssets ?? []);
  const designers = wd.assetDesigners ?? {};
  const legacyDestinations = [
    ...new Set(
      (wd.socialRows ?? [])
        .map((r) => legacyPlatformToDestination(r.platform))
        .filter((x): x is string => Boolean(x)),
    ),
  ];

  return PROMO_ASSETS.map((a) => {
    const isOn = enabled.has(a.key);
    const designer = designers[a.key]?.trim() || null;
    return {
      type: a.key,
      enabled: isOn,
      designerId: designer,
      // Best-effort: seed destinations from global social rows onto enabled assets only
      publishDestinations: isOn ? [...legacyDestinations] : [],
    };
  });
}

/** Derive legacy fields for draft compatibility and review summaries. */
export function deriveLegacyPromoFields(assets: PromotionAssetEntry[]): {
  promoAssets: string[];
  assetDesigners: Record<string, string>;
} {
  const promoAssets = assets.filter((a) => a.enabled).map((a) => a.type);
  const assetDesigners: Record<string, string> = {};
  for (const a of assets) {
    if (a.designerId) assetDesigners[a.type] = a.designerId;
  }
  return { promoAssets, assetDesigners };
}

export type ReleaseTypeVal = typeof RELEASE_TYPES[number]['value'];

/** Wizard track state — BUILD-011C + BUILD-012C/D */
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
  /** BUILD-012D — Original Work songwriters + ISWC */
  originalWorkComposers: RepeatableArtistEntry[];
  originalWorkLyricists: RepeatableArtistEntry[];
  originalWorkIswc: string;
  displayTitle: string;
  displayTitleEdited: boolean;
  durationDisplay: string;
  duration: number | null;
  previewStartDisplay: string;
  previewStartTime: number | null;
  genre: string;
  mixed: boolean;
  mastered: boolean;
  mixingEngineer: string;
  masteringEngineer: string;
  isrc: string;
  pubOpen: boolean;
  remixErrors: {
    originalWorkTitle?: string;
    originalWorkPrimaryArtist?: string;
    featuredArtists?: string;
    duration?: string;
    previewStartTime?: string;
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
    originalWorkComposers: [],
    originalWorkLyricists: [],
    originalWorkIswc: '',
    displayTitle: '',
    displayTitleEdited: false,
    durationDisplay: '',
    duration: null,
    previewStartDisplay: '',
    previewStartTime: null,
    genre: '',
    mixed: true,
    mastered: true,
    mixingEngineer: '',
    masteringEngineer: '',
    isrc: '',
    pubOpen: false,
    remixErrors: {},
  };
}

/** Normalize draft / legacy wizard tracks into current shape. */
export function normalizeWizardTrack(
  raw: Partial<WizardTrack> & {
    id?: string;
    featuredArtistIds?: string[];
    originalArtists?: { id: string; artistId: string }[];
    remixArtists?: { id: string; artistId: string }[];
    composers?: RepeatableArtistEntry[];
    lyricists?: RepeatableArtistEntry[];
    iswc?: string;
  },
): WizardTrack {
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
    originalWorkComposers: raw.originalWorkComposers ?? raw.composers ?? [],
    originalWorkLyricists: raw.originalWorkLyricists ?? raw.lyricists ?? [],
    originalWorkIswc: raw.originalWorkIswc ?? raw.iswc ?? '',
    durationDisplay: raw.durationDisplay ?? '',
    duration: raw.duration ?? null,
    previewStartDisplay: raw.previewStartDisplay ?? '',
    previewStartTime: raw.previewStartTime ?? null,
    genre: raw.genre ?? '',
    remixErrors: raw.remixErrors ?? {},
  };
}

export type PersonOption = { id: string; displayName: string };

export function uid() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

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
  /** BUILD-013 — structured liner notes document */
  linerNotes: RichTextDocument | null;
  /**
   * BUILD-029 — per-asset promotion deliverables (designer + publish destinations).
   * Source of truth for the Promotion step.
   */
  promotionAssets?: PromotionAssetEntry[];
  /** @deprecated Prefer promotionAssets; kept for draft compatibility. */
  promoAssets: string[];
  /** @deprecated Prefer promotionAssets[].designerId */
  assetDesigners: Record<string, string>;
  /** @deprecated Global social accounts removed in BUILD-029; kept for read/migrate only. */
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
