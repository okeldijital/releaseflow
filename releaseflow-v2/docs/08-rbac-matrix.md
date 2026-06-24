# RBAC Matrix

## Owner ≠ Admin

This distinction is critical and often overlooked:

| Dimension         | Owner                                      | Admin                                      |
|-------------------|--------------------------------------------|--------------------------------------------|
| Billing access    | Full — plans, invoices, payment methods    | View only (can see invoices, not change)   |
| Org deletion      | Can delete the organization                | Cannot delete                              |
| Tenant config     | Can modify tenant-level settings           | Org-level settings only                    |
| Irrevocability    | Cannot be removed by another Owner         | Can be removed by Owner                    |
| Count             | Typically 1 per org (max 2)                | Unlimited                                  |
| Default           | Creator of the org becomes Owner           | Must be assigned by Owner                  |

**Rule:** There must always be at least one Owner. An Owner cannot
demote themselves if they are the last Owner.

---

## Roles

| # | Role             | Abbr | Purpose                                               |
|---|------------------|------|-------------------------------------------------------|
| 1 | Owner            | OWN  | Ultimate authority. Billing, org config, deletion.    |
| 2 | Admin            | ADM  | Full operational control. No billing or deletion.     |
| 3 | Project Manager  | PM   | Day-to-day release and task coordination.             |
| 4 | A&R              | A&R  | Creative gatekeeper. Approves/rejects stages.         |
| 5 | Artist           | ART  | Primary performer. Owns their releases.               |
| 6 | Producer         | PRO  | Audio production. Uploads assets, views tasks.        |
| 7 | Engineer         | ENG  | Mixing/Mastering. Uploads assets, views tasks.        |
| 8 | Designer         | DES  | Visual assets (artwork, video). Uploads/versions.     |
| 9 | Marketing        | MKT  | Campaign creation, launch, reporting.                 |
| 10| PR               | PR   | Publicity, campaigns, asset upload.                   |
| 11| Viewer           | VWR  | Read-only access across all resources.                |

---

## Permission Categories

| Code     | Category        | Description                              |
|----------|-----------------|------------------------------------------|
| ORG      | Organization    | Org-level settings, billing, deletion    |
| USER     | User Management | Invite, remove, role assignment          |
| RELEASE  | Release         | CRUD, lifecycle, metadata, templates     |
| TASK     | Task            | CRUD, assignment, status                 |
| ASSET    | Asset           | Upload, version, delete                  |
| STAGE    | Stage           | Advance, skip, approve, reject           |
| WORKFLOW | Workflow        | Configure stages, templates              |
| CAMPAIGN | Marketing       | Create, launch, archive campaigns        |
| DIST     | Distribution    | Submit, approve, takedown                |
| REPORT   | Reports         | View, export, schedule                   |
| BILLING  | Billing         | Plans, invoices, usage                   |
| SETTINGS | Settings        | Org/team/config management               |

---

## Permission Definitions

| Permission              | Key                    | Scope             |
|-------------------------|------------------------|-------------------|
| Manage Organization     | `org:manage`           | Organization      |
| View Organization       | `org:view`             | Organization      |
| Delete Organization     | `org:delete`           | Organization      |
| View Billing            | `billing:view`         | Billing           |
| Manage Billing          | `billing:manage`       | Billing           |
| Invite Users            | `user:invite`          | Organization      |
| Remove Users            | `user:remove`          | Organization      |
| Assign Roles            | `user:assign_role`     | Organization      |
| View Team               | `user:view`            | Organization      |
| Create Release          | `release:create`       | Release           |
| View Release            | `release:view`         | Release           |
| Edit Release            | `release:edit`         | Release           |
| Delete Release          | `release:delete`       | Release           |
| Advance Stage           | `stage:advance`         | Workflow          |
| Approve Stage           | `stage:approve`         | Workflow          |
| Reject Stage            | `stage:reject`          | Workflow          |
| Skip Stage              | `stage:skip`            | Workflow          |
| Configure Workflow      | `workflow:manage`       | Workflow          |
| Create Task             | `task:create`           | Task              |
| View Task               | `task:view`             | Task              |
| Edit Task               | `task:edit`             | Task              |
| Delete Task             | `task:delete`           | Task              |
| Assign Task             | `task:assign`           | Task              |
| Complete Task           | `task:complete`         | Task              |
| Upload Asset            | `asset:upload`          | Asset             |
| View Asset              | `asset:view`            | Asset             |
| Delete Asset            | `asset:delete`          | Asset             |
| Version Asset           | `asset:version`         | Asset             |
| Create Campaign         | `campaign:create`       | Campaign          |
| View Campaign           | `campaign:view`         | Campaign          |
| Edit Campaign           | `campaign:edit`         | Campaign          |
| Launch Campaign         | `campaign:launch`       | Campaign          |
| Archive Campaign        | `campaign:archive`      | Campaign          |
| Submit Distribution     | `dist:submit`           | Distribution      |
| Approve Distribution    | `dist:approve`          | Distribution      |
| Takedown Distribution   | `dist:takedown`         | Distribution      |
| View Reports            | `report:view`           | Reports           |
| Export Reports          | `report:export`         | Reports           |
| Manage Settings         | `settings:manage`       | Organization      |
| View Settings           | `settings:view`         | Organization      |
| Manage Templates        | `template:manage`       | Workflow          |

---

## Legend

| Symbol | Meaning          |
|--------|------------------|
| ●      | Full permission  |
| ◐      | Self-only scope  |
| ○      | Read-only        |
| −      | No access        |

---

## Full Role ↔ Permission Matrix

### Organization & Billing

```
Permission              │ OWN │ ADM │ PM  │ A&R │ ART │ PRO │ ENG │ DES │ MKT │ PR  │ VWR
────────────────────────┼─────┼─────┼─────┼─────┼─────┼─────┼─────┼─────┼─────┼─────┼─────
Manage Organization     │ ●   │ −   │ −   │ −   │ −   │ −   │ −   │ −   │ −   │ −   │ −
View Organization       │ ●   │ ●   │ ●   │ ●   │ ●   │ ●   │ ●   │ ●   │ ●   │ ●   │ ●
Delete Organization     │ ●   │ −   │ −   │ −   │ −   │ −   │ −   │ −   │ −   │ −   │ −
View Billing            │ ●   │ ●   │ −   │ −   │ −   │ −   │ −   │ −   │ −   │ −   │ −
Manage Billing          │ ●   │ ○   │ −   │ −   │ −   │ −   │ −   │ −   │ −   │ −   │ −
```

### User Management

```
Permission              │ OWN │ ADM │ PM  │ A&R │ ART │ PRO │ ENG │ DES │ MKT │ PR  │ VWR
────────────────────────┼─────┼─────┼─────┼─────┼─────┼─────┼─────┼─────┼─────┼─────┼─────
Invite Users            │ ●   │ ●   │ ◐   │ −   │ −   │ −   │ −   │ −   │ −   │ −   │ −
Remove Users            │ ●   │ ●   │ −   │ −   │ −   │ −   │ −   │ −   │ −   │ −   │ −
Assign Roles            │ ●   │ ●   │ ◐   │ −   │ −   │ −   │ −   │ −   │ −   │ −   │ −
View Team               │ ●   │ ●   │ ●   │ ●   │ ●   │ ●   │ ●   │ ●   │ ●   │ ●   │ ●
```

### Release Management

```
Permission              │ OWN │ ADM │ PM  │ A&R │ ART │ PRO │ ENG │ DES │ MKT │ PR  │ VWR
────────────────────────┼─────┼─────┼─────┼─────┼─────┼─────┼─────┼─────┼─────┼─────┼─────
Create Release          │ ●   │ ●   │ ●   │ ●   │ ◐   │ −   │ −   │ −   │ −   │ −   │ −
View Release            │ ●   │ ●   │ ●   │ ●   │ ●   │ ◐   │ ◐   │ ◐   │ ●   │ ●   │ ○
Edit Release            │ ●   │ ●   │ ●   │ ●   │ ◐   │ −   │ −   │ −   │ −   │ −   │ −
Delete Release          │ ●   │ ●   │ −   │ −   │ −   │ −   │ −   │ −   │ −   │ −   │ −
```

### Workflow & Stages

```
Permission              │ OWN │ ADM │ PM  │ A&R │ ART │ PRO │ ENG │ DES │ MKT │ PR  │ VWR
────────────────────────┼─────┼─────┼─────┼─────┼─────┼─────┼─────┼─────┼─────┼─────┼─────
Advance Stage           │ ●   │ ●   │ ●   │ ●   │ −   │ −   │ −   │ −   │ −   │ −   │ −
Approve Stage           │ ●   │ ●   │ ◐   │ ●   │ −   │ −   │ −   │ −   │ −   │ −   │ −
Reject Stage            │ ●   │ ●   │ ◐   │ ●   │ −   │ −   │ −   │ −   │ −   │ −   │ −
Skip Stage              │ ●   │ ●   │ ●   │ −   │ −   │ −   │ −   │ −   │ −   │ −   │ −
Configure Workflow      │ ●   │ ●   │ ◐   │ −   │ −   │ −   │ −   │ −   │ −   │ −   │ −
Manage Templates        │ ●   │ ●   │ ◐   │ −   │ −   │ −   │ −   │ −   │ −   │ −   │ −
```

### Tasks

```
Permission              │ OWN │ ADM │ PM  │ A&R │ ART │ PRO │ ENG │ DES │ MKT │ PR  │ VWR
────────────────────────┼─────┼─────┼─────┼─────┼─────┼─────┼─────┼─────┼─────┼─────┼─────
Create Task             │ ●   │ ●   │ ●   │ ◐   │ −   │ −   │ −   │ −   │ −   │ −   │ −
View Task               │ ●   │ ●   │ ●   │ ●   │ ●   │ ◐   │ ◐   │ ◐   │ ●   │ ●   │ ○
Edit Task               │ ●   │ ●   │ ●   │ ◐   │ −   │ −   │ −   │ −   │ −   │ −   │ −
Delete Task             │ ●   │ ●   │ ●   │ −   │ −   │ −   │ −   │ −   │ −   │ −   │ −
Assign Task             │ ●   │ ●   │ ●   │ ◐   │ −   │ −   │ −   │ −   │ −   │ −   │ −
Complete Task           │ ●   │ ●   │ ●   │ ●   │ ◐   │ ◐   │ ◐   │ ◐   │ ●   │ ●   │ −
```

### Assets

```
Permission              │ OWN │ ADM │ PM  │ A&R │ ART │ PRO │ ENG │ DES │ MKT │ PR  │ VWR
────────────────────────┼─────┼─────┼─────┼─────┼─────┼─────┼─────┼─────┼─────┼─────┼─────
Upload Asset            │ ●   │ ●   │ ●   │ ●   │ ●   │ ●   │ ●   │ ●   │ ●   │ ●   │ −
View Asset              │ ●   │ ●   │ ●   │ ●   │ ●   │ ●   │ ●   │ ●   │ ●   │ ●   │ ○
Delete Asset            │ ●   │ ●   │ ●   │ −   │ ◐   │ −   │ −   │ ◐   │ −   │ −   │ −
Version Asset           │ ●   │ ●   │ ●   │ −   │ ●   │ ●   │ ●   │ ●   │ −   │ −   │ −
```

### Marketing Campaigns

```
Permission              │ OWN │ ADM │ PM  │ A&R │ ART │ PRO │ ENG │ DES │ MKT │ PR  │ VWR
────────────────────────┼─────┼─────┼─────┼─────┼─────┼─────┼─────┼─────┼─────┼─────┼─────
Create Campaign         │ ●   │ ●   │ ◐   │ −   │ −   │ −   │ −   │ −   │ ●   │ ●   │ −
View Campaign           │ ●   │ ●   │ ●   │ ●   │ ●   │ −   │ −   │ −   │ ●   │ ●   │ ○
Edit Campaign           │ ●   │ ●   │ ◐   │ −   │ −   │ −   │ −   │ −   │ ●   │ ●   │ −
Launch Campaign         │ ●   │ ●   │ −   │ ●   │ −   │ −   │ −   │ −   │ ●   │ −   │ −
Archive Campaign        │ ●   │ ●   │ ◐   │ −   │ −   │ −   │ −   │ −   │ ●   │ −   │ −
```

### Distribution

```
Permission              │ OWN │ ADM │ PM  │ A&R │ ART │ PRO │ ENG │ DES │ MKT │ PR  │ VWR
────────────────────────┼─────┼─────┼─────┼─────┼─────┼─────┼─────┼─────┼─────┼─────┼─────
Submit Distribution     │ ●   │ ●   │ ●   │ −   │ −   │ −   │ −   │ −   │ −   │ −   │ −
Approve Distribution    │ ●   │ ●   │ −   │ −   │ −   │ −   │ −   │ −   │ −   │ −   │ −
Takedown Distribution   │ ●   │ ●   │ −   │ −   │ −   │ −   │ −   │ −   │ −   │ −   │ −
```

### Reports & Settings

```
Permission              │ OWN │ ADM │ PM  │ A&R │ ART │ PRO │ ENG │ DES │ MKT │ PR  │ VWR
────────────────────────┼─────┼─────┼─────┼─────┼─────┼─────┼─────┼─────┼─────┼─────┼─────
View Reports            │ ●   │ ●   │ ●   │ ●   │ ○   │ ○   │ ○   │ ○   │ ●   │ ●   │ ○
Export Reports          │ ●   │ ●   │ ●   │ ●   │ −   │ −   │ −   │ −   │ ●   │ ●   │ −
Manage Settings         │ ●   │ ●   │ ◐   │ −   │ −   │ −   │ −   │ −   │ −   │ −   │ −
View Settings           │ ●   │ ●   │ ●   │ ○   │ ○   │ ○   │ ○   │ ○   │ ○   │ ○   │ ○
```

---

## Role Purpose & Restrictions

### Owner
**Purpose:** Ultimate authority over the organization. Owns billing,
tenant configuration, and org lifecycle.
**Restrictions:**
- Cannot delete own account if last Owner (must transfer first)
- Cannot be removed by other roles
- Limited to 2 per org to prevent governance deadlock
- All actions are audit-logged with Owner flag

### Admin
**Purpose:** Full operational control without billing or org deletion.
**Restrictions:**
- Cannot delete the organization
- Cannot manage billing plans
- Cannot remove Owner role from any user
- All actions are audit-logged

### Project Manager
**Purpose:** Day-to-day coordination of releases, tasks, and workflow.
**Restrictions:**
- Invite/role assignment is self-scoped (own projects only)
- Cannot delete releases
- Cannot skip stages (must advance through each)
- Workflow config scoped to assigned projects

### A&R
**Purpose:** Creative gatekeeper. Decides what advances through the
pipeline.
**Restrictions:**
- Cannot configure workflows or templates
- Cannot manage billing or org settings
- Cannot delete releases or tasks
- Cannot invite or remove users

### Artist
**Purpose:** Primary performer and creative contributor.
**Restrictions:**
- Self-scoped to releases where listed as primary artist
- Cannot view releases they are not credited on
- Cannot advance stages or approve work
- Cannot access billing, settings, or reports (read-only)

### Producer
**Purpose:** Audio production contributor.
**Restrictions:**
- Self-scoped to assigned tasks and releases
- Cannot create releases or tasks
- Cannot edit metadata or manage workflow
- Asset operations limited to assigned tasks

### Engineer
**Purpose:** Mix and/or mastering technical contributor.
**Restrictions:**
- Self-scoped to assigned tasks and releases
- Cannot create releases or tasks
- Cannot approve or reject stages
- Asset operations limited to assigned tasks

### Designer
**Purpose:** Visual asset creation (artwork, video, branding).
**Restrictions:**
- Self-scoped to assigned releases
- Can delete own uploaded assets only
- Cannot advance stages or manage workflow
- Cannot access marketing, distribution, or billing

### Marketing
**Purpose:** Campaign strategy, execution, and reporting.
**Restrictions:**
- Cannot manage workflow, stages, or templates
- Cannot invite or remove users
- Cannot delete releases
- Campaign launch requires A&R or Admin approval

### PR
**Purpose:** Public relations, media outreach, publicity assets.
**Restrictions:**
- Cannot manage workflow, stages, or billing
- Cannot delete releases or assets
- Cannot launch campaigns (view/edit only)
- Cannot invite or assign roles

### Viewer
**Purpose:** External stakeholders, label partners, auditors.
**Restrictions:**
- Read-only across all resources
- Cannot create, edit, delete any entity
- Cannot export reports (view only in-app)
- Cannot access billing, settings, or distribution

---

## Scoping Rules

- **Self-only scope (◐):** User can only act on entities where they
  are the assignee, creator, or named contributor.
- **Read-only (○):** User can view the resource but cannot create,
  edit, or delete.
- **PM self-scope on invites/roles:** PM can invite users only to
  their own projects and assign project-scoped roles.
- **Artist self-scope on releases:** Artist can create and edit
  releases where they are listed as primary artist.
- **Technical roles (Producer, Engineer, Designer):** See only
  tasks/assets assigned to them or their team.

---

## Permission Count Summary

| Role             | Full (●) | Self (◐) | Read (○) | Total Granular |
|------------------|----------|----------|----------|----------------|
| Owner            | 40       | 0        | 0        | 40             |
| Admin            | 31       | 0        | 1        | 32             |
| Project Manager  | 17       | 8        | 0        | 25             |
| A&R              | 12       | 4        | 4        | 20             |
| Artist           | 2        | 6        | 6        | 14             |
| Producer         | 0        | 5        | 4        | 9              |
| Engineer         | 0        | 5        | 4        | 9              |
| Designer         | 2        | 5        | 4        | 11             |
| Marketing        | 12       | 2        | 4        | 18             |
| PR               | 4        | 2        | 6        | 12             |
| Viewer           | 0        | 0        | 12       | 12             |
