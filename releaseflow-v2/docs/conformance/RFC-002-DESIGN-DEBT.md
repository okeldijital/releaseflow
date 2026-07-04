# RFC-002 — Design Debt Register

**Date:** 2026-06-29

---

## Active Debt

### DD-001 — Health Uses 3-Level Instead of 5-Level

| Field | Value |
|-------|-------|
| Severity | Medium |
| RFDS | RFDS-004 (Visual Hierarchy), PDS-06 (Health Grammar) |
| File | `releases/[id]/page.tsx:311-313` |
| Problem | Health pill uses `>=80 ? 'Healthy' : >=50 ? 'Attention' : 'Critical'` — a 3-level system |
| PDS Spec | 5 levels: Excellent (≥90), Healthy (≥70), Attention (≥50), Blocked (≥30), Critical (<30) |
| Fix | Import `computeHealth` from `operational-intelligence-service.ts` and use `computeHealth(readiness.percentage)` |
| Effort | 2 lines |

### DD-002 — Release Type Uses Span Instead of Badge

| Field | Value |
|-------|-------|
| Severity | Medium |
| RFDS | RFDS-006 (Component Inventory) |
| File | `releases/[id]/page.tsx:335` |
| Problem | `<span className="text-sm text-text-500">{release.releaseType}</span>` — raw span |
| Fix | `<Badge label={release.releaseType} color="bg-surface-100 text-text-700" />` |
| Effort | 1 line |

### DD-003 — Genre Uses Span Instead of Badge

| Field | Value |
|-------|-------|
| Severity | Low |
| Fix | Same pattern as DD-002 — use Badge component |

### DD-004 — Status Dropdown Accessibility

| Field | Value |
|-------|-------|
| Severity | Low |
| RFDS | RFDS-005 (Focus Model) |
| Problem | Status transition dropdown uses `fixed inset-0` backdrop but no focus trapping |
| Fix | Add `role="dialog"`, focus first option on open |

### DD-005 — Health Pill Visual Treatment

| Field | Value |
|-------|-------|
| Severity | Low |
| Problem | Health displayed as inline text: `Healthy · 68%` — no dot, no background pill |
| PDS Spec | Health should use dot + label + percentage in a rounded pill |
| Fix | Apply the same inline health pill pattern as Operations Center |

### DD-006 — Page Padding

| Field | Value |
|-------|-------|
| Severity | Low |
| Problem | `px-6 py-6` — 24px padding. Operations Center uses `px-5 sm:px-7 pt-10 pb-16` |
| Fix | Standardize to Operations Center pattern |

### DD-007 — Context Rail Breakpoint

| Field | Value |
|-------|-------|
| Severity | Low |
| Problem | Context rail hidden below `xl` (1280px). Should show at `lg` (1024px) per RFDS-005 |
| Fix | Change `hidden xl:flex` to `hidden lg:flex` in WorkspaceLayout |

### DD-008 — Duplicate daysUntil Helper

| Field | Value |
|-------|-------|
| Severity | Low |
| Problem | Local `daysUntil()` function duplicates computation in operational-intelligence-service |
| Fix | Remove local helper; use from intelligence service |

---

## Resolution Priority

| Priority | IDs |
|----------|-----|
| 1 (immediate) | DD-001, DD-002 |
| 2 (same sprint) | DD-003, DD-005, DD-008 |
| 3 (refinement) | DD-004, DD-006, DD-007 |

**Total effort**: ~20 minutes
