# RC-001 — Defect Log

**Date:** 2026-06-28

---

## Summary

| Severity | Count | Blocking |
|----------|-------|----------|
| P0 | 0 | None |
| P1 | 0 | None |
| P2 | 10 | No |
| P3 | 0 | No |

---

## P2 Defects

### P2-001 — `contributor/page.tsx` has direct Firestore

- **Area**: Contributor page
- **Steps**: Open `/contributor`
- **Expected**: Uses hook → service → repository
- **Actual**: Direct `collection()`, `query()`, `getDocs()` calls in page
- **Resolution**: Recover Contributor domain with repository/service/hook pattern

### P2-002 — `budgets/page.tsx` has direct Firestore

- **Area**: Budgets page
- **Resolution**: Recover Budget domain

### P2-003 — `brief/page.tsx` has direct Firestore

- **Area**: Brief page
- **Resolution**: Recover Brief domain

### P2-004-006 — Campaign pages have direct Firestore

- **Area**: `campaigns/new`, `campaigns/[id]`, `campaigns/page`
- **Resolution**: Recover Campaign domain (repository already exists as `campaign-service.ts`)

### P2-007 — `approvals/page.tsx` has direct Firestore

- **Area**: Approvals page
- **Resolution**: Recover Approval domain

### P2-008 — `alert-engine.ts` calls Firestore directly

- **Area**: Alert engine
- **Resolution**: Inject repository dependency into engine

### P2-009 — `recommendation-engine.ts` calls Firestore directly

- **Area**: Recommendation engine
- **Resolution**: Inject repository dependencies

### P2-010 — `rule-engine.ts` calls Firestore directly

- **Area**: Rule engine
- **Resolution**: Inject repository dependencies

---

## Previously Fixed (ST-001 → ST-005)

| ID | Description | Sprint | Status |
|----|-------------|--------|--------|
| ST-001-P0 | Firestore in stores | ST-002 | ✅ Fixed |
| ST-001-P0 | Org race condition | ST-002 | ✅ Fixed |
| ST-001-P0 | Sign-out cleanup missing | ST-002 | ✅ Fixed |
| ST-002-P1 | useOperationsCenter.ts 15 FS calls | ST-005 | ✅ Fixed |
| ST-002-P1 | organizations/page.tsx 10 FS calls | ST-005 | ✅ Fixed |
| ST-002-P1 | onboarding/page.tsx 2 FS calls | ST-005 | ✅ Fixed |
| ST-002-P2 | command-palette.tsx 3 FS calls | ST-005 | ✅ Fixed |

All P0 and P1 defects from prior audits have been resolved.
