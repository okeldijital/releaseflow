'use client';

/**
 * BUILD-302B — Persistent feedback trigger for the authenticated shell.
 *
 * Floating control using existing Button + Tooltip + Icon styling.
 * Opens FeedbackPanel (Modal composition). No page-by-page mounting.
 */

import { useMemo, useState } from 'react';
import { usePathname } from 'next/navigation';
import { Button, Tooltip } from '@releaseflow/ui';
import { useAuth } from '@/contexts/auth-context';
import { useOrgStore } from '@/stores/org-store';
import {
  resolveFeedbackContext,
  type FeedbackEntityHints,
} from '@/lib/feedback';
import { FeedbackPanel } from './feedback-panel';

export interface FeedbackTriggerProps {
  /** Optional entity IDs the application already knows for the current page. */
  entityHints?: FeedbackEntityHints;
}

function ChatBubbleIcon() {
  return (
    <svg
      className="h-5 w-5"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.75}
        d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.043 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
      />
    </svg>
  );
}

export function FeedbackTrigger({ entityHints }: FeedbackTriggerProps = {}) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname() || '/';
  const { user } = useAuth();
  const { activeOrgId } = useOrgStore();

  const auth = useMemo(() => {
    if (!user?.uid || !activeOrgId) return null;
    return { userId: user.uid, organisationId: activeOrgId };
  }, [user?.uid, activeOrgId]);

  const context = useMemo(
    () => resolveFeedbackContext(pathname, entityHints),
    [pathname, entityHints],
  );

  // Only show when authenticated session + active org exist (shell already requires auth).
  if (!auth) return null;

  return (
    <>
      <div
        className="fixed z-40 bottom-[calc(5rem+env(safe-area-inset-bottom))] right-4 lg:bottom-6 lg:right-6"
        data-testid="feedback-trigger-host"
      >
        <Tooltip content="Send feedback" position="left" delay={150}>
          <Button
            type="button"
            variant="secondary"
            size="md"
            aria-label="Send feedback"
            aria-haspopup="dialog"
            aria-expanded={open}
            onClick={() => setOpen(true)}
            className="!rounded-full !h-12 !w-12 !p-0 shadow-raised border border-surface-200"
            icon={<ChatBubbleIcon />}
          />
        </Tooltip>
      </div>

      <FeedbackPanel
        open={open}
        onClose={() => setOpen(false)}
        pathname={pathname}
        auth={auth}
        entityHints={entityHints}
        context={context}
      />
    </>
  );
}
