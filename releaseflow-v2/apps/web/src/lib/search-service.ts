import { getAllReleases } from './release-repository';
import { getTracksByOrg } from './track-repository';
import { searchArtists } from './artist-repository';
import { searchPeople } from './people-repository';
import { getTasks } from './task-repository';
import type { SearchResult } from './search-types';

function normalizeQuery(q: string): string {
  return q.trim().replace(/\s+/g, ' ').toLowerCase();
}

function scoreMatch(value: string, normalizedQuery: string): number {
  const lower = value.toLowerCase();
  if (lower === normalizedQuery) return 3;
  if (lower.startsWith(normalizedQuery)) return 2;
  if (lower.includes(normalizedQuery)) return 1;
  return 0;
}

function sortResults(results: SearchResult[]): SearchResult[] {
  return results.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    return a.title.localeCompare(b.title);
  });
}

async function searchReleases(
  q: string,
  orgId: string,
): Promise<SearchResult[]> {
  const releases = await getAllReleases(orgId);
  const results: SearchResult[] = [];

  for (const r of releases) {
    const titleScore = scoreMatch(r.title, q);
    const catalogScore = r.catalogNumber ? scoreMatch(r.catalogNumber, q) : 0;
    const upcScore = r.upc ? scoreMatch(r.upc, q) : 0;
    const maxScore = Math.max(titleScore, catalogScore, upcScore);

    if (maxScore > 0) {
      results.push({
        type: 'release',
        id: r.id,
        title: r.title,
        subtitle: r.lifecycle === 'draft' ? 'Continue Editing' : 'Open Release',
        url: `/releases/${r.id}`,
        badge: r.releaseType,
        score: maxScore,
      });
    }
  }

  return results;
}

async function searchTracks(
  q: string,
  orgId: string,
): Promise<SearchResult[]> {
  const tracks = await getTracksByOrg(orgId);
  const results: SearchResult[] = [];

  for (const t of tracks) {
    const titleScore = scoreMatch(t.title, q);
    const displayScore = t.displayTitle ? scoreMatch(t.displayTitle, q) : 0;
    const isrcScore = t.isrc ? scoreMatch(t.isrc, q) : 0;
    const maxScore = Math.max(titleScore, displayScore, isrcScore);

    if (maxScore > 0) {
      results.push({
        type: 'track',
        id: t.id,
        title: t.displayTitle ?? t.title,
        subtitle: 'Track',
        url: `/tracks/${t.id}`,
        badge: t.recordingType ?? 'original',
        score: maxScore,
      });
    }
  }

  return results;
}

async function searchArtistsFn(
  q: string,
  orgId: string,
): Promise<SearchResult[]> {
  const artists = await searchArtists(orgId, q);
  const results: SearchResult[] = [];

  for (const a of artists) {
    const titleScore = scoreMatch(a.name, q);
    const stageScore = a.stageName ? scoreMatch(a.stageName, q) : 0;
    const legalScore = a.legalName ? scoreMatch(a.legalName, q) : 0;
    const maxScore = Math.max(titleScore, stageScore, legalScore);

    results.push({
      type: 'artist',
      id: a.id,
      title: a.name,
      subtitle: a.stageName ?? a.artistType,
      url: `/artists/${a.id}`,
      badge: a.artistType,
      score: maxScore,
    });
  }

  return results;
}

async function searchPeopleFn(
  q: string,
  orgId: string,
): Promise<SearchResult[]> {
  const people = await searchPeople(orgId, q);
  const results: SearchResult[] = [];

  for (const p of people) {
    const displayScore = scoreMatch(p.displayName, q);
    const emailScore = scoreMatch(p.email, q);
    const maxScore = Math.max(displayScore, emailScore);

    results.push({
      type: 'person',
      id: p.id,
      title: p.displayName,
      subtitle: p.primaryRole,
      url: `/people/${p.id}`,
      badge: p.department ?? p.primaryRole,
      score: maxScore,
    });
  }

  return results;
}

async function searchTasksFn(
  q: string,
  orgId: string,
): Promise<SearchResult[]> {
  const tasks = await getTasks({
    organisationId: orgId,
    search: q,
    openOnly: true,
  });
  const results: SearchResult[] = [];

  for (const t of tasks) {
    const titleScore = scoreMatch(t.title, q);
    if (titleScore > 0) {
      results.push({
        type: 'task',
        id: t.id,
        title: t.title,
        subtitle: t.status,
        url: `/tasks/${t.id}`,
        badge: t.priority,
        score: titleScore,
      });
    }
  }

  return results;
}

export async function search(
  query: string,
  orgId: string,
): Promise<SearchResult[]> {
  const q = normalizeQuery(query);
  if (!q || q.length < 2) return [];

  const [releases, tracks, artists, people, tasks] = await Promise.all([
    searchReleases(q, orgId),
    searchTracks(q, orgId),
    searchArtistsFn(q, orgId),
    searchPeopleFn(q, orgId),
    searchTasksFn(q, orgId),
  ]);

  const all = [...releases, ...tracks, ...artists, ...people, ...tasks];
  return sortResults(all).slice(0, 20);
}