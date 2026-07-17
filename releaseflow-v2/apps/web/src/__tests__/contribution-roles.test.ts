import { describe, expect, it } from 'vitest';
import {
  CONTRIBUTION_ROLES,
  templatesForContributionRole,
} from '@/lib/contribution-roles';

describe('AW-001 contribution roles', () => {
  it('exposes controlled contribution roles without platform roles', () => {
    expect(CONTRIBUTION_ROLES).toContain('Lyricist');
    expect(CONTRIBUTION_ROLES).toContain('Producer');
    expect(CONTRIBUTION_ROLES as readonly string[]).not.toContain('administrator');
    expect(CONTRIBUTION_ROLES as readonly string[]).not.toContain('collaborator');
  });

  it('suggests templates for known roles', () => {
    const lyricist = templatesForContributionRole('Lyricist');
    expect(lyricist.length).toBeGreaterThan(0);
    expect(lyricist[0]).toMatch(/lyric/i);
  });

  it('falls back for unknown roles', () => {
    const other = templatesForContributionRole('Something Custom');
    expect(other.length).toBeGreaterThan(0);
  });
});
