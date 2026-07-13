import { getPeopleByOrg } from '@/lib/people-repository';
import { createNotification } from '@/lib/notification-service';

const MENTION_REGEX = /@([\w\s]+)/g;

export function extractMentions(content: string): string[] {
  const matches = content.match(MENTION_REGEX);
  if (!matches) return [];
  return matches.map((m) => m.slice(1).trim());
}

export async function processMentions(
  content: string,
  entityType: string,
  entityId: string,
  orgId: string,
  authorId: string,
): Promise<string[]> {
  const names = extractMentions(content);
  if (names.length === 0) return [];

  const people = await getPeopleByOrg(orgId);
  const nameLower = names.map((n) => n.toLowerCase());

  // Mention targets are collaborators, so they are identified by personId.
  const mentionedPersonIds: string[] = [];

  for (const person of people) {
    if (nameLower.includes(person.displayName.toLowerCase()) && person.userId) {
      const preview = content.length > 80 ? content.slice(0, 77) + '...' : content;

      // Notification delivery/routing still resolves through the linked
      // authentication identity (userId); only the mention target is a personId.
      await createNotification({
        userId: person.userId,
        type: 'mention',
        title: 'You were mentioned',
        message: `${authorId} mentioned you in a ${entityType}: "${preview}"`,
        referenceId: entityId,
        referenceType: entityType,
      });

      mentionedPersonIds.push(person.id);
    }
  }

  return mentionedPersonIds;
}
