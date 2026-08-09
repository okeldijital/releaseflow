/**
 * BUILD-302A — Deterministic FeedbackContext resolver.
 *
 * Application supplies context from the current route (and optional
 * entity IDs already established by the application layer).
 * No AI, heuristics, or user-entered location.
 *
 * Route patterns match the current App Router under apps/web/src/app/(app).
 * EPIC nested examples like /releases/:id/tracks/:trackId are accepted when
 * present, but the live app uses /tracks/:id for track detail.
 */

import type { FeedbackContext } from './feedback-types';

/**
 * Optional entity IDs the application already resolved (e.g. release linked to
 * a track). Only applied when the route's page type supports that entity —
 * never blindly accepted as arbitrary cross-tenant injection.
 */
export interface FeedbackEntityHints {
  releaseId?: string;
  trackId?: string;
  artistId?: string;
  personId?: string;
  assignmentId?: string;
  taskId?: string;
  assetId?: string;
}

const RESERVED_SEGMENTS = new Set([
  'new',
  'edit',
  'readiness',
  'releases',
  'tracks',
  'artists',
  'people',
  'assignments',
  'tasks',
  'assets',
  'campaigns',
  'administration',
  'settings',
  'profile',
  'dashboard',
  'inbox',
  'comments',
  'notifications',
  'my-work',
  'work',
  'invitations',
]);

function isIdSegment(segment: string | undefined): segment is string {
  return Boolean(segment && segment.length > 0 && !RESERVED_SEGMENTS.has(segment));
}

function normalizePath(pathname: string): string {
  if (!pathname) return '/';
  let p = pathname.trim();
  if (!p.startsWith('/')) p = `/${p}`;
  // Drop query/hash; collapse trailing slash (except root).
  const noQuery = p.split('?')[0] ?? p;
  const noHash = noQuery.split('#')[0] ?? noQuery;
  p = noHash;
  if (p.length > 1 && p.endsWith('/')) p = p.slice(0, -1);
  return p || '/';
}

function withEntity(
  base: FeedbackContext,
  key: keyof FeedbackEntityHints,
  value: string | undefined,
): FeedbackContext {
  if (!value) return base;
  return { ...base, [key]: value };
}

/**
 * Merge application-known entity hints only for pages that support them.
 * Hints never override IDs already extracted from the route.
 */
function applySupportedHints(
  ctx: FeedbackContext,
  hints?: FeedbackEntityHints,
): FeedbackContext {
  if (!hints) return ctx;
  let next = ctx;

  // Track pages may also know their release.
  if (ctx.page === 'track' || ctx.page === 'release-track') {
    if (!next.releaseId && hints.releaseId) {
      next = withEntity(next, 'releaseId', hints.releaseId);
    }
    if (!next.trackId && hints.trackId) {
      next = withEntity(next, 'trackId', hints.trackId);
    }
  }

  if (ctx.page === 'release' || ctx.page === 'release-edit' || ctx.page === 'release-readiness') {
    if (!next.releaseId && hints.releaseId) {
      next = withEntity(next, 'releaseId', hints.releaseId);
    }
  }

  if (ctx.page === 'artist' && !next.artistId && hints.artistId) {
    next = withEntity(next, 'artistId', hints.artistId);
  }
  if (ctx.page === 'person' && !next.personId && hints.personId) {
    next = withEntity(next, 'personId', hints.personId);
  }
  if (ctx.page === 'assignment' && !next.assignmentId && hints.assignmentId) {
    next = withEntity(next, 'assignmentId', hints.assignmentId);
  }
  if (ctx.page === 'task' && !next.taskId && hints.taskId) {
    next = withEntity(next, 'taskId', hints.taskId);
  }
  if ((ctx.page === 'asset' || ctx.module === 'assets') && !next.assetId && hints.assetId) {
    next = withEntity(next, 'assetId', hints.assetId);
  }

  return next;
}

/**
 * Resolve FeedbackContext from the current application route.
 *
 * @param pathname - Current location pathname (e.g. from usePathname()).
 * @param hints - Optional entity IDs already known to the application for this page.
 */
export function resolveFeedbackContext(
  pathname: string,
  hints?: FeedbackEntityHints,
): FeedbackContext {
  const route = normalizePath(pathname);
  const segments = route.split('/').filter(Boolean);
  const [s0, s1, s2, s3] = segments;

  let ctx: FeedbackContext;

  // Dashboard
  if (s0 === 'dashboard' || route === '/' || s0 === 'home') {
    ctx = { route, module: 'dashboard', page: s0 === 'home' ? 'home' : 'dashboard' };
    return applySupportedHints(ctx, hints);
  }

  // Releases list / detail / nested track (EPIC shape)
  if (s0 === 'releases') {
    if (!s1) {
      ctx = { route, module: 'releases', page: 'releases' };
    } else if (s1 === 'new') {
      ctx = { route, module: 'releases', page: 'release-new' };
    } else if (isIdSegment(s1) && s2 === 'tracks' && isIdSegment(s3)) {
      // /releases/:releaseId/tracks/:trackId (EPIC example; not primary live route)
      ctx = {
        route,
        module: 'releases',
        page: 'track',
        releaseId: s1,
        trackId: s3,
      };
    } else if (isIdSegment(s1) && s2 === 'edit') {
      ctx = { route, module: 'releases', page: 'release-edit', releaseId: s1 };
    } else if (isIdSegment(s1) && s2 === 'readiness') {
      ctx = { route, module: 'releases', page: 'release-readiness', releaseId: s1 };
    } else if (isIdSegment(s1)) {
      ctx = { route, module: 'releases', page: 'release', releaseId: s1 };
    } else {
      ctx = { route, module: 'releases', page: 'releases' };
    }
    return applySupportedHints(ctx, hints);
  }

  // Tracks (live primary track detail route: /tracks/:trackId)
  if (s0 === 'tracks') {
    if (!s1) {
      ctx = { route, module: 'tracks', page: 'tracks' };
    } else if (s1 === 'new') {
      ctx = { route, module: 'tracks', page: 'track-new' };
    } else if (isIdSegment(s1)) {
      ctx = { route, module: 'tracks', page: 'track', trackId: s1 };
    } else {
      ctx = { route, module: 'tracks', page: 'tracks' };
    }
    return applySupportedHints(ctx, hints);
  }

  // Artists
  if (s0 === 'artists') {
    if (!s1) {
      ctx = { route, module: 'artists', page: 'artists' };
    } else if (s1 === 'new') {
      ctx = { route, module: 'artists', page: 'artist-new' };
    } else if (isIdSegment(s1)) {
      ctx = { route, module: 'artists', page: 'artist', artistId: s1 };
    } else {
      ctx = { route, module: 'artists', page: 'artists' };
    }
    return applySupportedHints(ctx, hints);
  }

  // Assignments
  if (s0 === 'assignments') {
    if (!s1) {
      ctx = { route, module: 'assignments', page: 'assignments' };
    } else if (s1 === 'new') {
      ctx = { route, module: 'assignments', page: 'assignment-new' };
    } else if (isIdSegment(s1)) {
      ctx = { route, module: 'assignments', page: 'assignment', assignmentId: s1 };
    } else {
      ctx = { route, module: 'assignments', page: 'assignments' };
    }
    return applySupportedHints(ctx, hints);
  }

  // Tasks
  if (s0 === 'tasks') {
    if (!s1) {
      ctx = { route, module: 'tasks', page: 'tasks' };
    } else if (s1 === 'new') {
      ctx = { route, module: 'tasks', page: 'task-new' };
    } else if (isIdSegment(s1)) {
      ctx = { route, module: 'tasks', page: 'task', taskId: s1 };
    } else {
      ctx = { route, module: 'tasks', page: 'tasks' };
    }
    return applySupportedHints(ctx, hints);
  }

  // People (personId)
  if (s0 === 'people') {
    if (!s1) {
      ctx = { route, module: 'people', page: 'people' };
    } else if (s1 === 'new') {
      ctx = { route, module: 'people', page: 'person-new' };
    } else if (s1 === 'invitations') {
      ctx = { route, module: 'people', page: 'invitations' };
    } else if (isIdSegment(s1) && s2 === 'releases') {
      ctx = { route, module: 'people', page: 'person-releases', personId: s1 };
    } else if (isIdSegment(s1)) {
      ctx = { route, module: 'people', page: 'person', personId: s1 };
    } else {
      ctx = { route, module: 'people', page: 'people' };
    }
    return applySupportedHints(ctx, hints);
  }

  // Assets — list page only in current app; optional assetId via hints
  if (s0 === 'assets') {
    if (isIdSegment(s1)) {
      ctx = { route, module: 'assets', page: 'asset', assetId: s1 };
    } else {
      ctx = { route, module: 'assets', page: 'assets' };
    }
    return applySupportedHints(ctx, hints);
  }

  // Inbox-like surfaces (no dedicated /inbox route in live app)
  if (s0 === 'inbox' || s0 === 'comments' || s0 === 'notifications' || s0 === 'my-work' || s0 === 'work') {
    const page =
      s0 === 'inbox'
        ? 'inbox'
        : s0 === 'comments'
          ? 'comments'
          : s0 === 'notifications'
            ? 'notifications'
            : s0 === 'my-work'
              ? 'my-work'
              : 'work';
    ctx = { route, module: 'inbox', page };
    return applySupportedHints(ctx, hints);
  }

  // Settings: profile + administration sections
  if (s0 === 'profile') {
    ctx = { route, module: 'settings', page: 'profile' };
    return applySupportedHints(ctx, hints);
  }
  if (s0 === 'settings') {
    const section = s1 || 'settings';
    ctx = { route, module: 'settings', page: section };
    return applySupportedHints(ctx, hints);
  }
  if (s0 === 'administration') {
    const section = s1 || 'administration';
    ctx = { route, module: 'settings', page: section };
    return applySupportedHints(ctx, hints);
  }

  // Campaigns (entity detail when present — not required by EPIC but real routes)
  if (s0 === 'campaigns') {
    if (!s1) {
      ctx = { route, module: 'campaigns', page: 'campaigns' };
    } else if (s1 === 'new') {
      ctx = { route, module: 'campaigns', page: 'campaign-new' };
    } else if (isIdSegment(s1)) {
      ctx = { route, module: 'campaigns', page: 'campaign' };
    } else {
      ctx = { route, module: 'campaigns', page: 'campaigns' };
    }
    return applySupportedHints(ctx, hints);
  }

  // Generic fallback: first segment as module/page
  if (s0) {
    ctx = {
      route,
      module: s0,
      page: s1 && !isIdSegment(s1) ? s1 : s0,
    };
    // Capture unknown single-id resources under first segment when pattern is /module/:id
    if (isIdSegment(s1) && !s2) {
      // Do not invent entity field names for unknown modules.
      ctx = { route, module: s0, page: s0 };
    }
    return applySupportedHints(ctx, hints);
  }

  ctx = { route: '/', module: 'dashboard', page: 'dashboard' };
  return applySupportedHints(ctx, hints);
}

/**
 * Strip empty optional entity keys so persisted context stays minimal.
 */
export function compactFeedbackContext(context: FeedbackContext): FeedbackContext {
  const compact: FeedbackContext = {
    route: context.route,
    module: context.module,
    page: context.page,
  };
  if (context.releaseId) compact.releaseId = context.releaseId;
  if (context.trackId) compact.trackId = context.trackId;
  if (context.artistId) compact.artistId = context.artistId;
  if (context.personId) compact.personId = context.personId;
  if (context.assignmentId) compact.assignmentId = context.assignmentId;
  if (context.taskId) compact.taskId = context.taskId;
  if (context.assetId) compact.assetId = context.assetId;
  return compact;
}
