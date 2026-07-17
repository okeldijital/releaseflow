'use client';

/**
 * UX-001 — Human-readable assignment history.
 * Never renders Firebase UIDs, Person IDs, or raw storage details.
 */

import type { ActivityEventRecord } from '@/lib/activity-service';
import { humanizeAssignmentActivity } from '@/lib/assignment-activity-humanize';

function formatDateTime(d: unknown): string {
  if (!d) return '';
  if (d && typeof d === 'object' && 'toDate' in d) {
    const date = (d as { toDate: () => Date }).toDate();
    return date.toLocaleDateString(undefined, {
      month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit',
    });
  }
  if (typeof d === 'object' && d !== null && 'seconds' in d) {
    const date = new Date((d as { seconds: number }).seconds * 1000);
    return date.toLocaleDateString(undefined, {
      month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit',
    });
  }
  return '';
}

interface ActivityTimelineProps {
  activities: ActivityEventRecord[];
  actorNames: Map<string, string>;
  /** Optional map of person ids → display names for assignees mentioned in metadata */
  subjectNames?: Map<string, string>;
}

export function ActivityTimeline({
  activities,
  actorNames,
  subjectNames,
}: ActivityTimelineProps) {
  if (activities.length === 0) {
    return (
      <div className="text-center py-12" role="status">
        <p className="text-sm text-content-secondary">No activity yet.</p>
      </div>
    );
  }

  return (
    <div className="space-y-0" aria-label="Assignment history">
      {activities.map((act, i) => {
        const sentence = humanizeAssignmentActivity(act, actorNames, subjectNames);
        const isLast = i === activities.length - 1;
        const when = formatDateTime(act.createdAt);

        return (
          <div key={act.id} className="flex gap-3">
            <div className="flex flex-col items-center shrink-0">
              <div
                className="h-2.5 w-2.5 rounded-full bg-primary-500/70 mt-1.5 shrink-0"
                aria-hidden
              />
              {!isLast ? <div className="w-px flex-1 bg-surface-700/50 mt-1" aria-hidden /> : null}
            </div>
            <div className={`pb-5 min-w-0 flex-1 ${isLast ? 'pb-0' : ''}`}>
              <p className="text-sm text-content-primary leading-snug">{sentence}</p>
              {when ? (
                <p className="text-xs text-content-label mt-1">{when}</p>
              ) : null}
            </div>
          </div>
        );
      })}
    </div>
  );
}

export { humanizeAssignmentActivity } from '@/lib/assignment-activity-humanize';
