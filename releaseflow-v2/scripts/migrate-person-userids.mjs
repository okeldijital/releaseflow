/**
 * ARS-004.2 — Person.userId migration report + optional dry-run apply.
 *
 * Usage (from monorepo with Firebase Admin credentials):
 *   node scripts/migrate-person-userids.mjs --org=<orgId> [--apply]
 *
 * Without --apply: report only.
 * With --apply: set person.userId from membership.userId when missing.
 *
 * Requires GOOGLE_APPLICATION_CREDENTIALS or FIREBASE_SERVICE_ACCOUNT_JSON.
 */

import { readFileSync, existsSync } from 'node:fs';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);

function parseArgs(argv) {
  const out = { apply: false, org: null };
  for (const a of argv) {
    if (a === '--apply') out.apply = true;
    if (a.startsWith('--org=')) out.org = a.slice(6);
  }
  return out;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  if (!args.org) {
    console.error('Usage: node scripts/migrate-person-userids.mjs --org=<organizationId> [--apply]');
    process.exit(1);
  }

  let admin;
  try {
    admin = require('firebase-admin');
  } catch {
    console.error('firebase-admin not installed. Install at workspace root or run with apps/web node_modules.');
    process.exit(1);
  }

  if (!admin.apps.length) {
    const json = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
    if (json) {
      admin.initializeApp({ credential: admin.credential.cert(JSON.parse(json)) });
    } else if (process.env.GOOGLE_APPLICATION_CREDENTIALS && existsSync(process.env.GOOGLE_APPLICATION_CREDENTIALS)) {
      admin.initializeApp({ credential: admin.credential.applicationDefault() });
    } else {
      console.error('Set GOOGLE_APPLICATION_CREDENTIALS or FIREBASE_SERVICE_ACCOUNT_JSON');
      process.exit(1);
    }
  }

  const db = admin.firestore();
  const orgId = args.org;

  const peopleSnap = await db.collection('people').where('organizationId', '==', orgId).get();
  const membershipsSnap = await db.collection('memberships').where('organizationId', '==', orgId).get();

  /** @type {Map<string, string>} email -> userId from memberships */
  const userByEmail = new Map();
  const userIds = new Set();
  for (const d of membershipsSnap.docs) {
    const m = d.data();
    if (m.userId) userIds.add(m.userId);
    if (m.email && m.userId) userByEmail.set(String(m.email).toLowerCase(), m.userId);
  }

  const report = {
    orgId,
    totalPeople: peopleSnap.size,
    linked: 0,
    missing: 0,
    wouldLink: 0,
    applied: 0,
    orphaned: 0,
    duplicates: [],
    rows: [],
  };

  /** @type {Map<string, string[]>} userId -> personIds */
  const byUser = new Map();

  for (const d of peopleSnap.docs) {
    const p = d.data();
    const personId = d.id;
    const email = (p.email || '').toLowerCase();
    const currentUid = p.userId || null;
    const membershipUid = email ? userByEmail.get(email) : null;

    if (currentUid) {
      report.linked += 1;
      const list = byUser.get(currentUid) || [];
      list.push(personId);
      byUser.set(currentUid, list);
      report.rows.push({ personId, status: 'linked', userId: currentUid });
      continue;
    }

    if (membershipUid) {
      report.wouldLink += 1;
      report.rows.push({ personId, status: 'would_link', userId: membershipUid, email });
      if (args.apply) {
        await d.ref.update({
          userId: membershipUid,
          invitationStatus: p.invitationStatus || 'accepted',
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });
        report.applied += 1;
      }
    } else {
      report.missing += 1;
      report.orphaned += 1;
      report.rows.push({ personId, status: 'missing', email: email || null });
    }
  }

  for (const [uid, ids] of byUser) {
    if (ids.length > 1) report.duplicates.push({ userId: uid, personIds: ids });
  }

  console.log(JSON.stringify(report, null, 2));
  if (!args.apply) {
    console.error('\nDry run only. Re-run with --apply to write userId links.');
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
