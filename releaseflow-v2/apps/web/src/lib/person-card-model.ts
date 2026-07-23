/**
 * BUILD-018 — Canonical PersonCard view model + mapper.
 *
 * Firestore → Person Service → toPersonCardModels() → PersonCardModel → PersonCard
 * No page-level mapping or presentation enrichment.
 */
import type { PersonRecord } from './people-repository';
import { MediaUrlService } from '@releaseflow/firebase/cloudinary';
import { CONTRIBUTION_ROLES } from './contribution-roles';

/** Overflow menu actions prepared by the mapper (card never invents them). */
export type PersonCardMenuAction =
  | 'view'
  | 'edit'
  | 'archive'
  | 'restore'
  | 'delete';

export interface PersonCardModel {
  id: string;
  organizationId: string;
  displayName: string;
  /** Resolved display image URL (MediaUrlService.person or stored avatarUrl) */
  image: string | null;
  imagePublicId: string | null;
  /** Primary professional / contribution role label */
  subtitle: string;
  releaseCount: number | null;
  creditCount: number | null;
  status: string;
  menuActions: PersonCardMenuAction[];
  /** Search helpers (not always rendered on the card) */
  email: string;
  primaryRole: string;
  department: string | null;
  updatedAt?: unknown;
}

/** Significance order: earlier = more significant when picking among roles. */
const ROLE_SIGNIFICANCE: string[] = [
  'Executive Producer',
  'Producer',
  'Composer',
  'Songwriter',
  'Lyricist',
  'Mix Engineer',
  'Mastering Engineer',
  'Engineer',
  'Featured Artist',
  'Vocalist',
  'Musician',
  'Artwork Designer',
  'Photographer',
  'Videographer',
  'Label Manager',
  'Project Manager',
  'Marketing',
  'PR',
  'Distribution',
  'Social Media',
  'Owner',
  'Administrator',
  'Other',
];

const ROLE_RANK = new Map(
  ROLE_SIGNIFICANCE.map((label, index) => [label.toLowerCase(), index]),
);

/** Known slug → display label for stored primaryRole values. */
export const PERSON_ROLE_LABELS: Record<string, string> = {
  producer: 'Producer',
  executive_producer: 'Executive Producer',
  engineer: 'Engineer',
  mix_engineer: 'Mix Engineer',
  mastering_engineer: 'Mastering Engineer',
  composer: 'Composer',
  songwriter: 'Songwriter',
  lyricist: 'Lyricist',
  featured_artist: 'Featured Artist',
  musician: 'Musician',
  vocalist: 'Vocalist',
  photographer: 'Photographer',
  videographer: 'Videographer',
  artwork_designer: 'Artwork Designer',
  label_manager: 'Label Manager',
  project_manager: 'Project Manager',
  marketing: 'Marketing',
  pr: 'PR',
  distribution: 'Distribution',
  social_media: 'Social Media',
  owner: 'Owner',
  administrator: 'Administrator',
  admin: 'Administrator',
  manager: 'Label Manager',
  collaborator: 'Collaborator',
  other: 'Other',
};

function humanizeRole(raw: string): string {
  const trimmed = raw.trim();
  if (!trimmed) return '';
  const known = PERSON_ROLE_LABELS[trimmed.toLowerCase().replace(/\s+/g, '_')];
  if (known) return known;
  // Already a display label (e.g. contribution role string)
  if (CONTRIBUTION_ROLES.includes(trimmed as (typeof CONTRIBUTION_ROLES)[number])) {
    return trimmed;
  }
  // Title-case snake_case / kebab
  if (/[_-]/.test(trimmed)) {
    return trimmed
      .split(/[_-]+/)
      .filter(Boolean)
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
      .join(' ');
  }
  return trimmed;
}

function roleRank(label: string): number {
  const r = ROLE_RANK.get(label.toLowerCase());
  return r === undefined ? 999 : r;
}

/**
 * Primary role for the card subtitle.
 * Prefer stored primaryRole, then position, then most significant among extras.
 */
export function resolvePersonPrimaryRole(
  person: Pick<PersonRecord, 'primaryRole' | 'position' | 'department'>,
  extraRoles: string[] = [],
): string {
  const candidates: string[] = [];
  if (person.primaryRole?.trim()) candidates.push(humanizeRole(person.primaryRole));
  if (person.position?.trim()) candidates.push(humanizeRole(person.position));
  for (const r of extraRoles) {
    if (r?.trim()) candidates.push(humanizeRole(r));
  }
  const unique = [...new Set(candidates.filter(Boolean))];
  if (unique.length === 0) {
    // Do not invent — department is secondary metadata only when nothing else exists
    return person.department?.trim() ? humanizeRole(person.department) : '';
  }
  unique.sort((a, b) => roleRank(a) - roleRank(b));
  return unique[0] ?? '';
}

export function resolvePersonImage(person: PersonRecord): string | null {
  if (person.avatarPublicId) {
    try {
      return MediaUrlService.person(person.avatarPublicId, 400);
    } catch {
      // Public cloud name missing — fall through to stored URL
    }
  }
  return person.avatarUrl ?? null;
}

export function resolvePersonMenuActions(
  person: PersonRecord,
): PersonCardMenuAction[] {
  const actions: PersonCardMenuAction[] = ['view', 'edit'];
  if (person.status === 'archived') {
    actions.push('restore');
  } else {
    actions.push('archive');
  }
  actions.push('delete');
  return actions;
}

/**
 * Map a single person + optional counts into the card model (no I/O).
 */
export function toPersonCardModel(
  person: PersonRecord,
  counts?: { releases?: number; credits?: number } | null,
  opts?: { extraRoles?: string[] },
): PersonCardModel {
  return {
    id: person.id,
    organizationId: person.organizationId,
    displayName: person.displayName,
    image: resolvePersonImage(person),
    imagePublicId: person.avatarPublicId ?? null,
    subtitle: resolvePersonPrimaryRole(person, opts?.extraRoles),
    releaseCount: counts?.releases ?? null,
    creditCount: counts?.credits ?? null,
    status: person.status,
    menuActions: resolvePersonMenuActions(person),
    email: person.email,
    primaryRole: person.primaryRole,
    department: person.department ?? null,
    updatedAt: person.updatedAt,
  };
}

export type PersonLinkCounts = Record<string, { releases: number; credits: number }>;

/**
 * Batch counts from org assignments — one query, no N+1.
 * Releases: unique release ids linked via assignment.
 * Credits: total assignment roles (work credits).
 */
export async function getPersonLinkCounts(
  organizationId: string,
): Promise<PersonLinkCounts> {
  if (!organizationId) return {};
  try {
    const { fetchAssignments } = await import('./assignment-service');
    const assignments = await fetchAssignments(organizationId, {
      includeArchived: true,
    });
    const acc = new Map<string, { releases: Set<string>; credits: number }>();
    for (const a of assignments) {
      const pid = a.assigneeId;
      if (!pid) continue;
      let entry = acc.get(pid);
      if (!entry) {
        entry = { releases: new Set(), credits: 0 };
        acc.set(pid, entry);
      }
      entry.credits += 1;
      if (a.releaseId) entry.releases.add(a.releaseId);
      if (a.entityType === 'release' && a.entityId) {
        entry.releases.add(a.entityId);
      }
    }
    const out: PersonLinkCounts = {};
    for (const [id, v] of acc) {
      out[id] = { releases: v.releases.size, credits: v.credits };
    }
    return out;
  } catch {
    return {};
  }
}

/**
 * Collect contribution roles per person from assignments (batch).
 */
async function getPersonRoleHints(
  organizationId: string,
): Promise<Record<string, string[]>> {
  if (!organizationId) return {};
  try {
    const { fetchAssignments } = await import('./assignment-service');
    const assignments = await fetchAssignments(organizationId, {
      includeArchived: true,
    });
    const map: Record<string, string[]> = {};
    for (const a of assignments) {
      if (!a.assigneeId || !a.role?.trim()) continue;
      if (!map[a.assigneeId]) map[a.assigneeId] = [];
      map[a.assigneeId]!.push(a.role);
    }
    return map;
  } catch {
    return {};
  }
}

/**
 * Batch enrichment: counts + role hints once, map all people.
 * Image resolution via MediaUrlService (no N+1 network).
 */
export async function toPersonCardModels(
  organizationId: string,
  people: PersonRecord[],
  opts?: { includeCounts?: boolean; includeRoleHints?: boolean },
): Promise<PersonCardModel[]> {
  if (people.length === 0) return [];
  const includeCounts = opts?.includeCounts !== false;
  const includeRoleHints = opts?.includeRoleHints !== false;

  let counts: PersonLinkCounts = {};
  let roleHints: Record<string, string[]> = {};

  if (includeCounts && includeRoleHints) {
    // Single assignment fetch shared for counts + roles
    try {
      const { fetchAssignments } = await import('./assignment-service');
      const assignments = await fetchAssignments(organizationId, {
        includeArchived: true,
      });
      const acc = new Map<string, { releases: Set<string>; credits: number }>();
      for (const a of assignments) {
        const pid = a.assigneeId;
        if (!pid) continue;
        let entry = acc.get(pid);
        if (!entry) {
          entry = { releases: new Set(), credits: 0 };
          acc.set(pid, entry);
        }
        entry.credits += 1;
        if (a.releaseId) entry.releases.add(a.releaseId);
        if (a.entityType === 'release' && a.entityId) {
          entry.releases.add(a.entityId);
        }
        if (a.role?.trim()) {
          if (!roleHints[pid]) roleHints[pid] = [];
          roleHints[pid]!.push(a.role);
        }
      }
      for (const [id, v] of acc) {
        counts[id] = { releases: v.releases.size, credits: v.credits };
      }
    } catch {
      counts = {};
      roleHints = {};
    }
  } else {
    if (includeCounts) {
      counts = await getPersonLinkCounts(organizationId);
    }
    if (includeRoleHints) {
      roleHints = await getPersonRoleHints(organizationId);
    }
  }

  return people.map((p) =>
    toPersonCardModel(p, counts[p.id] ?? null, {
      extraRoles: roleHints[p.id] ?? [],
    }),
  );
}
