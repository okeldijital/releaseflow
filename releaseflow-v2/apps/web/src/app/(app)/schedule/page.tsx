'use client';

/**
 * BUILD-220F — Legacy /schedule → /calendar/schedule (query preserved).
 * Operational UI lives in schedule-view.tsx, embedded by CalendarModule
 * and Releases → Schedule.
 */

import { LegacyCalendarRedirect } from '@/app/(app)/calendar/_components/legacy-calendar-redirect';

export default function ScheduleListRedirectPage() {
  return <LegacyCalendarRedirect fromPath="/schedule" />;
}
