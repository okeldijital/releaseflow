'use client';

/**
 * BUILD-220C — Shared Collaboration module presentation.
 *
 * Tabs: Assignments | Tasks | Inbox | People
 * Content reuses existing domain pages (no second collaboration system).
 */

import { usePathname, useRouter } from 'next/navigation';
import { ModulePage, PageTabs } from '@releaseflow/ui';
import { COLLABORATION_PAGE_TABS } from '@/lib/navigation';
import { CollaborationEmbedContext } from './collaboration-embed-context';
import AssignmentsView from '@/app/(app)/assignments/assignments-view';
import TasksView from '@/app/(app)/tasks/tasks-view';
import NotificationsView from '@/app/(app)/notifications/notifications-view';
import PeopleView from '@/app/(app)/people/people-view';

export type CollaborationTab = 'assignments' | 'tasks' | 'inbox' | 'people';

export interface CollaborationModuleProps {
  tab: CollaborationTab;
}

export function CollaborationModule({ tab }: CollaborationModuleProps) {
  const pathname = usePathname() || '/collaboration';
  const router = useRouter();

  const header = (
    <div>
      <h1 className="text-display-md font-semibold text-primary-400 tracking-tight">
        Collaboration
      </h1>
      <p className="mt-1 text-sm text-text-400">
        Assignments, tasks, inbox, and people for your organisation.
      </p>
    </div>
  );

  const tabs = (
    <PageTabs
      tabs={COLLABORATION_PAGE_TABS}
      pathname={pathname}
      onNavigate={(href) => router.push(href)}
      aria-label="Collaboration sections"
    />
  );

  return (
    <CollaborationEmbedContext.Provider value={true}>
      <div className="page-transition" data-collaboration-tab={tab}>
        <div className="mx-auto max-w-7xl px-5 sm:px-7 pt-8">
          <ModulePage header={header} tabs={tabs} />
        </div>
        {tab === 'assignments' ? <AssignmentsView /> : null}
        {tab === 'tasks' ? <TasksView /> : null}
        {tab === 'inbox' ? <NotificationsView /> : null}
        {tab === 'people' ? <PeopleView /> : null}
      </div>
    </CollaborationEmbedContext.Provider>
  );
}
