import { getDocs, collection, query, where, getDoc, doc, orderBy } from 'firebase/firestore';
import { getDb } from './firebase';
import { getGroupsForArtist } from './artist-membership-repository';

export type DiscographyFilter = 'all' | 'solo' | 'group' | 'appears_on' | 'remixes' | 'writing' | 'production';

export interface DiscographyEntry {
  id: string;
  title: string;
  releaseType: string;
  status: string;
  role: string;
  category: DiscographyFilter;
  artistName?: string;
}

export interface DiscographySummary {
  all: DiscographyEntry[];
  solo: DiscographyEntry[];
  group: DiscographyEntry[];
  appears_on: DiscographyEntry[];
  remixes: DiscographyEntry[];
  writing: DiscographyEntry[];
  production: DiscographyEntry[];
}

async function getArtistName(artistId: string): Promise<string | null> {
  const db = getDb();
  if (!db) return null;
  const snap = await getDoc(doc(db, 'organizations', '_', 'artists', artistId));
  return snap.exists() ? (snap.data().name as string) ?? null : null;
}

export async function getDiscography(
  organizationId: string,
  artistId: string,
): Promise<DiscographySummary> {
  const db = getDb();
  if (!db) return emptyDiscography();

  const all: DiscographyEntry[] = [];

  // 1. Releases where artist is directly linked (all roles)
  const releaseArtistsSnap = await getDocs(
    query(collection(db, 'release_artists'), where('artistId', '==', artistId)),
  );
  const releaseIds = new Set<string>();
  for (const d of releaseArtistsSnap.docs) {
    const data = d.data();
    const relId = data.releaseId as string;
    releaseIds.add(relId);
    const relSnap = await getDoc(doc(db, 'releases', relId));
    if (relSnap.exists()) {
      const rel = relSnap.data() as { title?: string; releaseType?: string; status?: string };
      const role = (data.role as string) ?? '';
      let category: DiscographyFilter = 'solo';
      if (role === 'featured' || role === 'guest_artist') category = 'appears_on';
      else if (role === 'remixer') category = 'remixes';
      all.push({
        id: relId,
        title: rel.title ?? 'Untitled',
        releaseType: rel.releaseType ?? '',
        status: rel.status ?? '',
        role,
        category,
      });
    }
  }

  // 2. Releases via group memberships
  const groups = await getGroupsForArtist(artistId);
  for (const membership of groups) {
    const groupSnap = await getDocs(
      query(collection(db, 'release_artists'), where('artistId', '==', membership.groupArtistId)),
    );
    for (const d of groupSnap.docs) {
      const data = d.data();
      const relId = data.releaseId as string;
      if (releaseIds.has(relId)) continue;
      releaseIds.add(relId);
      const relSnap = await getDoc(doc(db, 'releases', relId));
      if (relSnap.exists()) {
        const rel = relSnap.data() as { title?: string; releaseType?: string; status?: string };
        const groupName = await getArtistName(membership.groupArtistId);
        all.push({
          id: relId,
          title: rel.title ?? 'Untitled',
          releaseType: rel.releaseType ?? '',
          status: rel.status ?? '',
          role: `${data.role as string} (via ${groupName ?? membership.groupArtistId})`,
          category: 'group',
          artistName: groupName ?? undefined,
        });
      }
    }
  }

  // 3. Track credits (writing/production)
  const creditsSnap = await getDocs(
    query(collection(db, 'track_credits'), where('artistId', '==', artistId)),
  );
  for (const d of creditsSnap.docs) {
    const data = d.data();
    const trackId = data.trackId as string;
    const trackSnap = await getDoc(doc(db, 'tracks', trackId));
    if (trackSnap.exists()) {
      const track = trackSnap.data() as { title?: string; releaseType?: string; status?: string };
      const role = (data.role as string) ?? '';
      let category: DiscographyFilter = 'writing';
      if (role === 'producer' || role === 'mix_engineer' || role === 'mastering_engineer' || role === 'arranger') {
        category = 'production';
      }
      all.push({
        id: trackId,
        title: track.title ?? 'Untitled',
        releaseType: 'track',
        status: track.status ?? '',
        role,
        category,
      });
    }
  }

  return {
    all,
    solo: all.filter((e) => e.category === 'solo'),
    group: all.filter((e) => e.category === 'group'),
    appears_on: all.filter((e) => e.category === 'appears_on'),
    remixes: all.filter((e) => e.category === 'remixes'),
    writing: all.filter((e) => e.category === 'writing'),
    production: all.filter((e) => e.category === 'production'),
  };
}

function emptyDiscography(): DiscographySummary {
  return { all: [], solo: [], group: [], appears_on: [], remixes: [], writing: [], production: [] };
}

export const DISCOGRAPHY_FILTERS: { id: DiscographyFilter; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'solo', label: 'Solo Releases' },
  { id: 'group', label: 'Group Releases' },
  { id: 'appears_on', label: 'Appears On' },
  { id: 'remixes', label: 'Remixes' },
  { id: 'writing', label: 'Writing Credits' },
  { id: 'production', label: 'Production Credits' },
];
