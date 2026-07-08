'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { useOrgStore } from '@/stores/org-store';
import { useRoleStore } from '@/stores/role-store';
import {
  getMembershipsByOrg,
  updateMembershipRole,
  removeMembership,
} from '@/lib/organization-repository';
import type { MembershipRecord } from '@/lib/organization-repository';
import { inviteUser } from '@/lib/invitation-service';
import { fetchPendingInvitations } from '@/lib/invitation-service';
import type { InvitationRecord } from '@/lib/invitation-service';
import { Button, EmptyState, LoadingState, Select, Badge, StatusBadge, Input } from '@releaseflow/ui';

const ROLE_OPTIONS = [
  { value: 'owner', label: 'Owner' },
  { value: 'admin', label: 'Admin' },
  { value: 'release_manager', label: 'Release Manager' },
  { value: 'contributor', label: 'Contributor' },
];

function InviteDialog({ open, onClose, orgName }: { open: boolean; onClose: () => void; orgName: string }) {
  const { user } = useAuth();
  const { activeOrgId } = useOrgStore();
  const [closing, setClosing] = useState(false);
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('contributor');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const dialogRef = useRef<HTMLDivElement>(null);
  const closeBtnRef = useRef<HTMLButtonElement>(null);

  const handleClose = useCallback(() => {
    setClosing(true);
    setTimeout(() => { setClosing(false); setEmail(''); setRole('contributor'); setError(''); setSuccess(''); onClose(); }, 200);
  }, [onClose]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { handleClose(); return; }
      if (e.key === 'Tab' && dialogRef.current) {
        const els = dialogRef.current.querySelectorAll<HTMLElement>('button,[href],input,select,textarea,[tabindex]:not([tabindex="-1"])');
        if (!els.length) return;
        const first = els[0]!;
        const last = els[els.length - 1]!;
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
      }
    };
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    setTimeout(() => closeBtnRef.current?.focus(), 0);
    return () => { document.removeEventListener('keydown', onKey); document.body.style.overflow = ''; };
  }, [open, handleClose]);

  useEffect(() => () => { document.body.style.overflow = ''; }, []);

  if (!open && !closing) return null;

  const handleInvite = async () => {
    if (!email.trim()) { setError('Email is required'); return; }
    if (!user || !activeOrgId) return;

    setSending(true);
    setError('');
    setSuccess('');

    try {
      await inviteUser({
        organizationId: activeOrgId,
        email: email.trim(),
        inviterId: user.uid,
        inviterName: user.displayName || user.email || 'A user',
        roleId: role,
        orgName,
        roleName: ROLE_OPTIONS.find((r) => r.value === role)?.label || role,
      });
      setSuccess(`Invitation sent to ${email.trim()}`);
      setEmail('');
      setTimeout(() => handleClose(), 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send invitation');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className={`fixed inset-0 z-50 flex items-center justify-center p-4 ${closing ? 'opacity-0 transition-opacity duration-200' : ''}`}>
      <div className={`fixed inset-0 bg-surface-900/40 backdrop-blur-sm ${closing ? 'opacity-0 transition-opacity duration-200' : 'animate-fade-in'}`} onClick={handleClose} aria-hidden="true" />
      <div ref={dialogRef} role="dialog" aria-modal="true" aria-labelledby="invite-title" className={`relative z-10 w-full max-w-sm bg-layer-2 dark:bg-surface-800 rounded-lg shadow-modal border border-surface-200 dark:border-surface-600 ${closing ? 'opacity-0 scale-95 transition-all duration-200' : 'animate-scale-in'}`}>
        <div className="px-6 pt-6 pb-4">
          <h2 id="invite-title" className="text-base font-semibold text-text-900 dark:text-text-100">Invite Members</h2>
          <p className="mt-3 text-sm text-text-500 dark:text-text-400">Send an invitation to join <strong>{orgName}</strong>.</p>
        </div>
        <div className="px-6 pb-4 space-y-4">
          <div>
            <label className="block text-xs font-medium text-text-500 mb-1">Email</label>
            <Input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="colleague@example.com" type="email" />
          </div>
          <div>
            <label className="block text-xs font-medium text-text-500 mb-1">Role</label>
            <Select options={ROLE_OPTIONS} value={role} onChange={setRole} />
          </div>
          {error && <p className="text-xs text-red-400">{error}</p>}
          {success && <p className="text-xs text-emerald-400">{success}</p>}
        </div>
        <div className="px-6 py-4 border-t border-surface-100 dark:border-surface-700 flex items-center gap-3">
          <button ref={closeBtnRef} type="button" onClick={handleClose} className="flex-1 h-10 px-4 text-sm font-medium text-text-700 dark:text-text-300 rounded-md border border-surface-200 dark:border-surface-600 bg-layer-2 dark:bg-surface-800 hover:bg-surface-50 dark:hover:bg-surface-700 transition-colors">
            Cancel
          </button>
          <button type="button" onClick={handleInvite} disabled={sending} className="flex-1 h-10 px-4 text-sm font-medium text-surface-50 rounded-md bg-primary-500 hover:bg-primary-600 disabled:opacity-50 transition-colors">
            {sending ? 'Sending...' : 'Send Invitation'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function AdministrationMembersPage() {
  const { user } = useAuth();
  const { activeOrgId } = useOrgStore();
  const [orgName, setOrgName] = useState('Organization');
  const { role, loading: roleLoading } = useRoleStore();
  const [members, setMembers] = useState<MembershipRecord[]>([]);
  const [invitations, setInvitations] = useState<InvitationRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [inviteOpen, setInviteOpen] = useState(false);

  useEffect(() => {
    if (!activeOrgId) { setLoading(false); return; }
    let cancelled = false;
    async function load() {
      const [{ getDoc, doc }, { getDb }] = await Promise.all([
        import('firebase/firestore'),
        import('@/lib/firebase'),
      ]);
      const db = getDb();
      if (db) {
        const snap = await getDoc(doc(db, 'organizations', activeOrgId!));
        if (snap.exists()) setOrgName((snap.data() as Record<string, unknown>).name as string || 'Organization');
      }
      const [m, i] = await Promise.all([
        getMembershipsByOrg(activeOrgId!),
        fetchPendingInvitations(activeOrgId!),
      ]);
      if (cancelled) return;
      setMembers(m);
      setInvitations(i);
      setLoading(false);
    }
    load();
    return () => { cancelled = true; };
  }, [activeOrgId]);

  async function handleRoleChange(membershipId: string, newRole: string) {
    await updateMembershipRole(membershipId, newRole);
    setMembers((prev) => prev.map((m) => (m.id === membershipId ? { ...m, roleId: newRole } : m)));
  }

  async function handleRemove(membershipId: string) {
    await removeMembership(membershipId);
    setMembers((prev) => prev.filter((m) => m.id !== membershipId));
  }

  const isOwner = role === 'owner';
  const isAdminOrOwner = role === 'owner' || role === 'admin';

  if (!activeOrgId) {
    return (
      <div className="mx-auto max-w-4xl px-5 sm:px-7 py-8 page-transition">
        <div className="mb-8">
          <p className="text-display-md font-semibold text-text-900 tracking-tight">Members</p>
          <p className="text-sm text-text-500 mt-1">Manage members, roles, and permissions</p>
        </div>
        <EmptyState title="No organization selected" description="Select an organization to manage its members." />
      </div>
    );
  }

  if (loading || roleLoading) {
    return <div className="flex items-center justify-center py-32"><LoadingState /></div>;
  }

  return (
    <div className="mx-auto max-w-4xl px-5 sm:px-7 py-8 page-transition">
      <div className="mb-8 flex items-start justify-between">
        <div>
          <p className="text-display-md font-semibold text-text-900 tracking-tight">Members</p>
          <p className="text-sm text-text-500 mt-1">Manage members, roles, and permissions</p>
        </div>
        {isAdminOrOwner && (
          <Button variant="primary" size="sm" onClick={() => setInviteOpen(true)}>Invite</Button>
        )}
      </div>

      {invitations.length > 0 && (
        <div className="mb-8">
          <h3 className="text-sm font-semibold text-text-500 uppercase tracking-widest mb-3">Pending Invitations</h3>
          <div className="space-y-2">
            {invitations.map((inv) => (
              <div key={inv.id} className="flex items-center justify-between rounded-lg border border-amber-500/20 bg-amber-500/5 px-4 py-2.5">
                <div>
                  <p className="text-sm text-text-300">{inv.email}</p>
                  <p className="text-xs text-text-500">Invited {inv.createdAt ? new Date(typeof inv.createdAt === 'object' && 'toDate' in inv.createdAt ? (inv.createdAt as { toDate: () => Date }).toDate() : String(inv.createdAt)).toLocaleDateString() : 'recently'} &middot; Role: {inv.roleId}</p>
                </div>
                <span className="text-xs font-medium text-amber-400 px-2 py-1 rounded bg-amber-500/10">Pending</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {members.length === 0 ? (
        <EmptyState title="No members found" description="Invite team members to your organization." />
      ) : (
        <div className="space-y-1.5">
          {members.map((m) => (
            <div key={m.id} className="flex items-center justify-between rounded-xl border border-surface-200/80 bg-layer-2 px-4 py-3.5">
              <div className="flex items-center gap-3 min-w-0">
                <div>
                  <p className="text-sm font-medium text-text-900 truncate">{m.userId.slice(0, 8)}&hellip;</p>
                  <p className="text-xs text-text-400">{m.userId}</p>
                </div>
                <StatusBadge status={m.status} />
              </div>
              <div className="flex items-center gap-2 shrink-0">
                {isAdminOrOwner && m.userId !== user?.uid ? (
                  <Select
                    options={ROLE_OPTIONS.filter((r) => (r.value === 'owner' ? isOwner : true))}
                    value={m.roleId}
                    onChange={(v) => handleRoleChange(m.id, v)}
                    className="w-36"
                  />
                ) : (
                  <Badge label={m.roleId === 'release_manager' ? 'Release Manager' : m.roleId} />
                )}
                {isOwner && m.userId !== user?.uid && (
                  <Button variant="outline" size="sm" onClick={() => handleRemove(m.id)}>Remove</Button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <InviteDialog open={inviteOpen} onClose={() => setInviteOpen(false)} orgName={orgName || 'Organization'} />
    </div>
  );
}
