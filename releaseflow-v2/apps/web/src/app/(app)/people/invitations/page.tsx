'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useInvitations, useInvitePerson, type InvitePersonInput } from '@/hooks/useInvitation';
import { cancelInvitation, resendPersonInvitation, getInvitationLink } from '@/lib/invitation-service';
import { PLATFORM_ROLE_OPTIONS, PLATFORM_ROLE_LABELS } from '@/lib/platform-roles';
import { DISCIPLINE_OPTIONS } from '@/lib/disciplines';
import { useAuth } from '@/contexts/auth-context';
import { useOrgStore } from '@/stores/org-store';
import { Button, EmptyState, LoadingState, Input, ConfirmationDialog, Avatar } from '@releaseflow/ui';
import { toast } from '@/stores/toast-store';

const INVITATION_EXPIRY_DAYS = 7;

export default function InvitationsPage() {
  const { invitations, loading, refresh } = useInvitations();
  const { invite, saving } = useInvitePerson();
  const { user } = useAuth();
  const { activeOrgId } = useOrgStore();
  const [inviteName, setInviteName] = useState('');
  const [inviteEmail, setInviteEmail] = useState('');
  const [invitePlatformRole, setInvitePlatformRole] = useState<string>('collaborator');
  const [inviteDiscipline, setInviteDiscipline] = useState('');
  const [customDiscipline, setCustomDiscipline] = useState('');
  const [cancelId, setCancelId] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [createdLink, setCreatedLink] = useState<string | null>(null);

  const effectiveDiscipline = inviteDiscipline === 'custom' ? customDiscipline.trim() : inviteDiscipline;

  async function handleInvite(e: React.FormEvent) {
    e.preventDefault();
    if (!inviteEmail.trim() || !effectiveDiscipline) return;
    const input: InvitePersonInput = {
      email: inviteEmail,
      name: inviteName,
      platformRole: invitePlatformRole as InvitePersonInput['platformRole'],
      professionalRole: effectiveDiscipline,
    };
    const result = await invite(input);
    if (result) {
      setCreatedLink(getInvitationLink(result.token));
      setInviteName('');
      setInviteEmail('');
      setInvitePlatformRole('collaborator');
      setInviteDiscipline('');
      setCustomDiscipline('');
      await refresh();
    }
  }

  async function handleCopy() {
    if (!createdLink) return;
    try {
      await navigator.clipboard.writeText(createdLink);
      toast.success('Invitation link copied.');
    } catch {
      toast.error('Could not copy link.');
    }
  }

  async function handleShare() {
    if (!createdLink) return;
    const shareData = {
      title: 'ReleaseFlow Invitation',
      text: 'You have been invited to collaborate on ReleaseFlow.',
      url: createdLink,
    };
    if (typeof navigator !== 'undefined' && typeof navigator.share === 'function') {
      try {
        await navigator.share(shareData);
        return;
      } catch {
        // User cancelled or share failed — fall through to copy fallback.
      }
    }
    try {
      await navigator.clipboard.writeText(createdLink);
      toast.success('Invitation link copied.');
    } catch {
      toast.error('Could not share link.');
    }
  }

  function closeSuccess() {
    setCreatedLink(null);
  }

  async function handleCancel() {
    if (!cancelId || !user?.uid || !activeOrgId) return;
    setActionLoading(true);
    try {
      await cancelInvitation(cancelId, user.uid, activeOrgId);
      toast.success('Invitation revoked');
      setCancelId(null);
      await refresh();
    } catch {
      toast.error('Failed to revoke invitation');
    } finally {
      setActionLoading(false);
    }
  }

  async function handleResend(id: string) {
    if (!user?.uid || !activeOrgId) return;
    setActionLoading(true);
    try {
      await resendPersonInvitation(id, user.uid, activeOrgId, { expiresInDays: INVITATION_EXPIRY_DAYS });
      toast.success('Invitation resent');
      await refresh();
    } catch {
      toast.error('Failed to resend invitation');
    } finally {
      setActionLoading(false);
    }
  }

  const statusLabel = (status: string) => {
    switch (status) {
      case 'pending': return 'Pending';
      case 'accepted': return 'Accepted';
      case 'expired': return 'Expired';
      case 'revoked': return 'Revoked';
      default: return status;
    }
  };

  const statusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-warning-500/10 text-warning-600';
      case 'accepted': return 'bg-success-500/10 text-success-600';
      case 'expired': return 'bg-surface-800 text-text-500';
      case 'revoked': return 'bg-danger-500/10 text-danger-600';
      default: return 'bg-surface-800 text-text-500';
    }
  };

  const formatDate = (value: unknown) => {
    if (typeof value === 'object' && value && 'toDate' in value) {
      return (value as { toDate: () => Date }).toDate().toLocaleDateString();
    }
    if (value instanceof Date) return value.toLocaleDateString();
    return '';
  };

  return (
    <div className="mx-auto max-w-4xl px-5 sm:px-7 py-8 page-transition">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <p className="text-display-md font-semibold text-primary-400 tracking-tight">Invite Collaborator</p>
          <p className="mt-1 text-sm text-text-400">Invite collaborators to work on your releases.</p>
        </div>
        <Link href="/people">
          <Button variant="secondary" size="sm">← Back</Button>
        </Link>
      </div>

      <form onSubmit={handleInvite} className="mb-8 rounded-xl border border-surface-200/80 bg-layer-2 p-4">
        <h3 className="text-sm font-semibold text-primary-400 mb-3">Invite by Email</h3>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div>
            <Input
              label="Name (optional)"
              type="text"
              value={inviteName}
              onChange={(e) => setInviteName(e.target.value)}
              placeholder="Collaborator name"
            />
          </div>
          <div>
            <Input
              label="Email"
              type="email"
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
              placeholder="collaborator@example.com"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-text-400 mb-1">Platform Role</label>
            <select
              value={invitePlatformRole}
              onChange={(e) => setInvitePlatformRole(e.target.value)}
              className="h-9 w-full rounded-md border border-surface-700/60 bg-surface-900 px-3 text-sm text-surface-100"
            >
              {PLATFORM_ROLE_OPTIONS.map((r) => (
                <option key={r} value={r}>{PLATFORM_ROLE_LABELS[r]}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-text-400 mb-1">Professional Role</label>
            <select
              value={inviteDiscipline}
              onChange={(e) => setInviteDiscipline(e.target.value)}
              className="h-9 w-full rounded-md border border-surface-700/60 bg-surface-900 px-3 text-sm text-surface-100"
            >
              <option value="">Select professional role...</option>
              {DISCIPLINE_OPTIONS.map((d) => (
                <option key={d} value={d}>{d}</option>
              ))}
              <option value="custom">Custom...</option>
            </select>
          </div>
        </div>
        {inviteDiscipline === 'custom' && (
          <div className="mt-3">
            <Input
              label="Custom Professional Role"
              type="text"
              value={customDiscipline}
              onChange={(e) => setCustomDiscipline(e.target.value)}
              placeholder="e.g. Foley Artist"
            />
          </div>
        )}
        <div className="mt-4">
          <Button
            type="submit"
            size="sm"
            loading={saving}
            disabled={!inviteEmail.trim() || !effectiveDiscipline || !invitePlatformRole}
          >
            Send Invitation
          </Button>
        </div>
      </form>

      {createdLink && (
        <div className="mb-8 rounded-xl border border-success-500/30 bg-success-500/5 p-5">
          <div className="flex items-center gap-2">
            <svg className="h-5 w-5 text-success-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <p className="text-sm font-semibold text-success-500">Invitation Created</p>
          </div>
          <p className="mt-1 text-xs text-text-400">✓ Email Sent</p>
          <p className="mt-3 text-xs font-medium text-text-400">Invitation Link</p>
          <p className="mt-1 break-all rounded-md border border-surface-700/60 bg-surface-900 px-3 py-2 text-xs text-text-500">
            {createdLink}
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <Button size="sm" variant="secondary" onClick={handleCopy}>Copy Link</Button>
            <Button size="sm" variant="secondary" onClick={handleShare}>Share Link</Button>
            <Button size="sm" variant="ghost" onClick={closeSuccess}>Done</Button>
          </div>
        </div>
      )}

      {loading ? (
        <LoadingState />
      ) : invitations.length === 0 ? (
        <EmptyState title="No pending invitations" description="Invite collaborators to begin assigning work." />
      ) : (
        <div className="space-y-2">
          {invitations.map((inv) => (
            <div key={inv.id} className="flex items-center justify-between rounded-xl border border-surface-200/80 bg-layer-2 px-4 py-3">
              <div className="flex items-center gap-3 min-w-0 flex-1">
                <div className="shrink-0">
                  <Avatar name={inv.inviteeEmail || inv.inviteeName} size="sm" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-primary-400 truncate">
                    {inv.inviteeName || inv.inviteeEmail}
                  </p>
                  <p className="text-xs text-text-500">
                    {inv.professionalRole || '—'} &middot; {PLATFORM_ROLE_LABELS[inv.platformRole] ?? inv.platformRole} &middot; Sent {formatDate(inv.createdAt)}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <span className={`text-xs px-2 py-0.5 rounded-full ${statusColor(inv.status)}`}>
                  {statusLabel(inv.status)}
                </span>
                {inv.status === 'pending' && (
                  <>
                    <Button size="sm" variant="ghost" onClick={() => handleResend(inv.id)} disabled={actionLoading}>
                      Resend
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => setCancelId(inv.id)} disabled={actionLoading}>
                      Cancel
                    </Button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <ConfirmationDialog
        open={!!cancelId}
        onClose={() => setCancelId(null)}
        onConfirm={handleCancel}
        title="Revoke Invitation"
        message="This will cancel the invitation. The person will no longer be able to accept it."
        confirmLabel="Revoke"
        variant="danger"
        loading={actionLoading}
      />
    </div>
  );
}
