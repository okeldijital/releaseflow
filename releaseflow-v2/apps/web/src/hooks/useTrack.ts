'use client';

import { useState, useEffect, useCallback } from 'react';
import { useOrgStore } from '@/stores/org-store';
import { fetchTrack, fetchTracksByOrg } from '@/lib/track-service';
import type { TrackRecord } from '@/lib/track-repository';

interface UseTrackResult {
  track: TrackRecord | null;
  loading: boolean;
  error: string | null;
  refresh: () => void;
}

interface UseTracksResult {
  tracks: TrackRecord[];
  loading: boolean;
  error: string | null;
  refresh: () => void;
}

export function useTrack(trackId: string): UseTrackResult {
  const { activeOrgId, orgVersion } = useOrgStore();
  const [track, setTrack] = useState<TrackRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchTrack(trackId);
      if (data && activeOrgId && data.organizationId !== activeOrgId) {
        setTrack(null);
        setError('Access denied');
      } else {
        setTrack(data);
        setError(null);
      }
    } catch (err) {
      setError('Failed to load track. Please try again.');
      if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') console.error('useTrack:', err);
    } finally {
      setLoading(false);
    }
  }, [trackId, activeOrgId, orgVersion]);

  useEffect(() => { load(); }, [load]);

  return { track, loading, error, refresh: load };
}

export function useTracks(): UseTracksResult {
  const { activeOrgId, orgVersion } = useOrgStore();
  const [tracks, setTracks] = useState<TrackRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!activeOrgId) {
      setTracks([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const data = await fetchTracksByOrg(activeOrgId);
      setTracks(data);
      setError(null);
    } catch (err) {
      setError('Failed to load tracks. Please try again.');
      if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') console.error('useTracks:', err);
    } finally {
      setLoading(false);
    }
  }, [activeOrgId, orgVersion]);

  useEffect(() => { load(); }, [load]);

  return { tracks, loading, error, refresh: load };
}
