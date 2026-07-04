# RFDS-002 — Page Zones

**Status:** Active
**Version:** 1.0

---

## Purpose

Every component on a page must be classified into a zone. The classification determines its visual weight, reading width, and content hierarchy.

A page is not a collection of sections. It is a sequence of operational answers.

---

## The Six Zones

| Zone | Purpose | Reading Width | Priority |
|------|---------|--------------|----------|
| **Situation** | Current operational state | 640px | 100 |
| **Decision** | What requires action | 640px | 80–90 |
| **Evidence** | Supporting data | 960–1120px | 70 |
| **Context** | Supplemental information | 360px (rail) | 50 |
| **History** | Chronological record | 640px | 10 |
| **Navigation** | Movement | Fixed rail | 20 |

---

## Zone Composition Rules

### Rule 1: Every page has one Situation zone

The Situation zone answers "what is happening?" It is always the first content below the topbar. The date or page identity is the Situation anchor.

### Rule 2: The Decision zone is the focal point

The Decision zone is what the user should do. It contains the highest-value action the interface can offer. It sits directly below the Situation zone, separated by relationship spacing (16–24px).

### Rule 3: Evidence is data, not decoration

The Evidence zone contains data that supports the decision. Tables, metrics, charts. It is visually quieter than the Decision zone. It sits below the Decision zone.

### Rule 4: Context is peripheral

The Context zone is a side rail. It does not compete with the main column. On mobile, it collapses into a tab or expandable section.

### Rule 5: History is at the bottom

The History zone is the least important content. It is at the bottom of the page. It can be collapsed, hidden, or moved to a dedicated page.

### Rule 6: Navigation is separate

The Navigation zone is the rail on the left. It is not part of the content flow. It is a tool, not a destination.

---

## Zone Layouts Per Page

### Operations Center

```
┌─────────────────────────────────────────────────┐
│ Navigation Rail (left, 72–256px)               │
├────┬────────────────────────────────────────────┤
│    │                                            │
│ N  │ ┌────── Situation (Hero) ─────────┐      │
│ a  │ │ Date (40px) + briefing        │      │
│ v  │ └────────────────────────────────┘      │
│    │                                            │
│ R  │ ┌────── Decision ─────────────────┐      │
│ a  │ │ Assessment (2-col grid)        │      │
│ i  │ │ Actions (list)                 │      │
│ l  │ └────────────────────────────────┘      │
│    │                                            │
│    │ ┌────── Evidence ──────────────────┐      │
│    │ │ Metrics (inline)                 │      │
│    │ │ Active Releases (table)          │      │
│    │ │ Attention (conditional)          │      │
│    │ └────────────────────────────────┘      │
│    │                                            │
│    │ ┌────── History ───────────────────┐      │
│    │ │ Recent Activity                  │      │
│    │ └────────────────────────────────┘      │
│    │                                            │
└────┴────────────────────────────────────────────┘
```

### Release Workspace

```
┌──────────┬──────────────────────────────────────┐
│ Nav Rail │ Release Hero (date, type, health)   │
│          │                                      │
│          │ Tabs (Overview, Workflow, etc.)      │
│          │                                      │
│          │ Active tab content (640–960px)       │
│          │                                      │
│          │                            ┌────────┐ │
│          │                            │Context │ │
│          │                            │ Rail   │ │
│          │                            │ 360px  │ │
│          │                            └────────┘ │
└──────────┴──────────────────────────────────────┘
```

### Artist Workspace

```
┌──────────┬──────────────────────────────────────┐
│ Nav Rail │ Artist Hero (name, role, health)    │
│          │                                      │
│          │ Tabs (Overview, Releases, etc.)      │
│          │                                      │
│          │ Active tab content (640–960px)       │
│          │                                      │
│          │                            ┌────────┐ │
│          │                            │Context │ │
│          │                            │ Rail   │ │
│          │                            │ 360px  │ │
│          │                            └────────┘ │
└──────────┴──────────────────────────────────────┘
```

---

## Zone → Component Mapping

### Situation Zone

| Component | Where |
|-----------|------|
| Page identity (H1, date) | Top of content, flush left |
| Briefing (conclusion) | Below identity, 640px width |
| Hero CTAs (primary action) | Top right of content area |

### Decision Zone

| Component | Where |
|-----------|------|
| Assessment (2-col grid) | Below hero, 16–24px gap |
| Immediate actions (text list) | Below assessment, 16–24px gap |
| Recommendations | Same zone as actions |

### Evidence Zone

| Component | Where |
|-----------|------|
| Org Pulse (inline) | Below decisions, 40px gap |
| Tables (data) | 24px gap from metrics |
| Metrics summaries | Within inline pulse |
| Inline charts (future) | 960–1120px width |

### Context Zone

| Component | Where |
|-----------|------|
| Context rail | Right side of canvas (≥1280px) |
| Tabs bar | Above active tab content |
| Side panels (drawers) | Right edge, overlay |
| Inline tooltips | Triggered by focus/hover |

### History Zone

| Component | Where |
|-----------|------|
| Activity feed | Bottom of page |
| Audit log | Settings page, bottom |
| Version history | Settings page, bottom |

### Navigation Zone

| Component | Where |
|-----------|------|
| Sidebar | Left of canvas, fixed |
| Topbar | Top of canvas, fixed |
| Breadcrumbs | Topbar, left |
| Context rail | Right of content, fixed (≥1280px) |

---

## Zone Visibility Per Breakpoint

| Zone | Desktop | Laptop | Tablet | Mobile |
|------|---------|--------|--------|--------|
| Situation | Visible | Visible | Visible | Visible |
| Decision | Visible | Visible | Visible | Visible |
| Evidence | Visible | Visible | Scroll/Hidden | Cards/Hidden |
| Context | Rail | Rail | Drawer | Drawer |
| History | Visible | Visible | Visible | Hidden (tab) |
| Navigation | Rail | Rail | Drawer | Drawer |

---

## Anti-Patterns

| Anti-Pattern | Result |
|-------------|--------|
| Context zone in main column | Pushes content, competes with decision |
| History above decision | User sees yesterday before today's priority |
| Situation as a small subtitle | Loses focal-point function |
| Evidence at the same priority as decision | Two competing focal points |
| Multiple zones collapsed into one section | Cannot tell which question is being answered |
