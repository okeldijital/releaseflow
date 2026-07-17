# MUX-002 — Collaborator Mobile Workspace

**Status:** Implemented  
**Priority:** P1  
**Depends on:** ARS-003, ARS-004, UX-001  

## Objective

Make mobile the collaborator’s daily operational workspace: assigned work, label awareness, release/track read-only library, assignment-scoped comments — not chat or admin.

## Navigation map

### Bottom nav (phone)

| Tab | Route |
|-----|--------|
| Home | `/home` |
| Work | `/assignments` |
| Schedule | `/schedule` |
| Comments | `/comments` |
| Profile | `/profile` |

Notifications remain on the **header bell** (AppShell `onOpenNotifications` → `/notifications`).

### Sidebar / desktop collaborator nav

Home · My Assignments · Releases · Tracks · Schedule · Comments · Profile

### Blocked for collaborators

`/dashboard`, `/administration`, `/organizations`, `/people`, `/artists`, `/releases/new`

Tracks and releases lists are **allowed** (read).

## Permission matrix

| Resource | Collaborator |
|----------|----------------|
| Home | Read |
| Assignments | Read / update own |
| Releases | Read |
| Tracks | Read (`artist.read`) |
| Schedule | Read (personal + release milestones) |
| Comments | Read/write on accessible assignments |
| Notifications | Read (header) |
| Administration / People | No |

## Screen specs

### Home (`/home`)

1. Greeting + org + bell badge  
2. Today’s summary tiles (assignments, due today, unread comments, upcoming releases)  
3. Continue working (single highest-priority card)  
4. Recent updates (org/user activity)  
5. Upcoming releases (read-only cards)  
6. Quick access grid: Releases · Tracks · Schedule · Comments  

### Comments (`/comments`)

Assignment-grouped conversations (not user chat). Opens `/assignments/{id}?tab=comments`.

### Schedule

Domain tabs: **Assignments** | **Releases** (milestones list).

### Releases / Tracks

Existing list/detail surfaces; create/edit chrome hidden when capabilities missing.

## Component ownership

| Piece | Location |
|-------|----------|
| Home | `app/(app)/home/page.tsx` |
| Comments inbox | `app/(app)/comments/page.tsx` + `lib/assignment-comments-inbox.ts` |
| Nav | `app/(app)/layout.tsx` |
| Cards | `components/mobile/assignment-card.tsx` |
| Notification deep links | `lib/notification-engine-service.ts` `notificationHref` |

## Empty states

- No continue card: “You are all caught up.”  
- No comments threads: “Comments appear here when you discuss work on an assignment.”  
- No release milestones: navigate months / empty copy  

## Acceptance (manual)

- [ ] Home shows summary + continue + updates + upcoming + quick access  
- [ ] Bottom nav Comments opens assignment conversations  
- [ ] Bell opens notifications; comment types deep-link to assignment comments tab  
- [ ] Collaborator browses releases/tracks without create/edit  
- [ ] Schedule Releases tab lists milestones  
- [ ] TypeScript / ESLint / tests / production build  

## Residual

- Track/release detail “no edit” is capability-gated; some admin-only overflow may still appear if permissions misconfigured.  
- Full offline cache expansion is incremental (existing PWA queue for comments).  
- List virtualization not added for small catalogues.  
