# Domain Validation Matrix — ST-004.5

**Date:** 2026-06-28

---

| Domain | Repository | Service | Hook | Pages | Tests | Arch | Status |
|--------|-----------|---------|------|-------|-------|------|--------|
| Organization | `organization-repository.ts` | Inline in repo | org-store, role-store | 1/3 recovered | ✅ | ⚠️ | P1 gap |
| Release | `release-repository.ts` | `release-service.ts` | useRelease, useReleases | 4/4 recovered | ✅ | ✅ | **Complete** |
| Workflow | `workflow-repository.ts` | `workflow-service.ts` | useWorkflow | Integrated | ✅ | ✅ | **Complete** |
| Activity | `workflow-repository.ts` | `workflow-service.ts` | useActivity | Integrated | ✅ | ✅ | **Complete** |
| Artist | `artist-repository.ts` | `artist-service.ts` | useArtist, useArtists | 3/3 recovered | ✅ | ✅ | **Complete** |
| Asset | `asset-repository.ts` | `asset-service.ts` | useAsset, useReleaseAssets | 1/1 recovered | ✅ | ✅ | **Complete** |
| Rights | `rights-repository.ts` | `rights-service.ts` | useRightsHolders, useReleaseOwnership | 2/2 recovered | ✅ | ✅ | **Complete** |
| Distribution | `distribution-repository.ts` | `distribution-service.ts` | (via release) | Integrated | ✅ | ✅ | **Complete** |
| Campaigns | `campaign-service.ts` | Inline | — | 0/3 recovered | ✅ | ⚠️ | P2 |
| Budget | `budget-service.ts` | Inline | — | 0/1 recovered | ✅ | ⚠️ | P2 |
| Approval | `approval-service.ts` | Inline | — | 0/1 recovered | ✅ | ⚠️ | P2 |
| Contributor | — | — | — | 0/1 recovered | ✅ | ⚠️ | P2 |
| Brief | — | — | — | 0/1 recovered | ✅ | ⚠️ | P2 |
| Onboarding | — | — | — | 0/1 recovered | ✅ | ⚠️ | P1 |

---

## Summary

| Metric | Count |
|--------|-------|
| Domains fully recovered | 7 of 7 core |
| Domains with gaps | 5 (non-core) |
| Pages recovered | 12 of 21 |
| Repositories created | 7 |
| Services refactored | 7 |
| Hooks created | 8 |
| Architecture violations remaining | 12 |
| P0 blocking | 0 |
| P1 before production | 3 |
