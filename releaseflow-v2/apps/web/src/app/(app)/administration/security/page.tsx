'use client';

import { useState, useEffect } from 'react';
import { useOrgStore } from '@/stores/org-store';
import { getMembershipsByOrg } from '@/lib/organization-repository';
import type { MembershipRecord } from '@/lib/organization-repository';
import { Card, LoadingState, EmptyState, Badge, StatusBadge } from '@releaseflow/ui';

export default function AdministrationSecurityPage() {
  const { activeOrgId } = useOrgStore();
  const [members, setMembers] = useState<MembershipRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!activeOrgId) {
      setLoading(false);
      return;
    }
    let cancelled = false;
    getMembershipsByOrg(activeOrgId).then((data) => {
      if (cancelled) return;
      setMembers(data);
      setLoading(false);
    });
    return () => { cancelled = true; };
  }, [activeOrgId]);

  if (!activeOrgId) {
    return (
      <div className="mx-auto max-w-4xl px-5 sm:px-7 py-8 page-transition">
        <div className="mb-8">
          <p className="text-[1.75rem] font-semibold text-text-900 tracking-tight">Security</p>
          <p className="text-sm text-text-500 mt-1">Monitor access, sessions, and permissions</p>
        </div>
        <EmptyState title="No organization selected" description="Select an organization to view security settings." />
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <LoadingState />
      </div>
    );
  }

  const roleCounts = members.reduce<Record<string, number>>((acc, m) => {
    acc[m.roleId] = (acc[m.roleId] || 0) + 1;
    return acc;
  }, {});

  return (
    <div className="mx-auto max-w-4xl px-5 sm:px-7 py-8 page-transition">
      <div className="mb-8">
        <p className="text-[1.75rem] font-semibold text-text-900 tracking-tight">Security</p>
        <p className="text-sm text-text-500 mt-1">Monitor access, sessions, and permissions</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2 mb-8">
        <Card padding="md" className="border border-surface-200/80">
          <p className="font-semibold text-text-900 mb-4">Active Sessions</p>
          <p className="text-sm text-text-400">Session monitoring coming in v1.3</p>
        </Card>

        <Card padding="md" className="border border-surface-200/80">
          <p className="font-semibold text-text-900 mb-4">API Keys</p>
          <p className="text-sm text-text-400">API key management coming in v1.3</p>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2 mb-8">
        <Card padding="md" className="border border-surface-200/80">
          <p className="font-semibold text-text-900 mb-4">Recent Sign-ins</p>
          <p className="text-sm text-text-400">Sign-in history coming in v1.3</p>
        </Card>

        <Card padding="md" className="border border-surface-200/80">
          <p className="font-semibold text-text-900 mb-4">Permission Review</p>
          {Object.keys(roleCounts).length > 0 ? (
            <div className="space-y-2">
              {Object.entries(roleCounts).map(([role, count]) => (
                <div key={role} className="flex items-center justify-between">
                  <Badge label={role === 'release_manager' ? 'Release Manager' : role} />
                  <span className="text-sm text-text-500">{count} member{count !== 1 ? 's' : ''}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-text-400">No members found</p>
          )}
        </Card>
      </div>

      <Card padding="md" className="border border-surface-200/80">
        <p className="font-semibold text-text-900 mb-4">Organization Access</p>
        {members.length > 0 ? (
          <div className="space-y-1.5">
            {members.map((m) => (
              <div key={m.id} className="flex items-center justify-between rounded-lg border border-surface-200/80 bg-layer-2 px-4 py-2.5">
                <div className="flex items-center gap-3 min-w-0">
                  <p className="text-sm font-medium text-text-900 truncate">{m.userId.slice(0, 8)}&hellip;</p>
                  <StatusBadge status={m.status} />
                </div>
                <Badge label={m.roleId === 'release_manager' ? 'Release Manager' : m.roleId} />
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-text-400">No members found</p>
        )}
      </Card>
    </div>
  );
}
