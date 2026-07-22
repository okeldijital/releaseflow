'use client';

/**
 * BUILD-014B — Resolve user/person ids to Identity for list UIs.
 * Components must not look up avatars themselves beyond this hook / IdentityService.
 */

import { useEffect, useState } from 'react';
import {
  resolveIdentity,
  resolveIdentities,
  resolvePersonIdentity,
  type Identity,
} from '@/lib/identity-service';
import type { PersonRecord } from '@/lib/people-repository';

export function useIdentity(userId: string | null | undefined) {
  const [identity, setIdentity] = useState<Identity | null>(null);
  const [loading, setLoading] = useState(Boolean(userId));

  useEffect(() => {
    if (!userId) {
      setIdentity(null);
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    void resolveIdentity(userId).then((id) => {
      if (!cancelled) {
        setIdentity(id);
        setLoading(false);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [userId]);

  return { identity, loading };
}

export function useIdentities(userIds: string[]) {
  const key = userIds.filter(Boolean).sort().join(',');
  const [map, setMap] = useState<Map<string, Identity>>(new Map());
  const [loading, setLoading] = useState(userIds.length > 0);

  useEffect(() => {
    const ids = key ? key.split(',') : [];
    if (ids.length === 0) {
      setMap(new Map());
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    void resolveIdentities(ids).then((m) => {
      if (!cancelled) {
        setMap(m);
        setLoading(false);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [key]);

  return { identities: map, loading };
}

export function usePersonIdentity(
  person: Pick<PersonRecord, 'id' | 'userId' | 'displayName' | 'email' | 'avatarUrl'> | null | undefined,
) {
  const [identity, setIdentity] = useState<Identity | null>(null);

  useEffect(() => {
    if (!person) {
      setIdentity(null);
      return;
    }
    let cancelled = false;
    void resolvePersonIdentity(person).then((id) => {
      if (!cancelled) setIdentity(id);
    });
    return () => {
      cancelled = true;
    };
  }, [person?.id, person?.userId, person?.displayName, person?.email, person?.avatarUrl]);

  return identity;
}
