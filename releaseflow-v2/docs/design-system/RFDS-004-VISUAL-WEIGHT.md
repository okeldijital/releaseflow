# RFDS-004 — Visual Weight System

**Status:** Active
**Version:** 1.0

---

## Principle

Every component receives a permanent visual weight. The weight determines its dominance on the page. No subjective "this feels too big" — the weight is deterministic.

---

## The VH Scale

| Weight | Role | Examples | Typography | Position |
|--------|------|----------|------------|-----------|
| **VH-100** | Situation | Hero briefing, page identity, date | 40px medium text-900 | Top of page |
| **VH-95** | Critical State | Critical health, blocker | 15px bold text-900 + accent | Inline with hero |
| **VH-90** | Decision | Primary CTA, immediate action | 15px medium text-900 | Top-right or inline |
| **VH-85** | Assessment | Health %, readiness %, stage | 24px value / 10px label | 2-col grid below hero |
| **VH-80** | Status | Current stage, workflow state | 13px semibold + status dot | Inline with hero |
| **VH-75** | Priority Evidence | Deadline (overdue), alert | 14px medium text-700 | Below assessment |
| **VH-70** | Evidence | Tables, metrics, data | 14px normal text-700 | 960–1120px width |
| **VH-60** | Context | Context rail content | 13px normal text-500 | Right rail |
| **VH-55** | Tab Labels | Tab bar, section headers | 10–12px medium uppercase tracking-widest | Above content |
| **VH-50** | Supporting | Card titles, subtitles | 14px normal text-700 | Standard position |
| **VH-40** | Navigation | Sidebar nav items | 13px normal text-400 | Left rail |
| **VH-30** | Legal/Copyright | Settings, metadata fields | 11px normal text-500 | Footer/settings |
| **VH-20** | Metadata | IDs, timestamps, technical | 10px normal text-400 | Inline, tooltip |
| **VH-10** | Decoration | Dividers, structural | 1px surface-200 | Between sections |

---

## Weight Enforcement Rules

### Rule 1: No component exceeds its assigned weight

A component at VH-70 (Evidence) must never use typography larger than 14px normal. A component at VH-40 (Navigation) must never use accent colour.

### Rule 2: One VH-100 element per page

Every page has exactly one VH-100 element — the hero. On the Operations Center, this is the date. On the Release Workspace, this is the release title.

### Rule 3: Maximum one VH-90/95 element per section

A section may have at most one dominant element. If a page has a critical health indicator (VH-95) and a primary CTA (VH-90), they must not compete for the same visual space.

### Rule 4: Adjacent elements must differ by at least 5 points

If two adjacent elements share the same visual weight, the eye cannot determine priority. A section at VH-70 must not follow another at VH-70 without a weight change.

### Rule 5: Navigation never exceeds VH-40

The sidebar, breadcrumbs, and command palette are tools. They must not visually compete with content. VH-40 means 13px normal text-400. No bold. No accent colour. No hover backgrounds that exceed the content's visual weight.

### Rule 6: Decoration never exceeds VH-10

Dividers, separators, and structural elements are invisible. They are 1px with 50% opacity. They must never use colour from the accent palette.

---

## Weight Inheritance

Child components inherit the weight of their parent, bounded by the child's own maximum.

```
VH-90 (Primary CTA container)
    ├── VH-90 (Button — inherits 90, bound at 90)
    └── VH-40 (Secondary text — bound at 40, cannot use 90)

VH-70 (Table)
    ├── VH-70 (Column headers — inherit 70)
    ├── VH-70 (Cells — inherit 70)
    └── VH-50 (Pagination — bound at 50)
```

---

## Weight Auditing

To audit a page's visual hierarchy:

1. Identify every component
2. Assign its VH value
3. Verify no component exceeds its weight
4. Verify maximum one VH-100
5. Verify adjacent weights differ by ≥5
6. Verify navigation ≤ VH-40
7. Verify decoration ≤ VH-10

A page that passes all 7 checks has a valid visual hierarchy.
