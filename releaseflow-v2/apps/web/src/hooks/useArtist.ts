'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useOrgStore } from '@/stores/org-store';
import {
  fetchArtist, fetchArtists, fetchArtistReleases,
  fetchCreditsByArtist, fetchTrackTitle,
  validateDeleteArtist,
  toArtistCardModels,
} from '@/lib/artist-service';
import type { ArtistCardModel } from '@/lib/artist-service';
import { getDiscography } from '@/lib/artist-discography-service';
import type { DiscographySummary } from '@/lib/artist-discography-service';
import { getTracksByArtist } from '@/lib/track-artist-repository';
import type { TrackArtistRecord } from '@/lib/track-artist-repository';
import { fetchActivityByEntity } from '@/lib/workflow-service';
import type { ActivityEventRecord } from '@/lib/activity-service';
import type { ArtistRecord, TrackCreditRecord, ArtistReferenceSummary } from '@/lib/artist-service';
import { toArtistOptions, type ArtistOption } from '@/lib/artist-field-picker-logic';

export type { ArtistOption, ArtistCardModel };

export interface ArtistTrackLink extends TrackArtistRecord {
  trackTitle?: string;
}

export function useArtist(artistId: string | undefined) {
  const { activeOrgId, orgVersion } = useOrgStore();
  const [artist, setArtist] = useState<ArtistRecord | null>(null);
  const [releases, setReleases] = useState<{ id: string; title: string; role: string; status: string; releaseType: string }[]>([]);
  const [credits, setCredits] = useState<(TrackCreditRecord & { trackTitle?: string })[]>([]);
  const [tracks, setTracks] = useState<ArtistTrackLink[]>([]);
  const [deleteCheck, setDeleteCheck] = useState<{ allowed: boolean; references: ArtistReferenceSummary } | null>(null);
  const [discography, setDiscography] = useState<DiscographySummary | null>(null);
  const [activities, setActivities] = useState<ActivityEventRecord[]>([]);
  const [activitiesLoading, setActivitiesLoading] = useState(true);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [forbidden, setForbidden] = useState(false);

  const load = useCallback(async () => {
    if (!artistId || !activeOrgId) {
      setLoading(false);
      setArtist(null);
      setError(null);
      setForbidden(false);
      return;
    }
    setLoading(true);
    setError(null);
    setForbidden(false);
    try {
      const a = await fetchArtist(activeOrgId, artistId);
      if (!a) {
        setArtist(null);
        setLoading(false);
        return;
      }
      if (a.organizationId && a.organizationId !== activeOrgId) {
        setForbidden(true);
        setArtist(null);
        setLoading(false);
        return;
      }
      setArtist(a);

      const [relResult, credResult, trackResult, d, discResult] = await Promise.allSettled([
        fetchArtistReleases(artistId),
        fetchCreditsByArtist(artistId),
        getTracksByArtist(artistId),
        validateDeleteArtist(activeOrgId, artistId),
        getDiscography(activeOrgId, artistId),
      ]);

      if (relResult.status === 'fulfilled') setReleases(relResult.value);

      if (credResult.status === 'fulfilled') {
        const creds = credResult.value;
        const titled = await Promise.allSettled(
          creds.map(async (c) => {
            const title = await fetchTrackTitle(c.trackId);
            return { ...c, trackTitle: title ?? undefined };
          }),
        );
        const creditsArr = titled.filter((r) => r.status === 'fulfilled');
        setCredits(creditsArr.map((r) => r.value as TrackCreditRecord & { trackTitle?: string }));
      }

      if (trackResult.status === 'fulfilled') {
        const trackLinks = trackResult.value;
        const titled = await Promise.allSettled(
          trackLinks.map(async (t) => {
            const title = await fetchTrackTitle(t.trackId);
            return { ...t, trackTitle: title ?? undefined };
          }),
        );
        const tracksArr = titled.filter((r) => r.status === 'fulfilled');
        setTracks(tracksArr.map((r) => r.value as ArtistTrackLink));
      }

      if (d.status === 'fulfilled') setDeleteCheck(d.value);
      if (discResult.status === 'fulfilled') setDiscography(discResult.value);

      setActivitiesLoading(true);
      fetchActivityByEntity(activeOrgId, 'artist', artistId)
        .then((acts) => setActivities(acts))
        .catch(() => setActivities([]))
        .finally(() => setActivitiesLoading(false));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load artist');
    } finally {
      setLoading(false);
    }
  }, [artistId, activeOrgId, orgVersion]);

  useEffect(() => { void load(); }, [load]);

  return {
    artist, releases, credits, tracks, deleteCheck,
    discography, activities, activitiesLoading, loading, error, forbidden, refresh: load,
  };
}

export function useArtists() {
  const [artists, setArtists] = useState<ArtistRecord[]>([]);
  const [cardModels, setCardModels] = useState<ArtistCardModel[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const { activeOrgId, orgVersion, artistCatalogueVersion, bumpArtistCatalogue } = useOrgStore();

  const load = useCallback(async (opts?: { silent?: boolean }) => {
    if (!activeOrgId) {
      setArtists([]);
      setCardModels([]);
      setLoading(false);
      return;
    }
    if (!opts?.silent) setLoading(true);
    try {
      const data = await fetchArtists(activeOrgId, true);
      setArtists(data);
      // BUILD-016 — single mapper path (batch counts + media URLs)
      const models = await toArtistCardModels(activeOrgId, data);
      setCardModels(models);
    } catch {
      setArtists([]);
      setCardModels([]);
    } finally {
      if (!opts?.silent) setLoading(false);
    }
  }, [activeOrgId]);

  useEffect(() => { void load(); }, [load, orgVersion, artistCatalogueVersion]);

  const filteredArtists = useMemo(() => {
    if (statusFilter === 'all') return artists;
    return artists.filter((a) => a.status === statusFilter);
  }, [artists, statusFilter]);

  const filteredCardModels = useMemo(() => {
    if (statusFilter === 'all') return cardModels;
    return cardModels.filter((a) => a.status === statusFilter);
  }, [cardModels, statusFilter]);

  const artistOptions = useMemo(
    () =>
      toArtistOptions(
        artists
          .filter((a) => a.status !== 'archived')
          .map((a) => {
            const model = cardModels.find((m) => m.id === a.id);
            return {
              ...a,
              // Prefer media-pipeline URL from the card model
              imageUrl: model?.image ?? a.imageUrl,
            };
          }),
      ),
    [artists, cardModels],
  );

  /** Active (non-archived) card models for pickers / search. */
  const pickerCardModels = useMemo(
    () => cardModels.filter((a) => a.status !== 'archived'),
    [cardModels],
  );

  const onArtistCreated = useCallback((_created: ArtistOption) => {
    bumpArtistCatalogue();
    void load({ silent: true });
  }, [bumpArtistCatalogue, load]);

  return {
    artists: filteredArtists,
    allArtists: artists,
    /** BUILD-016 — status-filtered catalogue cards */
    artistCards: filteredCardModels,
    allArtistCards: cardModels,
    pickerCardModels,
    artistOptions,
    loading,
    refresh: load,
    onArtistCreated,
    bumpArtistCatalogue,
    statusFilter,
    setStatusFilter,
  };
}
