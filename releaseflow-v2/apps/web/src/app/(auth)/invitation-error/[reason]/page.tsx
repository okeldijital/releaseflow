'use client';

import { useParams } from 'next/navigation';
import Link from 'next/link';

const ERROR_CONTENT: Record<string, { title: string; description: string }> = {
  expired: {
    title: 'Invitation Expired',
    description: 'This invitation link has expired. Please ask the person who invited you to send a new one.',
  },
  revoked: {
    title: 'Invitation Revoked',
    description: 'This invitation has been revoked by the sender. Please ask them to send a new invitation if needed.',
  },
  'already-accepted': {
    title: 'Already Accepted',
    description: 'This invitation has already been used. If you believe this is a mistake, please contact the organization administrator.',
  },
  'email-mismatch': {
    title: 'Email Mismatch',
    description: 'This invitation was sent to a different email address. Please sign in with the email address that received the invitation, or ask the sender to invite your current email address.',
  },
  'invalid-token': {
    title: 'Invalid Invitation',
    description: 'This invitation link is not valid. Please check that you have the correct link, or ask the sender for a new one.',
  },
  'organization-not-found': {
    title: 'Organization Not Found',
    description: 'The organization associated with this invitation no longer exists. Please contact the person who invited you.',
  },
};

export default function InvitationErrorPage() {
  const params = useParams();
  const reason = (params?.reason as string) ?? 'invalid-token';
  const content = (ERROR_CONTENT[reason] ?? ERROR_CONTENT['invalid-token'])!;

  return (
    <div className="text-center">
      <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-warning-500/15">
        <svg className="h-8 w-8 text-warning-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
        </svg>
      </div>

      <h1 className="text-display-md font-semibold tracking-tight text-text-100">{content.title}</h1>
      <p className="mt-3 text-sm text-text-400 leading-relaxed">{content.description}</p>

      <div className="mt-8 space-y-3">
        <Link
          href="/sign-in"
          className="block w-full rounded-xl bg-primary-500 py-3 text-sm font-medium text-surface-0 hover:bg-primary-400 transition-colors"
        >
          Go to Sign In
        </Link>
        <Link
          href="/"
          className="block w-full rounded-xl border border-surface-700 bg-surface-800 py-3 text-sm font-medium text-text-300 hover:bg-surface-700 transition-colors"
        >
          Back to Home
        </Link>
      </div>
    </div>
  );
}
