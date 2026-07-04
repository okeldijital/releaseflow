'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useOrgStore } from '@/stores/org-store';
import {
  fetchArtist, fetchArtists, fetchArtistReleases,
  fetchCreditsByArtist, fetchTrackTitle, checkArtistReadiness,
} from '@/lib/artist-service';
import type { ArtistRecord, TrackCreditRecord } from '@/lib/artist-repository';
import type { ArtistReadinessResult } from '@/lib/artist-service';
import { toArtistOptions, type ArtistOption } from '@/lib/artist-field-picker-logic';

export type { ArtistOption };

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
  const { activeOrgId, orgVersion } = useOrgStore();

  const load = useCallback(async (opts?: { silent?: boolean }) => {
    if (!activeOrgId) {
      setArtists([]);
      setLoading(false);
      return;
    }
    if (!opts?.silent) setLoading(true);
    try {
      const data = await fetchArtists(activeOrgId);
      setArtists(data);
    } catch {
      // silent
    } finally {
      if (!opts?.silent) setLoading(false);
    }
  }, [activeOrgId]);

  useEffect(() => { void load(); }, [load, orgVersion]);

  const artistOptions = useMemo(() => toArtistOptions(artists), [artists]);

  const onArtistCreated = useCallback((created: ArtistOption) => {
    setArtists((prev) => {
      if (prev.some((a) => a.id === created.id)) return prev;
      return [
        ...prev,
        {
          id: created.id,
          name: created.name,
          slug: created.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''),
          artistType: 'original_artist',
          organizationId: activeOrgId,
          status: 'active',
          createdAt: null,
        },
      ];
    });
    void load({ silent: true });
  }, [load, activeOrgId]);

  return { artists, artistOptions, loading, refresh: load, onArtistCreated };
}
