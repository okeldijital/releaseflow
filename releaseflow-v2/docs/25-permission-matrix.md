# Permission Matrix (Final)

## Purpose

This document defines the complete, implementation-ready RBAC model. Every
permission is enumerated with its key, category, scope, and assignment to
each of the 11 roles. This supersedes the draft in `08-rbac-matrix.md` for
implementation purposes.

---

## Role Definitions

| ID | Role | Abbr | Max per Org | Default Assignment |
|----|------|------|-------------|-------------------|
| R1 | Owner | OWN | 2 | Org creator |
| R2 | Admin | ADM | Unlimited | By Owner |
| R3 | Project Manager | PM | Unlimited | By Admin or Owner |
| R4 | A&R | A&R | Unlimited | By Admin or Owner |
| R5 | Artist | ART | Unlimited | By PM, Admin, or Owner |
| R6 | Producer | PRO | Unlimited | By PM, Admin, or Owner |
| R7 | Engineer | ENG | Unlimited | By PM, Admin, or Owner |
| R8 | Designer | DES | Unlimited | By PM, Admin, or Owner |
| R9 | Marketing | MKT | Unlimited | By Admin or Owner |
| R10 | PR | PR | Unlimited | By Admin or Owner |
| R11 | Viewer | VWR | Unlimited | By Admin or Owner |

## Scope Model

| Scope | Symbol | Meaning |
|-------|--------|---------|
| Global | ● | All resources in the organization |
| Self | ◐ | Only resources where user is assignee, creator, or named contributor |
| Read | ○ | View only — no create, edit, delete |
| None | − | No access |

### Self-Scope Rules

Self-scoped permissions apply differently per role:

| Role | Self-Scope Boundary |
|------|---------------------|
| PM | Releases, tasks, and workflows they are assigned to manage |
| A&R | Stages they are designated to approve/reject |
| Artist | Releases where they are listed as primary artist or featured artist |
| Producer | Releases and tasks they are assigned to |
| Engineer | Releases and tasks they are assigned to |
| Designer | Releases they are assigned to; only own uploads |
| Marketing | Campaigns they created or are assigned to |
| PR | Campaigns they are assigned to |

---

## Permission Catalog

### Organization (ORG)

| Key | Permission | Description |
|-----|------------|-------------|
| `org:view` | View Organization | See org profile, settings, branding |
| `org:edit` | Edit Organization | Modify org name, slug, type, branding |
| `org:delete` | Delete Organization | Permanently delete org and all data |

### User Management (USER)

| Key | Permission | Description |
|-----|------------|-------------|
| `user:invite` | Invite Users | Send invitations to join org |
| `user:remove` | Remove Users | Remove members from org |
| `user:assign_role` | Assign Roles | Change a user's role |
| `user:view` | View Team | See member list and roles |

### Billing (BILLING)

| Key | Permission | Description |
|-----|------------|-------------|
| `billing:view` | View Billing | See plan, invoices, payment methods |
| `billing:manage` | Manage Billing | Change plan, update payment, download invoices |

### Settings (SETTINGS)

| Key | Permission | Description |
|-----|------------|-------------|
| `settings:view` | View Settings | See all settings pages |
| `settings:manage` | Manage Settings | Modify org settings, workflow config, integrations |

### Release (RELEASE)

| Key | Permission | Description |
|-----|------------|-------------|
| `release:create` | Create Release | Create new releases |
| `release:view` | View Release | See release detail, tabs, metadata |
| `release:edit` | Edit Release | Modify release metadata, settings |
| `release:delete` | Delete Release | Permanently delete a release |
| `release:advance_status` | Advance Status | Change release status (DRAFT → PLANNING → etc.) |

### Stage (STAGE)

| Key | Permission | Description |
|-----|------------|-------------|
| `stage:advance` | Advance Stage | Move a stage forward when tasks complete |
| `stage:approve` | Approve Stage | Approve stage deliverables for completion |
| `stage:reject` | Reject Stage | Reject and send stage back for rework |
| `stage:skip` | Skip Stage | Skip a stage entirely |

### Workflow (WORKFLOW)

| Key | Permission | Description |
|-----|------------|-------------|
| `workflow:configure` | Configure Workflow | Add/remove/reorder stages in a workflow |
| `template:manage` | Manage Templates | Edit release template defaults |

### Task (TASK)

| Key | Permission | Description |
|-----|------------|-------------|
| `task:create` | Create Task | Add tasks to a stage |
| `task:view` | View Task | See task details |
| `task:edit` | Edit Task | Modify task title, description, due date |
| `task:delete` | Delete Task | Remove a task |
| `task:assign` | Assign Task | Set or change task assignee |
| `task:complete` | Complete Task | Mark task as done |

### Asset (ASSET)

| Key | Permission | Description |
|-----|------------|-------------|
| `asset:upload` | Upload Asset | Upload files to a release |
| `asset:view` | View Asset | Download and preview assets |
| `asset:delete` | Delete Asset | Remove an asset version |
| `asset:version` | Version Asset | Create a new version of an existing asset |

### Campaign (CAMPAIGN)

| Key | Permission | Description |
|-----|------------|-------------|
| `campaign:create` | Create Campaign | Start a new marketing campaign |
| `campaign:view` | View Campaign | See campaign details and assets |
| `campaign:edit` | Edit Campaign | Modify campaign plan |
| `campaign:launch` | Launch Campaign | Publish a campaign (requires approval) |
| `campaign:archive` | Archive Campaign | Close a completed campaign |

### Distribution (DIST)

| Key | Permission | Description |
|-----|------------|-------------|
| `dist:submit` | Submit Distribution | Send release to DSPs for distribution |
| `dist:approve` | Approve Distribution | Authorize distribution submission |
| `dist:takedown` | Takedown Distribution | Remove release from DSPs |

### Report (REPORT)

| Key | Permission | Description |
|-----|------------|-------------|
| `report:view` | View Reports | See in-app analytics dashboards |
| `report:export` | Export Reports | Download reports as CSV/PDF |

---

## Full Matrix

### Organization & Billing

```
Key                  │ OWN │ ADM │ PM  │ A&R │ ART │ PRO │ ENG │ DES │ MKT │ PR  │ VWR
─────────────────────┼─────┼─────┼─────┼─────┼─────┼─────┼─────┼─────┼─────┼─────┼─────
org:view             │ ●   │ ●   │ ●   │ ●   │ ●   │ ●   │ ●   │ ●   │ ●   │ ●   │ ●
org:edit             │ ●   │ −   │ −   │ −   │ −   │ −   │ −   │ −   │ −   │ −   │ −
org:delete           │ ●   │ −   │ −   │ −   │ −   │ −   │ −   │ −   │ −   │ −   │ −
billing:view         │ ●   │ ●   │ −   │ −   │ −   │ −   │ −   │ −   │ −   │ −   │ −
billing:manage       │ ●   │ ○   │ −   │ −   │ −   │ −   │ −   │ −   │ −   │ −   │ −
```

### User Management

```
Key                  │ OWN │ ADM │ PM  │ A&R │ ART │ PRO │ ENG │ DES │ MKT │ PR  │ VWR
─────────────────────┼─────┼─────┼─────┼─────┼─────┼─────┼─────┼─────┼─────┼─────┼─────
user:invite          │ ●   │ ●   │ ◐   │ −   │ −   │ −   │ −   │ −   │ −   │ −   │ −
user:remove          │ ●   │ ●   │ −   │ −   │ −   │ −   │ −   │ −   │ −   │ −   │ −
user:assign_role     │ ●   │ ●   │ ◐   │ −   │ −   │ −   │ −   │ −   │ −   │ −   │ −
user:view            │ ●   │ ●   │ ●   │ ●   │ ●   │ ●   │ ●   │ ●   │ ●   │ ●   │ ●
```

### Settings

```
Key                  │ OWN │ ADM │ PM  │ A&R │ ART │ PRO │ ENG │ DES │ MKT │ PR  │ VWR
─────────────────────┼─────┼─────┼─────┼─────┼─────┼─────┼─────┼─────┼─────┼─────┼─────
settings:view        │ ●   │ ●   │ ●   │ ○   │ ○   │ ○   │ ○   │ ○   │ ○   │ ○   │ ○
settings:manage      │ ●   │ ●   │ ◐   │ −   │ −   │ −   │ −   │ −   │ −   │ −   │ −
```

### Release

```
Key                  │ OWN │ ADM │ PM  │ A&R │ ART │ PRO │ ENG │ DES │ MKT │ PR  │ VWR
─────────────────────┼─────┼─────┼─────┼─────┼─────┼─────┼─────┼─────┼─────┼─────┼─────
release:create       │ ●   │ ●   │ ●   │ ●   │ ◐   │ −   │ −   │ −   │ −   │ −   │ −
release:view         │ ●   │ ●   │ ●   │ ●   │ ●   │ ◐   │ ◐   │ ◐   │ ●   │ ●   │ ○
release:edit         │ ●   │ ●   │ ●   │ ●   │ ◐   │ −   │ −   │ −   │ −   │ −   │ −
release:delete       │ ●   │ ●   │ −   │ −   │ −   │ −   │ −   │ −   │ −   │ −   │ −
release:advance_status│ ●   │ ●   │ ●   │ ●   │ −   │ −   │ −   │ −   │ −   │ −   │ −
```

### Stage

```
Key                  │ OWN │ ADM │ PM  │ A&R │ ART │ PRO │ ENG │ DES │ MKT │ PR  │ VWR
─────────────────────┼─────┼─────┼─────┼─────┼─────┼─────┼─────┼─────┼─────┼─────┼─────
stage:advance        │ ●   │ ●   │ ●   │ ●   │ −   │ −   │ −   │ −   │ −   │ −   │ −
stage:approve        │ ●   │ ●   │ ◐   │ ●   │ −   │ −   │ −   │ −   │ −   │ −   │ −
stage:reject         │ ●   │ ●   │ ◐   │ ●   │ −   │ −   │ −   │ −   │ −   │ −   │ −
stage:skip           │ ●   │ ●   │ ●   │ −   │ −   │ −   │ −   │ −   │ −   │ −   │ −
```

### Workflow & Templates

```
Key                  │ OWN │ ADM │ PM  │ A&R │ ART │ PRO │ ENG │ DES │ MKT │ PR  │ VWR
─────────────────────┼─────┼─────┼─────┼─────┼─────┼─────┼─────┼─────┼─────┼─────┼─────
workflow:configure   │ ●   │ ●   │ ◐   │ −   │ −   │ −   │ −   │ −   │ −   │ −   │ −
template:manage      │ ●   │ ●   │ ◐   │ −   │ −   │ −   │ −   │ −   │ −   │ −   │ −
```

### Task

```
Key                  │ OWN │ ADM │ PM  │ A&R │ ART │ PRO │ ENG │ DES │ MKT │ PR  │ VWR
─────────────────────┼─────┼─────┼─────┼─────┼─────┼─────┼─────┼─────┼─────┼─────┼─────
task:create          │ ●   │ ●   │ ●   │ ◐   │ −   │ −   │ −   │ −   │ −   │ −   │ −
task:view            │ ●   │ ●   │ ●   │ ●   │ ●   │ ◐   │ ◐   │ ◐   │ ●   │ ●   │ ○
task:edit            │ ●   │ ●   │ ●   │ ◐   │ −   │ −   │ −   │ −   │ −   │ −   │ −
task:delete          │ ●   │ ●   │ ●   │ −   │ −   │ −   │ −   │ −   │ −   │ −   │ −
task:assign          │ ●   │ ●   │ ●   │ ◐   │ −   │ −   │ −   │ −   │ −   │ −   │ −
task:complete        │ ●   │ ●   │ ●   │ ●   │ ◐   │ ◐   │ ◐   │ ◐   │ ●   │ ●   │ −
```

### Asset

```
Key                  │ OWN │ ADM │ PM  │ A&R │ ART │ PRO │ ENG │ DES │ MKT │ PR  │ VWR
─────────────────────┼─────┼─────┼─────┼─────┼─────┼─────┼─────┼─────┼─────┼─────┼─────
asset:upload         │ ●   │ ●   │ ●   │ ●   │ ●   │ ●   │ ●   │ ●   │ ●   │ ●   │ −
asset:view           │ ●   │ ●   │ ●   │ ●   │ ●   │ ●   │ ●   │ ●   │ ●   │ ●   │ ○
asset:delete         │ ●   │ ●   │ ●   │ −   │ ◐   │ −   │ −   │ ◐   │ −   │ −   │ −
asset:version        │ ●   │ ●   │ ●   │ −   │ ●   │ ●   │ ●   │ ●   │ −   │ −   │ −
```

### Campaign

```
Key                  │ OWN │ ADM │ PM  │ A&R │ ART │ PRO │ ENG │ DES │ MKT │ PR  │ VWR
─────────────────────┼─────┼─────┼─────┼─────┼─────┼─────┼─────┼─────┼─────┼─────┼─────
campaign:create      │ ●   │ ●   │ ◐   │ −   │ −   │ −   │ −   │ −   │ ●   │ ●   │ −
campaign:view        │ ●   │ ●   │ ●   │ ●   │ ●   │ −   │ −   │ −   │ ●   │ ●   │ ○
campaign:edit        │ ●   │ ●   │ ◐   │ −   │ −   │ −   │ −   │ −   │ ●   │ ●   │ −
campaign:launch      │ ●   │ ●   │ −   │ ●   │ −   │ −   │ −   │ −   │ ●   │ −   │ −
campaign:archive     │ ●   │ ●   │ ◐   │ −   │ −   │ −   │ −   │ −   │ ●   │ −   │ −
```

### Distribution

```
Key                  │ OWN │ ADM │ PM  │ A&R │ ART │ PRO │ ENG │ DES │ MKT │ PR  │ VWR
─────────────────────┼─────┼─────┼─────┼─────┼─────┼─────┼─────┼─────┼─────┼─────┼─────
dist:submit          │ ●   │ ●   │ ●   │ −   │ −   │ −   │ −   │ −   │ −   │ −   │ −
dist:approve         │ ●   │ ●   │ −   │ −   │ −   │ −   │ −   │ −   │ −   │ −   │ −
dist:takedown        │ ●   │ ●   │ −   │ −   │ −   │ −   │ −   │ −   │ −   │ −   │ −
```

### Report

```
Key                  │ OWN │ ADM │ PM  │ A&R │ ART │ PRO │ ENG │ DES │ MKT │ PR  │ VWR
─────────────────────┼─────┼─────┼─────┼─────┼─────┼─────┼─────┼─────┼─────┼─────┼─────
report:view          │ ●   │ ●   │ ●   │ ●   │ ○   │ ○   │ ○   │ ○   │ ●   │ ●   │ ○
report:export        │ ●   │ ●   │ ●   │ ●   │ −   │ −   │ −   │ −   │ ●   │ ●   │ −
```

---

## Permission Count Summary

| Role | Global (●) | Self (◐) | Read (○) | Total |
|------|-----------|----------|----------|-------|
| Owner | 40 | 0 | 0 | 40 |
| Admin | 31 | 0 | 2 | 33 |
| PM | 17 | 9 | 0 | 26 |
| A&R | 12 | 5 | 4 | 21 |
| Artist | 2 | 7 | 6 | 15 |
| Producer | 0 | 6 | 4 | 10 |
| Engineer | 0 | 6 | 4 | 10 |
| Designer | 2 | 6 | 4 | 12 |
| Marketing | 12 | 3 | 4 | 19 |
| PR | 4 | 3 | 6 | 13 |
| Viewer | 0 | 0 | 13 | 13 |

---

## Implementation Rules

### Authorization Enforcement

| Layer | Enforcement |
|-------|-------------|
| UI | Hide actions and nav items the user cannot perform. Never grey out. |
| API | Validate every request against the caller's role + scope. |
| Data | Queries must filter results based on self-scope boundaries. |
| Audit | All denied access attempts are logged with user, resource, action, and timestamp. |

### Self-Scope Implementation

```typescript
interface SelfScopeRule {
  role: RoleId;
  resourceType: 'release' | 'task' | 'campaign' | 'asset';
  filter: (userId: string, resource: Resource) => boolean;
}
```

For each self-scoped permission, the backend applies a filter:

- **PM self-scope:** `release.pmIds.includes(userId)` or `release.createdBy === userId`
- **Artist self-scope:** `release.artistIds.includes(userId)` or `release.tracks.some(t => t.artistIds.includes(userId))`
- **Producer/Engineer/Designer self-scope:** `release.contributorIds.includes(userId)` or `task.assigneeId === userId`
- **Marketing/PR self-scope:** `campaign.createdBy === userId`

### Role Assignment Rules

| Rule | Enforced By |
|------|-------------|
| Must have at least 1 Owner at all times | API — prevent last Owner demotion/removal |
| Owner cannot be removed by any other role | API — only self-initiated transfer |
| Max 2 Owners per org | API — reject assignment if limit reached |
| Admin cannot assign Owner role | API — only existing Owner can grant Owner |
| PM can only assign project-scoped roles | API — limited to Artist, Producer, Engineer, Designer within their releases |
| Role change requires `user:assign_role` | API — checked before update |

### Permission Inheritance

There is no hierarchical inheritance. Each role has an explicit permission
map. However, certain permissions imply others:

| If a user has... | Then they also have... | Rationale |
|-----------------|----------------------|-----------|
| `org:edit` | `org:view` | Can't edit what you can't see |
| `release:edit` | `release:view` | Can't edit what you can't see |
| `release:delete` | `release:view` + `release:edit` | Can't delete what you can't see/edit |
| `billing:manage` | `billing:view` | Can't manage what you can't see |
| `settings:manage` | `settings:view` | Can't manage what you can't see |
| `task:create` | `task:view` | Can't create what you can't see |
| `task:edit` | `task:view` | Can't edit what you can't see |

### Deny by Default

All permissions default to `−` (None). Only explicitly listed permissions
are granted. This ensures that new resources automatically restrict access
until deliberately assigned.

### Audit Logging

| Event | Logged Data |
|-------|-------------|
| Permission check (denied) | userId, resourceType, resourceId, action, timestamp |
| Role assignment change | actorId, targetUserId, oldRole, newRole, timestamp |
| Role scope change | actorId, targetUserId, resourceId, oldScope, newScope, timestamp |
| User removed | actorId, targetUserId, timestamp |
