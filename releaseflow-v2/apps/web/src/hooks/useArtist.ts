'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  fetchArtist, fetchArtists, fetchArtistReleases,
  fetchCreditsByArtist, fetchTrackTitle, checkArtistReadiness,
} from '@/lib/artist-service';
import type { ArtistRecord, TrackCreditRecord } from '@/lib/artist-repository';
import type { ArtistReadinessResult } from '@/lib/artist-service';

export function useArtist(artistId: string | undefined) {
  const [artist, setArtist] = useState<ArtistRecord | null>(null);
  const [releases, setReleases] = useState<{ id: string; title: string; role: string; status: string; releaseType: string }[]>([]);
  const [credits, setCredits] = useState<(TrackCreditRecord & { trackTitle?: string })[]>([]);
  const [readiness, setReadiness] = useState<ArtistReadinessResult | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!artistId) { setLoading(false); return; }
    setLoading(true);
    try {
      const [a, relData, credData, r] = await Promise.all([
        fetchArtist(artistId),
        fetchArtistReleases(artistId),
        fetchCreditsByArtist(artistId),
        checkArtistReadiness(artistId),
      ]);
      setArtist(a);
      setReadiness(r);
      setReleases(relData);
      const credsWithTitles: (TrackCreditRecord & { trackTitle?: string })[] = [...credData];
      await Promise.all(credsWithTitles.map(async (c) => {
        const title = await fetchTrackTitle(c.trackId);
        if (title) c.trackTitle = title;
      }));
      setCredits(credsWithTitles);
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, [artistId]);

  useEffect(() => { load(); }, [load]);

  return { artist, releases, credits, readiness, loading, refresh: load };
}

export function useArtists() {
  const [artists, setArtists] = useState<ArtistRecord[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchArtists();
      setArtists(data);
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  return { artists, loading, refresh: load };
}
