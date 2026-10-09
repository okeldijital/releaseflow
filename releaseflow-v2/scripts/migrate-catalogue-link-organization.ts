/**
 * RR-001 — Backfill organizationId on catalogue relationship documents.
 *
 * The Firestore rules use explicit tenant identity for release_tracks and
 * track_artists queries. This migration derives that identity from trusted
 * linked documents and refuses to repair inconsistent relationships silently.
 *
 * Usage (dry-run by default):
 *   FIREBASE_PROJECT_ID=<non-production-project> npx tsx scripts/migrate-catalogue-link-organization.ts
 *   FIREBASE_PROJECT_ID=<non-production-project> npx tsx scripts/migrate-catalogue-link-organization.ts --execute
 *
 * Production requires the additional explicit --allow-production flag.
 * This script does not create/delete links or alter release/track/artist data.
 */

import { applicationDefault, cert, initializeApp, type ServiceAccount } from 'firebase-admin/app';
import { getFirestore, type DocumentReference, type Firestore } from 'firebase-admin/firestore';
import { existsSync, readFileSync } from 'node:fs';

const BATCH_LIMIT = 400;
const PRODUCTION_PROJECT_ID = 'releaseflow-prod';

interface MigrationReport {
  projectId: string;
  dryRun: boolean;
  releaseTrackScanned: number;
  releaseTrackUpdated: number;
  trackArtistScanned: number;
  trackArtistUpdated: number;
  skipped: number;
  errors: string[];
}

function initializeDatabase(): { db: Firestore; projectId: string } {
  const projectId = process.env.FIREBASE_PROJECT_ID ?? process.env.GCLOUD_PROJECT;
  if (!projectId) {
    throw new Error('Set FIREBASE_PROJECT_ID explicitly; this migration must never infer the target project.');
  }
  if (projectId === PRODUCTION_PROJECT_ID && !process.argv.includes('--allow-production')) {
    throw new Error('Safety stop: production requires the explicit --allow-production flag.');
  }

  const credentialPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;
  const credential =
    credentialPath && existsSync(credentialPath)
      ? cert(JSON.parse(readFileSync(credentialPath, 'utf8')) as ServiceAccount)
      : applicationDefault();

  initializeApp({ credential, projectId });
  return { db: getFirestore(), projectId };
}

async function migrateCatalogueLinks(execute: boolean): Promise<MigrationReport> {
  const { db, projectId } = initializeDatabase();
  const report: MigrationReport = {
    projectId,
    dryRun: !execute,
    releaseTrackScanned: 0,
    releaseTrackUpdated: 0,
    trackArtistScanned: 0,
    trackArtistUpdated: 0,
    skipped: 0,
    errors: [],
  };
  let batch = db.batch();
  let pendingWrites = 0;

  const queueUpdate = async (ref: DocumentReference, organizationId: string) => {
    if (!execute) return;
    batch.update(ref, { organizationId });
    pendingWrites += 1;
    if (pendingWrites >= BATCH_LIMIT) {
      await batch.commit();
      batch = db.batch();
      pendingWrites = 0;
    }
  };

  const releaseLinks = await db.collection('release_tracks').get();
  report.releaseTrackScanned = releaseLinks.size;
  for (const link of releaseLinks.docs) {
    const data = link.data();
    const releaseId = typeof data.releaseId === 'string' ? data.releaseId : '';
    const trackId = typeof data.trackId === 'string' ? data.trackId : '';
    if (!releaseId || !trackId) {
      report.skipped += 1;
      report.errors.push(`release_tracks/${link.id}: missing releaseId or trackId`);
      continue;
    }

    const [releaseSnap, trackSnap] = await Promise.all([
      db.collection('releases').doc(releaseId).get(),
      db.collection('tracks').doc(trackId).get(),
    ]);
    if (!releaseSnap.exists || !trackSnap.exists) {
      report.skipped += 1;
      report.errors.push(`release_tracks/${link.id}: linked release or track does not exist`);
      continue;
    }

    const releaseOrg = releaseSnap.data()?.organizationId;
    const trackOrg = trackSnap.data()?.organizationId;
    if (typeof releaseOrg !== 'string' || !releaseOrg || releaseOrg !== trackOrg) {
      report.skipped += 1;
      report.errors.push(`release_tracks/${link.id}: linked release and track organizations do not match`);
      continue;
    }
    if (typeof data.organizationId === 'string' && data.organizationId !== releaseOrg) {
      report.skipped += 1;
      report.errors.push(`release_tracks/${link.id}: existing organizationId conflicts with linked entities`);
      continue;
    }
    if (data.organizationId === releaseOrg) continue;

    await queueUpdate(link.ref, releaseOrg);
    report.releaseTrackUpdated += 1;
  }

  const artistLinks = await db.collection('track_artists').get();
  report.trackArtistScanned = artistLinks.size;
  for (const link of artistLinks.docs) {
    const data = link.data();
    const trackId = typeof data.trackId === 'string' ? data.trackId : '';
    const artistId = typeof data.artistId === 'string' ? data.artistId : '';
    if (!trackId || !artistId) {
      report.skipped += 1;
      report.errors.push(`track_artists/${link.id}: missing trackId or artistId`);
      continue;
    }

    const trackSnap = await db.collection('tracks').doc(trackId).get();
    if (!trackSnap.exists) {
      report.skipped += 1;
      report.errors.push(`track_artists/${link.id}: linked track does not exist`);
      continue;
    }
    const organizationId = trackSnap.data()?.organizationId;
    if (typeof organizationId !== 'string' || !organizationId) {
      report.skipped += 1;
      report.errors.push(`track_artists/${link.id}: linked track has no organizationId`);
      continue;
    }

    const artistSnap = await db
      .collection('organizations')
      .doc(organizationId)
      .collection('artists')
      .doc(artistId)
      .get();
    if (!artistSnap.exists) {
      report.skipped += 1;
      report.errors.push(`track_artists/${link.id}: artist ${artistId} is not present in organization ${organizationId}`);
      continue;
    }
    if (typeof data.organizationId === 'string' && data.organizationId !== organizationId) {
      report.skipped += 1;
      report.errors.push(`track_artists/${link.id}: existing organizationId conflicts with linked entities`);
      continue;
    }
    if (data.organizationId === organizationId) continue;

    await queueUpdate(link.ref, organizationId);
    report.trackArtistUpdated += 1;
  }

  if (execute && pendingWrites > 0) await batch.commit();
  return report;
}

const execute = process.argv.includes('--execute');
migrateCatalogueLinks(execute)
  .then((report) => {
    console.log(`\nCatalogue Link Organization Migration — ${report.dryRun ? 'DRY RUN' : 'EXECUTE'}`);
    console.log(`Project: ${report.projectId}`);
    console.log(`release_tracks scanned: ${report.releaseTrackScanned}; ${report.dryRun ? 'would update' : 'updated'}: ${report.releaseTrackUpdated}`);
    console.log(`track_artists scanned: ${report.trackArtistScanned}; ${report.dryRun ? 'would update' : 'updated'}: ${report.trackArtistUpdated}`);
    console.log(`Skipped: ${report.skipped}`);
    if (report.errors.length) {
      console.log('\nItems requiring manual review:');
      for (const error of report.errors) console.log(`- ${error}`);
    }
    console.log('');
    if (report.errors.length > 0) process.exitCode = 2;
  })
  .catch((error) => {
    console.error('Catalogue link organization migration failed:', error);
    process.exit(1);
  });
