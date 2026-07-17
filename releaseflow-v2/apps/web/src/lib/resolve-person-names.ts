import { fetchPerson } from './person-service';
import { getPeopleByOrg } from './people-repository';

export async function resolvePersonNames(personIds: string[]): Promise<Map<string, string>> {
  const uniqueIds = [...new Set(personIds.filter(Boolean))];
  const map = new Map<string, string>();

  await Promise.all(
    uniqueIds.map(async (id) => {
      try {
        const person = await fetchPerson(id);
        map.set(id, person?.displayName ?? 'Unknown Person');
      } catch {
        map.set(id, 'Unknown Person');
      }
    }),
  );

  return map;
}

/**
 * UX-001 — Resolve display names for Person.id OR Auth uid.
 * Prefer org-scoped people directory for Auth uid → Person.userId matches.
 */
export async function resolveActorDisplayNames(
  ids: string[],
  organizationId?: string | null,
): Promise<Map<string, string>> {
  const uniqueIds = [...new Set(ids.filter(Boolean))];
  const map = await resolvePersonNames(uniqueIds);

  if (!organizationId) return map;

  const unresolved = uniqueIds.filter(
    (id) => !map.has(id) || map.get(id) === 'Unknown Person',
  );
  if (unresolved.length === 0) return map;

  try {
    const people = await getPeopleByOrg(organizationId);
    for (const id of unresolved) {
      const byPersonId = people.find((p) => p.id === id);
      if (byPersonId?.displayName) {
        map.set(id, byPersonId.displayName);
        continue;
      }
      const byUserId = people.find((p) => p.userId === id);
      if (byUserId?.displayName) {
        map.set(id, byUserId.displayName);
      }
    }
  } catch {
    /* keep partial map */
  }

  return map;
}
