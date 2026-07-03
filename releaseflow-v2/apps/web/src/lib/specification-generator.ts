import { createSpecification, updateSpecification, type SpecType } from './specification-repository';
import { getTemplate } from './specification-engine';
import { createRequestedAsset } from './asset-lifecycle-service';
import { createTask, assignTask } from './task-service';
import { getTrack } from './track-repository';

export async function generateSpecification(
  trackId: string,
  orgId: string,
  type: SpecType,
  fields: Record<string, string>,
  assignedPersonId?: string,
): Promise<string> {
  const template = getTemplate(type);

  const track = await getTrack(trackId);
  const trackTitle = track?.title ?? trackId;

  const specId = await createSpecification(trackId, orgId, type, `${template.label} — ${trackTitle}`, fields);

  await createRequestedAsset(trackId, orgId, `${template.label} — ${trackTitle}`, 'other', template.label);

  const taskId = await createTask('', '', 'system', {
    title: `${template.label} — ${trackTitle}`,
    description: `Specification task for ${template.label.toLowerCase()} of track "${trackTitle}"`,
  });

  await updateSpecification(specId, { taskId });

  if (assignedPersonId) {
    await updateSpecification(specId, { assignedPersonId });
    await assignTask(taskId, assignedPersonId, '', '', 'system');
  }

  return specId;
}
