import type { WorkRecord } from './work-repository';

export interface WorkOption {
  id: string;
  title: string;
  iswc?: string | null;
  pro?: string | null;
  status: string;
  writerCount?: number;
}

export function toWorkOptions(works: WorkRecord[]): WorkOption[] {
  return works.map((w) => ({
    id: w.id,
    title: w.title,
    iswc: w.iswc,
    pro: w.pro,
    status: w.status,
  }));
}

export function filterWorksForSearch(works: WorkOption[], query: string): WorkOption[] {
  const q = query.toLowerCase().trim();
  if (!q) return works;
  return works.filter(
    (w) =>
      w.title.toLowerCase().includes(q) ||
      (w.iswc?.toLowerCase().includes(q) ?? false),
  );
}

export function mergeWorkOptions(a: WorkOption[], b: WorkOption[]): WorkOption[] {
  const map = new Map<string, WorkOption>();
  for (const opt of [...a, ...b]) map.set(opt.id, opt);
  return Array.from(map.values());
}
