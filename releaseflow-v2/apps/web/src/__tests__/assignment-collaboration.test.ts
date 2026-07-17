import { describe, it, expect } from 'vitest';
import {
  getMentionQueryAtCursor,
  insertMentionAtCursor,
  resolveMentionIdsFromSelection,
  renderCommentMessageHtml,
  type MentionSuggestion,
} from '@/lib/assignment-mentions-service';
import { canComment, canModerateComments } from '@/lib/assignment-comments-service';
import { canManageReview } from '@/lib/assignment-service';

describe('CE-005 mention helpers', () => {
  it('detects @query at cursor', () => {
    const text = 'Hey @Jo';
    const r = getMentionQueryAtCursor(text, text.length);
    expect(r.active).toBe(true);
    expect(r.query).toBe('Jo');
  });

  it('does not treat email as mention', () => {
    const text = 'email me at a@b.com';
    const r = getMentionQueryAtCursor(text, text.length);
    expect(r.active).toBe(false);
  });

  it('inserts @Display Name and stores person id separately', () => {
    const text = 'Hey @';
    const { text: next } = insertMentionAtCursor(text, text.length, 'John Smith');
    expect(next).toContain('@John Smith');
    const selected: MentionSuggestion[] = [{
      personId: 'person_1',
      displayName: 'John Smith',
      primaryRole: 'Mixer',
    }];
    expect(resolveMentionIdsFromSelection(selected)).toEqual(['person_1']);
  });

  it('linkifies URLs and highlights mentions without markdown', () => {
    const html = renderCommentMessageHtml(
      'See https://example.com and @John Smith',
      ['John Smith'],
    );
    expect(html).toContain('href="https://example.com"');
    expect(html).toContain('@John Smith');
    expect(html).not.toContain('<strong>');
  });
});

describe('CE-005 permission helpers', () => {
  it('collaborators may comment but not moderate', () => {
    expect(canComment('contributor')).toBe(true);
    expect(canModerateComments('contributor')).toBe(false);
    expect(canManageReview('contributor')).toBe(false);
  });

  it('release managers and admins may moderate and review', () => {
    expect(canModerateComments('release_manager')).toBe(true);
    expect(canModerateComments('admin')).toBe(true);
    expect(canManageReview('release_manager')).toBe(true);
    expect(canManageReview('admin')).toBe(true);
    expect(canManageReview('owner')).toBe(true);
  });

  it('viewers cannot comment', () => {
    expect(canComment('viewer')).toBe(false);
  });
});

describe('CE-005 module structure', () => {
  it('exports comment service surface', async () => {
    const mod = await import('@/lib/assignment-comments-service');
    expect(typeof mod.addAssignmentComment).toBe('function');
    expect(typeof mod.editAssignmentComment).toBe('function');
    expect(typeof mod.deleteAssignmentComment).toBe('function');
    expect(typeof mod.getAssignmentCommentThreads).toBe('function');
  });

  it('exports watcher service surface', async () => {
    const mod = await import('@/lib/assignment-watchers-service');
    expect(typeof mod.watchAssignment).toBe('function');
    expect(typeof mod.unwatchAssignment).toBe('function');
  });

  it('exports notification event types', async () => {
    const mod = await import('@/lib/notification-event-service');
    expect(typeof mod.generateNotificationEvent).toBe('function');
  });

  it('exports review outcome actions', async () => {
    const mod = await import('@/lib/assignment-service');
    expect(typeof mod.submitForReviewAssignment).toBe('function');
    expect(typeof mod.approveUserAssignment).toBe('function');
    expect(typeof mod.requestChangesUserAssignment).toBe('function');
    expect(typeof mod.rejectUserAssignment).toBe('function');
  });
});
