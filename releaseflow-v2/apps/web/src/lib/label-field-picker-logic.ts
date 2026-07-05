export type LabelOption = { id: string; name: string };

export function normalizeLabelName(name: string): string {
  return name.trim().toLowerCase();
}

export function mergeLabelOptions(base: LabelOption[], extras: LabelOption[]): LabelOption[] {
  const byId = new Map<string, LabelOption>();
  for (const a of base) byId.set(a.id, a);
  for (const a of extras) byId.set(a.id, a);
  return Array.from(byId.values());
}

export function appendLabelOption(catalogue: LabelOption[], created: LabelOption): LabelOption[] {
  if (catalogue.some((a) => a.id === created.id)) return catalogue;
  return [...catalogue, created];
}

export function toLabelOptions(records: { id: string; name: string }[]): LabelOption[] {
  return records.map((r) => ({ id: r.id, name: r.name }));
}

export function findLabelByName(labels: LabelOption[], name: string): LabelOption | undefined {
  const norm = normalizeLabelName(name);
  if (!norm) return undefined;
  return labels.find((a) => normalizeLabelName(a.name) === norm);
}

export function filterLabelsForSearch(labels: LabelOption[], search: string): LabelOption[] {
  const normalizedSearch = search.trim().toLowerCase();
  if (!normalizedSearch) return [];
  return labels.filter((label) => label.name.toLowerCase().includes(normalizedSearch));
}

export function canCreateLabelFromSearch(catalogue: LabelOption[], search: string): boolean {
  const normalizedSearch = search.trim().toLowerCase();
  if (!normalizedSearch) return false;
  const hasExactMatch = catalogue.some(
    (label) => normalizeLabelName(label.name) === normalizedSearch,
  );
  return !hasExactMatch;
}
