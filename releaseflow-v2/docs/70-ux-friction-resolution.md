# TASK-BS-102 — UX Friction Resolution

## Priority Order (from TASK-3002)

1. Status transition UI
2. Role landing pages
3. What changed while I was away?
4. Workspace duplication
5. Mobile touch targets

---

## Resolution 1: Status Transition UI

**Problem:** The status model (doc 16) defines 12 allowed transitions but
no UI element triggers any of them. PMs cannot advance release status.

### Solution: Status Badge Dropdown

The status badge in the release header is interactive. Clicking shows a
dropdown of allowed transitions from the current state:

```
DRAFT state:                    PRODUCTION state:              READY state:
┌─────────────────┐             ┌─────────────────────┐       ┌─────────────────┐
│  DRAFT       ▼  │             │  PRODUCTION      ▼  │       │  READY       ▼  │
└─────────────────┘             └─────────────────────┘       └─────────────────┘
        │                                │                            │
        ▼                                ▼                            ▼
┌──────────────────┐            ┌──────────────────┐        ┌──────────────────┐
│  Begin Planning  │            │  Put on Hold     │        │  Publish         │
│  ─────────────── │            │  Mark Ready      │        │  ─────────────── │
│  Cancel Release  │            │  ─────────────── │        │  Reopen          │
└──────────────────┘            │  Revert to Plan  │        └──────────────────┘
                                │  ─────────────── │
                                │  Cancel Release  │
                                └──────────────────┘
```

### Rules

- Only allowed transitions appear (disallowed transitions are hidden, not grayed)
- Destructive transitions (Cancel, Archive) show a confirmation dialog
- Transitions with guards (e.g., PRODUCTION → READY needs all stages complete) show the guard inline: "All stages must be complete. 5/7 complete." (disabled if guard fails)
- ON HOLD requires a reason dialog (min 10 chars)
- RELEASED → READY requires Owner/Admin — hidden for other roles
- Transition is logged to activity feed: "Leko moved Lua from DRAFT to PLANNING"

### Spec Location

Add to doc 12 (Release Workspace, Status Badge section) and doc 16
(Release Status Model, Transition Rules section).

---

## Resolution 2: Role Landing Pages

**Problem:** No doc specifies which page a user sees on login based on
their role. A Producer logging in might see the generic dashboard instead
of their tasks.

### Solution: Role → Landing Page Routing Table

| Role | Landing Page | Doc |
|------|-------------|-----|
| Owner | Executive Dashboard (doc 60) | Answers "what needs attention?" |
| Admin | Executive Dashboard (doc 60) | Same as Owner |
| PM | Operations Center (doc 59) | Cross-release alerts + blocked work |
| A&R | Dashboard with Approval Queue prioritized | Approval requests first |
| Artist | Contributor Home (doc 42) | My tasks + releases |
| Producer | Contributor Home (doc 42) | My production tasks |
| Mix Engineer | Contributor Home (doc 42) | My mixing tasks |
| Mastering Engineer | Contributor Home (doc 42) | My mastering tasks |
| Designer | Contributor Home (doc 42) | My artwork tasks |
| Marketing | Campaign Workspace filtered to active campaigns | Active campaign overview |
| PR | Campaign Workspace (read-only) | Campaign status |
| Viewer | Dashboard (read-only) | Org overview |

### Implementation

```typescript
function getLandingPage(role: RoleId): string {
  const LANDING_PAGES: Record<RoleId, string> = {
    OWNER: '/executive',
    ADMIN: '/executive',
    PM: '/operations',
    A_AND_R: '/dashboard?filter=approvals',
    ARTIST: '/home',
    PRODUCER: '/home',
    ENGINEER: '/home',
    DESIGNER: '/home',
    MARKETING: '/marketing',
    PR: '/marketing',
    VIEWER: '/dashboard',
  };
  return LANDING_PAGES[role];
}
```

After login, the app redirects to the landing page. The user can navigate
elsewhere, but their default view is role-appropriate.

---

## Resolution 3: What Changed While I Was Away?

**Problem:** A PM returning after days away must manually check every
release to understand what happened. No diff view exists.

### Solution: "Since You Were Away" Panel on Operations Center

```
┌──────────────────────────────────────────────────────────────────┐
│  Since Aug 15 (4 days ago)                                       │
│                                                                   │
│  ─── Lua – The Fading Light ────────────────────────────────────  │
│  🟢 2 tasks completed                                             │
│  🔵 1 stage advanced (Production → Mixing)                      │
│  💬 3 new comments                                                │
│  🔴 1 new blocker (Mechanical license)                           │
│                                                                   │
│  ─── Midnight Sessions ─────────────────────────────────────────  │
│  🟢 4 tasks completed                                             │
│  🔵 2 stages advanced (Mixing → Mastering → Artwork)             │
│  ✅ 1 approval granted (Cover Art v3)                            │
│                                                                   │
│  ─── Summer EP ─────────────────────────────────────────────────  │
│  🔵 1 release shipped (RELEASED)                                 │
│                                                                   │
│  ─── Across All Releases ────────────────────────────────────────  │
│  7 tasks completed · 4 stages advanced · 2 approvals · 1 release │
│  1 new blocker · $3,000 budget overage · 3 new comments          │
│                                                                   │
│  ┌──────────────────────────────────────────────────────────┐    │
│  │  View Full Activity Log                                  │    │
│  └──────────────────────────────────────────────────────────┘    │
└──────────────────────────────────────────────────────────────────┘
```

### How It Works

On logout, the system stores `lastSessionEndedAt`. On next login, it
queries all events since that timestamp, grouped by release:

```typescript
interface SinceYouWereAway {
  since: Timestamp;
  duration: number;              // Days
  releases: ReleaseChanges[];
  totals: {
    tasksCompleted: number;
    stagesAdvanced: number;
    approvalsDecided: number;
    releasesShipped: number;
    newBlockers: number;
    commentsAdded: number;
  };
}

interface ReleaseChanges {
  releaseId: string;
  releaseName: string;
  tasksCompleted: number;
  stagesAdvanced: { from: string; to: string }[];
  approvalsDecided: { entity: string; decision: string }[];
  newBlockers: { title: string }[];
  commentsAdded: number;
}
```

The panel appears at the top of the Operations Center (doc 59) on the
user's first visit after being away for ≥24 hours.

---

## Resolution 4: Workspace Duplication

**Problem:** Requirements Workspace (doc 38), Deliverable Workspace
(doc 34), and Distribution Workspace (doc 43) all show completeness data
with different organization. PMs must check all three.

### Solution: Consolidate into Distribution Workspace

The Distribution Workspace (doc 43) becomes the single source of truth
for "is this release distributable?" The other workspaces become sub-views
accessible from within it.

**Before:**
```
Sidebar
├── Requirements Workspace (38)    ← "What does the template need?"
├── Deliverable Workspace (34)     ← "What has been delivered?"
└── Distribution Workspace (43)    ← "What does Spotify need?"
```

**After:**
```
Distribution Workspace (43)
├── Tracks tab
├── Artwork tab
├── Metadata tab
├── Compliance tab
├── Packaging tab
├── Requirements (← doc 38 content, available as filter: "Show only required")
└── Deliverables (← doc 34 content, available as sub-view per category)
```

### Migration

- Doc 38 (Requirements) → merged into Distribution Workspace as a filter
- Doc 34 (Deliverables) → merged into Distribution Workspace as category sub-views
- Doc 43 (Distribution) → expanded to include Requirements and Deliverables tabs
- Docs 38 and 34 become appendices: "Deprecated — see Distribution Workspace."

### PM's New Experience

To check if a release is distributable, the PM opens ONE workspace
(Distribution). They see:
- Metadata: what fields are complete/missing
- Tracks: per-track readiness
- Artwork: validation results
- Requirements: template must-haves (filtered view)
- Deliverables: files by category (sub-view)

One click instead of three. One vocabulary instead of three.

---

## Resolution 5: Mobile Touch Targets

**Problem:** S-size buttons (32px) fail WCAG 2.1 minimum (44px). Multiple
docs lack mobile touch target specifications.

### Solution: Touch Target Scaling

All interactive elements scale to minimum 44×44px touch area on viewports
<768px:

| Element | Desktop Size | Mobile Size | Method |
|---------|-------------|-------------|--------|
| S Button | 32px | 44px | Scale up to M (40px) + 2px padding to reach 44px |
| M Button | 40px | 44px | Add 2px padding |
| L Button | 48px | 48px | Already safe |
| Table row action | 24px icon | 44px touch area | Padding expands touch area, icon stays small |
| Checkbox | 16px | 44px touch area | Invisible touch padding |
| Status badge | Variable | 44px min height | Padding to reach 44px |
| Tab | Variable | 44px min height | Padding or larger font |
| Dropdown trigger | 40px | 44px | Padding to 4px |

### CSS Implementation

```css
@media (max-width: 767px) {
  .btn-s {
    height: 44px;       /* Was 32px */
    padding: 0 16px;    /* Was 8px */
  }
  .btn-m {
    height: 44px;       /* Was 40px */
    padding: 0 16px;    /* Was 12px */
  }
  .action-icon {
    min-width: 44px;
    min-height: 44px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
  }
  .status-badge {
    min-height: 44px;
    padding: 6px 14px;
  }
}
```

### Affected Docs

Update doc 10 (Design System, Button section) to include mobile touch
target rules. Add touch target note to doc 65 (Mobile Audit).

---

## Summary

| # | Friction | Severity | Resolution | Docs Affected |
|---|----------|----------|-----------|---------------|
| 1 | Status transition UI | Blocking | Status badge dropdown | 12, 16 |
| 2 | Role landing pages | Medium | Routing table + implementation | 33, 42, 6, 60 |
| 3 | What changed while away? | Medium | "Since you were away" panel | 59 |
| 4 | Workspace duplication | High | Consolidate into Distribution | 34, 38, 43 |
| 5 | Mobile touch targets | Medium | CSS scaling rules | 10, 65 |

All 5 resolved. 0 blocking issues remain.
