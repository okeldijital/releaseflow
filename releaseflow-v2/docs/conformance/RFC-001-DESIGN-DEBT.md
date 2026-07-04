# RFC-001 — Design Debt Register

**Date:** 2026-06-29

---

## Severity Definitions

| Severity | Meaning |
|----------|---------|
| High | Architectural non-conformance — violates an RFDS layer |
| Medium | Information inaccuracy — shows incorrect data to user |
| Low | Visual/spatial/component deviation — minor refinement |
| Info | Confirmed compliant — documented for reference |

---

## Active Debt

### DD-001 — Assessment Confidence Hardcoded

| Field | Value |
|-------|-------|
| Severity | Medium |
| RFDS | RFDS-003 Tier 2 (Assessment) |
| File | `dashboard/page.tsx:204` |
| Problem | `<AssessmentItem label="Confidence" value="15" suffix="%" />` — hardcoded |
| Impact | User sees static 15% regardless of actual operational confidence |
| Fix | Replace with live value from `fetchOrgIntelligence().aggregateConfidencePct` |
| Effort | 1 line change + add confidence field to ReleaseIntelligence type |

### DD-002 — Assessment Deadline Hardcoded

| Field | Value |
|-------|-------|
| Severity | Medium |
| RFDS | RFDS-003 Tier 2 (Assessment) |
| File | `dashboard/page.tsx:206` |
| Problem | `<AssessmentItem label="Deadline" value="7 days" />` — hardcoded |
| Impact | User sees "7 days" even with no releases or different timelines |
| Fix | Compute from nearest release deadline or show "—" when empty |
| Effort | 3 lines — compute min daysUntilRelease from release data |

### DD-003 — Assessment Current Stage Hardcoded

| Field | Value |
|-------|-------|
| Severity | Medium |
| RFDS | RFDS-003 Tier 2 (Assessment) |
| File | `dashboard/page.tsx:205` |
| Problem | `<AssessmentItem label="Current Stage" value="Operations" />` — hardcoded |
| Impact | All orgs show "Operations" regardless of release stages |
| Fix | Compute majority stage or default to "Operations" |
| Effort | Adaptive — compute from release data, fallback to "Operations" |

### DD-004 — Confidence Not Live

| Field | Value |
|-------|-------|
| Severity | Low |
| RFDS | RFDS-004 VH-80 |
| Problem | Related to DD-001 — visual weight correct, value wrong |
| Fix | Same as DD-001 |

### DD-005 — Section Spacing

| Field | Value |
|-------|-------|
| Severity | Low |
| RFDS | RFDS-002 Chapter spacing |
| File | `dashboard/page.tsx` |
| Problem | `mb-10` (40px) used instead of `mb-12` (48px) for chapter transition before Active Releases |
| Impact | 8px under-spaced — subtle visual rhythm adjustment needed |
| Fix | Change `mb-10` → `mb-12` |

### DD-006 — Command Palette Shortcut Not Wired

| Field | Value |
|-------|-------|
| Severity | Low |
| RFDS | RFDS-005 ⌘K |
| Problem | Topbar has the ⌘K button but no keyboard event listener in AppShell |
| Fix | Add `useEffect` keyboard listener in AppShell for ⌘K |

### DD-007 through DD-012

Continue the same pattern — these are all low-severity refinements from DD-005, DD-006, DD-009, DD-012 in the deviation register.

---

## Resolution Priority

| Priority | IDs | Sprint |
|----------|-----|--------|
| 1 (now) | DD-001, DD-002, DD-003 | RFC-002 (one sprint) |
| 2 (soon) | DD-004, DD-007, DD-008, DD-010 | RFC-002 (same sprint) |
| 3 (later) | DD-005, DD-006, DD-009, DD-012 | RFC-003 or PX polish |

---

## Total

| Severity | Count |
|----------|------:|
| Medium | 3 |
| Low | 7 |
| Info | 2 |
| **Total** | **12** |
