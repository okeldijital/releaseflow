'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useOrgStore } from '@/stores/org-store';
import { useAuth } from '@/contexts/auth-context';
import {
  invitePerson,
  expireStaleInvitations,
  fetchInvitationsByOrg,
  getInvitationLink,
} from '@/lib/invitation-service';
import type { InvitationRecord, PlatformRole } from '@/lib/invitation-service';
import { getOrganization } from '@/lib/organization-repository';

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

export interface InvitePersonInput {
  email: string;
  name: string;
  platformRole: PlatformRole;
  /**
   * @deprecated DOM-001 — contribution roles belong on assignments only.
   * Kept optional for backward-compatible call sites; always stored as empty.
   */
  professionalRole?: string;
}

export function useInvitePerson() {
  const [saving, setSaving] = useState(false);
  const { activeOrgId } = useOrgStore();
  const { user } = useAuth();

  const invite = useCallback(async (input: InvitePersonInput) => {
    if (!activeOrgId || !user?.uid) return null;
    setSaving(true);
    try {
      const org = await getOrganization(activeOrgId);
      const result = await invitePerson({
        organizationId: activeOrgId,
        organizationName: org?.name ?? '',
        inviteeName: input.name.trim(),
        inviteeEmail: input.email.trim(),
        platformRole: input.platformRole,
        // DOM-001: invitations collect platform role only.
        professionalRole: '',
        invitedByUserId: user.uid,
        invitedByName: user.displayName || user.email?.split('@')[0] || 'Administrator',
      });
      return result;
    } finally {
      setSaving(false);
    }
  }, [activeOrgId, user?.uid, user?.displayName, user?.email]);

  return { invite, saving, getInvitationLink };
}
