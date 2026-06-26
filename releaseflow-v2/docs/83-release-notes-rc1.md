# Release Notes — ReleaseFlow RC1 (v0.9.3)

## Overview

ReleaseFlow RC1 is the first release candidate of the music release management platform. It provides end-to-end release lifecycle management with workflow automation, contributor management, campaign tools, and operational diagnostics.

---

## What's Included

### Release Management
- Create releases: Single, EP, Album, Remix
- Auto-generated workflow stages (7 stages per release type)
- Track management with ISRC codes and duration
- Release lifecycle states: Draft → Planning → In Production → On Hold → Ready → Released → Cancelled → Archived
- Metadata management (UPC, catalog number, label, copyright, genre, language)

### Workflow Engine
- Configurable stage pipeline per release type
- Task creation, assignment, completion per stage
- Task priorities: Low, Medium, High, Critical
- Task comments with @mention support
- Workflow progress tracking (percentage)
- Workflow health monitoring (green/amber/red)

### Contributors
- Artist profiles with 7 artist types
- Release-artist linking with roles (Primary, Featured, Remixer, etc.)
- Track credits with 8 credit roles
- Artist readiness scoring

### Deliverables & Approvals
- Deliverable tracking: Audio, Artwork, Document, Metadata, Video, Other
- Approval workflow: Draft → In Review → Approved / Rejected
- Deliverables scoped to campaigns, stages, or tasks

### Campaigns
- Campaign types: Pre-Save, Social, Press, Playlist Pitch, Advertising
- Campaign lifecycle: Draft → Active → Paused → Completed
- Campaign task management
- Campaign readiness assessment

### Distribution
- Distribution read1iness engine (metadata, deliverables, requirements, dependencies)
- Distribution package generation
- Required metadata validation (UPC, catalog, label, copyright, etc.)

### Budget Management
- Release budget initialization
- Cost item tracking across 9 categories
- Budget health monitoring (On Budget / At Risk / Over Budget)
- Automatic budget recalculation on cost changes

### Dependencies
- External dependency tracking: Legal, Licensing, Distribution, Approval, Vendor, Marketing
- Blocking dependency detection
- Dependency status flow

### Alerts & Notifications
- Operational alert generation via rule engine
- Alert deduplication (same rule + entity + release)
- User notifications: Assignments, Mentions, Approvals
- Read/unread/archive states
- Notification scoped to users

### Permissions & Access Control
- 10 roles: Owner, Admin, Project Manager, A&R, Artist, Producer, Mix Engineer, Mastering Engineer, Designer, Viewer
- Organization-scoped data access
- Route-level permission checks
- Permission audit dashboard

### Tenant Isolation
- Organization-based data partitioning
- Cross-org access prevention
- User membership verification

### Diagnostics
- Permission audit dashboard
- Activity audit coverage
- Data integrity checks
- Performance review
- Active alert overview

---

## Known Limitations

| Limitation | Impact | Mitigation |
|---|---|---|
| No offline support | Requires internet connection for all operations | None |
| Single organization at a time | Cannot operate across multiple orgs simultaneously | Org switcher planned |
| No batch operations | Multi-select on release list is UI-only | Manual per-item operations |
| Firebase-only backend | Tightly coupled to Firebase | Abstracted via repository layer in future sprints |
| No email delivery for notifications | Notifications are in-app only | Email delivery planned |
| No calendar integration | Release dates don't sync to external calendars | Manual entry |
| No third-party DSP integration | Distribution packages are local only | Integration layer planned |

---

## Supported Browsers

| Browser | Minimum Version |
|---|---|
| Chrome | 120+ |
| Firefox | 120+ |
| Safari | 17+ |
| Edge | 120+ |

---

## Supported Devices

| Device | Status |
|---|---|
| Desktop (≥1024px) | Full support |
| Tablet (768-1023px) | Full support |
| Mobile (375-767px) | Supported with responsive layout |
| Mobile (<375px) | Degraded experience |

---

## Installation

See [Deployment Guide](./80-deployment-guide.md) for detailed setup instructions.

Quick start for local development:

```bash
git clone https://github.com/okeldijital/releaseflow.git
cd releaseflow/releaseflow-v2
pnpm install
pnpm dev
```

---

## Changelog

### v0.9.3-rc3
- fix: complete tenant isolation validation

### v0.9.2-rc2
- chore: beta stabilization sprint 017 complete

### v0.9.1-rc1
- feat: complete releaseflow beta feature set

---

## Feedback

Report issues via the project's GitHub Issues or through the beta test bug reporting template.
