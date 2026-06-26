# Navigation Specification — ReleaseFlow UI

> Version: 1.0 | Last Updated: 2026-06-24

---

## Navigation Architecture

### Global Navigation Structure

```
Operations                    (primary workflows)
├── Dashboard                 /
├── Releases                  /releases
│   ├── New                   /releases/new
│   └── Detail                /releases/[id]
│       └── Edit              /releases/[id]/edit
├── Artists                   /artists
│   ├── New                   /artists/new
│   └── Detail                /artists/[id]

Execution                     (day-to-day management)
├── Campaigns                 /campaigns
│   ├── New                   /campaigns/new
│   └── Detail                /campaigns/[id]
├── Budgets                   /budgets
├── Rights Holders            /rights-holders
│   └── New                   /rights-holders/new
└── Contributor               /contributor

Monitoring                    (oversight and health)
├── Brief                     /brief
└── Audit                     /audit

Administration                (platform management)
└── Organizations             /organizations
```

---

## Route Definitions

### Operations

| Route | Page | Icon | Permission | Roles |
|---|---|---|---|---|
| `/dashboard` | Dashboard | Home | Any auth user | All |
| `/releases` | Release List | Document | View Releases | All |
| `/releases/new` | New Release | Plus | Create Releases | Owner, Admin, Release Manager |
| `/releases/[id]` | Release Detail | — | View Releases | All (tenant-scoped) |
| `/releases/[id]/edit` | Edit Release | — | Edit Releases | Owner, Admin, Release Manager |
| `/artists` | Artist List | Music Note | View Artists | All |
| `/artists/new` | New Artist | Plus | Create Artists | Owner, Admin, Release Manager |
| `/artists/[id]` | Artist Detail | — | View Artists | All |

### Execution

| Route | Page | Icon | Permission | Roles |
|---|---|---|---|---|
| `/campaigns` | Campaign List | Megaphone | View Campaigns | All |
| `/campaigns/new` | New Campaign | Plus | Create Campaigns | Owner, Admin, Marketing |
| `/campaigns/[id]` | Campaign Detail | — | View Campaigns | All |
| `/budgets` | Budget Overview | Dollar | View Budgets | Owner, Admin, Finance |
| `/rights-holders` | Rights Holders | Scale | View Rights | Owner, Admin, Legal |
| `/rights-holders/new` | New Rights Holder | Plus | Manage Rights | Owner, Admin, Legal |
| `/contributor` | My Dashboard | User | View Own Tasks | All |

### Monitoring

| Route | Page | Icon | Permission | Roles |
|---|---|---|---|---|
| `/brief` | Daily Brief | Clipboard | View Reports | Owner, Admin, Release Manager |
| `/audit` | System Audit | Shield | Platform Admin | Owner, Admin |

### Administration

| Route | Page | Icon | Permission | Roles |
|---|---|---|---|---|
| `/organizations` | Organization | Users | Manage Org | Owner, Admin |

---

## Role-Based Visibility

### Owner
```
Visible: All routes
Visible (sidebar): Dashboard, Releases, Artists, Campaigns, Organizations, Contributor
Hidden: None
```

### Admin
```
Visible: All routes
Visible (sidebar): Dashboard, Releases, Artists, Campaigns, Organizations, Contributor
Hidden: None
```

### Release Manager
```
Visible: /dashboard, /releases, /artists, /campaigns, /contributor, /brief
Visible (sidebar): Dashboard, Releases, Artists, Campaigns, Contributor
Hidden: /organizations, /audit, /budgets, /rights-holders
```

### Contributor
```
Visible: /dashboard, /releases, /artists, /contributor
Visible (sidebar): Dashboard, Releases, Artists, Contributor
Hidden: /campaigns, /organizations, /audit, /budgets, /rights-holders, /brief
Create/Edit: All read-only except assigned tasks
```

### Viewer
```
Visible: /dashboard, /releases, /artists
Visible (sidebar): Dashboard, Releases, Artists
Hidden: Everything else
All routes: Read-only
```

---

## Sidebar Navigation Items

| # | Label | Icon | Route | Section | Permission |
|---|---|---|---|---|---|
| 1 | Dashboard | Home | `/dashboard` | Operations | Any |
| 2 | Releases | Document | `/releases` | Operations | View Releases |
| 3 | Artists | Music | `/artists` | Operations | View Artists |
| 4 | Campaigns | Megaphone | `/campaigns` | Execution | View Campaigns |
| 5 | Organizations | Users | `/organizations` | Admin | Manage Org |
| 6 | Contributor | Person | `/contributor` | Execution | Any |

### Hidden Sidebar Items (Accessible via URL)

| Route | Access Method | Permission |
|---|---|---|
| `/releases/new` | Button on Releases page | Create Releases |
| `/releases/[id]` | Click release card | View Releases |
| `/releases/[id]/edit` | Button on detail page | Edit Releases |
| `/campaigns/new` | Button on Campaigns page | Create Campaigns |
| `/artists/new` | Button on Artists page | Create Artists |
| `/budgets` | URL only (no sidebar) | View Budgets |
| `/brief` | URL only (no sidebar) | View Reports |
| `/audit` | URL only (no sidebar) | Platform Admin |
| `/rights-holders` | URL only (no sidebar) | View Rights |

---

## Navigation Patterns

### Breadcrumbs

```
Home > Releases > Midnight Protocol (Remix)
Home > Campaigns > Summer Campaign
Home > Artists > Artist Name
```

Breadcrumbs appear in the Topbar, left-aligned, between the mobile hamburger and the right-side controls.

### Active State

The active sidebar item matches by route prefix:
- `/releases` activates when pathname starts with `/releases`
- `/releases/new` does NOT match `/releases` in sidebar (parent-only highlighting)

### Back Navigation

Each detail/create page includes a back link:
```html
← Back to Releases    (on /releases/new)
← Back to Release     (on /releases/[id]/edit)
```

The back link preserves the previous page context (no full page reload).

---

## Contextual Navigation (Release Detail)

```
Release Detail (/releases/[id])
├── Header: Title + Status + Edit/Delete buttons
├── Tab: Overview (default)
├── Tab: Workflow (stages + tasks)
├── Tab: Deliverables
├── Tab: Dependencies
└── Context Rail: Metadata, Readiness %, Activity Timeline
```

### Tab Definitions

| Tab | Content | Permission |
|---|---|---|
| Overview | Release info, readiness, distribution, ownership, requirements | All |
| Workflow | Stages, tasks, task assignment | All |
| Deliverables | Deliverables, approvals, assets | All |
| Dependencies | Blocking/non-blocking, health, due dates | All |

---

## Keyboard Shortcuts

| Shortcut | Action |
|---|---|
| `Cmd/Ctrl + K` | Command palette (search releases, artists, tasks) |
| `Cmd/Ctrl + N` | New release (from any page) |
| `Esc` | Close modal/drawer |
| `←` | Back navigation (when available) |
| `?` | Show keyboard shortcuts help |

---

## State Preservation

| Scenario | Behavior |
|---|---|
| Navigate away from form | Warn if unsaved changes |
| List page filter/sort | Preserve in URL params |
| Expanded stage | Expand state lost on navigation (intentional) |
| Release detail scroll | Reset to top on route change |
| Org selector change | Reset all list states, navigate to dashboard |
