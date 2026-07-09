import type { Task } from '@/app/(app)/types';
import type { CreditRecord } from './credit-repository';
import type { TrackRightRecord } from './rights-repository';
import type { DistributionChannelRecord } from './distribution-channel-repository';
import type { DistributionScheduleRecord } from './distribution-schedule-repository';

export type ReportDomain =
  | 'releases'
  | 'tracks'
  | 'tasks'
  | 'assets'
  | 'credits'
  | 'rights'
  | 'distribution'
  | 'team_activity';

export type ReportFormat = 'json' | 'csv';

export interface ReportConfig {
  domain: ReportDomain;
  orgId: string;
  filters?: {
    status?: string;
    dateFrom?: string;
    dateTo?: string;
    ownerId?: string;
    artistId?: string;
    releaseId?: string;
  };
}

export interface ReportResult {
  config: ReportConfig;
  generatedAt: string;
  rowCount: number;
  data: Record<string, unknown>[];
}

function csvEscape(value: unknown): string {
  if (value === null || value === undefined) return '';
  const str = String(value);
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

export function exportReport(result: ReportResult, format: ReportFormat): string {
  if (format === 'json') {
    return JSON.stringify(result, null, 2);
  }

  if (result.data.length === 0) return '';

  const headers = Object.keys(result.data[0]!);
  const headerRow = headers.join(',');
  const dataRows = result.data.map((row) =>
    headers.map((h) => csvEscape(row[h])).join(',')
  );
  return [headerRow, ...dataRows].join('\n');
}

async function generateReleasesReport(
  config: ReportConfig,
): Promise<Record<string, unknown>[]> {
  const { getReleasesByOrganization } = await import('./release-repository');
  const releases = await getReleasesByOrganization(config.orgId);
  let filtered = releases;
  if (config.filters?.status) {
    filtered = filtered.filter((r) => r.status === config.filters!.status);
  }
  if (config.filters?.dateFrom) {
    const from = new Date(config.filters.dateFrom).getTime();
    filtered = filtered.filter((r) => {
      const ts = r.createdAt as { toDate?: () => Date } | undefined;
      return ts?.toDate?.()?.getTime() ?? 0 >= from;
    });
  }
  if (config.filters?.dateTo) {
    const to = new Date(config.filters.dateTo).getTime();
    filtered = filtered.filter((r) => {
      const ts = r.createdAt as { toDate?: () => Date } | undefined;
      return ts?.toDate?.()?.getTime() ?? 0 <= to;
    });
  }
  return filtered.map((r) => ({
    id: r.id,
    title: r.title,
    releaseType: r.releaseType,
    status: r.status,
    createdBy: r.createdBy,
    targetReleaseDate: r.targetReleaseDate,
    upc: r.upc,
    label: r.label,
    genre: r.genre,
    createdAt: r.createdAt,
  }));
}

async function generateTracksReport(
  config: ReportConfig,
): Promise<Record<string, unknown>[]> {
  const { getTracksByOrg } = await import('./track-repository');
  let tracks = await getTracksByOrg(config.orgId);
  if (config.filters?.releaseId) {
    const { getTracksByRelease } = await import('./release-track-repository');
    const releaseTracks = await getTracksByRelease(config.filters.releaseId);
    const trackIds = new Set(
      releaseTracks.map((rt) => rt.trackId),
    );
    tracks = tracks.filter((t) => trackIds.has(t.id));
  }
  if (config.filters?.status) {
    tracks = tracks.filter((t) => t.status === config.filters!.status);
  }
  return tracks.map((t) => ({
    id: t.id,
    title: t.title,
    isrc: t.isrc,
    duration: t.duration,
    status: t.status,
    genre: t.genre,
    explicit: t.explicit,
    version: t.version,
    createdAt: t.createdAt,
  }));
}

async function generateTasksReport(
  config: ReportConfig,
): Promise<Record<string, unknown>[]> {
  const { getDb } = await import('./firebase');
  const { collection, query, where, getDocs } = await import('@firebase/firestore');
  const db = getDb();
  if (!db) return [];

  const releases = await (async () => {
    const { getReleasesByOrganization } = await import('./release-repository');
    return getReleasesByOrganization(config.orgId);
  })();
  const releaseIds = releases.map((r) => r.id);
  if (releaseIds.length === 0) return [];

  const tasks: Task[] = [];
  for (const releaseId of releaseIds) {
    const snap = await getDocs(
      query(
        collection(db, 'tasks'),
        where('releaseId', '==', releaseId),
      ),
    );
    for (const d of snap.docs) {
      tasks.push({ id: d.id, ...d.data() } as Task);
    }
  }

  let filtered = tasks;
  if (config.filters?.status) {
    filtered = filtered.filter((t) => t.status === config.filters!.status);
  }
  if (config.filters?.ownerId) {
    filtered = filtered.filter((t) => t.assigneeId === config.filters!.ownerId);
  }
  if (config.filters?.releaseId) {
    filtered = filtered.filter((t) => t.releaseId === config.filters!.releaseId);
  }
  return filtered.map((t) => ({
    id: t.id,
    title: t.title,
    priority: t.priority,
    status: t.status,
    assigneeId: t.assigneeId,
    releaseId: t.releaseId,
    stageId: t.stageId,
    dueDate: t.dueDate,
    createdAt: t.createdAt,
  }));
}

async function generateAssetsReport(
  config: ReportConfig,
): Promise<Record<string, unknown>[]> {
  const { getAssetsByOrg } = await import('./asset-entity-repository');
  let assets = await getAssetsByOrg(config.orgId);
  if (config.filters?.releaseId) {
    assets = assets.filter((a) => a.releaseId === config.filters!.releaseId);
  }
  return assets.map((a) => ({
    id: a.id,
    name: a.name,
    type: a.type,
    filename: a.filename,
    contentType: a.contentType,
    sizeBytes: a.sizeBytes,
    status: a.status,
    releaseId: a.releaseId,
    createdAt: a.createdAt,
  }));
}

async function generateCreditsReport(
  config: ReportConfig,
): Promise<Record<string, unknown>[]> {
  const { getDb } = await import('./firebase');
  const { collection, query, where, getDocs } = await import('@firebase/firestore');
  const db = getDb();
  if (!db) return [];

  const snap = await getDocs(
    query(
      collection(db, 'credits'),
      where('organizationId', '==', config.orgId),
    ),
  );
  let credits = snap.docs.map((d) => ({
    id: d.id,
    ...d.data(),
  }) as CreditRecord);

  if (config.filters?.releaseId) {
    const { getTracksByRelease } = await import('./release-track-repository');
    const releaseTracks = await getTracksByRelease(config.filters.releaseId);
    const trackIds = new Set(
      releaseTracks.map((rt) => rt.trackId),
    );
    credits = credits.filter((c) => trackIds.has(c.trackId));
  }

  return credits.map((c) => ({
    id: c.id,
    trackId: c.trackId,
    personId: c.personId,
    creditType: c.creditType,
    creditName: c.creditName,
    displayOrder: c.displayOrder,
    visible: c.visible,
    verified: c.verified,
    createdAt: c.createdAt,
  }));
}

async function generateRightsReport(
  config: ReportConfig,
): Promise<Record<string, unknown>[]> {
  const { getDb } = await import('./firebase');
  const { collection, query, where, getDocs } = await import('@firebase/firestore');
  const db = getDb();
  if (!db) return [];

  const snap = await getDocs(
    query(
      collection(db, 'track_rights'),
      where('organizationId', '==', config.orgId),
    ),
  );
  let rights = snap.docs.map((d) => ({
    id: d.id,
    ...d.data(),
  }) as TrackRightRecord);

  if (config.filters?.releaseId) {
    const { getTracksByRelease } = await import('./release-track-repository');
    const releaseTracks = await getTracksByRelease(config.filters.releaseId);
    const trackIds = new Set(
      releaseTracks.map((rt) => rt.trackId),
    );
    rights = rights.filter((r) => trackIds.has(r.trackId));
  }

  return rights.map((r) => ({
    id: r.id,
    trackId: r.trackId,
    rightType: r.rightType,
    territory: r.territory,
    status: r.status,
    effectiveDate: r.effectiveDate,
    expiryDate: r.expiryDate,
    notes: r.notes,
    createdAt: r.createdAt,
  }));
}

async function generateDistributionReport(
  config: ReportConfig,
): Promise<Record<string, unknown>[]> {
  const { getDb } = await import('./firebase');
  const { collection, query, where, getDocs, orderBy } = await import('@firebase/firestore');
  const db = getDb();
  if (!db) return [];

  const releases = await (async () => {
    const { getReleasesByOrganization } = await import('./release-repository');
    return getReleasesByOrganization(config.orgId);
  })();
  const releaseIds = releases.map((r) => r.id);
  if (releaseIds.length === 0) return [];

  const results: Record<string, unknown>[] = [];

  for (const releaseId of releaseIds) {
    const [channelsSnap, packagesSnap, schedulesSnap] = await Promise.all([
      getDocs(
        query(
          collection(db, 'distribution_channels'),
          where('releaseId', '==', releaseId),
        ),
      ),
      getDocs(
        query(
          collection(db, 'distribution_packages'),
          where('releaseId', '==', releaseId),
          orderBy('createdAt', 'desc'),
        ),
      ),
      getDocs(
        query(
          collection(db, 'distribution_schedules'),
          where('releaseId', '==', releaseId),
        ),
      ),
    ]);

    const releaseTitle =
      releases.find((r) => r.id === releaseId)?.title ?? releaseId;

    for (const d of channelsSnap.docs) {
      const ch = { id: d.id, ...d.data() } as DistributionChannelRecord;
      results.push({
        releaseId,
        releaseTitle,
        entity: 'channel',
        channel: ch.channel,
        status: ch.status,
        deliveryDate: ch.deliveryDate,
        publicationDate: ch.publicationDate,
      });
    }

    for (const d of packagesSnap.docs) {
      const pkg = d.data();
      results.push({
        releaseId,
        releaseTitle,
        entity: 'package',
        packageId: d.id,
        status: pkg.status as string,
        completeness: pkg.completeness as number,
        generatedAt: pkg.generatedAt as unknown,
      });
    }

    for (const d of schedulesSnap.docs) {
      const sched = { id: d.id, ...d.data() } as DistributionScheduleRecord;
      results.push({
        releaseId,
        releaseTitle,
        entity: 'schedule',
        scheduleId: sched.id,
        releaseDate: sched.releaseDate,
        distributionDate: sched.distributionDate,
        presaveDate: sched.presaveDate,
        announcementDate: sched.announcementDate,
      });
    }
  }

  return results;
}

async function generateTeamActivityReport(
  config: ReportConfig,
): Promise<Record<string, unknown>[]> {
  const { getRecentActivity } = await import('./activity-service');
  let activities = await getRecentActivity(config.orgId, 200);
  if (config.filters?.dateFrom) {
    const from = new Date(config.filters.dateFrom).getTime();
    activities = activities.filter((a) => {
      const ts = a.createdAt as { toDate?: () => Date } | undefined;
      return ts?.toDate?.()?.getTime() ?? 0 >= from;
    });
  }
  if (config.filters?.dateTo) {
    const to = new Date(config.filters.dateTo).getTime();
    activities = activities.filter((a) => {
      const ts = a.createdAt as { toDate?: () => Date } | undefined;
      return ts?.toDate?.()?.getTime() ?? 0 <= to;
    });
  }
  return activities.map((a) => ({
    id: a.id,
    entityType: a.entityType,
    entityId: a.entityId,
    actorId: a.actorId,
    action: a.action,
    details: a.details,
    metadata: a.metadata,
    createdAt: a.createdAt,
  }));
}

const domainGenerators: Record<
  ReportDomain,
  (config: ReportConfig) => Promise<Record<string, unknown>[]>
> = {
  releases: generateReleasesReport,
  tracks: generateTracksReport,
  tasks: generateTasksReport,
  assets: generateAssetsReport,
  credits: generateCreditsReport,
  rights: generateRightsReport,
  distribution: generateDistributionReport,
  team_activity: generateTeamActivityReport,
};

export async function generateReport(config: ReportConfig): Promise<ReportResult> {
  const generator = domainGenerators[config.domain];
  const data = await generator(config);
  return {
    config,
    generatedAt: new Date().toISOString(),
    rowCount: data.length,
    data,
  };
}

export async function getReportSummary(
  orgId: string,
): Promise<{ domain: ReportDomain; count: number }[]> {
  const domains: ReportDomain[] = [
    'releases',
    'tracks',
    'tasks',
    'assets',
    'credits',
    'rights',
    'distribution',
    'team_activity',
  ];

  const configs: ReportConfig[] = domains.map((domain) => ({
    domain,
    orgId,
  }));

  const results = await Promise.all(
    configs.map(async (config) => {
      try {
        const { rowCount } = await generateReport(config);
        return { domain: config.domain, count: rowCount };
      } catch {
        return { domain: config.domain, count: 0 };
      }
    }),
  );

  return results;
}
