'use client';

import { useState, useEffect, FormEvent } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { collection, query, where, getDocs, getDoc, doc, addDoc, updateDoc, deleteDoc, Timestamp } from 'firebase/firestore';
import { getDb } from '@/lib/firebase';
import type { Organization, Membership, Role } from '../types';

export default function OrganizationsPage() {
  const { user } = useAuth();
  const [orgs, setOrgs] = useState<Organization[]>([]);
  const [invites, setInvites] = useState<(Membership & { orgName?: string })[]>([]);
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [loading, setLoading] = useState(true);
  const [orgMembers, setOrgMembers] = useState<Record<string, Membership[]>>({});
  const [orgRoles, setOrgRoles] = useState<Record<string, Role[]>>({});
  const [expandedOrg, setExpandedOrg] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    const uid = user.uid;
    let cancelled = false;
    async function load() {
      const db = getDb();
      if (!db) return;
      const activeQ = query(collection(db, 'memberships'), where('userId', '==', uid), where('status', '==', 'active'));
      const pendingQ = query(collection(db, 'memberships'), where('userId', '==', uid), where('status', '==', 'pending'));
      const [activeSnap, pendingSnap] = await Promise.all([getDocs(activeQ), getDocs(pendingQ)]);
      if (cancelled) return;

      const orgData: Organization[] = [];
      for (const d of activeSnap.docs) {
        const membership = d.data() as Membership;
        const snap = await getDoc(doc(db, 'organizations', membership.organizationId));
        if (snap.exists()) orgData.push({ id: snap.id, ...snap.data() } as Organization);
      }
      if (!cancelled) setOrgs(orgData);

      const inviteData: (Membership & { orgName?: string })[] = [];
      for (const d of pendingSnap.docs) {
        const m = { id: d.id, ...d.data() } as Membership;
        const orgSnap = await getDoc(doc(db, 'organizations', m.organizationId));
        const orgName = orgSnap.exists() ? (orgSnap.data() as Organization).name : m.organizationId;
        inviteData.push({ ...m, orgName });
      }
      if (!cancelled) setInvites(inviteData);
      if (!cancelled) setLoading(false);
    }
    load();
    return () => { cancelled = true; };
  }, [user]);

  function generateSlug(value: string) {
    return value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  }

  async function handleCreate(e: FormEvent) {
    e.preventDefault();
    if (!user) return;
    const db = getDb();
    if (!db) return;
    const orgRef = await addDoc(collection(db, 'organizations'), {
      name, slug, ownerId: user.uid, createdAt: Timestamp.now(),
    });
    await addDoc(collection(db, 'memberships'), {
      organizationId: orgRef.id, userId: user.uid, roleId: 'owner', status: 'active', invitedBy: user.uid, createdAt: Timestamp.now(),
    });
    setName('');
    setSlug('');
    const snap = await getDoc(doc(db, 'organizations', orgRef.id));
    if (snap.exists()) setOrgs((prev) => [...prev, { id: snap.id, ...snap.data() } as Organization]);
  }

  async function handleAccept(membershipId: string) {
    const db = getDb();
    if (!db) return;
    await updateDoc(doc(db, 'memberships', membershipId), { status: 'active' });
    setInvites((prev) => prev.filter((i) => i.id !== membershipId));
    const m = invites.find((i) => i.id === membershipId);
    if (m) {
      const snap = await getDoc(doc(db, 'organizations', m.organizationId));
      if (snap.exists()) setOrgs((prev) => [...prev, { id: snap.id, ...snap.data() } as Organization]);
    }
  }

  async function handleDecline(membershipId: string) {
    const db = getDb();
    if (!db) return;
    await deleteDoc(doc(db, 'memberships', membershipId));
    setInvites((prev) => prev.filter((i) => i.id !== membershipId));
  }

  async function toggleExpand(orgId: string) {
    if (expandedOrg === orgId) { setExpandedOrg(null); return; }
    setExpandedOrg(orgId);
    if (!orgMembers[orgId]) {
      const db = getDb();
      if (!db) return;
      const [memSnap, roleSnap] = await Promise.all([
        getDocs(query(collection(db, 'memberships'), where('organizationId', '==', orgId))),
        getDocs(query(collection(db, 'roles'), where('organizationId', '==', orgId))),
      ]);
      setOrgMembers((prev) => ({ ...prev, [orgId]: memSnap.docs.map((d) => ({ id: d.id, ...d.data() }) as Membership) }));
      setOrgRoles((prev) => ({ ...prev, [orgId]: roleSnap.docs.map((d) => ({ id: d.id, ...d.data() }) as Role) }));
    }
  }

  async function handleRoleChange(membershipId: string, roleId: string) {
    const db = getDb();
    if (!db) return;
    await updateDoc(doc(db, 'memberships', membershipId), { roleId });
    setOrgMembers((prev) => {
      const updated = { ...prev };
      for (const oid of Object.keys(updated)) {
        updated[oid] = updated[oid]?.map((m) => m.id === membershipId ? { ...m, roleId } : m) ?? [];
      }
      return updated;
    });
  }

  if (loading) {
    return <div className="flex items-center justify-center py-20"><div className="h-8 w-8 animate-spin rounded-full border-4 border-zinc-300 border-t-zinc-800 dark:border-zinc-700 dark:border-t-zinc-200" /></div>;
  }

  return (
    <div className="mx-auto max-w-4xl px-6 py-8">
      <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50 mb-8">Organizations</h1>

      {invites.length > 0 && (
        <div className="mb-10 rounded-xl border border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-950 p-5">
          <h2 className="font-semibold text-blue-900 dark:text-blue-200 mb-3">Pending Invitations ({invites.length})</h2>
          <div className="space-y-2">
            {invites.map((invite) => (
              <div key={invite.id} className="flex items-center justify-between rounded-lg bg-white dark:bg-blue-900/30 px-4 py-3">
                <div className="text-sm text-blue-800 dark:text-blue-200">
                  Invited to <span className="font-medium">{invite.orgName ?? invite.organizationId}</span>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => handleAccept(invite.id)} className="rounded-md bg-blue-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-700">Accept</button>
                  <button onClick={() => handleDecline(invite.id)} className="rounded-md border border-blue-300 dark:border-blue-700 px-3 py-1.5 text-xs font-medium text-blue-700 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-900">Decline</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <form onSubmit={handleCreate} className="mb-10 flex gap-3 items-end">
        <div>
          <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Name</label>
          <input value={name} onChange={(e) => { setName(e.target.value); setSlug(generateSlug(e.target.value)); }}
            className="rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3 py-2 text-sm text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-900"
            placeholder="Organization name" required />
        </div>
        <div>
          <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Slug</label>
          <input value={slug} onChange={(e) => setSlug(e.target.value)}
            className="rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3 py-2 text-sm text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-900"
            placeholder="org-slug" required />
        </div>
        <button type="submit" className="rounded-lg bg-zinc-900 dark:bg-zinc-100 px-4 py-2 text-sm font-medium text-white dark:text-zinc-900 hover:bg-zinc-800 dark:hover:bg-zinc-200 transition-colors">Create</button>
      </form>

      {orgs.length === 0 ? (
        <div className="text-center py-16 rounded-xl border border-dashed border-zinc-300 dark:border-zinc-700">
          <p className="text-zinc-500 mb-1">No organizations yet.</p>
          <p className="text-sm text-zinc-400">Create one above to get started.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {orgs.map((org) => (
            <div key={org.id} className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 overflow-hidden">
              <button onClick={() => toggleExpand(org.id)}
                className="w-full flex items-center justify-between px-6 py-4 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors text-left">
                <div>
                  <h3 className="font-semibold text-zinc-900 dark:text-zinc-50">{org.name}</h3>
                  <p className="text-sm text-zinc-500 mt-0.5">{org.slug}</p>
                </div>
                <svg className={`w-5 h-5 text-zinc-400 transition-transform ${expandedOrg === org.id ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {expandedOrg === org.id && (
                <div className="border-t border-zinc-200 dark:border-zinc-800 px-6 py-4">
                  {(orgMembers[org.id]?.length ?? 0) === 0 ? (
                    <p className="text-sm text-zinc-500">No members yet.</p>
                  ) : (
                    <div className="space-y-2">
                      <h4 className="text-xs font-medium text-zinc-400 uppercase tracking-wider">Members</h4>
                      {orgMembers[org.id]?.map((member) => {
                        const memberRole = orgRoles[org.id]?.find((r) => r.id === member.roleId);
                        return (
                          <div key={member.id} className="flex items-center justify-between rounded-lg border border-zinc-100 dark:border-zinc-800 px-4 py-2.5">
                            <div className="flex items-center gap-3">
                              <div className="h-8 w-8 rounded-full bg-zinc-200 dark:bg-zinc-700 flex items-center justify-center text-xs font-medium text-zinc-600 dark:text-zinc-400">
                                {member.userId.slice(0, 2).toUpperCase()}
                              </div>
                              <div>
                                <p className="text-sm font-medium text-zinc-900 dark:text-zinc-50">{member.userId}</p>
                                <p className="text-xs text-zinc-400">{memberRole?.name ?? 'Unknown role'}</p>
                              </div>
                            </div>
                            <select value={member.roleId} onChange={(e) => handleRoleChange(member.id, e.target.value)}
                              className="rounded-md border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-2 py-1 text-xs text-zinc-700 dark:text-zinc-300 focus:outline-none focus:ring-2 focus:ring-zinc-900">
                              {orgRoles[org.id]?.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
                            </select>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
