'use client';

import { useState, useEffect, useCallback } from 'react';
import { useOrgStore } from '@/stores/org-store';
import {
  fetchRightsHolders, fetchReleaseOwnerships, fetchTrackOwnerships,
  validateReleaseOwnership, validateTrackOwnership,
} from '@/lib/rights-service';
import type { RightsHolderRecord, ReleaseOwnershipRecord, TrackOwnershipRecord } from '@/lib/rights-repository';
import type { OwnershipValidation } from '@/lib/rights-service';

export function useRightsHolders() {
  const [holders, setHolders] = useState<RightsHolderRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const { activeOrgId, orgVersion } = useOrgStore();
  const load = useCallback(async () => {
    setLoading(true);
    try {
      setHolders(await fetchRightsHolders(activeOrgId ?? undefined));
    } catch { /* silent */ }
    finally { setLoading(false); }
  }, [activeOrgId]);
  useEffect(() => { load(); }, [load, orgVersion]);
  return { holders, loading, refresh: load };
}

export function useReleaseOwnership(releaseId: string | undefined) {
  const [ownerships, setOwnerships] = useState<ReleaseOwnershipRecord[]>([]);
  const [validation, setValidation] = useState<OwnershipValidation | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!releaseId) { setLoading(false); return; }
    setLoading(true);
    try {
      const [data, v] = await Promise.all([
        fetchReleaseOwnerships(releaseId),
        validateReleaseOwnership(releaseId),
      ]);
      setOwnerships(data);
      setValidation(v);
    } catch { /* silent */ }
    finally { setLoading(false); }
  }, [releaseId]);

  useEffect(() => { load(); }, [load]);

  return { ownerships, validation, loading, refresh: load };
}

export function useTrackOwnership(trackId: string | undefined) {
  const [ownerships, setOwnerships] = useState<TrackOwnershipRecord[]>([]);
  const [validation, setValidation] = useState<OwnershipValidation | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!trackId) { setLoading(false); return; }
    setLoading(true);
    try {
      const [data, v] = await Promise.all([
        fetchTrackOwnerships(trackId),
        validateTrackOwnership(trackId),
      ]);
      setOwnerships(data);
      setValidation(v);
    } catch { /* silent */ }
    finally { setLoading(false); }
  }, [trackId]);

  useEffect(() => { load(); }, [load]);

  return { ownerships, validation, loading, refresh: load };
}
