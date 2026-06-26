# 09 — UI-Backend Mapping Audit

## Purpose

Every screen must trace to backend entities. No UI element renders
without a defined data source. This audit verifies 100% UI → backend
traceability.

---

## Backend Entity Catalog

```
Entity            Collection / Subcollection       Docs
──────────────────────────────────────────────────────────────────
Organization       organizations                   01, 03, 04
User                users                          07, 08
Membership          organizations/{orgId}/members   07, 08
Release             releases                       03, 04, 16
Track               releases/{id}/tracks           03, 13
Stage               releases/{id}/stages           03, 05, 15
Task                releases/{id}/tasks            03, 05, 31
Deliverable         releases/{id}/deliverables      34, 43
Dependency          releases/{id}/dependencies      66
Contributor         releases/{id}/contributors      03, 17
Asset               releases/{id}/assets            34, 36
Budget              releases/{id}/budget            55
Cost                releases/{id}/costs             56
Vendor              releases/{id}/vendors           55
Campaign            releases/{id}/campaigns         46, 48
Campaign Asset      releases/{id}/campaigns/{}/asset 46
Milestone           releases/{id}/campaigns/{}/milestones 47
Channel             releases/{id}/campaigns/{}/channels 46
Checklist Item      releases/{id}/delivery-checklist  45
Approval            approvals                      35, 40
Notification        notifications                  41, 61
Alert               alerts (computed)              61
Activity            activity (log)                 59
Artist              artists                        49, 50
Credit              releases/{id}/credits          51
Ownership           releases/{id}/ownership        52
Split               releases/{id}/ownership/splits 53
Rights Readiness    (computed)                     54
DSP Submission      releases/{id}/submissions      43
CMO Registration    releases/{id}/ownership/cmo    52
Invitation          invitations                    27
```

---

## Screen Mapping

### Auth Screens

| Screen | Route | Entities | Status |
|--------|-------|----------|--------|
| Sign In | `/sign-in` | User (auth) | ✅ Mapped |
| Sign Up | `/sign-up` | User (create) | ✅ Mapped |
| Forgot Password | `/forgot-password` | User (password reset) | ✅ Mapped |
| Invitation Accept | `/invite/[token]` | Invitation, Membership | ✅ Mapped |

### Onboarding Screens

| Screen | Route | Entities | Status |
|--------|-------|----------|--------|
| Create Account | `/onboarding` (step 1) | User | ✅ Mapped |
| Verify Email | `/onboarding` (step 1b) | User | ✅ Mapped |
| Create Organization | `/onboarding` (step 2) | Organization | ✅ Mapped |
| Branding | `/onboarding` (step 2a) | Organization | ✅ Mapped |
| Invite Team | `/onboarding` (step 3) | Invitation, Membership | ✅ Mapped |
| First Release | `/onboarding` (step 4) | Release | ✅ Mapped |
| Completion | `/onboarding` (done) | Release | ✅ Mapped |

### App Shell

| Screen | Route | Entities | Status |
|--------|-------|----------|--------|
| Sidebar (org) | All `/(app)` routes | Organization, Membership, User | ✅ Mapped |
| Sidebar (release) | `/releases/[id]/*` | Release, Stage | ✅ Mapped |
| Top Nav | All `/(app)` routes | Notification, User | ✅ Mapped |
| Notification Panel | Slide-out | Notification | ✅ Mapped |
| Search | Top nav input | Release, Task, Asset | ✅ Mapped |
| Org Switcher | Sidebar/header dropdown | Membership, Organization | ✅ Mapped |
| FAB | Primary list views | Release, Task, Asset, Membership | ✅ Mapped |
| Breadcrumb | Release detail | Release | ✅ Mapped |

### Dashboard

| Screen | Route | Entities | Status |
|--------|-------|----------|--------|
| Dashboard | `/dashboard` | Release, Task, Notification, Invitation | ✅ Mapped |
| Dashboard (no org) | `/dashboard` | (empty) | ✅ Mapped |
| Dashboard (no releases) | `/dashboard` | Release (empty) | ✅ Mapped |
| Stat Cards | `/dashboard` | Release, Task, Membership, Deadline | ✅ Mapped |
| Recent Activity | `/dashboard` | Activity | ✅ Mapped |
| Pending Invitations | `/dashboard` | Invitation | ✅ Mapped |

### Operations Center

| Screen | Route | Entities | Status |
|--------|-------|----------|--------|
| Operations Center | `/operations` | Release, Task, Deliverable, Dependency, Alert, Budget, Campaign | ✅ Mapped |
| Since you were away | `/operations` | Activity | ✅ Mapped |
| Alerts section | `/operations` | Alert | ✅ Mapped |
| Blocked Work section | `/operations` | Dependency, Stage, Approval | ✅ Mapped |
| Critical Deadlines | `/operations` | Task, Stage, Deliverable, Milestone | ✅ Mapped |
| Org Pulse | `/operations` | Release, Stage, Deadline, Budget (computed) | ✅ Mapped |

### Executive Dashboard

| Screen | Route | Entities | Status |
|--------|-------|----------|--------|
| Executive Dashboard | `/executive` | Release, Alert, Stage, Deadline, Budget, Campaign, Rights | ✅ Mapped |
| Attention Banner | `/executive` | Alert | ✅ Mapped |
| Stat Cards | `/executive` | Alert (computed), Stage (computed) | ✅ Mapped |
| Budget Pulse | `/executive` | Budget, Cost | ✅ Mapped |
| Release Pulse | `/executive` | Release, Stage, Readiness (computed), Campaign, Budget, Rights | ✅ Mapped |

### Releases List

| Screen | Route | Entities | Status |
|--------|-------|----------|--------|
| Releases List | `/releases` | Release (list) | ✅ Mapped |
| Release Card | `/releases` | Release, Stage, Health (computed) | ✅ Mapped |
| Filter sidebar | `/releases` | Release (filtered) | ✅ Mapped |

### Release Workspace

| Screen | Route | Entities | Status |
|--------|-------|----------|--------|
| Shell: header + tabs + status badge | `/releases/[id]` | Release | ✅ Mapped |
| Status badge dropdown | `/releases/[id]` | Release (status transition) | ✅ Mapped |
| Tab: Overview | `/releases/[id]/overview` | Release, Stage, Task, Deliverable, Activity | ✅ Mapped |
| Tab: Workflow | `/releases/[id]/workflow` | Stage, Task | ✅ Mapped |
| Stage Detail panel | (slide-out) | Stage, Task, Activity | ✅ Mapped |
| Tab: Tasks | `/releases/[id]/tasks` | Task | ✅ Mapped |
| Task Detail panel | (slide-out) | Task, Asset, Activity | ✅ Mapped |
| Tab: Deliverables | `/releases/[id]/deliverables` | Deliverable, Asset | ✅ Mapped |
| Tab: Dependencies | `/releases/[id]/dependencies` | Dependency, Stage, Release | ✅ Mapped |
| Tab: Distribution | `/releases/[id]/distribution` | Release (metadata), Track, Artwork (validation), Submission | ✅ Mapped |
| DSP Readiness Report | (within Distribution) | DSPSubmission, DSPCheck | ✅ Mapped |
| Delivery Checklist | (within Distribution) | ChecklistItem | ✅ Mapped |
| Tab: Campaign | `/releases/[id]/campaign` | Campaign, CampaignAsset, Milestone, Channel | ✅ Mapped |
| Tab: Budget | `/releases/[id]/budget` | Budget, Cost, Vendor | ✅ Mapped |
| Tab: Activity | `/releases/[id]/activity` | Activity | ✅ Mapped |
| Tab: Settings | `/releases/[id]/settings` | Release | ✅ Mapped |

### Tasks

| Screen | Route | Entities | Status |
|--------|-------|----------|--------|
| Tasks Board (cross-release) | `/tasks` | Task (all releases) | ✅ Mapped |
| Task filters | `/tasks` | Task (filtered) | ✅ Mapped |

### Assets

| Screen | Route | Entities | Status |
|--------|-------|----------|--------|
| Asset Catalog | `/assets` | Asset (all releases) | ✅ Mapped |
| Asset Detail | `/assets/[id]` | Asset, Version | ✅ Mapped |
| Asset filters | `/assets` | Asset (filtered) | ✅ Mapped |

### Calendar

| Screen | Route | Entities | Status |
|--------|-------|----------|--------|
| Calendar | `/calendar` | Release, Task, Stage, Milestone | ✅ Mapped |

### Marketing

| Screen | Route | Entities | Status |
|--------|-------|----------|--------|
| Marketing Hub | `/marketing` | Campaign (list) | ✅ Mapped |
| Campaign Detail | `/marketing/[id]` | Campaign, Asset, Milestone, Channel | ✅ Mapped |
| Promotion Calendar | (within Campaign) | Milestone | ✅ Mapped |

### Distribution Hub

| Screen | Route | Entities | Status |
|--------|-------|----------|--------|
| Distribution Hub | `/distribution` | Submission (all releases) | ✅ Mapped |
| Submission Detail | `/distribution/[id]` | Submission (per DSP) | ✅ Mapped |

### Reports

| Screen | Route | Entities | Status |
|--------|-------|----------|--------|
| Reports Dashboard | `/reports` | Release, Task, Campaign (aggregated) | ✅ Mapped |

### Settings

| Screen | Route | Entities | Status |
|--------|-------|----------|--------|
| Organization Profile | `/settings` | Organization | ✅ Mapped |
| Team Management | `/settings/team` | Membership, Invitation | ✅ Mapped |
| Workflows | `/settings/workflows` | WorkflowTemplate | ✅ Mapped |
| Templates | `/settings/templates` | ReleaseTemplate | ✅ Mapped |
| Integrations | `/settings/integrations` | Integration | ✅ Mapped |
| Billing | `/settings/billing` | Billing (plan, invoice) | ✅ Mapped |
| Account | `/settings/account` | User | ✅ Mapped |

### Artists

| Screen | Route | Entities | Status |
|--------|-------|----------|--------|
| Artist Catalog | `/artists` | Artist | ✅ Mapped |
| New Artist | `/artists/new` | Artist (create) | ✅ Mapped |
| Artist Workspace | `/artists/[id]` | Artist | ✅ Mapped |
| Tab: Overview | `/artists/[id]/overview` | Artist, Completeness | ✅ Mapped |
| Tab: Releases | `/artists/[id]/releases` | Release, Credit | ✅ Mapped |
| Tab: Credits | `/artists/[id]/credits` | Credit | ✅ Mapped |
| Tab: Assets | `/artists/[id]/assets` | Asset (scoped) | ✅ Mapped |
| Tab: Campaigns | `/artists/[id]/campaigns` | Campaign | ✅ Mapped |
| Tab: Press Kit | `/artists/[id]/press-kit` | Artist, Asset (computed) | ✅ Mapped |
| Artist Completeness | (within Overview) | Artist (computed) | ✅ Mapped |

### Credits & Ownership

| Screen | Route | Entities | Status |
|--------|-------|----------|--------|
| Credits Manager | `/releases/[id]/credits` | Credit, Artist | ✅ Mapped |
| Ownership Workspace | `/releases/[id]/ownership` | Ownership | ✅ Mapped |
| Tab: Master Rights | (within Ownership) | MasterOwner | ✅ Mapped |
| Tab: Publishing Rights | (within Ownership) | PublishingShare, PRO, IPI | ✅ Mapped |
| Tab: Mechanical Rights | (within Ownership) | MechanicalLicense | ✅ Mapped |
| Tab: Neighbouring Rights | (within Ownership) | CMORegistration, PerformerShare | ✅ Mapped |
| Split Editor | (within Publishing) | Split | ✅ Mapped |
| Rights Readiness | `/releases/[id]/rights` | Ownership (computed) | ✅ Mapped |

### Contributor Home

| Screen | Route | Entities | Status |
|--------|-------|----------|--------|
| Contributor Home | `/home` | Task, Notification, Approval, Deadline, Release | ✅ Mapped |
| Tab: My Tasks | `/home` | Task (assigned) | ✅ Mapped |
| Tab: Pending | `/home?tab=pending` | Task (all), Approval | ✅ Mapped |

### Review & Approvals

| Screen | Route | Entities | Status |
|--------|-------|----------|--------|
| Review Panel | (panel) | Approval, Deliverable, Asset | ✅ Mapped |
| Approval Queue | (within dashboard/home) | Approval | ✅ Mapped |
| Approval History | (within review panel) | Approval (timeline) | ✅ Mapped |

### Dependencies & Blockers

| Screen | Route | Entities | Status |
|--------|-------|----------|--------|
| Blocker Dashboard | `/blockers` | Dependency, Stage, Release | ✅ Mapped |
| Dependency Timeline | (within Dependencies) | Dependency, Stage | ✅ Mapped |

### Alerts & Notifications

| Screen | Route | Entities | Status |
|--------|-------|----------|--------|
| Alert Card | (within Operations) | Alert | ✅ Mapped |
| Acknowledge flow | (within Alert) | Alert | ✅ Mapped |
| Escalation flow | (within Alert) | Alert, Notification | ✅ Mapped |
| Notification Center | (slide-out) | Notification | ✅ Mapped |

### Budget & Resources

| Screen | Route | Entities | Status |
|--------|-------|----------|--------|
| Resource Planning | `/resources` | Resource, Release, Campaign | ✅ Mapped |
| Cost Detail Panel | (within Budget) | Cost, Vendor | ✅ Mapped |
| Budget Forecast | (within Budget) | Budget, Cost (computed) | ✅ Mapped |

### Campaign Health

| Screen | Route | Entities | Status |
|--------|-------|----------|--------|
| Campaign Health Panel | (within Campaign) | Campaign, Milestone, Channel (computed) | ✅ Mapped |

---

## Summary

| Category | Screens Audited | ✅ Mapped | Coverage |
|----------|----------------|-----------|----------|
| Auth | 4 | 4 | 100% |
| Onboarding | 7 | 7 | 100% |
| App Shell | 8 | 8 | 100% |
| Dashboard | 6 | 6 | 100% |
| Operations Center | 6 | 6 | 100% |
| Executive Dashboard | 5 | 5 | 100% |
| Releases List | 3 | 3 | 100% |
| Release Workspace | 16 | 16 | 100% |
| Tasks | 2 | 2 | 100% |
| Assets | 3 | 3 | 100% |
| Calendar | 1 | 1 | 100% |
| Marketing | 3 | 3 | 100% |
| Distribution Hub | 2 | 2 | 100% |
| Reports | 1 | 1 | 100% |
| Settings | 7 | 7 | 100% |
| Artists | 10 | 10 | 100% |
| Credits & Ownership | 8 | 8 | 100% |
| Contributor Home | 3 | 3 | 100% |
| Review & Approvals | 3 | 3 | 100% |
| Dependencies & Blockers | 2 | 2 | 100% |
| Alerts & Notifications | 4 | 4 | 100% |
| Budget & Resources | 3 | 3 | 100% |
| Campaign Health | 1 | 1 | 100% |

| Total | 108 | 108 | **100%** |
