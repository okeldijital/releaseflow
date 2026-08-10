'use client';

/**
 * BUILD-220F — Shared Calendar module presentation.
 *
 * Tabs: Schedule | Deadlines | Releases
 * Content reuses existing schedule projection UI (no second calendar system).
 *
 * Distinct from Releases → Schedule (/releases/schedule).
 */

import { usePathname, useRouter } from 'next/navigation';
import { ModulePage, PageTabs } from '@releaseflow/ui';
import { CALENDAR_PAGE_TABS } from '@/lib/navigation';
import { CalendarEmbedContext } from './calendar-embed-context';
import ScheduleView from '@/app/(app)/schedule/schedule-view';

export type CalendarTab = 'schedule' | 'deadlines' | 'releases';

export interface CalendarModuleProps {
  tab: CalendarTab;
}

export function CalendarModule({ tab }: CalendarModuleProps) {
  const pathname = usePathname() || '/calendar';
  const router = useRouter();

  const header = (
    <div>
      <h1 className="text-display-md font-semibold text-primary-400 tracking-tight">
        Calendar
      </h1>
      <p className="mt-1 text-sm text-text-400">
        Schedule, deadlines, and release dates across your organisation.
      </p>
    </div>
  );

  const tabs = (
    <PageTabs
      tabs={CALENDAR_PAGE_TABS}
      pathname={pathname}
      onNavigate={(href) => router.push(href)}
      aria-label="Calendar sections"
    />
  );

  const surface =
    tab === 'deadlines'
      ? 'deadlines'
      : tab === 'releases'
        ? 'releases'
        : 'assignments';

  return (
    <CalendarEmbedContext.Provider value={true}>
      <div className="page-transition" data-calendar-tab={tab}>
        <div className="mx-auto max-w-7xl px-5 sm:px-7 pt-8">
          <ModulePage header={header} tabs={tabs} />
        </div>
        <ScheduleView surface={surface} />
      </div>
    </CalendarEmbedContext.Provider>
  );
}
