/**
 * BUILD-003 — One-time artist migration
 *
 * Migrates legacy `artists` → `organizations/{orgId}/artists/{artistId}`,
 * merges duplicates by normalized name, remaps references, and optionally
 * deletes the legacy collection.
 *
 * Usage:
 *   GOOGLE_APPLICATION_CREDENTIALS=./service-account.json \
 *   npx tsx scripts/migrate-artists.ts [--execute] [--delete-legacy]
 *
 * Default is dry-run (report only).
 */

import { initializeApp, applicationDefault, cert, type ServiceAccount } from 'firebase-admin/app';
import { getFirestore, Timestamp, type Firestore, type QueryDocumentSnapshot } from 'firebase-admin/firestore';
import { readFileSync, existsSync } from 'fs';

const LEGACY_COLLECTION = 'artists';
const BATCH_LIMIT = 400;

function normalizeArtistName(name: string): string {
  return name.trim().toLowerCase();
}

function slugify(name: string): string {
  return name.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

interface OrgReport {
  organizationId: string;
  legacyCount: number;
  migrated: number;
  merged: number;
  skipped: number;
}

interface MigrationResult {
  dryRun: boolean;
  deleteLegacy: boolean;
  organizations: OrgReport[];
  idRemap: Record<string, string>;
  referencesUpdated: number;
  legacyDeleted: number;
  errors: string[];
}

function initAdmin(): Firestore {
  const projectId = process.env.FIREBASE_PROJECT_ID ?? process.env.GCLOUD_PROJECT ?? 'releaseflow-prod';
  const credPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;

  if (credPath && existsSync(credPath)) {
    const serviceAccount = JSON.parse(readFileSync(credPath, 'utf8')) as ServiceAccount;
    initializeApp({ credential: cert(serviceAccount), projectId });
  } else {
    initializeApp({ credential: applicationDefault(), projectId });
  }

  return getFirestore();
}

async function remapReferences(
  db: Firestore,
  idRemap: Record<string, string>,
  dryRun: boolean,
): Promise<number> {
  let updated = 0;

  const remap = (id: string | null | undefined) => {
    if (!id) return id;
    return idRemap[id] ?? id;
  };

  const collections: { name: string; field: string }[] = [
    { name: 'release_artists', field: 'artistId' },
    { name: 'track_credits', field: 'artistId' },
    { name: 'track_artists', field: 'artistId' },
  ];

  for (const { name, field } of collections) {
    for (const [oldId, newId] of Object.entries(idRemap)) {
      const snap = await db.collection(name).where(field, '==', oldId).get();
      for (const docSnap of snap.docs) {
        if (!dryRun) {
          await docSnap.ref.update({ [field]: newId });
        }
        updated += 1;
      }
    }
  }

  const tracksSnap = await db.collection('tracks').get();
  for (const trackDoc of tracksSnap.docs) {
    const data = trackDoc.data();
    const patch: Record<string, unknown> = {};

    for (const field of ['primaryArtistId', 'originalArtistId', 'remixerArtistId'] as const) {
      const val = data[field] as string | undefined;
      if (val && idRemap[val]) patch[field] = remap(val);
    }

    if (Array.isArray(data.featuredArtistIds)) {
      const remapped = (data.featuredArtistIds as string[]).map((id) => remap(id) as string);
      if (remapped.some((id, i) => id !== (data.featuredArtistIds as string[])[i])) {
        patch.featuredArtistIds = remapped;
      }
    }

    if (Object.keys(patch).length > 0) {
      if (!dryRun) await trackDoc.ref.update(patch);
      updated += 1;
    }
  }

  return updated;
}

export async function migrateArtists(options: {
  execute?: boolean;
  deleteLegacy?: boolean;
} = {}): Promise<MigrationResult> {
  const dryRun = !options.execute;
  const deleteLegacy = Boolean(options.deleteLegacy);
  const db = initAdmin();

  const result: MigrationResult = {
    dryRun,
    deleteLegacy,
    organizations: [],
    idRemap: {},
    referencesUpdated: 0,
    legacyDeleted: 0,
    errors: [],
  };

  const legacySnap = await db.collection(LEGACY_COLLECTION).get();
  const byOrg = new Map<string, QueryDocumentSnapshot[]>();

  for (const docSnap of legacySnap.docs) {
    const orgId = (docSnap.data().organizationId as string) ?? '';
    if (!orgId) {
      result.errors.push(`Artist ${docSnap.id} has no organizationId — skipped`);
      continue;
    }
    const list = byOrg.get(orgId) ?? [];
    list.push(docSnap);
    byOrg.set(orgId, list);
  }

  for (const [organizationId, legacyDocs] of byOrg.entries()) {
    const report: OrgReport = {
      organizationId,
      legacyCount: legacyDocs.length,
      migrated: 0,
      merged: 0,
      skipped: 0,
    };

    const nestedSnap = await db
      .collection('organizations')
      .doc(organizationId)
      .collection('artists')
      .get();

    const canonicalByNormalized = new Map<string, string>();
    const canonicalNameById = new Map<string, string>();

    for (const nestedDoc of nestedSnap.docs) {
      const name = (nestedDoc.data().name as string) ?? '';
      const normalized = normalizeArtistName(name);
      if (!normalized) continue;
      if (!canonicalByNormalized.has(normalized)) {
        canonicalByNormalized.set(normalized, nestedDoc.id);
        canonicalNameById.set(nestedDoc.id, name);
      }
    }

    for (const legacyDoc of legacyDocs) {
      const data = legacyDoc.data();
      const name = (data.name as string) ?? '';
      const normalized = normalizeArtistName(name);
      if (!normalized) {
        report.skipped += 1;
        continue;
      }

      const existingCanonicalId = canonicalByNormalized.get(normalized);

      if (existingCanonicalId) {
        if (existingCanonicalId !== legacyDoc.id) {
          result.idRemap[legacyDoc.id] = existingCanonicalId;
          report.merged += 1;
        } else {
          report.skipped += 1;
        }
        continue;
      }

      canonicalByNormalized.set(normalized, legacyDoc.id);
      canonicalNameById.set(legacyDoc.id, name);

      const targetRef = db
        .collection('organizations')
        .doc(organizationId)
        .collection('artists')
        .doc(legacyDoc.id);

      const targetSnap = await targetRef.get();
      if (targetSnap.exists) {
        report.skipped += 1;
        continue;
      }

      if (!dryRun) {
        await targetRef.set({
          ...data,
          name,
          slug: (data.slug as string) ?? slugify(name),
          normalizedName: normalized,
          organizationId,
          updatedAt: Timestamp.now(),
          createdAt: data.createdAt ?? Timestamp.now(),
        });
      }
      report.migrated += 1;
    }

    result.organizations.push(report);
  }

  if (Object.keys(result.idRemap).length > 0) {
    result.referencesUpdated = await remapReferences(db, result.idRemap, dryRun);
  }

  if (deleteLegacy && !dryRun) {
    let batch = db.batch();
    let ops = 0;
    for (const docSnap of legacySnap.docs) {
      batch.delete(docSnap.ref);
      ops += 1;
      result.legacyDeleted += 1;
      if (ops >= BATCH_LIMIT) {
        await batch.commit();
        batch = db.batch();
        ops = 0;
      }
    }
    if (ops > 0) await batch.commit();
  }

  return result;
}

function printReport(result: MigrationResult) {
  const mode = result.dryRun ? 'DRY RUN' : 'EXECUTE';
  console.log(`\n=== Artist Migration (${mode}) ===\n`);
  console.log(
    'Organization'.padEnd(28),
    'Legacy'.padStart(8),
    'Migrated'.padStart(10),
    'Merged'.padStart(8),
    'Skipped'.padStart(8),
  );
  console.log('-'.repeat(62));

  for (const row of result.organizations) {
    console.log(
      row.organizationId.padEnd(28),
      String(row.legacyCount).padStart(8),
      String(row.migrated).padStart(10),
      String(row.merged).padStart(8),
      String(row.skipped).padStart(8),
    );
  }

  console.log('\nID remaps:', Object.keys(result.idRemap).length);
  if (Object.keys(result.idRemap).length > 0) {
    for (const [oldId, newId] of Object.entries(result.idRemap)) {
      console.log(`  ${oldId} → ${newId}`);
    }
  }

  console.log('References updated:', result.referencesUpdated);
  if (result.deleteLegacy) console.log('Legacy docs deleted:', result.legacyDeleted);
  if (result.errors.length) {
    console.log('\nErrors:');
    result.errors.forEach((e) => console.log(`  - ${e}`));
  }
  console.log('');
}

const execute = process.argv.includes('--execute');
const deleteLegacy = process.argv.includes('--delete-legacy');

migrateArtists({ execute, deleteLegacy })
  .then(printReport)
  .catch((err) => {
    console.error('Migration failed:', err);
    process.exit(1);
  });