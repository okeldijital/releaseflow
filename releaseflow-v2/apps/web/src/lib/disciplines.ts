export const DISCIPLINE_OPTIONS = [
  'Producer',
  'Executive Producer',
  'Artist',
  'Featured Artist',
  'Recording Engineer',
  'Mix Engineer',
  'Mastering Engineer',
  'Vocal Engineer',
  'Songwriter',
  'Composer',
  'Lyricist',
  'Graphic Designer',
  'Photographer',
  'Videographer',
  'Animator',
  'Creative Director',
  'Marketing Manager',
  'PR Manager',
  'Distribution Manager',
  'Publisher',
  'A&R',
  'Project Manager',
  'Label Manager',
  'Administrator',
] as const;

export type Discipline = typeof DISCIPLINE_OPTIONS[number];

export const DISCIPLINE_TO_SYSTEM_ROLE: Record<string, string> = {
  'Producer': 'contributor',
  'Executive Producer': 'contributor',
  'Artist': 'contributor',
  'Featured Artist': 'contributor',
  'Recording Engineer': 'contributor',
  'Mix Engineer': 'contributor',
  'Mastering Engineer': 'contributor',
  'Vocal Engineer': 'contributor',
  'Songwriter': 'contributor',
  'Composer': 'contributor',
  'Lyricist': 'contributor',
  'Graphic Designer': 'contributor',
  'Photographer': 'contributor',
  'Videographer': 'contributor',
  'Animator': 'contributor',
  'Creative Director': 'contributor',
  'Marketing Manager': 'contributor',
  'PR Manager': 'contributor',
  'Distribution Manager': 'contributor',
  'Publisher': 'contributor',
  'A&R': 'contributor',
  'Project Manager': 'release_manager',
  'Label Manager': 'release_manager',
  'Administrator': 'admin',
};

export function getSystemRoleForDiscipline(discipline: string): string {
  return DISCIPLINE_TO_SYSTEM_ROLE[discipline] ?? 'contributor';
}
