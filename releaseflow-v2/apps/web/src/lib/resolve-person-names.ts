import { fetchPerson } from './person-service';

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
