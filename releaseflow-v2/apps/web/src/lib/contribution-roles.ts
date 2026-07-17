/**
 * AW-001 / DOM-001 — Contribution roles describe creative work on an assignment.
 * They do NOT affect authorization (platform roles do).
 */

export const CONTRIBUTION_ROLES = [
  'Producer',
  'Executive Producer',
  'Engineer',
  'Mix Engineer',
  'Mastering Engineer',
  'Composer',
  'Songwriter',
  'Lyricist',
  'Featured Artist',
  'Musician',
  'Vocalist',
  'Artwork Designer',
  'Photographer',
  'Videographer',
  'Marketing',
  'PR',
  'Distribution',
  'Social Media',
  'Project Manager',
  'Other',
] as const;

export type ContributionRole = (typeof CONTRIBUTION_ROLES)[number];

export const CONTRIBUTION_ROLE_OPTIONS = CONTRIBUTION_ROLES.map((r) => ({
  value: r,
  label: r,
}));

/** Suggested assignment titles when a contribution role is chosen. */
export const CONTRIBUTION_ROLE_TEMPLATES: Record<string, string[]> = {
  Lyricist: ['Complete lyrics', 'Review lyric revisions', 'Submit final lyrics'],
  Composer: ['Compose arrangement', 'Deliver demo', 'Submit final composition'],
  Producer: ['Produce session', 'Review production notes', 'Deliver production package'],
  'Mix Engineer': ['Mix draft', 'Address mix notes', 'Deliver final mix'],
  'Mastering Engineer': ['Master draft', 'Address master notes', 'Deliver final master'],
  'Artwork Designer': ['Design cover concepts', 'Revise artwork', 'Deliver final assets'],
  Marketing: ['Draft campaign plan', 'Prepare assets', 'Launch campaign tasks'],
  Photographer: ['Shoot session', 'Select photos', 'Deliver finals'],
  Videographer: ['Shoot video', 'Edit cut', 'Deliver final video'],
  'Featured Artist': ['Record vocals', 'Approve performance', 'Submit final take'],
  Vocalist: ['Record vocals', 'Comp vocals', 'Deliver finals'],
  Musician: ['Record performance', 'Overdubs', 'Submit stems'],
  PR: ['Draft press materials', 'Pitch outlets', 'Track coverage'],
  Distribution: ['Prepare delivery package', 'Submit to DSPs', 'Confirm live'],
  'Social Media': ['Create content plan', 'Produce posts', 'Schedule release day content'],
  'Project Manager': ['Coordinate milestones', 'Chase deliverables', 'Status report'],
  Other: ['Complete assigned work', 'Submit for review'],
};

export function templatesForContributionRole(role: string): string[] {
  return CONTRIBUTION_ROLE_TEMPLATES[role] ?? CONTRIBUTION_ROLE_TEMPLATES.Other ?? [];
}
