'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useOrgStore } from '@/stores/org-store';
import { useAuth } from '@/contexts/auth-context';
import {
  invitePerson,
  cancelInvitation,
  resendPersonInvitation,
  expireStaleInvitations,
  fetchPendingInvitations,
  fetchInvitationsByOrg,
} from '@/lib/invitation-service';
import type { InvitationRecord } from '@/lib/invitation-service';

export function useInvitations() {
  const [invitations, setInvitations] = useState<InvitationRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const { activeOrgId } = useOrgStore();

  const load = useCallback(async () => {
    if (!activeOrgId) {
      setInvitations([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      await expireStaleInvitations(activeOrgId);
      const data = await fetchInvitationsByOrg(activeOrgId);
      setInvitations(data);
    } catch {
      setInvitations([]);
    } finally {
      setLoading(false);
    }
  }, [activeOrgId]);

  useEffect(() => { void load(); }, [load]);

  const pendingInvitations = useMemo(() => invitations.filter((i) => i.status === 'pending'), [invitations]);

  return {
    invitations,
    pendingInvitations,
    loading,
    refresh: load,
  };
}

export function useInvitePerson() {
  const [saving, setSaving] = useState(false);
  const { activeOrgId } = useOrgStore();
  const { user } = useAuth();

  const invite = useCallback(async (email: string, roleId: string) => {
    if (!activeOrgId || !user?.uid) return null;
    setSaving(true);
    try {
      const result = await invitePerson({
        organizationId: activeOrgId,
        email: email.trim(),
        inviterId: user.uid,
        roleId: roleId.trim() || 'contributor',
      });
      return result;
    } finally {
      setSaving(false);
    }
  }, [activeOrgId, user?.uid]);

  return { invite, saving };
}
