# Release Workspace — High-Fidelity Design

**Version:** 3.0 (Flagship)
**Status:** Approved
**Route:** `/releases/[id]` → redirects to `/releases/[id]/overview`
**Hero Component:** Release Journey

---

## Layout · 1440px Viewport

```
┌──────────────────────────────────────────────────────────────────────────────────────┐
│  Application Shell                                                                     │
│                                                                                        │
│  ┌───────────┐ ┌────────────────────────────────────────────────────────────────────┐ │
│  │ Sidebar   │ │ Top Nav · h 56px · bg Surface · border-b 1px #E4E4E7               │ │
│  │ w 240px   │ │ ┌─────────────────────────────────────────────────────────────────┐ │ │
│  │ bg #FFF   │ │ │ ◀ Back to Releases                    🔔(3)  👤                  │ │ │
│  │           │ │ └─────────────────────────────────────────────────────────────────┘ │ │
│  │ ▸ Ops     │ │                                                                      │ │
│  │ ◆ Release │ │  ─── Release Header ─────────────────────────────────────────────   │ │
│  │ ▸ Tasks   │ │  ┌──────────────────────────────────────────────────────────────┐    │ │
│  │ ▸ Assets  │ │  │                                                                │    │ │
│  │ ▸ Artists │ │  │  ┌────┐  Lua · The Fading Light                               │    │ │
│  │ ▸ Mktg    │ │  │  │ 🎵 │  Kinn Timo · EP · Nov 15, 2026                       │    │ │
│  │ ▸ Dist    │ │  │  │    │                                                        │    │ │
│  │ ▸ Reports │ │  │  └────┘  ┌───────────┐ ┌───────────────┐  ┌───────────────┐  │    │ │
│  │           │ │  │          │ PRODUCTION│ │ 🟡 ATTENTION  │  │ Advance Stage │  │    │ │
│  │ ◀ Back    │ │  │          │     ▼     │ │ Health        │  │  (Primary)    │  │    │ │
│  │           │ │  │          └───────────┘ └───────────────┘  └───────────────┘  │    │ │
│  │ Lua ───── │ │  └──────────────────────────────────────────────────────────────┘    │ │
│  │ ◆ Overview│ │  mb 24px                                                              │ │
│  │ ▸ Workflow│ │                                                                      │ │
│  │ ▸ Tasks   │ │  ─── Operational Summary ────────────────────────────────────────    │ │
│  │ ▸ Deliv.  │ │  ┌──────────────────────────────────────────────────────────────┐    │ │
│  │ ▸ Depend. │ │  │ Release is in Production. Mastering is underway.              │    │ │
│  │ ▸ Distrib.│ │  │ Artwork approval is outstanding. Release confidence is high.  │    │ │
│  │ ▸ Campaign│ │  │ Distribution is expected to begin in 3 weeks.                 │    │ │
│  │ ▸ Budget  │ │  └──────────────────────────────────────────────────────────────┘    │ │
│  │ ▸ Activity│ │  mb 32px                                                              │ │
│  │ ▸ Settings│ │                                                                      │ │
│  │           │ │  ─── Release Journey ─── [HERO COMPONENT] ──────────────────────    │ │
│  │           │ │  ┌──────────────────────────────────────────────────────────────┐    │ │
│  │           │ │  │                                                                │    │ │
│  │           │ │  │    Planning     Prod       Mixing    Mastering    Artwork     │    │ │
│  │           │ │  │    ┌─────┐    ┌─────┐    ┌─────┐    ┌─────┐    ┌─────┐       │    │ │
│  │           │ │  │    │  ✓  │───→│  ✓  │───→│  ✓  │───→│  ◉  │───→│  ○  │       │    │ │
│  │           │ │  │    │ Aug1│    │Aug10│    │Aug15│    │Aug22│    │ Sep5│       │    │ │
│  │           │ │  │    │ 5/5 │    │ 8/8 │    │ 6/6 │    │ 4/7 │    │ 0/3 │       │    │ │
│  │           │ │  │    │ Alex│    │ SamW│    │ SamW│    │Sam W│    │Taylr│       │    │ │
│  │           │ │  │    └─────┘    └─────┘    └─────┘    └─────┘    └─────┘       │    │ │
│  │           │ │  │                     ← scroll →                                │    │ │
│  │           │ │  │                                                                │    │ │
│  │           │ │  │     Distribution    Campaign      Release                      │    │ │
│  │           │ │  │    ┌─────┐    ┌─────┐    ┌─────┐                               │    │ │
│  │           │ │  │    │  ○  │    │  ○  │    │  ○  │                               │    │ │
│  │           │ │  │    │Oct15│    │ Nov8│    │Nov15│                               │    │ │
│  │           │ │  │    │ 0/5 │    │ 0/4 │    │ 0/2 │                               │    │ │
│  │           │ │  │    │ AMgr│    │ AMgr│    │  —  │                               │    │ │
│  │           │ │  │    └─────┘    └─────┘    └─────┘                               │    │ │
│  │           │ │  │                     ← scroll →                                │    │ │
│  │           │ │  │                                                                │    │ │
│  │           │ │  │  Timeline: Today ────┬──── Sep 5 ────┬─── Oct 15 ──── Nov 15  │    │ │
│  │           │ │  │                      │               │               ★ Release │    │ │
│  │           │ │  └──────────────────────────────────────────────────────────────┘    │ │
│  │           │ │  mb 32px                                                              │ │
│  │           │ │                                                                      │ │
│  │           │ │  ─── Workflow Board ────────────────────────────────────────────    │ │
│  │           │ │  ┌──────────────────────────────────────────────────────────────┐    │ │
│  │           │ │  │ Stage: Mastering · Active · Owner: Sam Wilson · Due: Sep 5   │    │ │
│  │           │ │  │                                                               │    │ │
│  │           │ │  │  ┌────────────┐ ┌────────────┐ ┌────────────┐ ┌────────────┐  │    │ │
│  │           │ │  │  │ ○ TO DO    │ │ ◉ IN PROG. │ │ ◐ REVIEW   │ │ ✓ DONE     │  │    │ │
│  │           │ │  │  │   (3)      │ │   (2)      │ │   (1)      │ │   (1)      │  │    │ │
│  │           │ │  │  │            │ │            │ │            │ │            │  │    │ │
│  │           │ │  │  │ EQ drum    │ │ Level      │ │ Rough mix  │ │ Import     │  │    │ │
│  │           │ │  │  │ stems      │ │ stems      │ │ approve    │ │ stems      │  │    │ │
│  │           │ │  │  │ 👤 Sam W   │ │ 👤 Sam W   │ │ 👤 Sam A&R │ │ 👤 Sam W   │  │    │ │
│  │           │ │  │  │ Aug 25 🔴  │ │ Aug 28 🟡  │ │ Aug 30 🟢  │ │ Aug 12 ✅  │  │    │ │
│  │           │ │  │  │            │ │            │ │            │ │            │  │    │ │
│  │           │ │  │  │ + Add Task │ │            │ │            │ │            │  │    │ │
│  │           │ │  │  └────────────┘ └────────────┘ └────────────┘ └────────────┘  │    │ │
│  │           │ │  └──────────────────────────────────────────────────────────────┘    │ │
│  │           │ │  mb 32px                                                              │ │
│  │           │ │                                                                      │ │
│  │           │ │  ─── Attention Panel ───────────────────────────────────────────    │ │
│  │           │ │  ┌──────────────────────────────────────────────────────────────┐    │ │
│  │           │ │  │ ⏳ Pending Approval: Rough mix review                         │    │ │
│  │           │ │  │    Reviewer: Sam A&R · Submitted Aug 28 · SLA: Aug 31         │    │ │
│  │           │ │  │    ┌──────────┐ ┌──────────┐                                   │    │ │
│  │           │ │  │    │  Review  │ │  Snooze  │                                   │    │ │
│  │           │ │  │    └──────────┘ └──────────┘                                   │    │ │
│  │           │ │  └──────────────────────────────────────────────────────────────┘    │ │
│  │           │ │  mb 48px                                                              │ │
│  │           │ │                                                                      │ │
│  │           │ │  ─── Activity Feed ──────────────────────────────────────────────    │ │
│  │           │ │  🔵 Aug 25 · Production → Mixing (auto-advanced)                     │ │
│  │           │ │  🟢 Aug 25 · Alex completed "Finalize stems"                         │ │
│  │           │ │  💬 Aug 24 · Sam A&R: "Mix levels look clean"                        │ │
│  │           │ │  🔴 Aug 23 · Alert: Ad budget exceeded                                │ │
│  │           │ │  🟡 Aug 22 · Blocker: Mechanical License · Melodic Pub               │ │
│  │           │ │  👤 Aug 22 · Taylor assigned as Artwork Designer                      │ │
│  │           │ │                                                                      │ │
│  │           │ │  Showing 6 of 27 events · ─── Load more ───                          │ │
│  │           │ └──────────────────────────────────────────────────────────────────────┘ │
│  │           │                                                                          │
│  │           │  ┌──────────────────────────────────────────────────────────────────────┐ │
│  │           │  │ Context Rail · w 320px · bg #FAFAFA · border-l 1px #E4E4E7          │ │
│  │           │  │ Sticky top 56px · Independent scroll                                  │ │
│  │           │  │                                                                       │ │
│  │           │  │  ─── Health Ring ────────────────────────────────────────────────   │ │
│  │           │  │  ┌────────────────────────────────────────────────────────────────┐  │ │
│  │           │  │  │                       ┌───────┐                                 │  │ │
│  │           │  │  │                       │ 🟡    │  ← 120px ring, stroke-dash     │  │ │
│  │           │  │  │                       │ Atten │     offset = 68%                │  │ │
│  │           │  │  │                       │ tion  │     colour: #D97706             │  │ │
│  │           │  │  │                       │ 68%   │                                 │  │ │
│  │           │  │  │                       └───────┘                                 │  │ │
│  │           │  │  │                                                                 │  │ │
│  │           │  │  │  Confidence: High                                                │  │ │
│  │           │  │  │  Stage: Mastering                                                │  │ │
│  │           │  │  │  Days until release: 141                                         │  │ │
│  │           │  │  └────────────────────────────────────────────────────────────────┘  │ │
│  │           │  │  mb 24px                                                              │ │
│  │           │  │                                                                       │ │
│  │           │  │  ─── Readiness Stack ─────────────────────────────────────────────   │ │
│  │           │  │  ┌────────────────────────────────────────────────────────────────┐  │ │
│  │           │  │  │ ✓ Audio Masters         3 of 3 approved                        │  │ │
│  │           │  │  │ ✓ Artwork               1 of 1 approved                        │  │ │
│  │           │  │  │ ✓ Metadata              All fields complete                    │  │ │
│  │           │  │  │ ✗ Rights                Missing publisher info                 │  │ │
│  │           │  │  │ ✗ Distribution          DSP accounts not configured            │  │ │
│  │           │  │  │ ○ Marketing             Not started                            │  │ │
│  │           │  │  │ ○ Legal                 Not reviewed                           │  │ │
│  │           │  │  │                                                                 │  │ │
│  │           │  │  │  3 of 7 items ready                                           │  │ │
│  │           │  │  └────────────────────────────────────────────────────────────────┘  │ │
│  │           │  │  mb 24px                                                              │ │
│  │           │  │                                                                       │ │
│  │           │  │  ─── Info ────────────────────────────────────────────────────────   │ │
│  │           │  │  Owner: Alex PM                                                       │ │
│  │           │  │  Due Date: Nov 15, 2026                                               │ │
│  │           │  │  Type: EP                                                            │ │
│  │           │  │  Label: Acme Records                                                  │ │
│  │           │  │  Genre: Afro Tech                                                     │ │
│  │           │  │  UPC: —                                                               │ │
│  │           │  │  Template: Standard EP Release                                        │ │
│  │           │  │  mb 24px                                                              │ │
│  │           │  │                                                                       │ │
│  │           │  │  ─── Dependencies ─────────────────────────────────────────────────   │ │
│  │           │  │  🔴 Mechanical License · Melodic Pub · 12d                            │ │
│  │           │  │  🟡 Sam Wilson · 5 releases · Capacity                                │ │
│  │           │  │  ✓ Cover Art approved · Canvas unblocked                              │ │
│  │           │  │  mb 24px                                                              │ │
│  │           │  │                                                                       │ │
│  │           │  │  ─── Recent Activity ──────────────────────────────────────────────   │ │
│  │           │  │  🔵 Stage advanced · 2h ago                                           │ │
│  │           │  │  🟢 Task completed · 2h ago                                           │ │
│  │           │  │  💬 Comment · 1d ago                                                  │ │
│  │           │  └──────────────────────────────────────────────────────────────────────┘ │
│  └───────────┘                                                                            │
└──────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## Component Inventory

### Required Components

| Component | Section | PDS Ref | Purpose |
|-----------|---------|---------|---------|
| **Release Header** | Top section | PDS-11 | Establishes release identity: artwork, title, artist, type, date, health, stage, primary action |
| **Release Journey** | Hero Component | SA-005, PDS-11 | Vertical/horizontal stage pipeline: Planning → Recording → Editing → Mixing → Mastering → Artwork → Publishing → Distribution → Released |
| **Health Ring** | Context Rail | OI-013, PDS-11 | Primary operational indicator: ring with stroke-dash offset representing health %, colour-coded by health state |
| **Readiness Stack** | Context Rail | OI-014, PDS-11 | Binary operational readiness: Audio, Artwork, Metadata, Rights, Distribution, Marketing, Legal |
| **Context Rail** | Right panel | SA-007, PDS-11 | Persistent side panel: Health Ring, Readiness Stack, Info, Dependencies, Recent Activity |
| **Attention Panel** | Supporting | PDS-11 | Approvals, reviews, deadlines requiring immediate action within this release |
| **Workflow Board** | Supporting | PDS-11 | Active stage task board: To Do → In Progress → Review → Done columns |
| **Activity Feed** | Bottom section | SA-008 | Chronological event stream for this release |
| **Operational Summary** | Below header | OI-015, SA-004 | Narrative summary of current release situation |

### Base Components Used

| Component | Usage |
|-----------|-------|
| Tabs | 10-tab navigation: Overview, Workflow, Tasks, Deliverables, Dependencies, Distribution, Campaigns, Budget, Activity, Settings |
| StatusBadge | Release stage (PRODUCTION), health state (ATTENTION) |
| Button (M, 40px) | Review, Snooze, Add Task, + Upload, Mark Done |
| Button (L, primary) | Advance Stage (primary action, top-right) |
| ProgressBar | Stage completion bars within Workflow Board columns |
| Avatar / AvatarGroup | Task assignees, stage owners |
| Badge | Task urgency, priority indicators |
| Card | Task cards in Workflow Board columns |
| Timeline | Activity Feed events, Release Journey timeline |
| EmptyState | No tasks, no dependencies, no activity |

### Components Explicitly Excluded

No additional components beyond the 9 required above.

---

## Interaction Notes

### Release Header

| Interaction | Trigger | Result |
|-------------|---------|--------|
| Stage badge click | Click "PRODUCTION ▼" | Dropdown: available transitions (Put on Hold, Mark Ready, Cancel Release) |
| Health badge click | Click "🟡 ATTENTION" | Expands Health Ring detail in Context Rail |
| Primary Action | Click "Advance Stage" | Advances stage. Optimistic update. Confirmation only for destructive transitions. |
| Back arrow | Click "◀ Back to Releases" | Navigate to `/releases` |

### Release Journey (Hero Component)

| Interaction | Trigger | Result |
|-------------|---------|--------|
| Stage card click | Click any stage card | Opens Stage Detail panel (right drawer) with task list, owner, dependencies |
| Stage card hover | Hover over stage | Card elevates 2px. Shows abbreviated tooltip: "4 of 7 tasks complete" |
| Scroll (horizontal) | Drag or arrow keys | Scroll through stages if more than viewport width |
| Timeline marker | Click timeline date | Scroll Release Journey to that stage |
| Current stage highlight | n/a | Current stage has primary border + pulse animation on first load |

### Health Ring (Context Rail)

| Interaction | Trigger | Result |
|-------------|---------|--------|
| Ring hover | Hover over ring | Tooltip: "Health: Attention · 68% · Confidence: High" |
| Ring click | Click ring | Expands to show input breakdown (Workflow 80%, Dependencies 40%, Approvals 75%, Deliverables 85%, Schedule 90%, Budget 30%, Rights 20%, Distribution 0%) |

### Readiness Stack (Context Rail)

| Interaction | Trigger | Result |
|-------------|---------|--------|
| Category row click | Click "Rights — Missing publisher info" | Deep link to Rights section |
| Category row hover | Hover over category | Highlight row, cursor pointer |

### Workflow Board

| Interaction | Trigger | Result |
|-------------|---------|--------|
| Task card click | Click task card | Open Task Detail panel (right drawer) |
| Task card drag | Drag between columns | Change task status. Optimistic update with rollback. |
| "Start" button | Click | Task → IN_PROGRESS |
| "+ Upload" button | Click | Open file upload modal. Links to deliverable. |
| "Mark Done" button | Click | Task → DONE. Card slides to done column. |
| "+ Add Task" button | Click | Inline task creation at bottom of To Do column |
| Column header click | Click "TO DO (3)" | Filter board to show only that column's tasks |

### Attention Panel

| Interaction | Trigger | Result |
|-------------|---------|--------|
| Review button | Click | Open Review Panel (drawer, doc 35) |
| Snooze button | Click | Snooze dialog: 24h / 3d / 1w |

### Activity Feed

| Interaction | Trigger | Result |
|-------------|---------|--------|
| Activity item click | Click any event | Navigate to relevant entity (task, stage, comment) |
| "Load more" | Click | Load next 10 events |

### Tab Navigation

| Interaction | Trigger | Result |
|-------------|---------|--------|
| Tab click | Click "Workflow", "Tasks", etc. | Switch content area. URL updates. Active tab gets primary bottom border. |
| Tab count badge | Static | Shows count of items in that tab (e.g., "Tasks (8)") |

---

## Mobile Adaptation

### ≥1280px (Large Desktop)
- Full layout with Context Rail visible (320px)
- Tabs: 2 rows with icons + labels
- Release Journey: up to 7 stages visible, horizontal scroll for more
- Workflow Board: 4 columns full width

### 1024–1279px (Small Desktop)
- Context Rail visible (280px)
- Tabs: horizontal scroll
- Release Journey: 4-5 stages visible, scroll for more
- Workflow Board: 4 columns, narrower cards

### 768–1023px (Tablet)
- Context Rail: collapsed to bottom icon row. Expand as bottom sheet on tap.
- Tabs: icons + abbreviated labels (8 chars), horizontal scroll
- Release Journey: 3 stages visible, swipe to scroll
- Workflow Board: 3 columns, horizontal scroll for "Done" column
- Content stacks where needed

### <768px (Phone)
- **No sidebar**: Bottom tab bar for main navigation
- **Context Rail**: Transformed to full-width sections below content:
  - Health Ring: mini inline (80px, left-aligned)
  - Readiness Stack: accordion below Health Ring
  - Info/Dependencies: collapsed under "Release Details" accordion
- **Release Journey (Hero)**: 
  - Swipeable single-column view
  - Dot indicator showing position (e.g., ● ○ ○ ○ ○ ○ ○)
  - Stage name, status, owner, progress shown per swipe card
  - Current stage centered on load
- **Workflow Board**:
  - Swipeable single-column view
  - Column selector: [○ To Do] [◉ In Progress] [◐ Review] [✓ Done]
  - Tasks stack full-width within selected column
  - Action buttons full-width
- **Tabs**: Horizontal scroll, icons only. "More" dropdown for overflow tabs.
- **Activity Feed**: Last 5 events. "Load more" to expand.

---

## Accessibility Notes

| Requirement | Implementation |
|-------------|---------------|
| Color dependency | Health Ring displays numerical % alongside color. Journey stages show checkmark (✓), current (◉), pending (○) icons. |
| Focus order | Release Header → Tabs → Operational Summary → Release Journey → Workflow Board → Attention Panel → Activity Feed → Context Rail |
| Keyboard nav | Tab through main content → Context Rail. Arrow keys to navigate Journey stages. Enter to open stage detail. Tab between Workflow Board columns. |
| Screen reader | Journey: role="list" with role="listitem" per stage, aria-current="step" on active stage. Workflow Board: role="list" per column, role="listitem" per task. Health Ring: aria-valuenow="68" aria-valuetext="68 percent healthy, Attention". Readiness Stack: role="list" with aria-checked per item. |
| Touch targets | Minimum 44x44px for all interactive elements. Stage cards at 120px wide meet this. |
| Contrast | All text meets WCAG AA. #18181B on #FFFFFF = 15.3:1 (AAA). #D97706 on #FFFFFF = 3.7:1 — paired with icon for differentiation. |
| Motion | Health Ring animation on page load only (once). Task drag shows ghost card (not live animation). Stage advance: 200ms dissolve. |
| Reduced motion | @media (prefers-reduced-motion): all transitions instant. Health Ring static. |
| ARIA landmarks | role="banner" (top nav), role="navigation" (sidebar + tabs), role="main" (content), role="complementary" (Context Rail), role="region" per section |

---

## Compliance Checklist

| PDS Ref | Rule | Status |
|---------|------|--------|
| PDS-04 VL-101 | Typography leads hierarchy | ✅ Release title 24px/600 → stage names 16px/600 → task text 14px/400 |
| PDS-04 VL-102 | Space communicates | ✅ 32px section gaps, 12px card padding, 8px internal gaps |
| PDS-04 VL-103 | Colour explains | ✅ Journey stages: green (done), primary (active), neutral (pending). Health Ring: Excellent (green), Healthy (green), Attention (amber), Blocked (red), Critical (red) |
| PDS-04 VL-104 | Layout creates confidence | ✅ Consistent structure: Header → Summary → Hero → Supporting → Activity |
| PDS-05 DE-001 | Cognitive economy | ✅ Operational Summary explains situation before user reads any table |
| PDS-05 DE-002 | Five second rule | ✅ Where am I (header), what's happening (summary), what needs attention (attention panel), what should I do (primary action), is everything healthy (health ring) |
| PDS-05 DE-003 | One Hero Component | ✅ Release Journey exclusively |
| PDS-05 DE-004 | Visual rhythm | ✅ Spacing scale: 96 (between major sections) → 48 → 32 → 24 → 16 → 8 |
| PDS-05 DE-005 | Progressive disclosure | ✅ Overview → Stage Detail → Task Detail |
| PDS-05 DE-006 | Context never disappears | ✅ Release Header, Tabs, Context Rail persist while scrolling |
| PDS-05 DE-007 | Operational storytelling | ✅ Identity → Situation → Action → Work → History |
| PDS-06 VG-001 | Everything communicates | ✅ Every stage dot, health color, readiness check answers a question |
| PDS-06 VG-002 | Progress grammar | ✅ Journey shows stage name + bar + deliverables summary + next stage |
| PDS-06 VG-003 | Health grammar | ✅ Five universal health states on Health Ring |
| PDS-06 VG-004 | Time grammar | ✅ Relative times: "2h ago", "Today", "5 days remaining" |
| PDS-06 VG-005 | Collaboration grammar | ✅ Role Chips: Producer, Mix Engineer, A&R Reviewer |
| PDS-06 VG-006 | Ownership grammar | ✅ Owner, Responsible, Reviewer, Supporting roles |
| PDS-07 OI-001 | Measure confidence | ✅ Health Ring reflects calculated health from 10 inputs |
| PDS-07 OI-002 | Release Health | ✅ All 10 inputs evaluated: workflow, dependencies, approvals, deliverables, schedule, budget, rights, distribution, alerts, blockers |
| PDS-07 OI-003 | Readiness (binary) | ✅ Readiness Stack: Ready / Not Ready per category |
| PDS-07 OI-004 | Release Confidence | ✅ Confidence level + explanation displayed |
| PDS-07 OI-015 | Operational Summary | ✅ Narrative summary above hero component |
| PDS-08 IL-001 | Interactions disappear | ✅ Direct manipulation: click stage → open stage. Click task → open task. |
| PDS-08 IL-002 | One primary action | ✅ Advance Stage, top-right |
| PDS-08 IL-003 | Direct manipulation | ✅ Click release → open release. Click task → open task. |
| PDS-08 IL-004 | Progressive interaction | ✅ Primary (Advance Stage) → Secondary (tab nav) → Advanced (settings) |
| PDS-08 IL-005 | Immediate feedback | ✅ Task status change is optimistic. Stage advance is optimistic. |
| PDS-08 IL-006 | Optimistic interaction | ✅ Complete Task → UI updates immediately → sync in background |
| PDS-08 IL-007 | Confirmation philosophy | ✅ Destroy actions only. Never "Are you sure?" — explain consequences. |
| PDS-08 IL-008 | Undo before confirm | ✅ Task completion: undo toast for 5s. |
| PDS-12 SA-001 | Universal structure | ✅ Shell → Header → Summary → Primary Action → Hero → Supporting → Activity |
| PDS-12 SA-002 | Application Shell | ✅ Sidebar (release mode) + top nav persistent |
| PDS-12 SA-003 | Screen Header | ✅ Release identity, breadcrumb, primary + secondary actions |
| PDS-12 SA-004 | Operational Summary | ✅ Present at top |
| PDS-12 SA-005 | Hero Component | ✅ Release Journey |
| PDS-12 SA-006 | Supporting sections | ✅ Workflow, Tasks, People, Deliverables, Dependencies |
| PDS-12 SA-007 | Context Rail | ✅ Health Ring, Readiness Stack, Info, Dependencies, Activity |
| PDS-12 SA-014 | Release Workspace Blueprint | ✅ Header → Summary → Journey → Workflow → Deliverables → People → Distribution → Activity + Context Rail |

---

## Implementation Tokens

```css
.release-workspace {
  display: flex;
  height: calc(100vh - 56px);
  overflow: hidden;
}

.release-main {
  flex: 1;
  overflow-y: auto;
  padding: 24px 32px;
  max-width: calc(100% - 320px);
}

/* --- Release Header --- */
.release-header {
  display: flex;
  align-items: flex-start;
  gap: 20px;
  margin-bottom: 24px;
  padding-bottom: 24px;
  border-bottom: 1px solid var(--color-border);
}

.release-artwork {
  width: 80px;
  height: 80px;
  border-radius: 8px;
  background: var(--color-neutral-bg);
  flex-shrink: 0;
  overflow: hidden;

  img { width: 100%; height: 100%; object-fit: cover; }
}

.release-identity {
  flex: 1;

  .release-title {
    font: var(--text-h1); /* 24px / 600 */
    color: var(--color-text-primary);
    margin: 0;
  }

  .release-meta {
    font: var(--text-body); /* 14px / 400 */
    color: var(--color-text-secondary);
    margin-top: 4px;

    .meta-separator { color: var(--color-text-muted); margin: 0 6px; }
  }
}

.release-badges {
  display: flex;
  gap: 8px;
  margin-top: 12px;
}

.release-actions {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 8px;

  .primary-action {
    /* Button L · primary */
  }

  .secondary-actions {
    display: flex;
    gap: 8px;
  }
}

/* --- Operational Summary --- */
.ops-summary {
  margin-bottom: 32px;
  padding: 16px 20px;
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: 8px;
  font: var(--text-body);
  line-height: 1.7;
  color: var(--color-text-primary);
}

/* --- Release Journey (Hero) --- */
.release-journey {
  margin-bottom: 32px;
  overflow-x: auto;
  scrollbar-width: thin;
  -webkit-overflow-scrolling: touch;

  .journey-track {
    display: flex;
    gap: 0;
    min-width: max-content;
    padding: 8px 0;

    /* Connector line between stages */
    .journey-connector {
      width: 40px;
      flex-shrink: 0;
      display: flex;
      align-items: center;
      justify-content: center;

      &::after {
        content: '';
        width: 100%;
        height: 2px;
        background: var(--color-border);
      }
    }

    .stage-completed + .journey-connector::after {
      background: var(--color-success); /* #16A34A */
    }
  }

  .journey-timeline {
    display: flex;
    justify-content: space-between;
    margin-top: 16px;
    padding: 0 8px;
    font: var(--text-caption); /* 11px */
    color: var(--color-text-muted);

    .timeline-marker { position: relative; }
    .timeline-today { font-weight: 600; color: var(--color-primary); }
    .timeline-release { font-weight: 600; color: var(--color-text-primary); }
  }
}

.stage-card {
  width: 140px;
  flex-shrink: 0;
  padding: 16px 12px;
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: 8px;
  text-align: center;
  cursor: pointer;
  transition: all 100ms ease;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0,0,0,0.06);
  }

  .stage-icon {
    width: 32px;
    height: 32px;
    border-radius: 50%;
    margin: 0 auto 8px;
    display: flex;
    align-items: center;
    justify-content: center;
    font: var(--text-h3);
  }

  .stage-name {
    font: var(--text-body);
    font-weight: 600;
    color: var(--color-text-primary);
    margin-bottom: 4px;
  }

  .stage-date {
    font: var(--text-caption);
    color: var(--color-text-muted);
    margin-bottom: 8px;
  }

  .stage-progress {
    font: var(--text-caption);
    color: var(--color-text-secondary);
    margin-bottom: 4px;
  }

  .stage-owner {
    font: var(--text-caption);
    color: var(--color-text-muted);
  }

  /* States */
  &.stage-completed {
    border-color: #BBF7D0;
    background: #F0FDF4;

    .stage-icon { background: #16A34A; color: #FFF; }
  }

  &.stage-active {
    border-color: var(--color-primary);
    border-width: 2px;
    box-shadow: 0 0 0 4px rgba(var(--color-primary-rgb), 0.1);

    .stage-icon { background: var(--color-primary); color: #FFF; }
  }

  &.stage-blocked {
    border-color: #FECACA;
    background: #FEF2F2;

    .stage-icon { background: #DC2626; color: #FFF; }
  }
}

/* --- Workflow Board --- */
.workflow-board {
  margin-bottom: 32px;

  .board-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 12px;

    .board-title {
      font: var(--text-h2); /* 20px / 600 */
      color: var(--color-text-primary);
    }

    .board-meta {
      font: var(--text-body-sm);
      color: var(--color-text-secondary);
    }
  }

  .board-columns {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 12px;
  }
}

.board-column {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: 8px;
  padding: 12px;
  min-height: 200px;

  .column-header {
    font: var(--text-body);
    font-weight: 600;
    color: var(--color-text-primary);
    margin-bottom: 12px;
    padding-bottom: 8px;
    border-bottom: 1px solid var(--color-border);
    display: flex;
    justify-content: space-between;
    align-items: center;

    .column-count {
      font: var(--text-label);
      color: var(--color-text-muted);
      background: var(--color-neutral-bg);
      padding: 2px 8px;
      border-radius: 12px;
    }
  }

  .column-tasks {
    display: flex;
    flex-direction: column;
    gap: 8px;
    min-height: 100px;
  }
}

.task-card {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-left: 3px solid var(--urgency-color);
  border-radius: 0 6px 6px 0;
  padding: 10px;
  cursor: pointer;
  transition: all 100ms ease;

  &:hover {
    box-shadow: 0 2px 8px rgba(0,0,0,0.06);
  }

  .task-title {
    font: var(--text-body);
    font-weight: 500;
    color: var(--color-text-primary);
    margin-bottom: 4px;
  }

  .task-meta {
    font: var(--text-caption);
    color: var(--color-text-secondary);
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .task-avatar {
    display: inline-flex;
    vertical-align: middle;
    margin-right: 4px;
  }

  /* Urgency variants */
  &.urgency-overdue   { --urgency-color: #DC2626; background: #FEF2F2; }
  &.urgency-today     { --urgency-color: #D97706; background: #FEF3C7; }
  &.urgency-this-week { --urgency-color: #D97706; }
  &.urgency-future    { --urgency-color: #16A34A; }

  &.is-dragging {
    opacity: 0.6;
    transform: rotate(2deg);
  }
}

/* --- Attention Panel --- */
.attention-panel {
  margin-bottom: 32px;
}

.attention-item {
  border-left: 3px solid #7C3AED;
  background: #F5F3FF;
  padding: 12px;
  margin-bottom: 8px;
  border-radius: 0 6px 6px 0;

  .attention-title {
    font: var(--text-body);
    font-weight: 600;
    color: var(--color-text-primary);
    margin-bottom: 4px;
  }

  .attention-meta {
    font: var(--text-body-sm);
    color: var(--color-text-secondary);
    margin-bottom: 8px;
  }

  .attention-actions {
    display: flex;
    gap: 8px;
  }

  .sla-bar {
    height: 4px;
    background: #EDE9FE;
    border-radius: 2px;
    margin-bottom: 8px;
    overflow: hidden;

    .sla-fill {
      height: 100%;
      background: #7C3AED;
      border-radius: 2px;
      transition: width 300ms;
    }
  }
}

/* --- Activity Feed --- */
.activity-feed {
  margin-bottom: 48px;

  .activity-item {
    padding: 6px 0;
    font: var(--text-body-sm);
    color: var(--color-text-secondary);
    cursor: pointer;
    display: flex;
    align-items: center;
    gap: 8px;

    &:hover { color: var(--color-text-primary); }

    .activity-icon {
      width: 20px;
      height: 20px;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }

    .activity-actor {
      font-weight: 600;
      color: var(--color-text-primary);
    }

    .activity-time {
      color: var(--color-text-muted);
      margin-left: auto;
    }
  }

  .activity-load-more {
    display: block;
    text-align: center;
    padding: 8px;
    font: var(--text-body-sm);
    color: var(--color-primary);
    cursor: pointer;
    border-radius: 6px;

    &:hover { background: #F5F3FF; }
  }
}

/* --- Context Rail --- */
.context-rail {
  width: 320px;
  flex-shrink: 0;
  border-left: 1px solid var(--color-border);
  background: #FAFAFA;
  overflow-y: auto;
  padding: 24px 20px;
  position: sticky;
  top: 56px;
  height: calc(100vh - 56px);
}

.context-section {
  margin-bottom: 24px;

  .context-section-title {
    font: var(--text-label); /* 12px / 500 */
    color: var(--color-text-muted);
    text-transform: uppercase;
    letter-spacing: 0.05em;
    margin-bottom: 12px;
  }
}

/* --- Health Ring --- */
.health-ring {
  text-align: center;
  padding: 20px 0;

  .ring-container {
    position: relative;
    width: 120px;
    height: 120px;
    margin: 0 auto 12px;
  }

  .ring-svg {
    transform: rotate(-90deg);

    .ring-track {
      fill: none;
      stroke: var(--color-neutral-bg);
      stroke-width: 8;
    }

    .ring-fill {
      fill: none;
      stroke: var(--ring-color, #D97706);
      stroke-width: 8;
      stroke-linecap: round;
      transition: stroke-dashoffset 600ms ease;
    }
  }

  .ring-center {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    text-align: center;

    .ring-value {
      font: var(--text-h1); /* 24px / 600 */
      color: var(--color-text-primary);
    }

    .ring-label {
      font: var(--text-caption);
      color: var(--color-text-secondary);
    }
  }

  .ring-health-label {
    font: var(--text-body);
    font-weight: 600;
    margin-bottom: 4px;
  }

  .ring-confidence {
    font: var(--text-body-sm);
    color: var(--color-text-secondary);
  }

  .ring-stage {
    font: var(--text-body-sm);
    color: var(--color-text-secondary);
    margin-top: 8px;
  }

  .ring-days {
    font: var(--text-caption);
    color: var(--color-text-muted);
    margin-top: 4px;
  }

  /* Health state colors */
  &.excellent  .ring-value { color: #16A34A; } .ring-fill { stroke: #16A34A; }
  &.healthy    .ring-value { color: #16A34A; } .ring-fill { stroke: #16A34A; }
  &.attention  .ring-value { color: #D97706; } .ring-fill { stroke: #D97706; }
  &.blocked    .ring-value { color: #DC2626; } .ring-fill { stroke: #DC2626; }
  &.critical   .ring-value { color: #DC2626; } .ring-fill { stroke: #DC2626; }
}

/* --- Readiness Stack --- */
.readiness-stack {
  .readiness-item {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 8px 0;
    border-bottom: 1px solid var(--color-border);
    cursor: pointer;

    &:last-child { border-bottom: none; }

    &:hover { background: rgba(0,0,0,0.02); }

    .readiness-icon {
      width: 20px;
      height: 20px;
      border-radius: 50%;
      flex-shrink: 0;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 12px;
      font-weight: 600;
    }

    &.ready {
      .readiness-icon { background: #F0FDF4; color: #16A34A; }
    }

    &.not-ready {
      .readiness-icon { background: #FEF2F2; color: #DC2626; }
    }

    &.not-applicable {
      .readiness-icon { background: var(--color-neutral-bg); color: var(--color-text-muted); }
    }

    .readiness-category {
      font: var(--text-body-sm);
      font-weight: 500;
      color: var(--color-text-primary);
    }

    .readiness-detail {
      font: var(--text-caption);
      color: var(--color-text-secondary);
      margin-left: auto;
      text-align: right;
    }
  }

  .readiness-summary {
    font: var(--text-caption);
    color: var(--color-text-muted);
    text-align: center;
    padding-top: 8px;
  }
}

/* --- Responsive --- */
@media (max-width: 1279px) {
  .context-rail {
    width: 280px;
  }

  .release-main {
    max-width: calc(100% - 280px);
  }
}

@media (max-width: 1023px) {
  .context-rail {
    display: none; /* Bottom sheet on tap */
  }

  .release-main {
    max-width: 100%;
  }

  .stage-card {
    width: 120px;
  }

  .board-columns {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 767px) {
  .release-header {
    flex-wrap: wrap;
  }

  .release-artwork {
    width: 64px;
    height: 64px;
  }

  .release-actions {
    width: 100%;
    flex-direction: row;
    justify-content: flex-end;
  }

  .release-journey {
    .journey-track {
      gap: 0;

      .journey-connector { width: 24px; }
    }
  }

  .stage-card {
    width: 100px;
    padding: 12px 8px;
  }

  .board-columns {
    grid-template-columns: 1fr;
  }

  .board-column {
    display: none;

    &.column-active { display: block; }
  }

  .column-selector {
    display: flex;
    gap: 4px;
    margin-bottom: 12px;
    overflow-x: auto;

    .column-selector-btn {
      padding: 8px 16px;
      border-radius: 20px;
      font: var(--text-body-sm);
      font-weight: 500;
      white-space: nowrap;
      background: var(--color-neutral-bg);
      color: var(--color-text-secondary);
      border: none;
      cursor: pointer;

      &.active {
        background: #F5F3FF;
        color: var(--color-primary);
      }
    }
  }

  .attention-item .attention-actions {
    flex-direction: column;

    button { width: 100%; }
  }
}

@media (prefers-reduced-motion: reduce) {
  .stage-card { transition: none; }
  .ring-fill { transition: none; }
  .task-card { transition: none; }
}
```
