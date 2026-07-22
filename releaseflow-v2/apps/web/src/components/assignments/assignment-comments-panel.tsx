'use client';

import {
  useState, useEffect, useCallback, useRef, useMemo,
} from 'react';
import type { QueryDocumentSnapshot, DocumentData } from '@firebase/firestore';
import { useAuth } from '@/contexts/auth-context';
import { useOrgStore } from '@/stores/org-store';
import { useRoleStore } from '@/stores/role-store';
import {
  addAssignmentComment,
  editAssignmentComment,
  deleteAssignmentComment,
  getAssignmentCommentsPage,
  canModerateComments,
  canComment,
  subscribeAssignmentComments,
  type AssignmentCommentRecord,
} from '@/lib/assignment-comments-service';
import {
  getMentionSuggestions,
  getMentionQueryAtCursor,
  insertMentionAtCursor,
  renderCommentMessageHtml,
  type MentionSuggestion,
} from '@/lib/assignment-mentions-service';
import { markCommentRead, getUnreadCommentCount } from '@/lib/assignment-comment-reads-repository';
import { MentionPicker } from './mention-picker';
import { Button, EmptyState, LoadingState, Badge } from '@releaseflow/ui';
import { IdentityAvatar } from '@/components/identity-avatar';
import { toast } from '@/stores/toast-store';

const composerClassName = `
  w-full min-h-[88px] rounded-md border border-divider bg-layer-3 px-3 py-2
  text-base md:text-sm text-content-primary placeholder:text-content-label
  focus:border-primary-500 focus:ring-2 focus:ring-primary-500 focus:outline-none
  transition-colors
`.trim();

interface AssignmentCommentsPanelProps {
  assignmentId: string;
  onActivityChange?: () => void;
}

function formatDate(value: unknown): string {
  if (!value) return '';
  try {
    const obj = value as { seconds?: number; toDate?(): Date };
    if (typeof obj.toDate === 'function') {
      return obj.toDate().toLocaleString(undefined, {
        month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
      });
    }
    if (typeof obj.seconds === 'number') {
      return new Date(obj.seconds * 1000).toLocaleString(undefined, {
        month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
      });
    }
    return String(value);
  } catch {
    return '';
  }
}

function buildThreads(comments: AssignmentCommentRecord[]) {
  const top = comments.filter((c) => !c.parentCommentId);
  const replies = new Map<string, AssignmentCommentRecord[]>();
  for (const c of comments) {
    if (c.parentCommentId) {
      const list = replies.get(c.parentCommentId) ?? [];
      list.push(c);
      replies.set(c.parentCommentId, list);
    }
  }
  return top.map((comment) => ({
    comment,
    replies: replies.get(comment.id) ?? [],
  }));
}

export function AssignmentCommentsPanel({
  assignmentId,
  onActivityChange,
}: AssignmentCommentsPanelProps) {
  const { user } = useAuth();
  const { activeOrgId } = useOrgStore();
  const { role } = useRoleStore();

  const [comments, setComments] = useState<AssignmentCommentRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasMore, setHasMore] = useState(false);
  const [oldestDoc, setOldestDoc] = useState<QueryDocumentSnapshot<DocumentData> | null>(null);
  const [loadingOlder, setLoadingOlder] = useState(false);

  const [draft, setDraft] = useState('');
  const [replyTo, setReplyTo] = useState<AssignmentCommentRecord | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [unread, setUnread] = useState(0);
  const [collapsedReplies, setCollapsedReplies] = useState<Set<string>>(new Set());

  // Mention state
  const [mentionOpen, setMentionOpen] = useState(false);
  const [mentionQuery, setMentionQuery] = useState('');
  const [suggestions, setSuggestions] = useState<MentionSuggestion[]>([]);
  const [mentionLoading, setMentionLoading] = useState(false);
  const [activeMentionIdx, setActiveMentionIdx] = useState(0);
  const [selectedMentions, setSelectedMentions] = useState<MentionSuggestion[]>([]);
  const [cursorPos, setCursorPos] = useState(0);

  const listRef = useRef<HTMLDivElement>(null);
  const composerRef = useRef<HTMLTextAreaElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  /** BUG-003 — optimistic rows not yet in snapshot */
  const pendingRef = useRef<Map<string, AssignmentCommentRecord>>(new Map());

  const authorName =
    user?.displayName
    || user?.email
    || 'Collaborator';

  const mentionNames = useMemo(
    () => selectedMentions.map((m) => m.displayName),
    [selectedMentions],
  );

  const mergeWithPending = useCallback((serverList: AssignmentCommentRecord[]) => {
    const byId = new Map(serverList.map((c) => [c.id, c]));
    // Drop pending once server has them
    for (const id of [...pendingRef.current.keys()]) {
      if (byId.has(id)) pendingRef.current.delete(id);
    }
    for (const c of pendingRef.current.values()) {
      if (!byId.has(c.id)) byId.set(c.id, c);
    }
    return [...byId.values()].sort((a, b) => {
      const at = (a.createdAt as { seconds?: number })?.seconds ?? 0;
      const bt = (b.createdAt as { seconds?: number })?.seconds ?? 0;
      return at - bt;
    });
  }, []);

  const load = useCallback(async (opts?: { silent?: boolean }) => {
    if (!assignmentId) return;
    if (!opts?.silent) setLoading(true);
    try {
      const page = await getAssignmentCommentsPage(assignmentId, { pageSize: 50 });
      setComments(mergeWithPending(page.comments));
      setHasMore(page.hasMore);
      setOldestDoc(page.oldestDoc);
    } catch (err) {
      console.error('[AssignmentCommentsPanel] load failed', err);
      // BUG-003: never blank existing conversation on load failure
      setComments((prev) => prev);
    } finally {
      if (!opts?.silent) setLoading(false);
    }
  }, [assignmentId, mergeWithPending]);

  const loadUnread = useCallback(async () => {
    if (!user?.uid || !assignmentId) return;
    try {
      const n = await getUnreadCommentCount(assignmentId, user.uid);
      setUnread(n);
    } catch {
      setUnread(0);
    }
  }, [assignmentId, user?.uid]);

  // BUG-003 — live subscription; merge with optimistic; stable deps
  useEffect(() => {
    if (!assignmentId) return;
    setLoading(true);
    const unsub = subscribeAssignmentComments(
      assignmentId,
      (list) => {
        setComments(mergeWithPending(list));
        setLoading(false);
      },
      () => {
        // Subscription error — one-shot load, do not clear
        void load({ silent: true }).finally(() => setLoading(false));
      },
    );
    void loadUnread();
    return () => unsub();
  }, [assignmentId, load, loadUnread, mergeWithPending]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [comments.length]);

  // Mark visible comments as read
  useEffect(() => {
    if (!user?.uid || comments.length === 0) return;
    void (async () => {
      for (const c of comments) {
        if (c.authorId !== user.uid && !c.isDeleted) {
          try {
            await markCommentRead(assignmentId, c.id, user.uid);
          } catch {
            // ignore
          }
        }
      }
      await loadUnread();
    })();
  }, [comments, user?.uid, assignmentId, loadUnread]);

  // Mention suggestions
  useEffect(() => {
    if (!mentionOpen || !activeOrgId) {
      setSuggestions([]);
      return;
    }
    let cancelled = false;
    setMentionLoading(true);
    const t = setTimeout(() => {
      void getMentionSuggestions(activeOrgId, mentionQuery).then((list) => {
        if (!cancelled) {
          setSuggestions(list);
          setActiveMentionIdx(0);
          setMentionLoading(false);
        }
      }).catch(() => {
        if (!cancelled) {
          setSuggestions([]);
          setMentionLoading(false);
        }
      });
    }, 120);
    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, [mentionOpen, mentionQuery, activeOrgId]);

  const handleDraftChange = (value: string, cursor: number) => {
    setDraft(value);
    setCursorPos(cursor);
    const mq = getMentionQueryAtCursor(value, cursor);
    setMentionOpen(mq.active);
    setMentionQuery(mq.query);
  };

  const selectMention = (s: MentionSuggestion) => {
    const result = insertMentionAtCursor(draft, cursorPos, s.displayName);
    setDraft(result.text);
    setSelectedMentions((prev) => {
      if (prev.some((p) => p.personId === s.personId)) return prev;
      return [...prev, s];
    });
    setMentionOpen(false);
    setMentionQuery('');
    requestAnimationFrame(() => {
      const el = composerRef.current;
      if (el) {
        el.focus();
        el.setSelectionRange(result.cursor, result.cursor);
      }
    });
  };

  const loadOlder = async () => {
    if (!oldestDoc || loadingOlder) return;
    setLoadingOlder(true);
    try {
      const page = await getAssignmentCommentsPage(assignmentId, {
        pageSize: 50,
        cursor: oldestDoc,
      });
      setComments((prev) => {
        const ids = new Set(prev.map((c) => c.id));
        const older = page.comments.filter((c) => !ids.has(c.id));
        return [...older, ...prev];
      });
      setHasMore(page.hasMore);
      setOldestDoc(page.oldestDoc);
    } catch {
      toast.error('Failed to load older comments');
    } finally {
      setLoadingOlder(false);
    }
  };

  const handleSubmit = async () => {
    if (!draft.trim() || !activeOrgId || !user?.uid) return;
    if (!canComment(role)) {
      toast.error('You do not have permission to comment');
      return;
    }
    setSubmitting(true);
    try {
      // Only store ids for mentions still present in the message text
      const mentionedUserIds = selectedMentions
        .filter((m) => draft.toLowerCase().includes(`@${m.displayName.toLowerCase()}`))
        .map((m) => m.personId);

      const payload = {
        assignmentId,
        organizationId: activeOrgId,
        authorId: user.uid,
        authorName,
        message: draft.trim(),
        parentCommentId: replyTo?.id ?? null,
        mentionedUserIds,
        role,
      };

      // CE-008 — queue when offline instead of discarding
      if (typeof navigator !== 'undefined' && !navigator.onLine) {
        const { enqueueOfflineAction } = await import('@/lib/pwa/offline-queue');
        const { requestBackgroundSync } = await import('@/lib/pwa/register-sw');
        const { useConnectivityStore } = await import('@/lib/pwa/connectivity');
        await enqueueOfflineAction(
          replyTo ? 'reply' : 'comment',
          payload,
          { organizationId: activeOrgId, userId: user.uid },
        );
        await requestBackgroundSync();
        void useConnectivityStore.getState().refreshPending();
        setDraft('');
        setReplyTo(null);
        setSelectedMentions([]);
        toast.success(replyTo ? 'Reply queued for sync' : 'Comment queued for sync');
        return;
      }

      const created = await addAssignmentComment(
        {
          assignmentId,
          organizationId: activeOrgId,
          authorId: user.uid,
          authorName,
          message: draft.trim(),
          parentCommentId: replyTo?.id ?? null,
          mentionedUserIds,
        },
        role,
      );
      // BUG-003 — keep optimistic until snapshot includes this id
      pendingRef.current.set(created.id, created);
      setComments((prev) => mergeWithPending(prev));
      setDraft('');
      setReplyTo(null);
      setSelectedMentions([]);
      onActivityChange?.();
      toast.success(replyTo ? 'Reply posted' : 'Comment posted');
    } catch (e) {
      toast.error((e as Error).message || 'Failed to post comment');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditSave = async (commentId: string) => {
    if (!editDraft.trim() || !user?.uid) return;
    try {
      await editAssignmentComment(commentId, editDraft.trim(), user.uid, role);
      setEditingId(null);
      setEditDraft('');
      await load({ silent: true });
      onActivityChange?.();
      toast.success('Comment updated');
    } catch (e) {
      toast.error((e as Error).message || 'Failed to update');
    }
  };

  const handleDelete = async (commentId: string) => {
    if (!user?.uid) return;
    try {
      await deleteAssignmentComment(commentId, user.uid, role);
      await load({ silent: true });
      onActivityChange?.();
      toast.success('Comment deleted');
    } catch (e) {
      toast.error((e as Error).message || 'Failed to delete');
    }
  };

  const threads = buildThreads(comments);
  const allowComment = canComment(role);

  const onComposerKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (!mentionOpen) {
      if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
        e.preventDefault();
        void handleSubmit();
      }
      return;
    }
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveMentionIdx((i) => Math.min(i + 1, Math.max(suggestions.length - 1, 0)));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveMentionIdx((i) => Math.max(i - 1, 0));
    } else if (e.key === 'Enter' && suggestions[activeMentionIdx]) {
      e.preventDefault();
      const pick = suggestions[activeMentionIdx];
      if (pick) selectMention(pick);
    } else if (e.key === 'Escape') {
      e.preventDefault();
      setMentionOpen(false);
    }
  };

  const toggleReplies = (id: string) => {
    setCollapsedReplies((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  return (
    <div className="flex flex-col min-h-[420px] max-h-[min(70vh,720px)]">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <h3 className="text-base font-semibold text-primary-400">Comments</h3>
          {unread > 0 ? (
            <Badge label="New comments" size="sm" color="bg-info-500/10 text-info-400" />
          ) : null}
        </div>
        {hasMore ? (
          <Button size="sm" variant="ghost" onClick={() => void loadOlder()} loading={loadingOlder}>
            Load older
          </Button>
        ) : null}
      </div>

      <div ref={listRef} className="flex-1 overflow-y-auto space-y-4 pr-1">
        {loading && comments.length === 0 ? (
          <LoadingState />
        ) : threads.length === 0 ? (
          <EmptyState
            title="No comments yet"
            description="Start the discussion for this assignment."
          />
        ) : (
          threads.map(({ comment, replies }) => {
            const collapsed = collapsedReplies.has(comment.id);
            return (
              <div
                key={comment.id}
                className="rounded-xl border border-surface-200/80 bg-layer-2 p-4"
              >
                <CommentBody
                  comment={comment}
                  mentionNames={mentionNames}
                  isOwn={user?.uid === comment.authorId}
                  canModerate={canModerateComments(role)}
                  editing={editingId === comment.id}
                  editDraft={editDraft}
                  onEditDraft={setEditDraft}
                  onStartEdit={() => {
                    setEditingId(comment.id);
                    setEditDraft(comment.message);
                  }}
                  onCancelEdit={() => { setEditingId(null); setEditDraft(''); }}
                  onSaveEdit={() => void handleEditSave(comment.id)}
                  onDelete={() => void handleDelete(comment.id)}
                  onReply={() => {
                    setReplyTo(comment);
                    composerRef.current?.focus();
                  }}
                  allowActions={allowComment}
                />

                {replies.length > 0 ? (
                  <div className="mt-3">
                    <button
                      type="button"
                      className="text-xs text-text-500 hover:text-primary-400 md:hidden mb-2"
                      onClick={() => toggleReplies(comment.id)}
                    >
                      {collapsed ? `Show ${replies.length} ${replies.length === 1 ? 'reply' : 'replies'}` : 'Hide replies'}
                    </button>
                    <div
                      className={`ml-2 md:ml-4 space-y-3 border-l-2 border-surface-700/60 pl-4 ${
                        collapsed ? 'hidden md:block' : ''
                      }`}
                    >
                      {replies.map((reply) => (
                        <CommentBody
                          key={reply.id}
                          comment={reply}
                          mentionNames={mentionNames}
                          isOwn={user?.uid === reply.authorId}
                          canModerate={canModerateComments(role)}
                          editing={editingId === reply.id}
                          editDraft={editDraft}
                          onEditDraft={setEditDraft}
                          onStartEdit={() => {
                            setEditingId(reply.id);
                            setEditDraft(reply.message);
                          }}
                          onCancelEdit={() => { setEditingId(null); setEditDraft(''); }}
                          onSaveEdit={() => void handleEditSave(reply.id)}
                          onDelete={() => void handleDelete(reply.id)}
                          compact
                          allowActions={allowComment}
                        />
                      ))}
                    </div>
                  </div>
                ) : null}
              </div>
            );
          })
        )}
        <div ref={bottomRef} />
      </div>

      {/* Sticky composer */}
      {allowComment ? (
        <div className="sticky bottom-0 mt-4 pt-3 border-t border-surface-700/60 bg-layer-1 -mx-1 px-1 pb-1">
          {replyTo ? (
            <div className="flex items-center justify-between mb-2 text-xs text-text-500">
              <span>
                Replying to <span className="text-surface-100">{replyTo.authorName}</span>
              </span>
              <button
                type="button"
                className="text-text-400 hover:text-primary-400"
                onClick={() => setReplyTo(null)}
              >
                Cancel
              </button>
            </div>
          ) : null}

          <div className="relative">
            {mentionOpen ? (
              <MentionPicker
                suggestions={suggestions}
                activeIndex={activeMentionIdx}
                onSelect={selectMention}
                onHover={setActiveMentionIdx}
                loading={mentionLoading}
              />
            ) : null}
            <textarea
              ref={composerRef}
              placeholder={replyTo ? 'Write a reply… Use @ to mention.' : 'Write a comment… Use @ to mention.'}
              value={draft}
              onChange={(e) => {
                const el = e.target;
                handleDraftChange(el.value, el.selectionStart ?? el.value.length);
              }}
              onKeyUp={(e) => {
                const el = e.currentTarget;
                setCursorPos(el.selectionStart ?? el.value.length);
              }}
              onClick={(e) => {
                const el = e.currentTarget;
                setCursorPos(el.selectionStart ?? el.value.length);
              }}
              onKeyDown={onComposerKeyDown}
              rows={3}
              className={composerClassName}
            />
          </div>
          <div className="flex justify-end mt-2">
            <Button size="sm" onClick={() => void handleSubmit()} disabled={!draft.trim() || submitting} loading={submitting}>
              {replyTo ? 'Post Reply' : 'Post Comment'}
            </Button>
          </div>
        </div>
      ) : (
        <p className="text-xs text-text-500 mt-4">View-only — you cannot comment on this assignment.</p>
      )}
    </div>
  );
}

function CommentBody({
  comment,
  mentionNames,
  isOwn,
  canModerate,
  editing,
  editDraft,
  onEditDraft,
  onStartEdit,
  onCancelEdit,
  onSaveEdit,
  onDelete,
  onReply,
  compact,
  allowActions,
}: {
  comment: AssignmentCommentRecord;
  mentionNames: string[];
  isOwn: boolean;
  canModerate: boolean;
  editing: boolean;
  editDraft: string;
  onEditDraft: (v: string) => void;
  onStartEdit: () => void;
  onCancelEdit: () => void;
  onSaveEdit: () => void;
  onDelete: () => void;
  onReply?: () => void;
  compact?: boolean;
  allowActions: boolean;
}) {
  if (comment.isDeleted) {
    return (
      <div className={`flex items-start gap-3 ${compact ? 'gap-2' : ''}`}>
        <IdentityAvatar
          userId={comment.authorId}
          fallbackName={comment.authorName}
          size={compact ? 'xs' : 'sm'}
        />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-sm font-medium text-primary-400">{comment.authorName}</span>
            <span className="text-xs text-text-500">{formatDate(comment.createdAt)}</span>
          </div>
          <p className="text-sm text-text-500 italic">This comment was deleted.</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`flex items-start gap-3 ${compact ? 'gap-2' : ''}`}>
      <IdentityAvatar
        userId={comment.authorId}
        fallbackName={comment.authorName}
        size={compact ? 'xs' : 'sm'}
      />
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2 mb-1 flex-wrap">
          <span className="text-sm font-medium text-primary-400">{comment.authorName}</span>
          <span className="text-xs text-text-500">{formatDate(comment.createdAt)}</span>
          {comment.editedAt ? <span className="text-xs text-text-500">(edited)</span> : null}
        </div>

        {editing ? (
          <div className="space-y-2">
            <textarea
              value={editDraft}
              onChange={(e) => onEditDraft(e.target.value)}
              rows={3}
              className={composerClassName}
            />
            <div className="flex gap-2">
              <Button size="sm" onClick={onSaveEdit} disabled={!editDraft.trim()}>Save</Button>
              <Button size="sm" variant="ghost" onClick={onCancelEdit}>Cancel</Button>
            </div>
          </div>
        ) : (
          <div
            className="text-sm text-surface-100 whitespace-pre-wrap break-words"
            dangerouslySetInnerHTML={{
              __html: renderCommentMessageHtml(comment.message, mentionNames),
            }}
          />
        )}

        {allowActions && !editing ? (
          <div className="flex gap-3 mt-2">
            {!compact && onReply ? (
              <button
                type="button"
                onClick={onReply}
                className="text-xs text-text-500 hover:text-primary-400 transition-colors"
              >
                Reply
              </button>
            ) : null}
            {isOwn ? (
              <button
                type="button"
                onClick={onStartEdit}
                className="text-xs text-text-500 hover:text-primary-400 transition-colors"
              >
                Edit
              </button>
            ) : null}
            {(isOwn || canModerate) ? (
              <button
                type="button"
                onClick={onDelete}
                className="text-xs text-text-500 hover:text-danger-600 transition-colors"
              >
                Delete
              </button>
            ) : null}
          </div>
        ) : null}
      </div>
    </div>
  );
}
