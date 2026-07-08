import {
  createWork as repoCreate,
  getWork as repoGet,
  updateWork as repoUpdate,
  listWorks as repoList,
  searchWorks as repoSearch,
  archiveWork as repoArchive,
  restoreWork as repoRestore,
  findDuplicateWorks,
  addWriter as repoAddWriter,
  updateWriter as repoUpdateWriter,
  removeWriter as repoRemoveWriter,
  getWriters as repoGetWriters,
  validateSplits as repoValidateSplits,
  addPublisher as repoAddPublisher,
  updatePublisher as repoUpdatePublisher,
  removePublisher as repoRemovePublisher,
  getPublishers as repoGetPublishers,
  linkTrack as repoLinkTrack,
  unlinkTrack as repoUnlinkTrack,
  getLinkedTracks as repoGetLinkedTracks,
} from './work-repository';
import type { WorkRecord, CreateWorkFields, UpdateWorkFields } from './work-repository';

export type { WorkRecord, CreateWorkFields, UpdateWorkFields };

export interface WorkReadinessResult {
  ready: boolean;
  percentage: number;
  missing: string[];
  splitValid: boolean | null;
}

export interface DuplicateInfo {
  isDuplicate: boolean;
  matches: WorkRecord[];
}

export async function createNewWork(fields: CreateWorkFields): Promise<WorkRecord> {
  if (!fields.title.trim()) throw new Error('Work title is required');
  if (!fields.organizationId) throw new Error('Organization ID is required');
  return repoCreate(fields);
}

export async function editWork(workId: string, fields: UpdateWorkFields): Promise<void> {
  return repoUpdate(workId, fields);
}

export async function fetchWork(workId: string): Promise<WorkRecord | null> {
  return repoGet(workId);
}

export async function fetchWorks(orgId: string): Promise<WorkRecord[]> {
  return repoList(orgId);
}

export async function fetchWorkSearch(orgId: string, queryStr: string): Promise<WorkRecord[]> {
  return repoSearch(orgId, queryStr);
}

export async function archiveWork(workId: string): Promise<void> {
  const work = await repoGet(workId);
  if (!work) throw new Error('Work not found');
  if (work.status === 'archived') throw new Error('Work is already archived');
  return repoArchive(workId);
}

export async function restoreWork(workId: string): Promise<void> {
  const work = await repoGet(workId);
  if (!work) throw new Error('Work not found');
  if (work.status !== 'archived') throw new Error('Work is not archived');
  return repoRestore(workId);
}

export async function checkWorkReadiness(workId: string): Promise<WorkReadinessResult> {
  const work = await repoGet(workId);
  if (!work) return { ready: false, percentage: 0, missing: ['Work not found'], splitValid: null };

  const writers = await repoGetWriters(workId);
  const publishers = await repoGetPublishers(workId);
  const tracks = await repoGetLinkedTracks(workId);
  const splitCheck = await repoValidateSplits(workId);

  const checks: [boolean, string][] = [
    [!work.title, 'Title'],
    [!work.iswc, 'ISWC'],
    [!work.pro, 'PRO'],
    [writers.length === 0, 'Writers'],
    [!splitCheck.valid, 'Split Validation'],
    [publishers.length === 0, 'Publishers'],
    [tracks.length === 0, 'Linked Recordings'],
  ];

  const total = checks.length;
  const passed = checks.filter(([fail]) => !fail).length;
  const missing = checks.filter(([fail]) => fail).map(([, label]) => label);

  return {
    ready: missing.length === 0,
    percentage: Math.round((passed / total) * 100),
    missing,
    splitValid: splitCheck.valid,
  };
}

export async function checkDuplicateWorks(orgId: string, title: string): Promise<DuplicateInfo> {
  const matches = await findDuplicateWorks(orgId, title);
  return {
    isDuplicate: matches.length > 0,
    matches,
  };
}

export async function addWorkWriter(workId: string, fields: Parameters<typeof repoAddWriter>[1]): Promise<string> {
  return repoAddWriter(workId, fields);
}

export async function updateWorkWriter(splitId: string, fields: Parameters<typeof repoUpdateWriter>[1]): Promise<void> {
  return repoUpdateWriter(splitId, fields);
}

export async function removeWorkWriter(splitId: string): Promise<void> {
  return repoRemoveWriter(splitId);
}

export async function getWorkWriters(workId: string) {
  return repoGetWriters(workId);
}

export async function validateWorkSplits(workId: string) {
  return repoValidateSplits(workId);
}

export async function addWorkPublisher(workId: string, fields: Parameters<typeof repoAddPublisher>[1]): Promise<string> {
  return repoAddPublisher(workId, fields);
}

export async function updateWorkPublisher(publisherId: string, fields: Parameters<typeof repoUpdatePublisher>[1]): Promise<void> {
  return repoUpdatePublisher(publisherId, fields);
}

export async function removeWorkPublisher(publisherId: string): Promise<void> {
  return repoRemovePublisher(publisherId);
}

export async function getWorkPublishers(workId: string) {
  return repoGetPublishers(workId);
}

export async function linkTrackToWork(workId: string, trackId: string): Promise<string> {
  return repoLinkTrack(workId, trackId);
}

export async function unlinkTrackFromWork(workId: string, trackId: string): Promise<void> {
  return repoUnlinkTrack(workId, trackId);
}

export async function getWorkLinkedTracks(workId: string) {
  return repoGetLinkedTracks(workId);
}
