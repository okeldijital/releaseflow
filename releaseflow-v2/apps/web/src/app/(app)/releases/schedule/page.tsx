'use client';

import { ReleasesModule } from '../_components/releases-module';

/**
 * BUILD-220B — /releases/schedule
 * Reuses the existing Schedule module (no second schedule system).
 */
export default function ReleasesSchedulePage() {
  return <ReleasesModule tab="schedule" />;
}
