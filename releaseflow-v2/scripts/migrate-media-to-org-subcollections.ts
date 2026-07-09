/**
 * BUILD-031 — One-time media multi-tenant migration
 *
 * Migrates the top-level media collections into organization-scoped
 * subcollections, aligning media with ReleaseFlow's multi-tenant model:
 *
 *   media_assets     -> organizations/{orgId}/media_assets
 *   media_versions   -> organizations/{orgId}/media_versions
 *   media_usage      -> organizations/{orgId}/media_usage
 *   media_reviews    -> organizations/{orgId}/media_reviews
 *   media_comments   -> organizations/{orgId}/media_comments
 *
 * Behaviour:
 *   - Idempotent: existing target docs (same ID) are skipped, so it is safe
 *     to rerun. Document IDs are preserved so `deliverable.mediaAssetId`
 *     references remain valid.
 *   - Dry-run by default: pass --execute to write.
 *   - Progress reporting + validation summary.
 *   - Exits cleanly when no top-level media exists.
 *
 * Usage:
 *   GOOGLE_APPLICATION_CREDENTIALS=./service-account.json \
 *   npx tsx scripts/migrate-media-to-org-subcollections.ts [--execute]
 */

import { initializeApp, applicationDefault, cert, type ServiceAccount } from 'firebase-admin/app';
import { getFirestore, type Firestore, type DocumentData } from 'firebase-admin/firestore';
import { readFileSync, existsSync } from 'fs';

const TOP_LEVEL_COLLECTIONS = [
  'media_assets',
  'media_versions',
  'media_usage',
  'media_reviews',
  'media_comments',
] as const;

type MediaCollection = (typeof TOP_LEVEL_COLLECTIONS)[number];

interface CollectionReport {
  collection: MediaCollection;
  total: number;
  migrated: number;
  skipped: number;
  orphaned: number;
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

/**
 * Builds a map of top-level media_asset docId -> organizationId, used to route
 * child records (versions/usage/reviews/comments) that reference an assetId but
 * may not carry an organizationId of their own.
 */
async function buildAssetOrgMap(db: Firestore): Promise<Map<string, string>> {
  const map = new Map<string, string>();
  const snap = await db.collection('media_assets').get();
  for (const doc of snap.docs) {
    const orgId = (doc.data() as DocumentData).organizationId as string | undefined;
    if (orgId) map.set(doc.id, orgId);
  }
  return map;
}

function resolveOrgId(
  collection: MediaCollection,
  data: DocumentData,
  assetOrgMap: Map<string, string>,
): string | null {
  const direct = data.organizationId as string | undefined;
  if (direct) return direct;
  if (collection === 'media_assets') return null; // asset must carry its own org
  const assetId = data.assetId as string | undefined;
  if (assetId && assetOrgMap.has(assetId)) return assetOrgMap.get(assetId)!;
  return null;
}

async function migrateCollection(
  db: Firestore,
  collection: MediaCollection,
  assetOrgMap: Map<string, string>,
  execute: boolean,
): Promise<CollectionReport> {
  const report: CollectionReport = { collection, total: 0, migrated: 0, skipped: 0, orphaned: 0 };
  const snap = await db.collection(collection).get();
  report.total = snap.size;

  if (snap.empty) return report;

  for (const doc of snap.docs) {
    const data = doc.data();
    const orgId = resolveOrgId(collection, data, assetOrgMap);

    if (!orgId) {
      report.orphaned += 1;
      console.warn(`  [orphan] ${collection}/${doc.id} — cannot resolve organizationId, skipping`);
      continue;
    }

    const targetRef = db
      .collection('organizations')
      .doc(orgId)
      .collection(collection)
      .doc(doc.id);

    const existing = await targetRef.get();
    if (existing.exists) {
      report.skipped += 1;
      continue;
    }

    if (execute) {
      await targetRef.set({ ...data, organizationId: orgId });
    }
    report.migrated += 1;
  }

  return report;
}

async function main() {
  const execute = process.argv.includes('--execute');
  const db = initAdmin();

  console.log(`\nBUILD-031 media migration — ${execute ? 'EXECUTE' : 'DRY-RUN'}\n`);

  const assetOrgMap = await buildAssetOrgMap(db);

  // Exit cleanly when there is nothing to migrate.
  let totalTopLevel = 0;
  for (const c of TOP_LEVEL_COLLECTIONS) {
    const count = (await db.collection(c).limit(1).get()).size;
    totalTopLevel += count;
  }
  if (totalTopLevel === 0) {
    console.log('No top-level media documents found. Nothing to migrate. ✅\n');
    return;
  }

  const reports: CollectionReport[] = [];
  for (const collection of TOP_LEVEL_COLLECTIONS) {
    console.log(`Migrating ${collection} …`);
    const report = await migrateCollection(db, collection, assetOrgMap, execute);
    reports.push(report);
    console.log(
      `  total=${report.total} migrated=${report.migrated} skipped=${report.skipped} orphaned=${report.orphaned}`,
    );
  }

  console.log('\n── Summary ─────────────────────────────');
  let anyOrphans = false;
  for (const r of reports) {
    console.log(
      `${r.collection.padEnd(16)} total=${r.total} migrated=${r.migrated} skipped=${r.skipped} orphaned=${r.orphaned}`,
    );
    if (r.orphaned > 0) anyOrphans = true;
  }
  console.log('────────────────────────────────────────');

  if (!execute) {
    console.log('\nDry-run complete. Re-run with --execute to apply. No data was written.\n');
  } else {
    console.log('\nMigration complete. ✅');
    console.log('Note: top-level documents were copied, not deleted. Verify, then remove the');
    console.log('legacy top-level collections manually once satisfied.\n');
  }

  if (anyOrphans) {
    console.warn('⚠️  Some records could not be routed to an organization (orphans). Review the warnings above.\n');
  }
}

main().catch((err) => {
  console.error('Migration failed:', err);
  process.exit(1);
});
