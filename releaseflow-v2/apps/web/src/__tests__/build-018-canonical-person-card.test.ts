/**
 * BUILD-018 — Canonical Person Card
 *
 * Exactly one PersonCard, PersonCardModel, and toPersonCardModels mapper.
 * People page, search, pickers, and contributor browser use the canonical component.
 */
import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import {
  toPersonCardModel,
  resolvePersonPrimaryRole,
  PERSON_ROLE_LABELS,
  type PersonCardModel,
} from '@/lib/person-card-model';
import type { PersonRecord } from '@/lib/people-repository';

const root = join(__dirname, '..');
const cardPath = join(root, 'components/people/PersonCard.tsx');
const modelPath = join(root, 'lib/person-card-model.ts');
const servicePath = join(root, 'lib/person-service.ts');
const peoplePagePath = join(root, 'app/(app)/people/page.tsx');
const pickerPath = join(root, 'components/person-field-picker.tsx');
const dialogPath = join(root, 'components/person-picker-dialog.tsx');
const contributorPath = join(root, 'components/assignments/contributor-selector.tsx');
const hookPath = join(root, 'hooks/usePerson.ts');
const mediaPath = join(
  root,
  '../../../packages/firebase/src/cloudinary/media-url-service.ts',
);

function walkTsx(dir: string, acc: string[] = []): string[] {
  for (const name of readdirSync(dir)) {
    if (name === 'node_modules' || name === '.next') continue;
    const p = join(dir, name);
    const st = statSync(p);
    if (st.isDirectory()) walkTsx(p, acc);
    else if (/\.(tsx|ts)$/.test(name)) acc.push(p);
  }
  return acc;
}

function basePerson(over: Partial<PersonRecord> = {}): PersonRecord {
  return {
    id: 'p1',
    organizationId: 'org1',
    displayName: 'Sarah Nkosi',
    email: 'sarah@example.com',
    primaryRole: 'producer',
    status: 'active',
    avatarUrl: null,
    avatarPublicId: null,
    department: null,
    position: null,
    ...over,
  };
}

describe('BUILD-018 single PersonCard component', () => {
  const src = readFileSync(cardPath, 'utf8');

  it('exposes size compact | standard | large only', () => {
    expect(src).toContain("export type PersonCardSize = 'compact' | 'standard' | 'large'");
    expect(src).toContain('SIZE_STYLES');
  });

  it('implements one layout (photo, name, subtitle, stats, menu)', () => {
    expect(src).toContain('aspect-square');
    expect(src).toContain('line-clamp-2');
    expect(src).toContain('EntityOverflowMenu');
    expect(src).toContain('person.subtitle');
    expect(src).toContain('person.displayName');
    expect(src).toContain('Releases');
    expect(src).toContain('Credits');
  });

  it('does not fork separate list/table card layouts', () => {
    expect(src).not.toContain('renderListRow');
    expect(src).not.toContain('renderTableRow');
    expect(src).not.toContain('renderCompactRow');
  });

  it('is the only PersonCard export in the web app', () => {
    const files = walkTsx(root).filter((f) => !f.includes('/__tests__/'));
    const defs = files.filter((f) => {
      const text = readFileSync(f, 'utf8');
      return (
        /export function PersonCard\b/.test(text)
        || /export const PersonCard\b/.test(text)
      );
    });
    expect(defs).toEqual([cardPath]);
  });
});

describe('BUILD-018 PersonCardModel + mapper', () => {
  const modelSrc = readFileSync(modelPath, 'utf8');
  const serviceSrc = readFileSync(servicePath, 'utf8');
  const mediaSrc = readFileSync(mediaPath, 'utf8');

  it('defines exactly one PersonCardModel interface', () => {
    expect(modelSrc).toContain('export interface PersonCardModel');
    expect(modelSrc.match(/export interface PersonCardModel/g)?.length).toBe(1);
  });

  it('defines toPersonCardModel and toPersonCardModels', () => {
    expect(modelSrc).toContain('export function toPersonCardModel');
    expect(modelSrc).toContain('export async function toPersonCardModels');
  });

  it('service re-exports mapper and provides fetchPersonCardModels', () => {
    expect(serviceSrc).toContain('fetchPersonCardModels');
    expect(serviceSrc).toContain('fetchPersonSearchCardModels');
    expect(serviceSrc).toContain('export { toPersonCardModel, toPersonCardModels }');
  });

  it('uses MediaUrlService.person for image resolution', () => {
    expect(mediaSrc).toContain('person(publicId');
    expect(modelSrc).toContain('MediaUrlService.person');
    expect(modelSrc).toContain('avatarPublicId');
  });

  it('toPersonCardModel resolves subtitle without inventing unknown roles', () => {
    const known = toPersonCardModel(basePerson({ primaryRole: 'producer' }));
    expect(known.subtitle).toBe(PERSON_ROLE_LABELS.producer);
    expect(known.subtitle).toBe('Producer');

    const display = toPersonCardModel(basePerson({ primaryRole: 'Photographer' }));
    expect(display.subtitle).toBe('Photographer');

    const empty = toPersonCardModel(
      basePerson({ primaryRole: '', position: null, department: null }),
    );
    expect(empty.subtitle).toBe('');
  });

  it('picks most significant role among candidates', () => {
    expect(
      resolvePersonPrimaryRole(
        { primaryRole: '', position: 'Engineer', department: null },
        ['Photographer', 'Executive Producer'],
      ),
    ).toBe('Executive Producer');
  });

  it('toPersonCardModel attaches counts, menu actions, and helpers', () => {
    const model = toPersonCardModel(basePerson({ status: 'active' }), {
      releases: 8,
      credits: 34,
    });
    expect(model.releaseCount).toBe(8);
    expect(model.creditCount).toBe(34);
    expect(model.menuActions).toContain('view');
    expect(model.menuActions).toContain('edit');
    expect(model.menuActions).toContain('archive');
    expect(model.menuActions).toContain('delete');
    expect(model.menuActions).not.toContain('restore');
    expect(model.email).toBe('sarah@example.com');

    const archived = toPersonCardModel(basePerson({ status: 'archived' }));
    expect(archived.menuActions).toContain('restore');
    expect(archived.menuActions).not.toContain('archive');
  });

  it('hides counts when unavailable (null)', () => {
    const model: PersonCardModel = toPersonCardModel(basePerson());
    expect(model.releaseCount).toBeNull();
    expect(model.creditCount).toBeNull();
  });

  it('batch mapper resolves counts without N+1 page logic', () => {
    expect(modelSrc).toContain('getPersonLinkCounts');
    expect(modelSrc).toContain('fetchAssignments');
  });
});

describe('BUILD-018 call sites consume PersonCard', () => {
  it('people page uses PersonCard grid, not Avatar list rows', () => {
    const page = readFileSync(peoplePagePath, 'utf8');
    expect(page).toContain('PersonCard');
    expect(page).toContain('personCards');
    expect(page).toContain('data-person-card-grid');
    expect(page).not.toContain('PersonIdentityAvatar');
    expect(page).not.toContain('EntityOverflowMenu');
  });

  it('person search/picker results use PersonCard compact', () => {
    const picker = readFileSync(pickerPath, 'utf8');
    expect(picker).toContain('PersonCard');
    expect(picker).toContain('size="compact"');
    expect(picker).toContain('data-person-search-results');
    expect(picker).toContain('onSelect');

    const dialog = readFileSync(dialogPath, 'utf8');
    expect(dialog).toContain('PersonCard');
    expect(dialog).toContain('size="compact"');
    expect(dialog).toContain('data-person-search-results');
  });

  it('contributor browser uses PersonCard compact', () => {
    const contrib = readFileSync(contributorPath, 'utf8');
    expect(contrib).toContain('PersonCard');
    expect(contrib).toContain('size="compact"');
    expect(contrib).toContain('toPersonCardModels');
    expect(contrib).toContain('data-person-search-results');
  });

  it('usePeople maps via toPersonCardModels (no page-level mapping)', () => {
    const hook = readFileSync(hookPath, 'utf8');
    expect(hook).toContain('toPersonCardModels');
    expect(hook).toContain('personCards');
    expect(hook).toContain('pickerCardModels');
  });
});

describe('BUILD-018 no parallel person card components', () => {
  it('no second person card implementation files', () => {
    const files = walkTsx(join(root, 'components'));
    const suspect = files.filter((f) => {
      const base = f.split('/').pop() ?? '';
      if (base === 'PersonCard.tsx') return false;
      return /person[-_]?card/i.test(base);
    });
    expect(suspect).toEqual([]);
  });
});
