'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useInvitations, useInvitePerson } from '@/hooks/useInvitation';
import { cancelInvitation, resendPersonInvitation } from '@/lib/invitation-service';
import { Button, EmptyState, LoadingState, Input, ConfirmationDialog, Avatar } from '@releaseflow/ui';
import { DISCIPLINE_OPTIONS } from '@/lib/disciplines';
import { toast } from '@/stores/toast-store';

export default function InvitationsPage() {
  const { invitations, loading, refresh } = useInvitations();
  const { invite, saving } = useInvitePerson();
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteDiscipline, setInviteDiscipline] = useState('');
  const [customDiscipline, setCustomDiscipline] = useState('');
  const [cancelId, setCancelId] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  const effectiveDiscipline = inviteDiscipline === 'custom' ? customDiscipline.trim() : inviteDiscipline;

  async function handleInvite(e: React.FormEvent) {
    e.preventDefault();
    if (!inviteEmail.trim() || !effectiveDiscipline) return;
    const result = await invite(inviteEmail, effectiveDiscipline);
    if (result) {
      toast.success(`Invitation sent to ${inviteEmail}`);
      setInviteEmail('');
      setInviteDiscipline('');
      setCustomDiscipline('');
      await refresh();
    }
  }

  async function handleCancel() {
    if (!cancelId) return;
    setActionLoading(true);
    try {
      await cancelInvitation(cancelId, 'current-user', 'current-org');
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
    setActionLoading(true);
    try {
      await resendPersonInvitation(id, 'current-user', 'current-org');
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
        <div className="flex items-end gap-3">
          <div className="flex-1">
            <Input
              label="Email"
              type="email"
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
              placeholder="collaborator@example.com"
            />
          </div>
          <div className="w-48">
            <label className="block text-xs font-medium text-text-400 mb-1">Discipline</label>
            <select
              value={inviteDiscipline}
              onChange={(e) => setInviteDiscipline(e.target.value)}
              className="h-9 w-full rounded-md border border-surface-700/60 bg-surface-900 px-3 text-sm text-surface-100"
            >
              <option value="">Select discipline...</option>
              {DISCIPLINE_OPTIONS.map((d) => (
                <option key={d} value={d}>{d}</option>
              ))}
              <option value="custom">Custom...</option>
            </select>
          </div>
          <Button type="submit" size="sm" loading={saving} disabled={!inviteEmail.trim() || !effectiveDiscipline}>
            Send Invitation
          </Button>
        </div>
        {inviteDiscipline === 'custom' && (
          <div className="mt-3">
            <Input
              label="Custom Discipline"
              type="text"
              value={customDiscipline}
              onChange={(e) => setCustomDiscipline(e.target.value)}
              placeholder="e.g. Foley Artist"
            />
          </div>
        )}
      </form>

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
                  <Avatar name={inv.email} size="sm" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-primary-400 truncate">{inv.email}</p>
                  <p className="text-xs text-text-500">
                    {inv.discipline || '—'} &middot; Sent {formatDate(inv.createdAt)}
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
