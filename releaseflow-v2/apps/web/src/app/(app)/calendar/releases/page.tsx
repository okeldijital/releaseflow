'use client';

import { CalendarModule } from '../_components/calendar-module';

/**
 * BUILD-220F — /calendar/releases
 * Distinct from /releases/schedule (release-specific schedule workspace).
 */
export default function CalendarReleasesPage() {
  return <CalendarModule tab="releases" />;
}
