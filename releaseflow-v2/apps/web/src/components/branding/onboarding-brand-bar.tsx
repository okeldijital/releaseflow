'use client';

import { ReleaseFlowLogo } from './releaseflow-logo';

/** Fixed top brand for onboarding flows — understated, no badge. */
export function OnboardingBrandBar() {
  return (
    <div className="fixed top-0 left-0 right-0 flex items-center px-6 py-5 z-20 pointer-events-none">
      <ReleaseFlowLogo width={96} className="pointer-events-auto" />
    </div>
  );
}
