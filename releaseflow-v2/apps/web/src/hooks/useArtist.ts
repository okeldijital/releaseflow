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
  const { activeOrgId } = useOrgStore();
  const [artist, setArtist] = useState<ArtistRecord | null>(null);
  const [releases, setReleases] = useState<{ id: string; title: string; role: string; status: string; releaseType: string }[]>([]);
  const [credits, setCredits] = useState<(TrackCreditRecord & { trackTitle?: string })[]>([]);
  const [readiness, setReadiness] = useState<ArtistReadinessResult | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!artistId || !activeOrgId) { setLoading(false); return; }
    setLoading(true);
    try {
      const [a, relData, credData, r] = await Promise.all([
        fetchArtist(activeOrgId, artistId),
        fetchArtistReleases(artistId),
        fetchCreditsByArtist(artistId),
        checkArtistReadiness(activeOrgId, artistId),
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
  }, [artistId, activeOrgId]);

  useEffect(() => { void load(); }, [load]);

  return { artist, releases, credits, readiness, loading, refresh: load };
}

export function useArtists() {
  const [artists, setArtists] = useState<ArtistRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const { activeOrgId, orgVersion, artistCatalogueVersion, bumpArtistCatalogue } = useOrgStore();

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
      setArtists([]);
    } finally {
      if (!opts?.silent) setLoading(false);
    }
  }, [activeOrgId]);

  useEffect(() => { void load(); }, [load, orgVersion, artistCatalogueVersion]);

  const artistOptions = useMemo(() => toArtistOptions(artists), [artists]);

  const onArtistCreated = useCallback((_created: ArtistOption) => {
    bumpArtistCatalogue();
    void load({ silent: true });
  }, [bumpArtistCatalogue, load]);

  return { artists, artistOptions, loading, refresh: load, onArtistCreated, bumpArtistCatalogue };
}