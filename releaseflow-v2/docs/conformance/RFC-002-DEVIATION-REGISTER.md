# RFC-002 — Deviation Register

**Date:** 2026-06-29

---

| ID | Severity | Category | RFDS Ref | Description | Line | Fix |
|----|----------|----------|----------|-------------|------|-----|
| DD-001 | Medium | Visual | RFDS-004 | Health pill uses manual 3-level ternary instead of `computeHealth()` from operational-intelligence-service | 311-313 | Replace with `computeHealth(readiness.percentage)` |
| DD-002 | Medium | Components | RFDS-006 | Release type displayed as `<span>` instead of `<Badge>` component | 335 | Replace with `<Badge label={release.releaseType} />` |
| DD-003 | Low | Visual | RFDS-004 | Genre shown as `<span className="text-sm text-text-400">` instead of `Badge` | 336 | Replace with `<Badge label={release.genre} size="sm" />` |
| DD-004 | Low | Accessibility | RFDS-005 | Status dropdown uses `fixed inset-0` overlay without explicit focus trap | 352 | Add `role="dialog"`, focus first item on open |
| DD-005 | Low | Components | RFDS-006 | Health pill lacks the PDS 5-level visual treatment (no dot, no background pill) | 355-357 | Use HealthRing or inline health pill pattern from RFDS-004 |
| DD-006 | Low | Spatial | RFDS-002 | Page padding uses `px-6` (24px) — should use `px-5 sm:px-7` for consistent reading column | 318 | Update to match Operations Center pattern |
| DD-007 | Low | Responsive | RFDS-002 | Context rail hidden on non-wide desktop (<1280px) but spec says visible at ≥1024px | 317 | Adjust `xl:` breakpoint to `lg:` in WorkspaceLayout |
| DD-008 | Low | Information | RFDS-003 | `daysUntil()` helper function duplicates logic in operational-intelligence-service | 68-70 | Remove local helper; use `computeDaysUntil()` from intelligence service |

---

## Summary

| Severity | Count |
|----------|------:|
| Medium | 2 |
| Low | 6 |
| **Total** | **8** |
