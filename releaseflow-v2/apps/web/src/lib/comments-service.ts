import {
  createComment,
  updateComment,
  deleteComment,
  getCommentsByEntity,
  resolveComment,
  type EntityCommentRecord,
  type CreateCommentFields,
} from '@/lib/comments-repository';
import { extractMentions } from '@/lib/mentions-service';

export interface CommentWithReplies extends EntityCommentRecord {
  replies: EntityCommentRecord[];
}

export async function addComment(
  entityType: CreateCommentFields['entityType'],
  entityId: string,
  orgId: string,
  authorId: string,
  content: string,
): Promise<string> {
  console.log('[comments-service] Extracted mentions:', extractMentions(content));
  const comment = await createComment({
    entityType,
    entityId,
    organizationId: orgId,
    authorId,
    content,
  });
  return comment.id;
}

export async function addReply(
  parentCommentId: string,
  entityType: CreateCommentFields['entityType'],
  entityId: string,
  orgId: string,
  authorId: string,
  content: string,
): Promise<string> {
  console.log('[comments-service] Extracted mentions:', extractMentions(content));
  const comment = await createComment({
    entityType,
    entityId,
    organizationId: orgId,
    authorId,
    content,
    parentCommentId,
  });
  return comment.id;
}

export async function editComment(commentId: string, content: string): Promise<void> {
  await updateComment(commentId, { content });
}

export async function removeComment(commentId: string): Promise<void> {
  await deleteComment(commentId);
}

export async function getEntityComments(
  entityType: CreateCommentFields['entityType'],
  entityId: string,
): Promise<CommentWithReplies[]> {
  const allComments = await getCommentsByEntity(entityType, entityId);

  const topLevel = allComments.filter((c) => !c.parentCommentId);
  const replies = allComments.filter((c) => c.parentCommentId);

  const replyMap = new Map<string, EntityCommentRecord[]>();
  for (const reply of replies) {
    const list = replyMap.get(reply.parentCommentId!) || [];
    list.push(reply);
    replyMap.set(reply.parentCommentId!, list);
  }

  return topLevel.map((comment) => ({
    ...comment,
    replies: replyMap.get(comment.id) || [],
  }));
}

export async function resolveThread(commentId: string): Promise<void> {
  await resolveComment(commentId);
}
