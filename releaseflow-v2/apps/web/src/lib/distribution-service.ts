import {
  createPackage, updatePackage, getLatestPackage,
  getPackagesByRelease, getReleaseData, recordEvent, getEvents,
} from './distribution-repository';
import {
  createDistributionChannel,
} from './distribution-channel-repository';
import {
  createDistributionSchedule,
  getScheduleByRelease,
  updateDistributionSchedule,
} from './distribution-schedule-repository';
import {
  createTrackDelivery,
  getDeliveriesByRelease,
} from './distribution-delivery-repository';
import { getTracksByRelease } from './release-track-repository';
import { getRequirementsByRelease } from './requirement-service';
import { getDeliverablesByRelease } from './deliverable-service';
import { getBlockingDependencies } from './dependency-service';
import type { DistributionPackageRecord, DistributionEventRecord } from './distribution-repository';
import type { DistributionChannel, DistributionChannelRecord } from './distribution-channel-repository';
import type { DistributionScheduleRecord } from './distribution-schedule-repository';
import type { TrackDeliveryVariant, TrackDeliveryRecord } from './distribution-delivery-repository';
import type { Release } from '@/app/(app)/types';

export type { DistributionPackageRecord, DistributionEventRecord } from './distribution-repository';

const REQUIRED_METADATA_FIELDS = [
  'upc', 'catalogNumber', 'label', 'copyright', 'pLine', 'cLine', 'genre', 'language',
] as const;

export interface DistributionReadiness {
  canDistribute: boolean;
  completeness: number;
  metadataReady: boolean;
  deliverablesReady: boolean;
  requirementsReady: boolean;
  dependenciesReady: boolean;
  missingMetadata: string[];
  missingDeliverables: number;
  missingRequirements: number;
  missingDependencies: number;
}

export function checkDistributionReadiness(
  release: Release,
  deliverablesCount: number,
  approvedDeliverables: number,
  reqTotal: number,
  reqApproved: number,
  blockingDepCount: number,
  blockingDepCompleted: number,
): DistributionReadiness {
  const missingMetadata = REQUIRED_METADATA_FIELDS.filter((f) => !release[f]);
  const metadataReady = missingMetadata.length === 0;
  const deliverablesReady = approvedDeliverables > 0 && approvedDeliverables === deliverablesCount;
  const requirementsReady = reqTotal > 0 && reqApproved === reqTotal;
  const dependenciesReady = blockingDepCompleted === blockingDepCount;

  let score = 0;
  const weights = 4;
  if (metadataReady) score++;
  if (deliverablesReady) score++;
  if (requirementsReady) score++;
  if (dependenciesReady) score++;
  const completeness = Math.round((score / weights) * 100);

  return {
    canDistribute: metadataReady && deliverablesReady && requirementsReady && dependenciesReady,
    completeness,
    metadataReady,
    deliverablesReady,
    requirementsReady,
    dependenciesReady,
    missingMetadata,
    missingDeliverables: deliverablesCount - approvedDeliverables,
    missingRequirements: reqTotal - reqApproved,
    missingDependencies: blockingDepCount - blockingDepCompleted,
  };
}

export async function generateDistributionPackage(releaseId: string): Promise<string> {
  const [releaseData, reqs, dels, blockingDeps] = await Promise.all([
    getReleaseData(releaseId),
    getRequirementsByRelease(releaseId),
    getDeliverablesByRelease(releaseId),
    getBlockingDependencies(releaseId),
  ]);
  if (!releaseData) throw new Error('Release not found');

  const approvedDels = dels.filter((d) => d.status === 'approved').length;
  const approvedReqs = reqs.filter((r) => r.status === 'approved').length;

  const readiness = checkDistributionReadiness(
    releaseData as unknown as Release,
    dels.length,
    approvedDels,
    reqs.length,
    approvedReqs,
    blockingDeps.length,
    blockingDeps.filter((d) => d.status === 'completed').length,
  );

  const existing = await getLatestPackage(releaseId);
  if (existing) {
    await updatePackage(existing.id, {
      completeness: readiness.completeness,
      metadataReady: readiness.metadataReady,
      deliverablesReady: readiness.deliverablesReady,
      requirementsReady: readiness.requirementsReady,
    });
    await recordEvent(existing.id, 'package.updated', { completeness: readiness.completeness });
    return existing.id;
  }

  const id = await createPackage(
    releaseId,
    readiness.canDistribute ? 'generated' : 'draft',
    readiness.completeness,
    readiness.metadataReady,
    readiness.deliverablesReady,
    readiness.requirementsReady,
  );
  await recordEvent(id, 'package.created', { completeness: readiness.completeness });
  return id;
}

export async function fetchLatestPackage(releaseId: string): Promise<DistributionPackageRecord | null> {
  return getLatestPackage(releaseId);
}

export const getLatestDistributionPackage = fetchLatestPackage;

export async function fetchPackagesByRelease(releaseId: string): Promise<DistributionPackageRecord[]> {
  return getPackagesByRelease(releaseId);
}

export async function fetchPackageEvents(packageId: string): Promise<DistributionEventRecord[]> {
  return getEvents(packageId);
}

export function getDistributionReadinessSummary(readiness: DistributionReadiness): { ready: boolean; blockers: string[] } {
  const blockers: string[] = [];
  if (!readiness.metadataReady) blockers.push(`Missing metadata: ${readiness.missingMetadata.join(', ')}`);
  if (!readiness.deliverablesReady) blockers.push(`${readiness.missingDeliverables} unapproved deliverables`);
  if (!readiness.requirementsReady) blockers.push(`${readiness.missingRequirements} pending requirements`);
  if (!readiness.dependenciesReady) blockers.push(`${readiness.missingDependencies} unresolved dependencies`);
  return { ready: readiness.canDistribute, blockers };
}

export async function addDistributionChannel(
  releaseId: string,
  orgId: string,
  channel: DistributionChannel,
): Promise<DistributionChannelRecord> {
  return createDistributionChannel({ releaseId, organizationId: orgId, channel });
}

export async function setReleaseSchedule(
  releaseId: string,
  orgId: string,
  releaseDate: string,
  distributionDate?: string,
  presaveDate?: string,
  announcementDate?: string,
): Promise<DistributionScheduleRecord> {
  const existing = await getScheduleByRelease(releaseId);
  if (existing) {
    await updateDistributionSchedule(existing.id, {
      releaseDate,
      distributionDate: distributionDate ?? null,
      presaveDate: presaveDate ?? null,
      announcementDate: announcementDate ?? null,
    });
    return { ...existing, releaseDate, distributionDate, presaveDate, announcementDate };
  }
  return createDistributionSchedule({
    releaseId,
    organizationId: orgId,
    releaseDate,
    distributionDate: distributionDate ?? null,
    presaveDate: presaveDate ?? null,
    announcementDate: announcementDate ?? null,
  });
}

export async function addTrackDelivery(
  trackId: string,
  releaseId: string,
  orgId: string,
  variant: TrackDeliveryVariant,
): Promise<TrackDeliveryRecord> {
  return createTrackDelivery({ trackId, releaseId, organizationId: orgId, variant });
}

export interface TrackDeliveryStatus {
  trackId: string;
  trackTitle: string;
  variants: { variant: string; deliveryId: string; status: string }[];
}

export async function getReleaseDeliveryStatus(releaseId: string): Promise<TrackDeliveryStatus[]> {
  const [releaseTracks, deliveries] = await Promise.all([
    getTracksByRelease(releaseId),
    getDeliveriesByRelease(releaseId),
  ]);
  return releaseTracks.map((rt) => {
    const trackDeliveries = deliveries.filter((d) => d.trackId === rt.trackId);
    return {
      trackId: rt.trackId,
      trackTitle: rt.track?.title ?? 'Unknown Track',
      variants: trackDeliveries.map((d) => ({
        variant: d.variant,
        deliveryId: d.id,
        status: d.status,
      })),
    };
  });
}
