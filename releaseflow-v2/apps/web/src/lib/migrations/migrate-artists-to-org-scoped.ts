import {
  collection, doc, getDocs, query, updateDoc, where, writeBatch, getDoc,
} from 'firebase/firestore';
import { getDb } from '../firebase';
import { normalizeArtistName } from '../artist-field-picker-logic';
import { writeArtistToCanonicalPath } from '../artist-repository';

const LEGACY_COLLECTION = 'artists';
const BATCH_SIZE = 400;

export interface ArtistMigrationResult {
  organizationsProcessed: number;
  artistsMigrated: number;
  duplicatesMerged: number;
  trackReferencesUpdated: number;
  trackArtistLinksUpdated: number;
  idRemap: Record<string, string>;
  errors: string[];
}

function slugify(name: string): string {
  return name.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

async function remapTrackArtistFields(
  idRemap: Record<string, string>,
  organizationId: string,
): Promise<number> {
  const db = getDb();
  if (!db) return 0;
  let updated = 0;

  const tracksSnap = await getDocs(
    query(collection(db, 'tracks'), where('organizationId', '==', organizationId)),
  );

  for (const trackDoc of tracksSnap.docs) {
    const data = trackDoc.data();
    const patch: Record<string, unknown> = {};

    const remap = (id: string | null | undefined) => {
      if (!id) return id;
      return idRemap[id] ?? id;
    };

    if (data.primaryArtistId && idRemap[data.primaryArtistId as string]) {
      patch.primaryArtistId = remap(data.primaryArtistId as string);
    }
    if (data.originalArtistId && idRemap[data.originalArtistId as string]) {
      patch.originalArtistId = remap(data.originalArtistId as string);
    }
    if (data.remixerArtistId && idRemap[data.remixerArtistId as string]) {
      patch.remixerArtistId = remap(data.remixerArtistId as string);
    }
    if (Array.isArray(data.featuredArtistIds)) {
      const remapped = (data.featuredArtistIds as string[]).map((id) => remap(id) as string);
      if (remapped.some((id, i) => id !== (data.featuredArtistIds as string[])[i])) {
        patch.featuredArtistIds = remapped;
      }
    }

    if (Object.keys(patch).length > 0) {
      await updateDoc(doc(db, 'tracks', trackDoc.id), patch);
      updated += 1;
    }
  }

  for (const [oldId, newId] of Object.entries(idRemap)) {
    const linksSnap = await getDocs(
      query(collection(db, 'track_artists'), where('artistId', '==', oldId)),
    );
    for (const linkDoc of linksSnap.docs) {
      await updateDoc(doc(db, 'track_artists', linkDoc.id), { artistId: newId });
      updated += 1;
    }
  }

  return updated;
}

/**
 * Idempotent migration: copies legacy `artists` documents into
 * `organizations/{organizationId}/artists/{artistId}`, merges duplicates
 * by normalized name, and remaps track references.
 */
export async function migrateArtistsToOrgScoped(
  dryRun = true,
): Promise<ArtistMigrationResult> {
  const db = getDb();
  const result: ArtistMigrationResult = {
    organizationsProcessed: 0,
    artistsMigrated: 0,
    duplicatesMerged: 0,
    trackReferencesUpdated: 0,
    trackArtistLinksUpdated: 0,
    idRemap: {},
    errors: [],
  };

  if (!db) {
    result.errors.push('Firestore not initialized');
    return result;
  }

  const legacySnap = await getDocs(collection(db, LEGACY_COLLECTION));
  const byOrg = new Map<string, typeof legacySnap.docs>();

  for (const d of legacySnap.docs) {
    const orgId = (d.data().organizationId as string) ?? '';
    if (!orgId) {
      result.errors.push(`Artist ${d.id} has no organizationId — skipped`);
      continue;
    }
    const list = byOrg.get(orgId) ?? [];
    list.push(d);
    byOrg.set(orgId, list);
  }

  for (const [organizationId, docs] of byOrg.entries()) {
    result.organizationsProcessed += 1;

    const canonicalByName = new Map<string, string>();
    const orgIdRemap: Record<string, string> = {};

    for (const legacyDoc of docs) {
      const data = legacyDoc.data();
      const name = (data.name as string) ?? '';
      const normalized = normalizeArtistName(name);
      if (!normalized) continue;

      const canonicalId = canonicalByName.get(normalized);
      if (canonicalId && canonicalId !== legacyDoc.id) {
        orgIdRemap[legacyDoc.id] = canonicalId;
        result.duplicatesMerged += 1;
        continue;
      }

      canonicalByName.set(normalized, legacyDoc.id);

      const nestedRef = doc(db, 'organizations', organizationId, 'artists', legacyDoc.id);
      const nestedSnap = await getDoc(nestedRef);
      if (nestedSnap.exists()) continue;

      if (!dryRun) {
        await writeArtistToCanonicalPath(organizationId, legacyDoc.id, {
          ...data,
          name,
          normalizedName: normalized,
          slug: (data.slug as string) ?? slugify(name),
        });
      }
      result.artistsMigrated += 1;
    }

    Object.assign(result.idRemap, orgIdRemap);

    if (!dryRun && Object.keys(orgIdRemap).length > 0) {
      const updated = await remapTrackArtistFields(orgIdRemap, organizationId);
      result.trackReferencesUpdated += updated;
      result.trackArtistLinksUpdated += updated;
    }
  }

  if (!dryRun && legacySnap.docs.length > 0) {
    let batch = writeBatch(db);
    let ops = 0;
    for (const d of legacySnap.docs) {
      const orgId = (d.data().organizationId as string) ?? '';
      const nestedRef = doc(db, 'organizations', orgId, 'artists', d.id);
      const nestedSnap = await getDoc(nestedRef);
      if (!nestedSnap.exists()) continue;
      batch.update(doc(db, LEGACY_COLLECTION, d.id), { migratedToOrgScoped: true });
      ops += 1;
      if (ops >= BATCH_SIZE) {
        await batch.commit();
        batch = writeBatch(db);
        ops = 0;
      }
    }
    if (ops > 0) await batch.commit();
  }

  return result;
}