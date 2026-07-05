/**
 * BUILD-011 — One-time migration to remove orphaned release_tracks records.
 *
 * For every document in release_tracks:
 *   1. Read trackId
 *   2. Check whether tracks/{trackId} exists
 *   3. If it does NOT exist, delete the release_tracks document
 *
 * Idempotent — safe to run multiple times.
 *
 * Usage:
 *   GOOGLE_APPLICATION_CREDENTIALS=./service-account.json \
 *   npx tsx scripts/clean-orphan-release-tracks.ts [--execute]
 *
 * Default is dry-run (report only). Pass --execute to perform deletions.
 */

import { initializeApp, applicationDefault } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

function getProjectId(): string {
  try {
    const fs = require('fs');
    const content = fs.readFileSync('.firebaserc', 'utf-8');
    const config = JSON.parse(content);
    return config.projects?.default ?? 'releaseflow-prod';
  } catch {
    return 'releaseflow-prod';
  }
}

async function main() {
  const isExecute = process.argv.includes('--execute');
  const projectId = getProjectId();

  console.log(`Project: ${projectId}`);
  console.log(`Mode: ${isExecute ? 'EXECUTE' : 'DRY-RUN'}`);
  console.log();

  initializeApp({ projectId, credential: applicationDefault() });
  const db = getFirestore();

  const releaseTracksSnap = await db.collection('release_tracks').get();
  const total = releaseTracksSnap.size;
  let orphansFound = 0;
  let orphansRemoved = 0;

  for (const doc of releaseTracksSnap.docs) {
    const data = doc.data();
    const trackId: string | undefined = data.trackId;

    if (!trackId) {
      console.warn(`release_tracks/${doc.id} has no trackId — skipping`);
      continue;
    }

    const trackDoc = await db.collection('tracks').doc(trackId).get();

    if (!trackDoc.exists) {
      orphansFound++;
      console.log(`orphan  release_tracks/${doc.id}  →  tracks/${trackId}  (MISSING)`);

      if (isExecute) {
        await db.collection('release_tracks').doc(doc.id).delete();
        orphansRemoved++;
        console.log(`        deleted release_tracks/${doc.id}`);
      }
    }
  }

  console.log();
  console.log(`release_tracks scanned: ${total}`);
  console.log(`orphans found: ${orphansFound}`);
  console.log(`orphans removed: ${orphansRemoved}`);

  if (!isExecute && orphansFound > 0) {
    console.log();
    console.log('Run with --execute to remove orphans.');
  }
}

main().catch((err) => {
  console.error('Migration failed:', err);
  process.exit(1);
});
