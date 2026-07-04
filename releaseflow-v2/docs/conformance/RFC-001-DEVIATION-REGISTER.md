# RFC-001 — Deviation Register

**Date:** 2026-06-29

---

| ID | Severity | Category | RFDS Ref | Description | Impact | Correction |
|----|----------|----------|----------|-------------|--------|-------------|
| DD-001 | Medium | Information | RFDS-003 Tier 2 | Assessment: Confidence value hardcoded to "15%" | User sees static placeholder, not live operational state | Replace with `aggregateConfidencePct` from operational-intelligence-service |
| DD-002 | Medium | Information | RFDS-003 Tier 2 | Assessment: Deadline value hardcoded to "7 days" | Misleading — deadline should reflect nearest release | Compute from `min(releases.map(r => r.daysUntilRelease))` |
| DD-003 | Medium | Information | RFDS-003 Tier 2 | Assessment: Current Stage hardcoded to "Operations" | All releases show same stage in aggregate view | Compute from majority stage or "Operations" if empty |
| DD-004 | Low | Visual | RFDS-004 VH-80 | Confidence should use live computation | Visual weight is correct, but value is static | Wire to operational intelligence |
| DD-005 | Low | Spatial | RFDS-002 Chapter spacing | Evidence section uses mb-10 (40px) vs recommended mb-12 (48px) for chapter transitions | 8px under-spaced — subtle | Change mb-10 → mb-12 for the section before Active Releases table |
| DD-006 | Low | Navigation | RFDS-005 ⌘K | Topbar does not wire ⌘K shortcut handler | Command palette unreachable from keyboard | Wire `useEffect` keyboard listener in AppShell to open palette |
| DD-007 | Low | Blueprint | RFDS-008 Assessment | Missing dynamic Current Stage from release data | Always shows "Operations" regardless of release states | Extract from release intelligence data |
| DD-008 | Low | Blueprint | RFDS-008 Assessment | Missing dynamic Deadline value | Always shows "7 days" | Compute from nearest release deadline |
| DD-009 | Low | Visual | RFDS-004 VH-10 | Activity dot uses surface-300 — metadata shade | Slightly too visible for VH-10 | Change to text-text-400/50 |
| DD-010 | Low | Visual | RFDS-004 VH-80 | Confidence assessment not computed from intelligence | Value is placeholder | Wire to operational intelligence |
| DD-011 | Info | Information | RFDS-003 Reading | Briefing line length confirmed 640px at 15px ≈ 72 chars | Within 65–80 target | No action required — documented for confirmation |
| DD-012 | Info | Component | RFDS-006 States | "NOW" timestamp always visible with 0 actions | Shows empty section header "Immediate Actions" | Hide entire section when actions.length === 0 |

---

## Summary

| Severity | Count |
|----------|------:|
| Medium | 3 |
| Low | 7 |
| Info | 2 |
| **Total** | **12** |

Zero critical. Zero high. All items are in the Assessment block (DD-001 to DD-004, DD-007, DD-008, DD-010) or minor visual/spatial (DD-005, DD-009, DD-012). The Operations Center is implementable as-is for production.
