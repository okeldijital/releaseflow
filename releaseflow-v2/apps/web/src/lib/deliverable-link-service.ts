import {
  createDeliverableLink as repoCreate,
  getDeliverableLinksByAssignment as repoGetByAssignment,
  deleteDeliverableLink as repoDelete,
} from './deliverable-link-repository';
import type { DeliverableLinkRecord, CreateDeliverableLinkFields, DeliverableLinkProvider } from './deliverable-link-repository';
import { recordActivity } from './activity-service';

export type { DeliverableLinkRecord, DeliverableLinkProvider };

export async function addDeliverableLink(
  fields: CreateDeliverableLinkFields,
): Promise<DeliverableLinkRecord> {
  if (!fields.url.trim()) throw new Error('URL is required');
  if (!fields.label.trim()) throw new Error('Label is required');

  const link = await repoCreate(fields);

  await recordActivity({
    entityType: 'task',
    entityId: fields.assignmentId,
    organizationId: fields.organizationId,
    actorId: fields.createdBy,
    action: 'deliverable.added',
    details: `Deliverable link added: ${fields.label}`,
    metadata: { provider: fields.provider, url: fields.url },
  });

  return link;
}

export async function fetchDeliverableLinks(assignmentId: string): Promise<DeliverableLinkRecord[]> {
  return repoGetByAssignment(assignmentId);
}

export async function removeDeliverableLink(
  linkId: string,
  assignmentId: string,
  organizationId: string,
  actorId: string,
): Promise<void> {
  await repoDelete(linkId);

  await recordActivity({
    entityType: 'task',
    entityId: assignmentId,
    organizationId,
    actorId,
    action: 'deliverable.removed',
    details: 'Deliverable link removed',
  });
}
