import {
  createAssignmentComment as repoCreate,
  getAssignmentComment as repoGet,
  updateAssignmentComment as repoUpdate,
  softDeleteAssignmentComment as repoSoftDelete,
  getAssignmentComments as repoList,
  type AssignmentCommentRecord,
} from './assignment-comments-repository';
import type { QueryDocumentSnapshot, DocumentData } from '@firebase/firestore';
import { recordActivity } from './activity-service';
import { getAssignment } from './assignment-repository';
import { getPeopleByOrg } from './people-repository';
import { generateNotificationEvent } from './notification-event-service';
import type { AppRole } from '@/stores/role-store';

export type { AssignmentCommentRecord };
export type { AppRole };

export function canModerateComments(role: AppRole): boolean {
  return role === 'owner' || role === 'admin' || role === 'release_manager';
}

export function canComment(role: AppRole): boolean {
  return role !== 'viewer';
}

async function assertMentionsInOrganization(
  organizationId: string,
  mentionedUserIds: string[],
): Promise<void> {
  if (mentionedUserIds.length === 0) return;
  const people = await getPeopleByOrg(organizationId);
  const orgPersonIds = new Set(people.map((p) => p.id));
  const orgUserIds = new Set(people.map((p) => p.userId).filter(Boolean) as string[]);
  for (const id of mentionedUserIds) {
    if (!orgPersonIds.has(id) && !orgUserIds.has(id)) {
      throw new Error(`Mentioned user ${id} is not a member of this organization`);
    }
  }
}

export async function addAssignmentComment(
  fields: {
    assignmentId: string;
    organizationId: string;
    authorId: string;
    authorName: string;
    message: string;
    parentCommentId?: string | null;
    mentionedUserIds?: string[];
  },
  role: AppRole,
): Promise<AssignmentCommentRecord> {
  if (!canComment(role)) throw new Error('You do not have permission to comment');
  if (!fields.message.trim()) throw new Error('Comment message is required');

  const assignment = await getAssignment(fields.assignmentId);
  if (!assignment) throw new Error('Assignment not found');
  if (assignment.organizationId !== fields.organizationId) {
    throw new Error('Assignment does not belong to this organization');
  }

  if (fields.parentCommentId) {
    const parent = await repoGet(fields.parentCommentId);
    if (!parent) throw new Error('Parent comment not found');
    if (parent.assignmentId !== fields.assignmentId) {
      throw new Error('Parent comment does not belong to this assignment');
    }
    if (parent.parentCommentId) {
      throw new Error('Cannot reply to a reply');
    }
  }

  const mentionedUserIds = [...new Set(fields.mentionedUserIds ?? [])];
  await assertMentionsInOrganization(fields.organizationId, mentionedUserIds);

  const comment = await repoCreate({
    assignmentId: fields.assignmentId,
    organizationId: fields.organizationId,
    authorId: fields.authorId,
    authorName: fields.authorName,
    message: fields.message.trim(),
    parentCommentId: fields.parentCommentId ?? null,
    mentionedUserIds,
  });

  const isReply = !!fields.parentCommentId;
  const action = isReply ? 'reply.added' : 'comment.added';
  const details = isReply
    ? `${fields.authorName} replied to a comment`
    : `${fields.authorName} added a comment`;

  await recordActivity({
    entityType: 'task',
    entityId: fields.assignmentId,
    organizationId: fields.organizationId,
    actorId: fields.authorId,
    action,
    metadata: {
      commentId: comment.id,
      details,
      parentCommentId: fields.parentCommentId ?? null,
    },
  });

  await generateNotificationEvent({
    type: isReply ? 'comment.reply' : 'comment.created',
    organizationId: fields.organizationId,
    actorId: fields.authorId,
    entityId: fields.assignmentId,
    entityType: 'assignment',
    metadata: { commentId: comment.id, message: fields.message },
  });

  if (mentionedUserIds.length > 0) {
    await recordActivity({
      entityType: 'task',
      entityId: fields.assignmentId,
      organizationId: fields.organizationId,
      actorId: fields.authorId,
      action: 'comment.mentioned',
      metadata: {
        commentId: comment.id,
        mentionedUserIds,
        details: `${fields.authorName} mentioned collaborators`,
      },
    });

    for (const mentionedId of mentionedUserIds) {
      await generateNotificationEvent({
        type: 'comment.mentioned',
        organizationId: fields.organizationId,
        actorId: fields.authorId,
        recipientId: mentionedId,
        entityId: fields.assignmentId,
        entityType: 'assignment',
        metadata: { commentId: comment.id, message: fields.message },
      });
    }
  }

  return comment;
}

export async function editAssignmentComment(
  commentId: string,
  message: string,
  actorId: string,
  role: AppRole,
  mentionedUserIds?: string[],
): Promise<void> {
  if (!canComment(role)) throw new Error('You do not have permission to edit comments');
  if (!message.trim()) throw new Error('Comment message is required');

  const comment = await repoGet(commentId);
  if (!comment) throw new Error('Comment not found');
  if (comment.isDeleted) throw new Error('Cannot edit a deleted comment');
  if (comment.authorId !== actorId) throw new Error('You can only edit your own comments');

  const mentions = mentionedUserIds !== undefined
    ? [...new Set(mentionedUserIds)]
    : undefined;
  if (mentions) {
    await assertMentionsInOrganization(comment.organizationId, mentions);
  }

  await repoUpdate(commentId, {
    message: message.trim(),
    ...(mentions !== undefined ? { mentionedUserIds: mentions } : {}),
  });

  await recordActivity({
    entityType: 'task',
    entityId: comment.assignmentId,
    organizationId: comment.organizationId,
    actorId,
    action: 'comment.edited',
    metadata: {
      commentId,
      details: `${comment.authorName} edited a comment`,
    },
  });
}

export async function deleteAssignmentComment(
  commentId: string,
  actorId: string,
  role: AppRole,
): Promise<void> {
  const comment = await repoGet(commentId);
  if (!comment) throw new Error('Comment not found');
  if (comment.isDeleted) return;

  const canDelete = canModerateComments(role) || comment.authorId === actorId;
  if (!canDelete) {
    throw new Error('You do not have permission to delete this comment');
  }

  await repoSoftDelete(commentId);

  await recordActivity({
    entityType: 'task',
    entityId: comment.assignmentId,
    organizationId: comment.organizationId,
    actorId,
    action: 'comment.deleted',
    metadata: {
      commentId,
      details: `${comment.authorName}'s comment was deleted`,
    },
  });
}

export async function getAssignmentCommentsPage(
  assignmentId: string,
  opts?: {
    pageSize?: number;
    cursor?: QueryDocumentSnapshot<DocumentData>;
  },
): Promise<{
  comments: AssignmentCommentRecord[];
  hasMore: boolean;
  oldestDoc: QueryDocumentSnapshot<DocumentData> | null;
}> {
  return repoList(assignmentId, opts);
}

export async function getAssignmentCommentThreads(
  assignmentId: string,
  opts?: {
    pageSize?: number;
    cursor?: QueryDocumentSnapshot<DocumentData>;
  },
): Promise<{
  threads: { comment: AssignmentCommentRecord; replies: AssignmentCommentRecord[] }[];
  hasMore: boolean;
  oldestDoc: QueryDocumentSnapshot<DocumentData> | null;
}> {
  const { comments, hasMore, oldestDoc } = await repoList(assignmentId, opts);

  const topLevel = comments.filter((c) => !c.parentCommentId);
  const replyMap = new Map<string, AssignmentCommentRecord[]>();
  for (const c of comments) {
    if (c.parentCommentId) {
      const list = replyMap.get(c.parentCommentId) ?? [];
      list.push(c);
      replyMap.set(c.parentCommentId, list);
    }
  }

  return {
    threads: topLevel.map((comment) => ({
      comment,
      replies: replyMap.get(comment.id) ?? [],
    })),
    hasMore,
    oldestDoc,
  };
}
