# RFDS-007 — Workspace

**Status:** Active
**Version:** 1.0

---

## Pattern B — Workspace

**Purpose**: Help users complete operational work on a single entity.

**Operational Question**: *What should I do with this entity?*

**Used By**: Release Workspace, Artist Workspace

---

## Reading Order

```
Identity (Tier 1) — Entity name, type, status
    ↓
Operational State (Tier 2) — Health, readiness, stage
    ↓
Work Area (Tier 4) — Tabs, workflow board, tables
    ↓
Context (Tier 5) — Context rail with supplemental info
    ↓
History (Tier 6) — Activity feed
```

---

## Zone Assignment

| Section | Zone | VH | Width |
|---------|------|-----|-------|
| Entity header (name, type, status) | Situation | 100 | 960px (with context rail) |
| Health + readiness indicators | Decision | 80 | Inline with header |
| Primary action (Advance Stage, Add Release) | Decision | 90 | Top-right |
| Tabs | Context | 55 | Full width |
| Tab content (workflow, assets, rights) | Evidence | 70 | 960px |
| Context rail (HealthRing, ReadinessStack) | Context | 60 | 360px |
| Activity (tab) | History | 40 | 960px |

---

## Components Permitted

| Component | Section | Category |
|-----------|---------|----------|
| Hero (custom — name + badges) | Identity | Informational |
| HealthRing | Context | Informational |
| ReadinessStack | Context | Informational |
| ContextRail | Context | Contextual |
| ReleaseJourney | Identity | Informational |
| WorkflowBoard | Work Area | Operational |
| Table | Work Area | Operational |
| Tabs | Work Area | Operational |
| Button (primary action) | Decision | Operational |
| StatusBadge | Identity | Informational |
| ActivityFeed | History | Informational |

---

## Navigation

| Mechanism | VH | Location |
|-----------|-----|----------|
| Primary Action (Advance Stage / Add Release) | 90 | Top-right |
| Context Rail | 60 | Right (≥1280px) |
| Navigation Rail | 40 | Left |
| Breadcrumbs | 30 | Topbar |
| Command Palette (⌘K) | 70 | Overlay |

---

## Responsive Adaptations

### Desktop (≥1280px)
- Context rail visible (360px, right)
- Two-column layout supported

### Desktop (1024–1279px)
- Context rail visible (320px)
- Single-column content

### Tablet (768–1023px)
- Context rail: drawer overlay
- Tabs: horizontal scroll

### Mobile (<768px)
- Context rail: integrated into page flow below content
- Tabs: icons only, horizontal scroll
- Workflow board: single-column swipe
- Table: card list

---

## Accessibility

- `role="main"` on content area
- `role="complementary"` on context rail
- Tab order: Skip link → Nav Rail → Entity header → Primary action → Tabs → Tab content → Context rail → Activity
- Single H1 (entity name)
- Context rail independently scrollable
