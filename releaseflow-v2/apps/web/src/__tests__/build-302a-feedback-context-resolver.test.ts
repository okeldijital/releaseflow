/**
 * BUILD-302A — FeedbackContextResolver tests against actual App Router paths.
 */

import { describe, it, expect } from 'vitest';
import {
  resolveFeedbackContext,
  compactFeedbackContext,
} from '@/lib/feedback';

describe('resolveFeedbackContext — supported locations', () => {
  it('/dashboard → module + page + route', () => {
    expect(resolveFeedbackContext('/dashboard')).toEqual({
      route: '/dashboard',
      module: 'dashboard',
      page: 'dashboard',
    });
  });

  it('/releases → module + page + route', () => {
    expect(resolveFeedbackContext('/releases')).toEqual({
      route: '/releases',
      module: 'releases',
      page: 'releases',
    });
  });

  it('/releases/:releaseId → releaseId', () => {
    expect(resolveFeedbackContext('/releases/lua')).toEqual({
      route: '/releases/lua',
      module: 'releases',
      page: 'release',
      releaseId: 'lua',
    });
  });

  it('/releases/:releaseId/tracks/:trackId (EPIC nested shape)', () => {
    expect(resolveFeedbackContext('/releases/lua/tracks/izizwe')).toEqual({
      route: '/releases/lua/tracks/izizwe',
      module: 'releases',
      page: 'track',
      releaseId: 'lua',
      trackId: 'izizwe',
    });
  });

  it('/tracks/:trackId (live primary track route)', () => {
    expect(resolveFeedbackContext('/tracks/izizwe')).toEqual({
      route: '/tracks/izizwe',
      module: 'tracks',
      page: 'track',
      trackId: 'izizwe',
    });
  });

  it('track page accepts application releaseId hint only', () => {
    expect(
      resolveFeedbackContext('/tracks/izizwe', { releaseId: 'lua' }),
    ).toEqual({
      route: '/tracks/izizwe',
      module: 'tracks',
      page: 'track',
      trackId: 'izizwe',
      releaseId: 'lua',
    });
  });

  it('does not accept arbitrary entity hints on unrelated pages', () => {
    const ctx = resolveFeedbackContext('/dashboard', {
      trackId: 'evil-track',
      releaseId: 'evil-release',
      artistId: 'evil-artist',
    });
    expect(ctx).toEqual({
      route: '/dashboard',
      module: 'dashboard',
      page: 'dashboard',
    });
    expect(ctx).not.toHaveProperty('trackId');
    expect(ctx).not.toHaveProperty('releaseId');
  });

  it('/artists/:artistId → artistId', () => {
    expect(resolveFeedbackContext('/artists/artist-42')).toEqual({
      route: '/artists/artist-42',
      module: 'artists',
      page: 'artist',
      artistId: 'artist-42',
    });
  });

  it('/tasks/:taskId → taskId', () => {
    expect(resolveFeedbackContext('/tasks/task-7')).toEqual({
      route: '/tasks/task-7',
      module: 'tasks',
      page: 'task',
      taskId: 'task-7',
    });
  });

  it('/assignments/:assignmentId → assignmentId', () => {
    expect(resolveFeedbackContext('/assignments/asg-3')).toEqual({
      route: '/assignments/asg-3',
      module: 'assignments',
      page: 'assignment',
      assignmentId: 'asg-3',
    });
  });

  it('inbox-like surfaces → module + page', () => {
    expect(resolveFeedbackContext('/inbox')).toEqual({
      route: '/inbox',
      module: 'inbox',
      page: 'inbox',
    });
    expect(resolveFeedbackContext('/comments')).toEqual({
      route: '/comments',
      module: 'inbox',
      page: 'comments',
    });
    expect(resolveFeedbackContext('/notifications')).toEqual({
      route: '/notifications',
      module: 'inbox',
      page: 'notifications',
    });
    expect(resolveFeedbackContext('/my-work')).toEqual({
      route: '/my-work',
      module: 'inbox',
      page: 'my-work',
    });
  });

  it('/assets and optional asset detail', () => {
    expect(resolveFeedbackContext('/assets')).toEqual({
      route: '/assets',
      module: 'assets',
      page: 'assets',
    });
    expect(resolveFeedbackContext('/assets/asset-9')).toEqual({
      route: '/assets/asset-9',
      module: 'assets',
      page: 'asset',
      assetId: 'asset-9',
    });
    expect(
      resolveFeedbackContext('/assets', { assetId: 'asset-hint' }),
    ).toEqual({
      route: '/assets',
      module: 'assets',
      page: 'assets',
      assetId: 'asset-hint',
    });
  });

  it('/settings and administration sections', () => {
    expect(resolveFeedbackContext('/profile')).toEqual({
      route: '/profile',
      module: 'settings',
      page: 'profile',
    });
    expect(resolveFeedbackContext('/settings/security')).toEqual({
      route: '/settings/security',
      module: 'settings',
      page: 'security',
    });
    expect(resolveFeedbackContext('/administration/members')).toEqual({
      route: '/administration/members',
      module: 'settings',
      page: 'members',
    });
  });

  it('/people/:personId → personId', () => {
    expect(resolveFeedbackContext('/people/person-1')).toEqual({
      route: '/people/person-1',
      module: 'people',
      page: 'person',
      personId: 'person-1',
    });
  });

  it('normalizes trailing slashes and ignores query/hash', () => {
    expect(resolveFeedbackContext('/releases/lua/?tab=tracks#top')).toEqual({
      route: '/releases/lua',
      module: 'releases',
      page: 'release',
      releaseId: 'lua',
    });
  });

  it('does not treat reserved segments as entity ids', () => {
    expect(resolveFeedbackContext('/releases/new')).toEqual({
      route: '/releases/new',
      module: 'releases',
      page: 'release-new',
    });
    expect(resolveFeedbackContext('/releases/lua/edit')).toEqual({
      route: '/releases/lua/edit',
      module: 'releases',
      page: 'release-edit',
      releaseId: 'lua',
    });
  });

  it('route is sufficient for direct-link reconstruction', () => {
    const ctx = resolveFeedbackContext('/assignments/asg-3');
    expect(ctx.route).toBe('/assignments/asg-3');
    // No separate url field
    expect(ctx).not.toHaveProperty('url');
  });
});

describe('compactFeedbackContext', () => {
  it('omits empty optional entity fields', () => {
    expect(
      compactFeedbackContext({
        route: '/dashboard',
        module: 'dashboard',
        page: 'dashboard',
        releaseId: undefined,
        trackId: '',
      } as ReturnType<typeof resolveFeedbackContext>),
    ).toEqual({
      route: '/dashboard',
      module: 'dashboard',
      page: 'dashboard',
    });
  });
});
