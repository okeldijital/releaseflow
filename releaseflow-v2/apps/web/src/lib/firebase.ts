import { initializeApp, getApps, type FirebaseApp } from '@firebase/app';
import { getAuth, connectAuthEmulator, type Auth } from '@firebase/auth';
import { getFirestore, connectFirestoreEmulator, type Firestore } from '@firebase/firestore';

let app: FirebaseApp | undefined;
let auth: Auth | undefined;
let db: Firestore | undefined;

function getFirebaseConfig() {
  return {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  };
}

function initFirebase() {
  if (typeof window === 'undefined') return;
  if (app) return;
  const config = getFirebaseConfig();
  if (!config.apiKey) return;
  const existing = getApps();
  app = existing.length === 0 ? initializeApp(config) : existing[0];
  if (!app) return;
  auth = getAuth(app);
  db = getFirestore(app);
  if (process.env.NEXT_PUBLIC_EMULATOR_HOST) {
    connectAuthEmulator(auth, `http://${process.env.NEXT_PUBLIC_EMULATOR_HOST}:9099`);
    connectFirestoreEmulator(db, process.env.NEXT_PUBLIC_EMULATOR_HOST, 8080);
  }
}

export function getAuthInstance(): Auth | undefined {
  initFirebase();
  return auth;
}

export function getDb(): Firestore | undefined {
  initFirebase();
  return db;
}
