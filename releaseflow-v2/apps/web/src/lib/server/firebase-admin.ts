import { initializeApp, cert, applicationDefault, getApps, type App } from 'firebase-admin/app';
import { getAuth, type Auth } from 'firebase-admin/auth';
import { getFirestore, type Firestore } from 'firebase-admin/firestore';

let cached: App | undefined;

/**
 * Returns a singleton Firebase Admin app. Uses a service-account JSON from
 * FIREBASE_SERVICE_ACCOUNT when present, otherwise Application Default
 * Credentials (e.g. GOOGLE_APPLICATION_CREDENTIALS or the emulator).
 */
export function initAdmin(): App {
  if (cached) return cached;
  if (getApps().length > 0) {
    cached = getApps()[0]!;
    return cached;
  }

  const sa = process.env.FIREBASE_SERVICE_ACCOUNT;
  const appOptions = sa
    ? { credential: cert(JSON.parse(sa) as object) }
    : { credential: applicationDefault() };

  cached = initializeApp(appOptions);
  return cached;
}

export function getAdminAuth(): Auth {
  return getAuth(initAdmin());
}

export function getAdminDb(): Firestore {
  return getFirestore(initAdmin());
}
