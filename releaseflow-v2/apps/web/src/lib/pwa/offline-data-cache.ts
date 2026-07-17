/**
 * CE-008 — Recent data cache (IndexedDB).
 * Never stores auth tokens, invitation tokens, or permissions.
 */

import { idbDelete, idbGet, idbGetAll, idbPut } from './idb';

const ASSIGNMENT_TTL_MS = 1000 * 60 * 60 * 24; // 24h
const NOTIFICATION_TTL_MS = 1000 * 60 * 60 * 12; // 12h
const SCHEDULE_TTL_MS = 1000 * 60 * 60 * 6; // 6h
const MAX_ASSIGNMENTS = 40;
const MAX_NOTIFICATIONS = 80;

export interface CachedAssignment {
  id: string;
  userId: string;
  organizationId: string;
  cachedAt: number;
  snapshot: Record<string, unknown>;
}

export interface CachedNotification {
  id: string;
  userId: string;
  organizationId?: string;
  cachedAt: number;
  snapshot: Record<string, unknown>;
}

export interface CachedSchedule {
  key: string; // userId:orgId
  userId: string;
  organizationId: string;
  cachedAt: number;
  snapshot: Record<string, unknown>;
}

export async function cacheAssignmentView(fields: {
  id: string;
  userId: string;
  organizationId: string;
  snapshot: Record<string, unknown>;
}): Promise<void> {
  // Strip anything sensitive if present
  const safe = { ...fields.snapshot };
  delete safe.token;
  delete safe.invitationToken;
  delete safe.authToken;

  await idbPut('assignments', {
    id: fields.id,
    userId: fields.userId,
    organizationId: fields.organizationId,
    cachedAt: Date.now(),
    snapshot: safe,
  } satisfies CachedAssignment);

  // LRU-ish eviction
  const all = await idbGetAll<CachedAssignment>('assignments');
  const mine = all.filter((a) => a.userId === fields.userId).sort((a, b) => b.cachedAt - a.cachedAt);
  for (const extra of mine.slice(MAX_ASSIGNMENTS)) {
    await idbDelete('assignments', extra.id);
  }
}

export async function getCachedAssignment(
  id: string,
  userId: string,
): Promise<CachedAssignment | null> {
  const row = await idbGet<CachedAssignment>('assignments', id);
  if (!row || row.userId !== userId) return null;
  if (Date.now() - row.cachedAt > ASSIGNMENT_TTL_MS) return null;
  return row;
}

export async function listCachedAssignments(userId: string): Promise<CachedAssignment[]> {
  const all = await idbGetAll<CachedAssignment>('assignments');
  return all
    .filter((a) => a.userId === userId && Date.now() - a.cachedAt <= ASSIGNMENT_TTL_MS)
    .sort((a, b) => b.cachedAt - a.cachedAt);
}

export async function cacheNotifications(
  userId: string,
  organizationId: string | undefined,
  notifications: Record<string, unknown>[],
): Promise<void> {
  for (const n of notifications.slice(0, MAX_NOTIFICATIONS)) {
    const id = String(n.id ?? '');
    if (!id) continue;
    await idbPut('notifications', {
      id,
      userId,
      organizationId,
      cachedAt: Date.now(),
      snapshot: n,
    } satisfies CachedNotification);
  }
}

export async function listCachedNotifications(userId: string): Promise<CachedNotification[]> {
  const all = await idbGetAll<CachedNotification>('notifications');
  return all
    .filter((n) => n.userId === userId && Date.now() - n.cachedAt <= NOTIFICATION_TTL_MS)
    .sort((a, b) => b.cachedAt - a.cachedAt);
}

export async function cacheScheduleSnapshot(fields: {
  userId: string;
  organizationId: string;
  snapshot: Record<string, unknown>;
}): Promise<void> {
  const key = `${fields.userId}:${fields.organizationId}`;
  await idbPut('schedule', {
    key,
    userId: fields.userId,
    organizationId: fields.organizationId,
    cachedAt: Date.now(),
    snapshot: fields.snapshot,
  } satisfies CachedSchedule);
}

export async function getCachedSchedule(
  userId: string,
  organizationId: string,
): Promise<CachedSchedule | null> {
  const row = await idbGet<CachedSchedule>('schedule', `${userId}:${organizationId}`);
  if (!row) return null;
  if (Date.now() - row.cachedAt > SCHEDULE_TTL_MS) return null;
  return row;
}

export async function setMeta(key: string, value: unknown): Promise<void> {
  await idbPut('meta', { key, value, updatedAt: Date.now() });
}

export async function getMeta<T>(key: string): Promise<T | undefined> {
  const row = await idbGet<{ key: string; value: T }>('meta', key);
  return row?.value;
}
