import type { PersonRecord } from './people-repository';

export interface PersonOption {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string | null;
  department?: string | null;
  primaryRole: string;
  status: string;
}

export function normalizePersonName(name: string): string {
  return name.trim().toLowerCase();
}

export function mergePersonOptions(a: PersonOption[], b: PersonOption[]): PersonOption[] {
  const map = new Map<string, PersonOption>();
  for (const opt of [...a, ...b]) map.set(opt.id, opt);
  return Array.from(map.values());
}

export function toPersonOptions(people: PersonRecord[]): PersonOption[] {
  return people.map((p) => ({
    id: p.id,
    name: p.displayName,
    email: p.email,
    avatarUrl: p.avatarUrl,
    department: p.department,
    primaryRole: p.primaryRole,
    status: p.status,
  }));
}

export function filterPeopleForSearch(people: PersonOption[], query: string): PersonOption[] {
  const q = query.toLowerCase().trim();
  if (!q) return people;
  return people.filter(
    (p) =>
      p.name.toLowerCase().includes(q) ||
      p.email.toLowerCase().includes(q) ||
      (p.department?.toLowerCase().includes(q) ?? false) ||
      p.primaryRole.toLowerCase().includes(q),
  );
}
