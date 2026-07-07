'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useOrgStore } from '@/stores/org-store';
import {
  fetchArtist, fetchArtists, fetchArtistReleases,
  fetchCreditsByArtist, fetchTrackTitle, checkArtistReadiness,
  fetchArtistUsage, validateDeleteArtist,
} from '@/lib/artist-service';
import type { ArtistRecord, TrackCreditRecord, ArtistUsageResult, ArtistReferenceSummary } from '@/lib/artist-service';
import type { ArtistReadinessResult } from '@/lib/artist-service';
import { toArtistOptions, type ArtistOption } from '@/lib/artist-field-picker-logic';

export type { ArtistOption };

export function useArtist(artistId: string | undefined) {
  const { activeOrgId } = useOrgStore();
  const [artist, setArtist] = useState<ArtistRecord | null>(null);
  const [releases, setReleases] = useState<{ id: string; title: string; role: string; status: string; releaseType: string }[]>([]);
  const [credits, setCredits] = useState<(TrackCreditRecord & { trackTitle?: string })[]>([]);
  const [readiness, setReadiness] = useState<ArtistReadinessResult | null>(null);
  const [usage, setUsage] = useState<ArtistUsageResult | null>(null);
  const [deleteCheck, setDeleteCheck] = useState<{ allowed: boolean; references: ArtistReferenceSummary } | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!artistId || !activeOrgId) { setLoading(false); return; }
    setLoading(true);
    try {
      const [a, relData, credData, r, u, d] = await Promise.all([
        fetchArtist(activeOrgId, artistId),
        fetchArtistReleases(artistId),
        fetchCreditsByArtist(artistId),
        checkArtistReadiness(activeOrgId, artistId),
        fetchArtistUsage(activeOrgId, artistId),
        validateDeleteArtist(activeOrgId, artistId),
      ]);
      setArtist(a);
      setReadiness(r);
      setReleases(relData);
      setUsage(u);
      setDeleteCheck(d);
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

  return { artist, releases, credits, readiness, usage, deleteCheck, loading, refresh: load };
}

export function useArtists() {
  const [artists, setArtists] = useState<ArtistRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const { activeOrgId, orgVersion, artistCatalogueVersion, bumpArtistCatalogue } = useOrgStore();

  const load = useCallback(async (opts?: { silent?: boolean }) => {
    if (!activeOrgId) {
      setArtists([]);
      setLoading(false);
      return;
    }
    if (!opts?.silent) setLoading(true);
    try {
      const data = await fetchArtists(activeOrgId, true);
      setArtists(data);
    } catch {
      setArtists([]);
    } finally {
      if (!opts?.silent) setLoading(false);
    }
  }, [activeOrgId]);

  useEffect(() => { void load(); }, [load, orgVersion, artistCatalogueVersion]);

  const filteredArtists = useMemo(() => {
    if (statusFilter === 'all') return artists;
    return artists.filter((a) => a.status === statusFilter);
  }, [artists, statusFilter]);

  const artistOptions = useMemo(() => toArtistOptions(artists.filter((a) => a.status !== 'archived')), [artists]);

  const onArtistCreated = useCallback((_created: ArtistOption) => {
    bumpArtistCatalogue();
    void load({ silent: true });
  }, [bumpArtistCatalogue, load]);

  return {
    artists: filteredArtists,
    allArtists: artists,
    artistOptions,
    loading,
    refresh: load,
    onArtistCreated,
    bumpArtistCatalogue,
    statusFilter,
    setStatusFilter,
  };
}
