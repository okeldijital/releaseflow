# Visual Information Architecture — ReleaseFlow

**Version:** 1.0
**Date:** 2026-06-28

---

## Principle

Information architecture is the editorial layer between the data model and the interface. It answers *what* goes *where* and *why* before any visual styling exists.

---

## The Fixed Reading Order

Every screen follows the same vertical sequence:

```
1. Critical       — What requires immediate action? (red, top)
        ↓
2. Attention      — What needs review? (amber, below critical)
        ↓
3. Decision       — What action should I take? (primary CTA, top-right)
        ↓
4. Operational    — What is the current state? (health, stage, progress)
        ↓
5. Context        — What surrounding details matter? (dates, people, links)
        ↓
6. History        — What happened? (activity, timeline, bottom)
```

This order is **fixed**. No screen may violate it. An overdue blocker must always appear above an activity feed. A health summary must always appear above a task list.

---

## Visual Weight Distribution

| Layer | Approximate Visual Weight | Dominant Element |
|-------|--------------------------|-----------------|
| Critical | 10-15% (compact, high-contrast) | Attention Panel |
| Attention | 10-15% | Alerts, Blockers, Deadlines |
| Decision | 5% (single button) | Primary Action |
| Operational | 25-30% (hero) | Operational Summary, Hero |
| Context | 20-25% | Table, Workflow, Details |
| History | 10-15% (bottom) | Activity Feed |

The operational hero and context table should dominate. Navigation should never dominate.

---

## Screen Zones

Every screen divides into fixed zones:

```
┌────────────────────────────────────────────┐
│  Topbar (system-level)                      │
├──────────────────────┬─────────────────────┤
│                      │                     │
│  Sidebar             │  Content Area       │
│  (navigation)        │                     │
│                      │  1. Critical        │
│                      │  2. Attention       │
│                      │  3. Decision        │
│                      │  4. Operational     │
│                      │  5. Context         │
│                      │  6. History         │
│                      │                     │
│                      │                     │
├──────────────────────┴─────────────────────┤
│  Context Rail (optional, workspace pages)  │
└────────────────────────────────────────────┘
```

### Zone Rules

| Zone | What Belongs | What Must Not |
|------|-------------|---------------|
| Topbar | Breadcrumbs, Search, Notifications, Org Switcher, User Menu | Page-specific content |
| Sidebar | Navigation sections | Content, widgets, metrics |
| Content Area | The 6-layer reading order | Sidebar-style navigation |
| Context Rail (right) | Health Ring, Readiness Stack, Dependencies, Attention items | Primary actions, main content |

---

## The Decision Hierarchy In Practice

```
Operations Center → "What needs action?"     → Attention first, then health
Release Workspace → "Can this ship?"         → Health first, then blockers, then work
Artist Workspace  → "Which releases matter?" → Active releases first, then profile
Work              → "What do I work on?"     → Overdue first, then upcoming
```

The same 6-layer reading order applies, but the emphasis shifts per screen type.

---

## Progressive Disclosure

Information appears at the right level of detail for the right screen:

| Detail Level | Screen Type |
|--------------|-------------|
| Org-level aggregate | Operations Center |
| Release-level detailed | Release Workspace |
| Artist-level relationships | Artist Workspace |
| Personal-level tasks | Work |

A user should never see per-release task details on the Operations Center. A user should never see org-level metrics on the Release Workspace.

---

## Component ↔ Screen Mapping

| Component | Operations Center | Release Workspace | Artist Workspace | Work |
|-----------|:---:|:---:|:---:|:---:|
| OperationalSummary | ✅ Top | ✅ Below hero | ✅ Below hero | — |
| Release Health Table | ✅ Hero | — | — | — |
| ReleaseJourney | — | ✅ Hero | — | — |
| HealthRing | — | ✅ Context Rail | ✅ Context Rail | — |
| ReadinessStack | — | ✅ Context Rail | ✅ Context Rail | — |
| WorkflowBoard | — | ✅ Workflow tab | — | — |
| Attention Panel | ✅ | ✅ As tab | ✅ As tab | — |
| Activity Feed | ✅ Bottom | ✅ Activity tab | ✅ Activity tab | — |
| Quick Actions | ✅ Bottom-right | — | — | — |
| Context Rail | — | ✅ Fixed right | ✅ Fixed right | — |
