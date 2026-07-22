/**
 * BUILD-014B — Identity resolution.
 *
 * User ID → users/{uid} → Identity { displayName, avatarUrl, email }
 *
 * UI must never read Auth photoURL/displayName or invent avatar sources.
 * Linked Person records resolve through the linked user's canonical profile.
 * Unlinked People fall back to person fields (external collaborators).
 */
import { getUserProfile, type UserProfileRecord } from './user-profile-repository';
import { getPerson } from './people-repository';
import type { PersonRecord } from './people-repository';

export interface Identity {
  id: string;
  displayName: string;
  avatarUrl: string | null;
  email: string;
  /** True when resolved from users/{uid} */
  isUserProfile: boolean;
}

const cache = new Map<string, { at: number; identity: Identity }>();
const CACHE_TTL_MS = 60_000;

export function clearIdentityCache(userId?: string): void {
  if (userId) cache.delete(userId);
  else cache.clear();
}

function fromProfile(profile: UserProfileRecord): Identity {
  return {
    id: profile.id,
    displayName: profile.displayName?.trim() || profile.email?.split('@')[0] || 'User',
    avatarUrl: profile.avatarUrl ?? null,
    email: profile.email || '',
    isUserProfile: true,
  };
}

function fallbackIdentity(
  id: string,
  opts?: { displayName?: string | null; email?: string | null; avatarUrl?: string | null },
): Identity {
  const email = opts?.email?.trim() || '';
  const displayName =
    opts?.displayName?.trim()
    || email.split('@')[0]
    || 'User';
  return {
    id,
    displayName,
    avatarUrl: opts?.avatarUrl ?? null,
    email,
    isUserProfile: false,
  };
}

/**
 * Resolve a Firebase Auth uid (or users doc id) to Identity.
 */
export async function resolveIdentity(userId: string): Promise<Identity> {
  if (!userId) return fallbackIdentity('unknown');

  const hit = cache.get(userId);
  if (hit && Date.now() - hit.at < CACHE_TTL_MS) return hit.identity;

  try {
    const profile = await getUserProfile(userId);
    if (profile) {
      const identity = fromProfile(profile);
      cache.set(userId, { at: Date.now(), identity });
      return identity;
    }
  } catch {
    /* fall through */
  }

  const identity = fallbackIdentity(userId);
  cache.set(userId, { at: Date.now(), identity });
  return identity;
}

export async function resolveIdentities(
  userIds: string[],
): Promise<Map<string, Identity>> {
  const unique = [...new Set(userIds.filter(Boolean))];
  const map = new Map<string, Identity>();
  await Promise.all(
    unique.map(async (id) => {
      map.set(id, await resolveIdentity(id));
    }),
  );
  return map;
}

/**
 * Person → Identity. Linked users use users/{uid}; external people use person fields.
 */
export async function resolvePersonIdentity(
  person: Pick<PersonRecord, 'id' | 'userId' | 'displayName' | 'email' | 'avatarUrl'>,
): Promise<Identity> {
  if (person.userId) {
    const fromUser = await resolveIdentity(person.userId);
    if (fromUser.isUserProfile) return fromUser;
    // Profile missing: fall back to person but keep linked id
    return {
      id: person.userId,
      displayName: person.displayName || fromUser.displayName,
      avatarUrl: person.avatarUrl ?? null,
      email: person.email || fromUser.email,
      isUserProfile: false,
    };
  }
  return fallbackIdentity(person.id, {
    displayName: person.displayName,
    email: person.email,
    avatarUrl: person.avatarUrl,
  });
}

export async function resolvePersonIdentityById(
  personId: string,
): Promise<Identity> {
  if (!personId) return fallbackIdentity('unknown');
  try {
    const person = await getPerson(personId);
    if (person) return resolvePersonIdentity(person);
  } catch {
    /* fall through */
  }
  return fallbackIdentity(personId);
}

/**
 * Build Identity from a loaded UserProfile (no fetch).
 */
export function identityFromProfile(profile: UserProfileRecord): Identity {
  return fromProfile(profile);
}
