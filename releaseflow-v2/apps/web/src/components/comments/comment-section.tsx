'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { useOrgStore } from '@/stores/org-store';
import { getEntityComments, addComment, editComment, removeComment } from '@/lib/comments-service';
import { processMentions } from '@/lib/mentions-service';
import type { CommentWithReplies } from '@/lib/comments-service';
import { Button, TextArea, EmptyState, LoadingState } from '@releaseflow/ui';
import { IdentityAvatar } from '@/components/identity-avatar';
import { useIdentity } from '@/hooks/useIdentity';
import { toast } from '@/stores/toast-store';

interface CommentSectionProps {
  entityType: 'release' | 'track' | 'task';
  entityId: string;
  title?: string;
}

function formatDate(value: unknown): string {
  if (!value) return '';
  try {
    const obj = value as { seconds?: number; toDate?(): Date };
    if (typeof obj.seconds === 'number') return new Date(obj.seconds * 1000).toLocaleString();
    if (typeof obj.toDate === 'function') return obj.toDate().toLocaleString();
    if (value instanceof Date) return value.toLocaleString();
    return String(value);
  } catch {
    return '';
  }
}

function renderContent(content: string): string {
  let html = content
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

  html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
  html = html.replace(/\*(.+?)\*/g, '<em>$1</em>');
  html = html.replace(/`(.+?)`/g, '<code>$1</code>');
  html = html.replace(/@([\w\s]+)/g, '<span class="text-primary-400 font-medium">@$1</span>');

  return html;
}

function AuthorLabel({ userId }: { userId: string }) {
  const { identity } = useIdentity(userId);
  return (
    <span className="text-sm font-medium text-primary-400">
      {identity?.displayName || 'User'}
    </span>
  );
}

export function CommentSection({ entityType, entityId, title }: CommentSectionProps) {
  const { activeOrgId } = useOrgStore();
  const { user } = useAuth();
  const [comments, setComments] = useState<CommentWithReplies[]>([]);
  const [loading, setLoading] = useState(true);
  const [newComment, setNewComment] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const loadComments = useCallback(async () => {
    if (!activeOrgId) return;
    setLoading(true);
    try {
      const data = await getEntityComments(entityType, entityId);
      setComments(data);
    } catch {
      setComments([]);
    } finally {
      setLoading(false);
    }
  }, [activeOrgId, entityType, entityId]);

  useEffect(() => {
    void loadComments();
  }, [loadComments]);

  async function handleSubmit() {
    if (!newComment.trim() || !activeOrgId || !user?.uid) return;
    setSubmitting(true);
    try {
      await addComment(entityType, entityId, activeOrgId, user.uid, newComment.trim());
      await processMentions(newComment, entityType, entityId, activeOrgId, user.uid);
      setNewComment('');
      await loadComments();
      toast.success('Comment added');
    } catch {
      toast.error('Failed to add comment');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleEdit(commentId: string) {
    if (!editContent.trim() || !user?.uid) return;
    try {
      await editComment(commentId, editContent.trim(), user.uid);
      setEditingId(null);
      setEditContent('');
      await loadComments();
      toast.success('Comment updated');
    } catch {
      toast.error('Failed to update comment');
    }
  }

  async function handleDelete(commentId: string) {
    try {
      await removeComment(commentId);
      await loadComments();
      toast.success('Comment deleted');
    } catch {
      toast.error('Failed to delete comment');
    }
  }

  return (
    <div className="mt-8">
      <h3 className="text-base font-semibold text-primary-400 mb-4">{title ?? 'Comments'}</h3>

      {loading ? (
        <LoadingState />
      ) : comments.length === 0 ? (
        <EmptyState title="No comments yet" description="Start the discussion by adding a comment." />
      ) : (
        <div className="space-y-4">
          {comments.map((comment) => (
            <div key={comment.id} className="rounded-xl border border-surface-200/80 bg-layer-2 p-4">
              <div className="flex items-start gap-3">
                <IdentityAvatar userId={comment.authorId} size="sm" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <AuthorLabel userId={comment.authorId} />
                    <span className="text-xs text-text-500">{formatDate(comment.createdAt)}</span>
                    {Boolean(comment.editedAt) && comment.editedBy && comment.editedBy !== comment.authorId ? (
                      <span className="text-xs text-text-500">(edited)</span>
                    ) : null}
                    {Boolean(comment.editedAt) && comment.editedBy === comment.authorId ? (
                      <span className="text-xs text-text-500">(edited)</span>
                    ) : null}
                  </div>

                  {editingId === comment.id ? (
                    <div className="space-y-2">
                      <TextArea
                        value={editContent}
                        onChange={(e) => setEditContent(e.target.value)}
                        rows={3}
                      />
                      <div className="flex gap-2">
                        <Button size="sm" onClick={() => void handleEdit(comment.id)} disabled={!editContent.trim()}>
                          Save
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => {
                            setEditingId(null);
                            setEditContent('');
                          }}
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div
                      className="text-sm text-surface-100 whitespace-pre-wrap"
                      dangerouslySetInnerHTML={{ __html: renderContent(comment.content) }}
                    />
                  )}

                  {user?.uid === comment.authorId && editingId !== comment.id ? (
                    <div className="flex gap-2 mt-2">
                      <button
                        type="button"
                        onClick={() => {
                          setEditingId(comment.id);
                          setEditContent(comment.content);
                        }}
                        className="text-xs text-text-500 hover:text-primary-400 transition-colors"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => void handleDelete(comment.id)}
                        className="text-xs text-text-500 hover:text-danger-600 transition-colors"
                      >
                        Delete
                      </button>
                    </div>
                  ) : null}

                  {comment.replies.length > 0 ? (
                    <div className="mt-3 ml-4 space-y-3 border-l-2 border-surface-700/60 pl-4">
                      {comment.replies.map((reply) => (
                        <div key={reply.id} className="flex items-start gap-2">
                          <IdentityAvatar userId={reply.authorId} size="xs" />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-0.5">
                              <AuthorLabel userId={reply.authorId} />
                              <span className="text-xs text-text-500">{formatDate(reply.createdAt)}</span>
                              {reply.editedAt ? (
                                <span className="text-xs text-text-500">(edited)</span>
                              ) : null}
                            </div>
                            <div
                              className="text-sm text-surface-100 whitespace-pre-wrap"
                              dangerouslySetInnerHTML={{ __html: renderContent(reply.content) }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : null}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="mt-4">
        <TextArea
          placeholder="Write a comment... Use **bold**, *italic*, and @mentions."
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          rows={3}
        />
        <div className="flex justify-end mt-2">
          <Button size="sm" onClick={() => void handleSubmit()} disabled={!newComment.trim() || submitting}>
            {submitting ? 'Posting...' : 'Post Comment'}
          </Button>
        </div>
      </div>
    </div>
  );
}
