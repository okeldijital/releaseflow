'use client';

/**
 * BUILD-302B — Feedback panel composition.
 *
 * Uses existing Modal + TextArea + Button. Collects message only;
 * context is application-generated and non-editable.
 */

import { useEffect, useId, useRef, useState } from 'react';
import { Modal, TextArea, Button } from '@releaseflow/ui';
import {
  formatFeedbackContextDisplay,
  type FeedbackContextDisplay,
} from '@/lib/feedback/feedback-context-display';
import {
  isFeedbackMessageReady,
  sendFeedbackFromUi,
} from '@/lib/feedback/feedback-submission';
import type { FeedbackAuthContext, FeedbackContext } from '@/lib/feedback';
import type { FeedbackEntityHints } from '@/lib/feedback';
import { toast } from '@/stores/toast-store';

export type FeedbackPanelSubmissionState = 'idle' | 'submitting' | 'success' | 'error';

export interface FeedbackPanelProps {
  open: boolean;
  onClose: () => void;
  pathname: string;
  auth: FeedbackAuthContext | null;
  /** Optional entity IDs already known to the application for this route. */
  entityHints?: FeedbackEntityHints;
  /** Pre-resolved context for display (defaults to resolve inside send). */
  context?: FeedbackContext;
  /** Display lines override (tests); otherwise derived from context. */
  contextDisplay?: FeedbackContextDisplay;
}

export function FeedbackPanel({
  open,
  onClose,
  pathname,
  auth,
  entityHints,
  context,
  contextDisplay: contextDisplayProp,
}: FeedbackPanelProps) {
  const [message, setMessage] = useState('');
  const [submissionState, setSubmissionState] =
    useState<FeedbackPanelSubmissionState>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const submittingRef = useRef(false);
  const errorId = useId();

  const display =
    contextDisplayProp
    ?? (context ? formatFeedbackContextDisplay(context) : null);

  // Fresh form when reopening after close (preferred convention).
  useEffect(() => {
    if (open) {
      setMessage('');
      setSubmissionState('idle');
      setErrorMessage(null);
      submittingRef.current = false;
    }
  }, [open]);

  const canSend =
    isFeedbackMessageReady(message)
    && submissionState !== 'submitting'
    && Boolean(auth?.userId && auth?.organisationId);

  async function handleSend() {
    if (!canSend || !auth || submittingRef.current) return;
    submittingRef.current = true;
    setSubmissionState('submitting');
    setErrorMessage(null);

    const result = await sendFeedbackFromUi({
      message,
      pathname,
      auth,
      entityHints,
    });

    if (result.ok) {
      // BUILD-302C — distinguish full success vs saved-but-email-failed
      if (result.emailFailed) {
        setSubmissionState('success');
        toast.warning(
          'Your feedback was saved, but we couldn\'t send the notification. Please try again.',
        );
        setMessage('');
        submittingRef.current = false;
        onClose();
        return;
      }

      setSubmissionState('success');
      toast.success('Feedback sent. Thank you.');
      setMessage('');
      submittingRef.current = false;
      onClose();
      return;
    }

    // Persistence (or validation) failure — do not claim success
    setSubmissionState('error');
    setErrorMessage(result.error);
    toast.error('Could not send feedback', result.error);
    submittingRef.current = false;
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Send Feedback"
      size="sm"
      footer={(
        <>
          <Button
            type="button"
            variant="tertiary"
            size="md"
            disabled={submissionState === 'submitting'}
            onClick={onClose}
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="primary"
            size="md"
            loading={submissionState === 'submitting'}
            disabled={!canSend}
            onClick={() => void handleSend()}
            aria-label="Send feedback"
          >
            Send
          </Button>
        </>
      )}
    >
      {display ? (
        <div
          className="mb-4 rounded-md border border-surface-200 bg-layer-3 px-3 py-2"
          data-testid="feedback-context-indicator"
        >
          <p className="text-xs font-medium text-content-label">{display.label}</p>
          <ul className="mt-1 space-y-0.5">
            {display.lines.map((line) => (
              <li key={line} className="text-sm text-content-primary">
                {line}
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      <TextArea
        id="feedback-message"
        label="What would you like to tell us?"
        placeholder="Type your feedback..."
        rows={4}
        resize={false}
        value={message}
        disabled={submissionState === 'submitting'}
        onChange={(e) => setMessage(e.target.value)}
        error={errorMessage ?? undefined}
        aria-describedby={errorMessage ? errorId : undefined}
      />

      {errorMessage ? (
        <p id={errorId} className="sr-only" role="alert">
          {errorMessage}
        </p>
      ) : null}
    </Modal>
  );
}
