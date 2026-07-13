'use client';

import { useState } from 'react';
import { useInvitations, useInvitePerson } from '@/hooks/useInvitation';
import { cancelInvitation, resendPersonInvitation } from '@/lib/invitation-service';
import { Button, EmptyState, LoadingState, Input, ConfirmationDialog } from '@releaseflow/ui';
import { toast } from '@/stores/toast-store';

export default function InvitationsPage() {
  const { invitations, pendingInvitations, loading, refresh } = useInvitations();
  const { invite, saving } = useInvitePerson();
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('contributor');
  const [cancelId, setCancelId] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  async function handleInvite(e: React.FormEvent) {
    e.preventDefault();
    if (!inviteEmail.trim()) return;
    const result = await invite(inviteEmail, inviteRole);
    if (result) {
      toast.success(`Invitation sent to ${inviteEmail}`);
      setInviteEmail('');
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

  return (
    <div className="mx-auto max-w-4xl px-5 sm:px-7 py-8 page-transition">
      <div className="mb-8">
        <p className="text-display-md font-semibold text-primary-400 tracking-tight">Invitations</p>
        <p className="mt-1 text-sm text-text-400">Manage collaborator invitations.</p>
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
          <div className="w-40">
            <label className="block text-xs font-medium text-text-400 mb-1">Role</label>
            <select
              value={inviteRole}
              onChange={(e) => setInviteRole(e.target.value)}
              className="h-9 w-full rounded-md border border-surface-700/60 bg-surface-900 px-3 text-sm text-surface-100"
            >
              <option value="contributor">Contributor</option>
              <option value="release_manager">Release Manager</option>
              <option value="admin">Admin</option>
            </select>
          </div>
          <Button type="submit" size="sm" loading={saving} disabled={!inviteEmail.trim()}>
            Send Invitation
          </Button>
        </div>
      </form>

      {loading ? (
        <LoadingState />
      ) : invitations.length === 0 ? (
        <EmptyState title="No invitations" description="Invitations will appear here once sent." />
      ) : (
        <div className="space-y-2">
          {invitations.map((inv) => (
            <div key={inv.id} className="flex items-center justify-between rounded-xl border border-surface-200/80 bg-layer-2 px-4 py-3">
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-primary-400 truncate">{inv.email}</p>
                <p className="text-xs text-text-500">{inv.roleId} &middot; Sent {typeof inv.createdAt === 'object' && inv.createdAt && 'toDate' in inv.createdAt ? (inv.createdAt as { toDate: () => Date }).toDate().toLocaleDateString() : ''}</p>
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
