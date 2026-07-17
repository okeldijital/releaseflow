/**
 * BRAND-001 — Global ReleaseFlow logo adoption
 */

import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const webRoot = join(__dirname, '..');
const repoWeb = join(__dirname, '../..');

function read(rel: string): string {
  return readFileSync(join(webRoot, rel), 'utf8');
}

describe('BRAND-001 canonical asset', () => {
  it('ReleaseFlow-Logo.svg exists under public/icons', () => {
    const path = join(repoWeb, 'public/icons/ReleaseFlow-Logo.svg');
    expect(existsSync(path)).toBe(true);
  });

  it('ReleaseFlowLogo component references canonical path only', () => {
    const src = read('components/branding/releaseflow-logo.tsx');
    expect(src).toContain("'/icons/ReleaseFlow-Logo.svg'");
    expect(src).toContain('export function ReleaseFlowLogo');
    expect(src).toContain('priority');
  });
});

describe('BRAND-001 adoption surfaces', () => {
  it('auth layout uses ReleaseFlowLogo without orange badge mark', () => {
    const src = read('app/(auth)/layout.tsx');
    expect(src).toContain('ReleaseFlowLogo');
    expect(src).not.toContain('bg-primary-500 shadow-[0_4px_24px');
    expect(src).not.toContain('M4 3h6.5c2.485');
  });

  it('collaborator home shows logo above greeting', () => {
    const src = read('app/(app)/home/page.tsx');
    expect(src).toContain('ReleaseFlowLogo');
    expect(src).toContain('width={88}');
    // logo block appears before greeting header structure
    const logoIdx = src.indexOf('ReleaseFlowLogo');
    const greetingIdx = src.indexOf('{greeting}');
    expect(logoIdx).toBeGreaterThan(-1);
    expect(greetingIdx).toBeGreaterThan(logoIdx);
  });

  it('onboarding uses OnboardingBrandBar', () => {
    expect(read('app/(onboarding)/onboarding/page.tsx')).toContain('OnboardingBrandBar');
    expect(read('app/(onboarding)/onboarding/company/page.tsx')).toContain('OnboardingBrandBar');
  });

  it('no legacy stylised R path remains in app sources', () => {
    // Sample critical branding files
    const files = [
      'app/(auth)/layout.tsx',
      'app/(app)/home/page.tsx',
      'app/invite/[token]/page.tsx',
      'app/select-organization/page.tsx',
      'components/branding/releaseflow-logo.tsx',
    ];
    for (const f of files) {
      expect(read(f)).not.toContain('M4 3h6.5c2.485');
    }
  });
});
