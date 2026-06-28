# Service Inventory — ReleaseFlow

**Version:** 1.0
**Date:** 2026-06-28

---

## Domain Services (Business Logic)

Services contain business rules. They call repositories, never Firestore directly.

| Service | File | Responsibility | Dependencies |
|---------|------|---------------|--------------|
| ReleaseService | `release-service.ts` | Release lifecycle transitions | ReleaseRepository |
| WorkflowService | `workflow-service.ts` + `workflow-progression.ts` | Workflow creation, stage advancement | WorkflowRepository |
| TaskService | `task-service.ts` | Task CRUD, assignment, comments | TaskRepository |
| ArtistService | `artist-service.ts` | Artist profile, release linking, credits | ArtistRepository |
| OrganizationService | `organization-repository.ts` | Org CRUD, membership management | OrganizationRepository |
| DistributionService | `distribution-service.ts` | DSP package generation, readiness | DistributionRepository, ReleaseRepository |
| RightsService | `rights-service.ts` | Rights holder management, ownership validation | RightsRepository |
| ApprovalService | `approval-service.ts` | Approval request lifecycle | ApprovalRepository |
| CampaignService | `campaign-service.ts` | Campaign and campaign task management | CampaignRepository |
| BudgetService | `budget-service.ts` | Budget and cost item tracking | BudgetRepository |
| NotificationService | `notification-service.ts` | In-app notification delivery | NotificationRepository |
| RequirementService | `requirement-service.ts` | Release requirement tracking | RequirementRepository |
| ResourceService | `resource-service.ts` | Resource assignment and utilization | ResourceRepository |

## Domain Engines (Computation)

These compute business insights from repository data. They do NOT write to Firestore.

| Engine | File | Purpose |
|--------|------|---------|
| AlertEngine | `alert-engine.ts` | Operational alert generation (writes to AlertRepository) |
| ReadinessEngine | `readiness-engine.ts` | Release readiness computation |
| RuleEngine | `rule-engine.ts` | Operational rule evaluation |
| RecommendationEngine | `recommendation-engine.ts` | Actionable recommendations |
| DependencyHealth | `dependency-health.ts` | Dependency health scoring |
| WorkflowHealth | `workflow-health.ts` | Workflow health calculation |
| WorkflowProgress | `workflow-progress.ts` | Progress calculation |
| TaskProgress | `task-progress.ts` | Task progress computation |

## Diagnostic Services

| Service | File | Purpose |
|---------|------|---------|
| IntegrityValidator | `integrity-validator.ts` | Data integrity verification |
| QueryAnalyzer | `query-analyzer.ts` | Query performance analysis |
| BaselineMetrics | `baseline-metrics.ts` | Baseline metrics collection |
| PermissionAudit | `permission-audit.ts` | Permission matrix audit |
| PerformanceReview | `performance-review.ts` | Performance review |
| SecurityAudit | `security-audit.ts` | Security configuration audit |

---

## Service Rule

Every service function:

```
async function operationName(params): Promise<ReturnType>
```

Must:
1. Call repository functions only — never Firestore SDK directly
2. Contain business logic (validation, transformation, orchestration)
3. Never be called from a store — stores call hooks
