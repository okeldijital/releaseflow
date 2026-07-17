import {
  getDocs, addDoc,
  collection, query, where, orderBy, Timestamp,
} from '@firebase/firestore';
import { getDb } from '@/lib/firebase';

export interface GenreRecord {
  id: string;
  organizationId: string;
  name: string;
  createdAt: Timestamp;
  createdBy: string;
}

export interface SubgenreRecord {
  id: string;
  organizationId: string;
  genreId: string;
  name: string;
  createdAt: Timestamp;
  createdBy: string;
}

export async function getGenresByOrg(orgId: string): Promise<GenreRecord[]> {
  const db = getDb();
  if (!db) return [];
  const snap = await getDocs(
    query(
      collection(db, 'organization_genres'),
      where('organizationId', '==', orgId),
      orderBy('name', 'asc'),
    ),
  );
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as GenreRecord);
}

export async function createGenre(orgId: string, name: string, actorId: string): Promise<GenreRecord> {
  const db = getDb();
  if (!db) throw new Error('Firestore not initialized');
  const trimmed = name.trim();
  const ref = await addDoc(collection(db, 'organization_genres'), {
    organizationId: orgId,
    name: trimmed,
    createdAt: Timestamp.now(),
    createdBy: actorId,
  });
  return {
    id: ref.id,
    organizationId: orgId,
    name: trimmed,
    createdAt: Timestamp.now(),
    createdBy: actorId,
  };
}

export async function getOrCreateGenre(orgId: string, name: string, actorId: string): Promise<GenreRecord> {
  const existing = await getGenresByOrg(orgId);
  const found = existing.find((g) => g.name.toLowerCase() === name.trim().toLowerCase());
  if (found) return found;
  return createGenre(orgId, name, actorId);
}

export async function getSubgenresByGenre(orgId: string, genreId: string): Promise<SubgenreRecord[]> {
  const db = getDb();
  if (!db) return [];
  const snap = await getDocs(
    query(
      collection(db, 'organization_subgenres'),
      where('organizationId', '==', orgId),
      where('genreId', '==', genreId),
      orderBy('name', 'asc'),
    ),
  );
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as SubgenreRecord);
}

export async function createSubgenre(orgId: string, genreId: string, name: string, actorId: string): Promise<SubgenreRecord> {
  const db = getDb();
  if (!db) throw new Error('Firestore not initialized');
  const trimmed = name.trim();
  const ref = await addDoc(collection(db, 'organization_subgenres'), {
    organizationId: orgId,
    genreId,
    name: trimmed,
    createdAt: Timestamp.now(),
    createdBy: actorId,
  });
  return {
    id: ref.id,
    organizationId: orgId,
    genreId,
    name: trimmed,
    createdAt: Timestamp.now(),
    createdBy: actorId,
  };
}

export async function getOrCreateSubgenre(orgId: string, genreId: string, name: string, actorId: string): Promise<SubgenreRecord> {
  const existing = await getSubgenresByGenre(orgId, genreId);
  const found = existing.find((s) => s.name.toLowerCase() === name.trim().toLowerCase());
  if (found) return found;
  return createSubgenre(orgId, genreId, name, actorId);
}
