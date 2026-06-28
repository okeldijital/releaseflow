# Repository Inventory — ReleaseFlow

**Version:** 1.0
**Date:** 2026-06-28

---

## Repository Layer

All Firestore access goes through these files in `apps/web/src/lib/`. No other code may import `firebase/firestore`.

| Repository | File | Collections | C(R)UD |
|------------|------|-------------|--------|
| OrganizationRepository | `organization-repository.ts` | `organizations`, `memberships` | Full |
| ReleaseRepository | `release-service.ts` | `releases` | Update only |
| WorkflowRepository | `workflow-service.ts` + `workflow-progression.ts` | `workflows`, `stages` | Full |
| TaskRepository | `task-service.ts` | `tasks`, `comments` | Full |
| ArtistRepository | `artist-service.ts` | `artists`, `release_artists`, `track_credits` | Full |
| DeliverableRepository | `deliverable-service.ts` | `deliverables` | Full |
| DependencyRepository | `dependency-service.ts` | `dependencies` | Full |
| DistributionRepository | `distribution-service.ts` | `distribution_packages` | Full |
| RightsRepository | `rights-service.ts` | `rights_holders`, `release_ownerships`, `track_ownerships` | Full |
| CampaignRepository | `campaign-service.ts` | `campaigns`, `campaign_tasks` | Full |
| ApprovalRepository | `approval-service.ts` | `approval_requests` | Full |
| BudgetRepository | `budget-service.ts` | `release_budgets`, `cost_items` | Full |
| AssetRepository | `asset-service.ts` | `asset_references` | Full |
| RequirementRepository | `requirement-service.ts` | `release_requirements` | Full |
| NotificationRepository | `notification-service.ts` | `notifications` | Full |
| ResourceRepository | `resource-service.ts` | `resource_assignments` | Full |
| AlertRepository | `alert-engine.ts` | `operational_alerts` | Full |

### Missing Repositories

| Repository | Priority | Needed For |
|------------|----------|------------|
| ActivityRepository | P1 | Activity feeds in pages |
| OperationsRepository | P1 | `useOperationsCenter` hook (aggregation) |

---

## Repository Rule

Every repository function signature:

```
async function operationName(params): Promise<ReturnType>
```

Must:
1. Call `getDb()` to get the Firestore instance
2. Return `[]` or `null` if `!db`
3. Type the return value explicitly
4. Never be called from a page component directly — go through a service
