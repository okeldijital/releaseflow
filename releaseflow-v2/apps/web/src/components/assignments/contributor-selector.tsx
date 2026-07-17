'use client';

/**
 * AW-001 — Searchable contributor selector with workload + invite.
 */

import { useCallback, useEffect, useMemo, useState } from 'react';
import { fetchPeople } from '@/lib/person-service';
import type { PersonRecord } from '@/lib/people-repository';
import { fetchAssignments } from '@/lib/assignment-service';
import type { AssignmentRecord } from '@/lib/assignment-service';
import { getMembershipsByOrg } from '@/lib/organization-repository';
import type { MembershipRecord } from '@/lib/organization-repository';
import { invitePerson } from '@/lib/invitation-service';
import { getOrganization } from '@/lib/organization-repository';
import { resolvePersonSecurity } from '@/lib/people-platform';
import { Avatar, Button, Input } from '@releaseflow/ui';
import { toast } from '@/stores/toast-store';
import { useAuth } from '@/contexts/auth-context';

const OPEN = new Set(['assigned', 'accepted', 'in_progress', 'review', 'blocked']);

function weekEnd(): Date {
  const d = new Date();
  d.setDate(d.getDate() + (7 - d.getDay()));
  d.setHours(23, 59, 59, 999);
  return d;
}

function toDate(value: unknown): Date | null {
  if (!value) return null;
  if (value instanceof Date) return value;
  if (typeof value === 'object' && value && 'toDate' in value) {
    return (value as { toDate: () => Date }).toDate();
  }
  if (typeof value === 'object' && value && 'seconds' in value) {
    return new Date((value as { seconds: number }).seconds * 1000);
  }
  return null;
}

export interface ContributorSelection {
  person: PersonRecord;
  activeCount: number;
  dueThisWeek: number;
  platformRoleLabel: string;
}

interface ContributorSelectorProps {
  organizationId: string;
  value: ContributorSelection | null;
  onChange: (selection: ContributorSelection | null) => void;
}

export function ContributorSelector({ organizationId, value, onChange }: ContributorSelectorProps) {
  const { user } = useAuth();
  const [people, setPeople] = useState<PersonRecord[]>([]);
  const [assignments, setAssignments] = useState<AssignmentRecord[]>([]);
  const [memberships, setMemberships] = useState<MembershipRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [inviteMode, setInviteMode] = useState(false);
  const [inviteName, setInviteName] = useState('');
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviting, setInviting] = useState(false);

  const reload = useCallback(async () => {
    if (!organizationId) return;
    setLoading(true);
    try {
      const [p, a, m] = await Promise.all([
        fetchPeople(organizationId),
        fetchAssignments(organizationId, { includeArchived: false }).catch(() => [] as AssignmentRecord[]),
        getMembershipsByOrg(organizationId).catch(() => [] as MembershipRecord[]),
      ]);
      setPeople(p.filter((x) => x.status === 'active'));
      setAssignments(a);
      setMemberships(m);
    } finally {
      setLoading(false);
    }
  }, [organizationId]);

  useEffect(() => {
    void reload();
  }, [reload]);

  const workload = useMemo(() => {
    const map = new Map<string, { active: number; dueWeek: number }>();
    const end = weekEnd();
    for (const a of assignments) {
      if (!OPEN.has(a.status)) continue;
      const cur = map.get(a.assigneeId) ?? { active: 0, dueWeek: 0 };
      cur.active += 1;
      const due = toDate(a.dueDate);
      if (due && due <= end) cur.dueWeek += 1;
      map.set(a.assigneeId, cur);
    }
    return map;
  }, [assignments]);

  const ranked = useMemo(() => {
    const q = query.trim().toLowerCase();
    let list = people;
    if (q) {
      list = list.filter(
        (p) =>
          p.displayName.toLowerCase().includes(q)
          || p.email.toLowerCase().includes(q),
      );
    }
    return [...list].sort((a, b) => {
      const wa = workload.get(a.id)?.active ?? 0;
      const wb = workload.get(b.id)?.active ?? 0;
      if (wa !== wb) return wa - wb;
      return a.displayName.localeCompare(b.displayName);
    });
  }, [people, query, workload]);

  function selectPerson(p: PersonRecord) {
    const w = workload.get(p.id) ?? { active: 0, dueWeek: 0 };
    const sec = resolvePersonSecurity(p, memberships, []);
    onChange({
      person: p,
      activeCount: w.active,
      dueThisWeek: w.dueWeek,
      platformRoleLabel: sec.platformRoleLabel,
    });
    setOpen(false);
    setQuery('');
    setInviteMode(false);
  }

  async function handleInvite() {
    if (!user || !organizationId || !inviteEmail.trim()) return;
    setInviting(true);
    try {
      const org = await getOrganization(organizationId);
      await invitePerson({
        organizationId,
        organizationName: org?.name ?? '',
        inviteeName: inviteName.trim(),
        inviteeEmail: inviteEmail.trim(),
        platformRole: 'collaborator',
        professionalRole: '',
        invitedByUserId: user.uid,
        invitedByName: user.displayName || user.email?.split('@')[0] || 'Administrator',
      });
      toast.success('Invitation sent. They will appear here after accepting.');
      setInviteName('');
      setInviteEmail('');
      setInviteMode(false);
      await reload();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to send invitation');
    } finally {
      setInviting(false);
    }
  }

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-content-label">Contributor</label>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="w-full min-h-[48px] flex items-center gap-3 px-3 py-2.5 rounded-xl border border-surface-700/60 bg-surface-900 text-left hover:border-primary-500/40 transition-colors"
      >
        {value ? (
          <>
            <Avatar name={value.person.displayName} src={value.person.avatarUrl ?? undefined} size="sm" />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-surface-100 truncate">{value.person.displayName}</p>
              <p className="text-xs text-text-500 truncate">{value.platformRoleLabel}</p>
            </div>
          </>
        ) : (
          <span className="text-sm text-text-500">Search contributors…</span>
        )}
        <svg className="h-4 w-4 text-text-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {value ? <ContributorContextCard selection={value} /> : null}

      {open ? (
        <div className="fixed inset-0 z-[60] flex flex-col sm:items-center sm:justify-center sm:p-4">
          <button type="button" className="absolute inset-0 bg-surface-950/70 backdrop-blur-sm" aria-label="Close" onClick={() => setOpen(false)} />
          <div className="relative z-10 flex flex-col w-full h-full sm:h-auto sm:max-h-[85vh] sm:max-w-lg bg-surface-900 sm:rounded-2xl border-0 sm:border border-surface-700 shadow-modal">
            <div className="flex items-center justify-between px-4 py-3 border-b border-surface-700/60 min-h-[56px]">
              <h3 className="text-base font-semibold text-surface-50">
                {inviteMode ? 'Invite Contributor' : 'Select Contributor'}
              </h3>
              <button type="button" onClick={() => setOpen(false)} className="min-h-[44px] min-w-[44px] text-text-400">
                ✕
              </button>
            </div>

            {inviteMode ? (
              <div className="p-4 space-y-4">
                <Input label="Name" value={inviteName} onChange={(e) => setInviteName(e.target.value)} placeholder="Collaborator name" />
                <Input label="Email" type="email" value={inviteEmail} onChange={(e) => setInviteEmail(e.target.value)} placeholder="email@example.com" required />
                <p className="text-xs text-text-500">
                  Invites with platform role Contributor. Contribution roles are set when assigning work.
                </p>
                <div className="flex gap-2">
                  <Button variant="ghost" onClick={() => setInviteMode(false)} className="min-h-[48px] flex-1">
                    Back
                  </Button>
                  <Button onClick={() => void handleInvite()} loading={inviting} disabled={!inviteEmail.trim()} className="min-h-[48px] flex-1">
                    Send Invitation
                  </Button>
                </div>
              </div>
            ) : (
              <>
                <div className="p-3 border-b border-surface-700/40">
                  <input
                    autoFocus
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Search contributors…"
                    className="w-full min-h-[48px] rounded-xl border border-surface-700 bg-surface-950 px-4 text-sm text-surface-100 placeholder:text-text-500 focus:outline-none focus:ring-2 focus:ring-primary-500/30"
                  />
                </div>
                <div className="flex-1 overflow-y-auto p-2">
                  {loading ? (
                    <p className="text-sm text-text-500 p-4">Loading…</p>
                  ) : ranked.length === 0 ? (
                    <p className="text-sm text-text-500 p-4">No active collaborators found.</p>
                  ) : (
                    ranked.map((p) => {
                      const w = workload.get(p.id) ?? { active: 0, dueWeek: 0 };
                      const sec = resolvePersonSecurity(p, memberships, []);
                      const overloaded = w.active >= 10;
                      return (
                        <button
                          key={p.id}
                          type="button"
                          onClick={() => selectPerson(p)}
                          className="w-full flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-surface-800 text-left min-h-[72px]"
                        >
                          <Avatar name={p.displayName} src={p.avatarUrl ?? undefined} size="md" />
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-medium text-surface-100 truncate">{p.displayName}</p>
                            <p className="text-xs text-text-500">
                              {sec.platformRoleLabel}
                              {w.active > 0 ? ` · ${w.active} active` : ' · Available'}
                            </p>
                            {overloaded ? (
                              <p className="text-xs text-warning-500 mt-0.5">
                                ⚠ Already has {w.active} active assignments
                              </p>
                            ) : null}
                          </div>
                        </button>
                      );
                    })
                  )}
                </div>
                <div className="p-3 border-t border-surface-700/60">
                  <button
                    type="button"
                    onClick={() => setInviteMode(true)}
                    className="w-full min-h-[48px] rounded-xl border border-dashed border-primary-500/40 text-sm font-medium text-primary-400 hover:bg-primary-500/10"
                  >
                    + Invite New Contributor
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}

export function ContributorContextCard({ selection }: { selection: ContributorSelection }) {
  const overloaded = selection.activeCount >= 10;
  return (
    <div className="flex items-start gap-3 rounded-xl border border-surface-700/50 bg-surface-950/50 p-3">
      <Avatar name={selection.person.displayName} src={selection.person.avatarUrl ?? undefined} size="md" />
      <div className="min-w-0">
        <p className="text-sm font-semibold text-primary-400 truncate">{selection.person.displayName}</p>
        <p className="text-xs text-text-500">{selection.platformRoleLabel}</p>
        <p className="text-xs text-text-400 mt-1">
          {selection.activeCount} active assignment{selection.activeCount === 1 ? '' : 's'}
          {selection.dueThisWeek > 0 ? ` · ${selection.dueThisWeek} due this week` : ''}
        </p>
        {overloaded ? (
          <p className="text-xs text-warning-500 mt-1">
            ⚠ Already has {selection.activeCount} active assignments.
          </p>
        ) : null}
      </div>
    </div>
  );
}
