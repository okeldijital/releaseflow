# MUX-001 — Mobile Contributor Experience

**Priority:** High  
**Status:** Implemented  
**Prerequisites:** CE stack, RBAC-001, AUTH-001, DOM-001

## UX Summary

Contributors open ReleaseFlow to answer: **“What do I need to do next?”**

The mobile experience is **assignment-first**:

1. Greeting + open assignment count  
2. **Up next** featured assignment card  
3. **Due today** (includes overdue)  
4. **Upcoming**  
5. **Waiting** (in review)  
6. **Notifications** (unread)  
7. **Recent activity**

No release creation or management chrome for collaborators.

Managers/Administrators keep the existing desktop-oriented shell.

## Navigation

### Bottom nav (phone, collaborators only)

| Tab | Route |
|-----|--------|
| Home | `/home` |
| Assignments | `/assignments` |
| Schedule | `/schedule` |
| Notifications | `/notifications` |
| Profile | `/profile` |

- 56px min height, 48px+ targets, safe-area padding  
- Badges on Notifications  

### Drawer / sidebar

Collaborators: Home, Assignments, Schedule, Notifications, Profile (no Administration).  
Managers: existing admin nav unchanged.

### Header

- Multi-org: switcher visible  
- Single-org collaborators: switcher hidden on phone  

## Responsive Components

| Component | Change |
|-----------|--------|
| `AssignmentCard` | Primary mobile card (artwork, role, due, CTA) |
| Collaborator Home | Assignment-first sections |
| BottomNav | Larger touch targets |
| Assignments list | Card grid; own work only for collab |
| Assignment detail | Sticky mobile primary action bar |
| Schedule | Agenda default on phone; simplified tabs |
| Profile | Platform role, larger sign-out |
| AppShell | Bottom padding for nav |

## Files Modified / Added

| File | Purpose |
|------|---------|
| `components/mobile/assignment-card.tsx` | Shared assignment card |
| `app/(app)/home/page.tsx` | Contributor dashboard |
| `app/(app)/assignments/page.tsx` | Mobile card list |
| `app/(app)/assignments/[id]/page.tsx` | Sticky actions, person id |
| `app/(app)/schedule/page.tsx` | Agenda-first mobile |
| `app/(app)/profile/page.tsx` | Simplified profile |
| `app/(app)/layout.tsx` | Org switcher rules |
| `packages/ui/.../bottom-nav.tsx` | Touch targets |
| `packages/ui/.../app-shell.tsx` | Content padding |
| `docs/MUX-001-…` | This document |

## Validation

- Bottom navigation: collaborators on `md:hidden`  
- Assignment-first home implemented  
- Desktop admin nav unchanged  
- TypeScript / lint / tests / build — run after implementation  

Desktop managers are unaffected beyond shared BottomNav CSS (only rendered for collab shell).
