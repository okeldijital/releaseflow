'use client';

import { useState, useEffect, useCallback } from 'react';
import { useOrgStore } from '@/stores/org-store';
import { fetchRelease, fetchReleasesByOrg } from '@/lib/release-service';
import type { ReleaseRecord } from '@/lib/release-repository';

interface UseReleaseResult {
  release: ReleaseRecord | null;
  loading: boolean;
  error: string | null;
  refresh: () => void;
}

interface UseReleasesResult {
  releases: ReleaseRecord[];
  loading: boolean;
  error: string | null;
  refresh: () => void;
}

export function useRelease(releaseId: string): UseReleaseResult {
  const { activeOrgId, orgVersion } = useOrgStore();
  const [release, setRelease] = useState<ReleaseRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchRelease(releaseId);
      if (data && activeOrgId && data.organizationId && data.organizationId !== activeOrgId) {
        setRelease(null);
        setError('Access denied');
      } else {
        setRelease(data);
        setError(null);
      }
    } catch (err) {
      setError('Failed to load release. Please try again.');
      if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') console.error('useRelease:', err);
    } finally {
      setLoading(false);
    }
  }, [releaseId, activeOrgId, orgVersion]);

  useEffect(() => { load(); }, [load]);

  return { release, loading, error, refresh: load };
}

export function useReleases(): UseReleasesResult {
  const { activeOrgId, orgVersion } = useOrgStore();
  const [releases, setReleases] = useState<ReleaseRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!activeOrgId) {
      setReleases([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const data = await fetchReleasesByOrg(activeOrgId);
      setReleases(data);
      setError(null);
    } catch (err) {
      setError('Failed to load releases. Please try again.');
      if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') console.error('useReleases:', err);
    } finally {
      setLoading(false);
    }
  }, [activeOrgId, orgVersion]);

  useEffect(() => { load(); }, [load]);

  return { releases, loading, error, refresh: load };
}
