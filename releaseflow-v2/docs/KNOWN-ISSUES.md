# Known Issues — ReleaseFlow 1.0.0-RC1

**Date:** 2026-06-28

---

## Summary

| Severity | Count | Blocking |
|----------|-------|----------|
| P0 | 0 | No |
| P1 | 0 | No |
| P2 | 10 | No |
| P3 | 0 | No |

---

## P2 — Should Fix Before Production

| ID | Area | File | Description | Resolution |
|----|------|------|-------------|------------|
| P2-001 | Contributor | `app/(app)/contributor/page.tsx` | Direct Firestore query for assigned tasks | Recover with useContributorTasks hook → task-service |
| P2-002 | Budgets | `app/(app)/budgets/page.tsx` | Direct Firestore queries | Recover Budget domain |
| P2-003 | Brief | `app/(app)/brief/page.tsx` | 6 direct Firestore queries | Recover Brief domain |
| P2-004 | Campaigns | `app/(app)/campaigns/new/page.tsx` | Direct Firestore query | Recover with campaign-service |
| P2-005 | Campaigns | `app/(app)/campaigns/[id]/page.tsx` | Single getDoc call | Recover with campaign-service |
| P2-006 | Campaigns | `app/(app)/campaigns/page.tsx` | Direct Firestore queries | Recover with campaign-service |
| P2-007 | Approvals | `app/(app)/approvals/page.tsx` | Single getDoc call | Recover with approval-service |
| P2-008 | Alert Engine | `lib/alert-engine.ts` | Direct Firestore in domain engine | Inject repository dependency |
| P2-009 | Recommendation Engine | `lib/recommendation-engine.ts` | 12 direct Firestore calls | Inject repository dependencies |
| P2-010 | Rule Engine | `lib/rule-engine.ts` | 10 direct Firestore calls | Inject repository dependencies |

---

## Resolved from Prior Audits

| ID | Sprint | Description |
|----|--------|-------------|
| ST-001-P0 | ST-002 | Firestore in stores → fixed |
| ST-001-P1 | ST-002 | Org race condition → fixed |
| ST-001-P1 | ST-002 | Sign-out cleanup → fixed |
| ST-002-P1 | ST-005 | useOperationsCenter 15 FS calls → fixed |
| ST-002-P1 | ST-005 | organizations page 10 FS calls → fixed |
| ST-002-P1 | ST-005 | onboarding page 2 FS calls → fixed |
| ST-002-P2 | ST-005 | command-palette 3 FS calls → fixed |
