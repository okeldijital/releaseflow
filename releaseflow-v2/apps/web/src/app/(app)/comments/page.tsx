'use client';

/**
 * MUX-002.5 — Comments workspace (contextual, assignment-scoped).
 * Not a chat app: no private messaging, no "New Chat".
 */

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/contexts/auth-context';
import { useOrgStore } from '@/stores/org-store';
import { AuthorizationService } from '@/lib/auth/authorization-service';
import {
  loadCommentThreads,
  type AssignmentCommentThread,
} from '@/lib/assignment-comments-inbox';
import { EmptyState, LoadingState, Badge } from '@releaseflow/ui';
import { ArtworkPlaceholder } from '@/components/release/artwork-display';

function timeAgo(d: Date | null): string {
  if (!d) return '';
  const m = Math.floor((Date.now() - d.getTime()) / 60000);
  if (m < 1) return 'just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

export default function CommentsWorkspacePage() {
  const { user } = useAuth();
  const { activeOrgId } = useOrgStore();
  const [threads, setThreads] = useState<AssignmentCommentThread[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.uid || !activeOrgId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    const collab = AuthorizationService.isCollaboratorWorkspace();
    void loadCommentThreads({
      organizationId: activeOrgId,
      userId: user.uid,
      collaboratorOnly: collab,
    })
      .then(setThreads)
      .catch(() => setThreads([]))
      .finally(() => setLoading(false));
  }, [user?.uid, activeOrgId]);

  return (
    <div className="mx-auto max-w-lg md:max-w-2xl px-4 sm:px-5 py-5 sm:py-8 page-transition pb-8">
      <header className="mb-6">
        <h1 className="text-xl sm:text-2xl font-semibold text-content-primary tracking-tight">
          Comments
        </h1>
        <p className="text-sm text-content-secondary mt-1">
          Discussions stay attached to assignments — not a general chat.
        </p>
      </header>

      {loading ? (
        <LoadingState text="Loading conversations…" />
      ) : threads.length === 0 ? (
        <EmptyState
          title="No conversations yet"
          description="Comments appear here when you discuss work on an assignment."
        />
      ) : (
        <ul className="space-y-2" aria-label="Assignment conversations">
          {threads.map((t) => {
            const a = t.assignment;
            return (
              <li key={a.id}>
                <Link
                  href={`/assignments/${a.id}?tab=comments`}
                  className="
                    flex items-start gap-3 rounded-2xl border border-surface-700/60 bg-surface-900
                    px-3.5 py-3.5 min-h-[72px] hover:border-primary-500/40 active:scale-[0.99]
                    transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500/40
                  "
                >
                  <div className="shrink-0 h-12 w-12 rounded-xl bg-surface-800 overflow-hidden flex items-center justify-center">
                    <ArtworkPlaceholder title={a.title} size="sm" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-sm font-semibold text-content-primary truncate">
                        {a.title}
                      </p>
                      {t.unreadCount > 0 ? (
                        <Badge
                          label={`${t.unreadCount} unread`}
                          size="sm"
                          color="bg-primary-500/15 text-primary-400"
                        />
                      ) : a.status === 'completed' ? (
                        <span className="text-[11px] text-content-label shrink-0">Completed</span>
                      ) : null}
                    </div>
                    {a.role ? (
                      <p className="text-xs text-content-label mt-0.5 truncate">{a.role}</p>
                    ) : null}
                    {t.lastMessage ? (
                      <p className="text-xs text-content-secondary mt-1.5 line-clamp-2">
                        {t.lastAuthorName ? (
                          <span className="font-medium text-content-primary">{t.lastAuthorName}: </span>
                        ) : null}
                        {t.lastMessage}
                      </p>
                    ) : (
                      <p className="text-xs text-content-label mt-1.5">Start the discussion</p>
                    )}
                    {t.lastAt ? (
                      <p className="text-[11px] text-content-label mt-1">{timeAgo(t.lastAt)}</p>
                    ) : null}
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
