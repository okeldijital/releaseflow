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
  it('uses the studio wordmark at sign-in and in the workspace shell', () => {
    for (const surface of ['app/(auth)/layout.tsx', 'app/(app)/layout.tsx']) {
      expect(read(surface)).toContain('<StudioWordmark');
    }
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
