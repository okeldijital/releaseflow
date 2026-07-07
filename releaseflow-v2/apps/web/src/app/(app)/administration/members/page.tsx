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
import { Button, EmptyState, LoadingState, Select, Badge, StatusBadge } from '@releaseflow/ui';

const ROLE_OPTIONS = [
  { value: 'owner', label: 'Owner' },
  { value: 'admin', label: 'Admin' },
  { value: 'release_manager', label: 'Release Manager' },
  { value: 'contributor', label: 'Contributor' },
];

function InfoDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [closing, setClosing] = useState(false);
  const dialogRef = useRef<HTMLDivElement>(null);
  const closeBtnRef = useRef<HTMLButtonElement>(null);

  const handleClose = useCallback(() => {
    setClosing(true);
    setTimeout(() => { setClosing(false); onClose(); }, 200);
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

  return (
    <div className={`fixed inset-0 z-50 flex items-center justify-center p-4 ${closing ? 'opacity-0 transition-opacity duration-200' : ''}`}>
      <div className={`fixed inset-0 bg-surface-900/40 backdrop-blur-sm ${closing ? 'opacity-0 transition-opacity duration-200' : 'animate-fade-in'}`} onClick={handleClose} aria-hidden="true" />
      <div ref={dialogRef} role="dialog" aria-modal="true" aria-labelledby="invite-title" className={`relative z-10 w-full max-w-sm bg-layer-2 dark:bg-surface-800 rounded-lg shadow-modal border border-surface-200 dark:border-surface-600 ${closing ? 'opacity-0 scale-95 transition-all duration-200' : 'animate-scale-in'}`}>
        <div className="px-6 pt-6 pb-4">
          <h2 id="invite-title" className="text-base font-semibold text-text-900 dark:text-text-100">Invite Members</h2>
          <p className="mt-3 text-sm text-text-500 dark:text-text-400 leading-relaxed">
            Invitation workflow is scheduled for Sprint XX. This screen is intentionally unavailable.
          </p>
          <p className="mt-2 text-xs text-text-400 dark:text-text-500">
            Please use the Organisations page to create or join an organisation until the invitation system is available.
          </p>
        </div>
        <div className="px-6 py-4 border-t border-surface-100 dark:border-surface-700">
          <button ref={closeBtnRef} type="button" onClick={handleClose} className="w-full h-10 px-4 text-sm font-medium text-text-700 dark:text-text-300 rounded-md border border-surface-200 dark:border-surface-600 bg-layer-2 dark:bg-surface-800 hover:bg-surface-50 dark:hover:bg-surface-700 transition-colors duration-100">
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

export default function AdministrationMembersPage() {
  const { user } = useAuth();
  const { activeOrgId } = useOrgStore();
  const { role, loading: roleLoading } = useRoleStore();
  const [members, setMembers] = useState<MembershipRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [infoOpen, setInfoOpen] = useState(false);

  useEffect(() => {
    if (!activeOrgId) { setLoading(false); return; }
    let cancelled = false;
    async function load() {
      const data = await getMembershipsByOrg(activeOrgId!);
      if (cancelled) return;
      setMembers(data);
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
        <Button variant="primary" size="sm" onClick={() => setInfoOpen(true)}>Invite</Button>
      </div>

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

      <InfoDialog open={infoOpen} onClose={() => setInfoOpen(false)} />
    </div>
  );
}
