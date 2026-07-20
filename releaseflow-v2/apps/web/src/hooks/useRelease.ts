'use client';

import { useState, useEffect, useCallback } from 'react';
import { useOrgStore } from '@/stores/org-store';
import { useAuth } from '@/contexts/auth-context';
import { fetchRelease, fetchReleasesByOrg, fetchReleasesNeedingAttention, fetchContinueWorking, fetchUpcomingReleases, fetchRecentlyUpdated } from '@/lib/release-service';
import type { ReleaseQueryOptions } from '@/lib/release-repository';
import type { ReleaseRecord } from '@/lib/release-repository';

interface UseReleaseOptions extends ReleaseQueryOptions {
  sort?: ReleaseQueryOptions['sort'];
}

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

interface UseSectionResult<T> {
  data: T;
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

export function useReleases(options: UseReleaseOptions = {}): UseReleasesResult {
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
      const data = await fetchReleasesByOrg(activeOrgId, options);
      setReleases(data);
      setError(null);
    } catch (err) {
      setError('Failed to load releases. Please try again.');
      if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') console.error('useReleases:', err);
    } finally {
      setLoading(false);
    }
  }, [activeOrgId, orgVersion, options.lifecycle?.join(','), options.status?.join(','), options.search, options.sort]);

  useEffect(() => { load(); }, [load]);

  return { releases, loading, error, refresh: load };
}

export function useNeedsAttentionReleases(): UseSectionResult<ReleaseRecord[]> {
  const { activeOrgId, orgVersion } = useOrgStore();
  const { user } = useAuth();
  const [data, setData] = useState<ReleaseRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!activeOrgId) { setData([]); setLoading(false); return; }
    setLoading(true);
    try {
      const result = await fetchReleasesNeedingAttention(activeOrgId, user?.uid);
      setData(result);
      setError(null);
    } catch (err) {
      setError('Failed to load releases needing attention.');
      if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') console.error('useNeedsAttentionReleases:', err);
    } finally {
      setLoading(false);
    }
  }, [activeOrgId, orgVersion, user?.uid]);

  useEffect(() => { load(); }, [load]);

  return { data, loading, error, refresh: load };
}

export function useContinueWorking(): UseSectionResult<ReleaseRecord[]> {
  const { activeOrgId, orgVersion } = useOrgStore();
  const { user } = useAuth();
  const [data, setData] = useState<ReleaseRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!activeOrgId || !user?.uid) { setData([]); setLoading(false); return; }
    setLoading(true);
    try {
      const result = await fetchContinueWorking(activeOrgId, user.uid);
      setData(result);
      setError(null);
    } catch (err) {
      setError('Failed to load continue working releases.');
      if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') console.error('useContinueWorking:', err);
    } finally {
      setLoading(false);
    }
  }, [activeOrgId, orgVersion, user?.uid]);

  useEffect(() => { load(); }, [load]);

  return { data, loading, error, refresh: load };
}

export function useUpcomingReleases(withinDays = 30): UseSectionResult<ReleaseRecord[]> {
  const { activeOrgId, orgVersion } = useOrgStore();
  const [data, setData] = useState<ReleaseRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!activeOrgId) { setData([]); setLoading(false); return; }
    setLoading(true);
    try {
      const result = await fetchUpcomingReleases(activeOrgId, withinDays);
      setData(result);
      setError(null);
    } catch (err) {
      setError('Failed to load upcoming releases.');
      if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') console.error('useUpcomingReleases:', err);
    } finally {
      setLoading(false);
    }
  }, [activeOrgId, orgVersion, withinDays]);

  useEffect(() => { load(); }, [load]);

  return { data, loading, error, refresh: load };
}

export function useRecentlyUpdated(limit = 10): UseSectionResult<ReleaseRecord[]> {
  const { activeOrgId, orgVersion } = useOrgStore();
  const [data, setData] = useState<ReleaseRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!activeOrgId) { setData([]); setLoading(false); return; }
    setLoading(true);
    try {
      const result = await fetchRecentlyUpdated(activeOrgId, limit);
      setData(result);
      setError(null);
    } catch (err) {
      setError('Failed to load recently updated releases.');
      if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') console.error('useRecentlyUpdated:', err);
    } finally {
      setLoading(false);
    }
  }, [activeOrgId, orgVersion, limit]);

  useEffect(() => { load(); }, [load]);

  return { data, loading, error, refresh: load };
}
