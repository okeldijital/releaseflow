# RFC-002 — Conformance Matrix

**Date:** 2026-06-29

---

| # | Requirement | Source | Pass/Fail | DD ID |
|---|------------|--------|-----------|-------|
| 1 | Pattern: Workspace | RFDS-007 | ✅ | — |
| 2 | Operational Question: "What must happen?" | RFDS-008 | ✅ | — |
| 3 | Tier flow: 1→2→4→5→6 | RFDS-003 | ✅ | — |
| 4 | Zones: Identity → Decision → Evidence → Context → History | RFDS-002 | ✅ | — |
| 5 | Reading width: 640px editorial, 960px evidence | RFDS-002 | ✅ | — |
| 6 | Page padding standardized | RFDS-002 | ⚠️ | DD-006 |
| 7 | Context rail visible at ≥1024px | RFDS-005 | ⚠️ | DD-007 |
| 8 | VH-100: Release title (28px) | RFDS-004 | ✅ | — |
| 9 | VH-90: Advance Stage button | RFDS-004 | ✅ | — |
| 10 | VH-80: OperationalSummary | RFDS-004 | ✅ | — |
| 11 | VH-60: Context Rail content | RFDS-004 | ✅ | — |
| 12 | Health: 5-level | PDS-06 | ⚠️ | DD-001 |
| 13 | Badges for type/genre | RFDS-006 | ⚠️ | DD-002/003 |
| 14 | No hardcoded values | RFDS-003 | ✅ | — |
| 15 | All data through hooks/services | Architecture | ✅ | — |
| 16 | Zero Firestore in page | Architecture | ✅ | — |
| 17 | Status dropdown accessible | RFDS-005 | ⚠️ | DD-004 |
| 18 | 10 tabs per PDS-11 spec | PDS-11 | ✅ | — |
| 19 | WorkflowBoard present | RFDS-006 | ✅ | — |
| 20 | Rights integration in hero | RFDS-003 | ✅ | — |
| 21 | Blockers visible in hero | RFDS-003 | ✅ | — |
| 22 | Activity in dedicated tab | RFDS-008 | ✅ | — |
| 23 | Settings as last tab | RFDS-008 | ✅ | — |
| 24 | WorkspaceLayout used | RFDS-002 | ✅ | — |
| 25 | No duplicate business logic | Architecture | ⚠️ | DD-008 |

---

## Summary

| Status | Count |
|--------|------:|
| ✅ Pass | 17 |
| ⚠️ Fail | 8 |
| **Total** | **25** |

**68% pass rate** → 8 items require resolution. All low/medium severity.
