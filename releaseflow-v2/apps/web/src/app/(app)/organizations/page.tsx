'use client';

import { useState, useEffect, FormEvent } from 'react';
import { useAuth } from '@/contexts/auth-context';
import {
  getOrganizationsByUser, getPendingMemberships, createOrganization,
  acceptMembership, removeMembership, getMembershipsByOrg, updateMembershipRole,
} from '@/lib/organization-repository';
import type { OrganizationRecord, MembershipRecord } from '@/lib/organization-repository';
import { Button, Card, Input, EmptyState, LoadingState } from '@releaseflow/ui';

export default function OrganizationsPage() {
  const { user } = useAuth();
  const [orgs, setOrgs] = useState<(OrganizationRecord & { memberCount?: number })[]>([]);
  const [invites, setInvites] = useState<(MembershipRecord & { orgName?: string })[]>([]);
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    async function load() {
      const [orgData, inviteData] = await Promise.all([
        getOrganizationsByUser(user!.uid),
        getPendingMemberships(user!.uid),
      ]);
      if (cancelled) return;
      setOrgs(orgData.map((o) => ({ ...o, memberCount: undefined })));
      setInvites(inviteData);
      setLoading(false);
    }
    load();
    return () => { cancelled = true; };
  }, [user]);

  function generateSlug(value: string) {
    return value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  }

  async function handleCreate(e: FormEvent) {
    e.preventDefault();
    if (!name.trim() || !user) return;
    const org = await createOrganization(name.trim(), slug || generateSlug(name), user.uid);
    setName('');
    setSlug('');
    setOrgs((prev) => [...prev, org]);
  }

  async function handleAccept(membershipId: string) {
    await acceptMembership(membershipId);
    setInvites((prev) => prev.filter((i) => i.id !== membershipId));
  }

  async function handleDecline(membershipId: string) {
    await removeMembership(membershipId);
    setInvites((prev) => prev.filter((i) => i.id !== membershipId));
  }

  if (loading) {
    return <div className="flex items-center justify-center py-20"><LoadingState /></div>;
  }

  return (
    <div className="mx-auto max-w-4xl px-6 py-8">
      <h1 className="text-2xl font-bold text-text-900 mb-8">Organizations</h1>

      <Card padding="lg" className="mb-8">
        <h2 className="text-sm font-semibold text-text-900 mb-4">Create Organization</h2>
        <form onSubmit={handleCreate} className="flex gap-3 items-end">
          <Input label="Name" type="text" value={name} onChange={(e) => { setName(e.target.value); setSlug(generateSlug(e.target.value)); }} required placeholder="Organization name" />
          <div className="shrink-0"><Button type="submit" variant="primary" disabled={!name.trim()}>Create</Button></div>
        </form>
      </Card>

      {invites.length > 0 && (
        <Card padding="lg" className="mb-8">
          <h2 className="text-sm font-semibold text-text-900 mb-4">Pending Invitations ({invites.length})</h2>
          <div className="space-y-3">
            {invites.map((inv) => (
              <div key={inv.id} className="flex items-center justify-between border border-surface-200 rounded-lg px-4 py-3">
                <div><p className="text-sm font-medium text-text-900">{inv.orgName ?? inv.organizationId}</p><p className="text-xs text-text-500">{inv.roleId}</p></div>
                <div className="flex gap-2"><Button size="sm" variant="primary" onClick={() => handleAccept(inv.id)}>Accept</Button><Button size="sm" variant="outline" onClick={() => handleDecline(inv.id)}>Decline</Button></div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {orgs.length === 0 && invites.length === 0 ? (
        <EmptyState title="No organizations" description="Create or join an organization to get started." />
      ) : (
        <div className="space-y-3">
          {orgs.map((org) => (
            <Card key={org.id} padding="md" hover clickable>
              <div className="flex items-center justify-between">
                <div><p className="font-medium text-text-900">{org.name}</p><p className="text-xs text-text-500">{org.slug}</p></div>
                <span className="text-xs text-text-400">Active</span>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
