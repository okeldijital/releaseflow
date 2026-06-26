# Administrator Guide — ReleaseFlow RC1

## Overview

ReleaseFlow is a music release management platform. This guide covers administration tasks for Org Owners and Admins.

---

## Organizations

### Creating an Organization

Organizations are created during onboarding. The first user becomes the Org Owner.

### Organization Settings

Navigate to `/settings` to manage:
- **Organization name and slug** — Public identifier used in URLs
- **Organization type** — Record Label, Independent Artist, Management, Publisher, Agency
- **Timezone and country** — Used for date displays and defaults
- **Branding** — Logo upload via Cloudinary, brand color selection
- **Default language** — UI language preference

### Deleting an Organization

Organization deletion is irreversible. All releases, tasks, and data are permanently removed. This action requires Owner role.

---

## Users and Roles

### Role Hierarchy

| Role | Permissions |
|---|---|
| **Owner** | Full access. Manage billing, team, integrations, delete org. |
| **Admin** | Manage team, create/edit releases, campaigns, templates. Cannot delete org or manage billing. |
| **Project Manager** | Create/edit releases, manage campaigns, assign tasks. Cannot manage team or billing. |
| **A&R** | Create releases, view campaigns, contribute to releases. |
| **Artist** | View releases they are associated with, view campaigns, receive tasks. |
| **Producer** | View releases, complete assigned tasks, upload assets. |
| **Mix/Mastering Engineer** | View assigned tasks, upload finalized audio. |
| **Designer** | View assigned tasks, upload artwork deliverables. |
| **Viewer** | Read-only access to releases and campaigns. |

### Inviting Users

1. Navigate to `/settings/team`
2. Click "Invite Member"
3. Enter email address
4. Select role
5. Send invitation (7-day expiry)

Invited users receive a magic link. If they don't have an account, one is created on claim.

### Managing Users

- **Change role** — From `/settings/team`, select user and update role
- **Remove user** — Removes user from organization. Does not delete their account.
- **Re-invite** — If invitation expires, re-send from team settings.

---

## Artists

### Adding Artists

Navigating to `/artists/new`:
1. Enter artist name (auto-generates slug)
2. Select artist type: Original Artist, Remix Artist, Cover Artist, Producer, DJ, Band, Label
3. Optional: Bio, Country, Genres, Image URL, Social Links
4. Save

### Linking Artists to Releases

From a release detail page, navigate to the Contributors tab:
1. Search for existing artist or create new
2. Select role: Primary, Featured, Remixer, Original Artist, Cover Performer, Guest Artist
3. Set primary flag if this is the main artist
4. Save

### Artist Readiness

The platform computes artist readiness based on profile completeness: Name, Bio, Image, Country, Genres, Social Links.

---

## Releases

### Creating a Release

From `/releases/new`:
1. **Step 1** — Title (required), Type (Single/EP/Album/Remix), Optional release date
2. **Step 2** — Review auto-generated workflow stages (7 stages for Single/EP/Album, 6 for Remix)
3. **Step 3** — Confirm and create

### Release Lifecycle States

| State | Description |
|---|---|
| Draft | Initial creation, not yet in production |
| Planning | Tasks and timeline being defined |
| In Production | Active work underway |
| On Hold | Paused, no active work |
| Ready for Distribution | All gates passed |
| Released | Distributed to stores/platforms |
| Cancelled | Terminated before release |
| Archived | Released and no longer active |

### Release Dashboard

Each release has a detail page with tabs:
- **Overview** — Progress, stage pipeline, pending tasks, deadlines
- **Tracks** — Track listing with ISRC, duration, status
- **Assets** — Uploaded files (Cloudinary)
- **Workflow** — Stage pipeline with task lists per stage
- **Tasks** — Cross-stage task board
- **Campaign** — Marketing campaign management
- **Distribution** — Distribution package generation
- **Contributors** — Artist and personnel credits
- **Activity** — Full event log
- **Settings** — Metadata overrides, archive, cancel

### Release Archive/Cancel

- **Archive** — Release published, no longer active. Data preserved. ID (Reversible by Owner).
- **Cancel** — Release terminated before publishing. Data preserved. (Irreversible).

---

## Campaigns

### Creating a Campaign

From `/campaigns/new`:
1. Select release
2. Choose campaign type: Pre-Save, Social, Press, Playlist Pitch, Advertising
3. Name and assign owner
4. Save

### Campaign Lifecycle

Draft → Active → Paused → Completed

### Campaign Tasks

Each campaign supports tasks: Schedule Post, Send Press Release, Submit Playlist Pitch, Launch Ad.

---

## Diagnostics

### Accessing Diagnostics

Navigate to `/diagnostics`. The diagnostics dashboard shows:

- **Permission Audit** — Coverage percentage and gaps
- **Activity Audit** — Event type coverage
- **Data Integrity** — Required collection checks
- **Performance** — Query optimization status
- **Alerts** — Active operational alerts

### Alert Resolution

1. Review alerts on the diagnostics page
2. Address the underlying issue (e.g., fill missing metadata)
3. Resolve alert to clear it from active list

---

## Budgets

### Setting Release Budgets

From the Budgets page (`/budgets`):
1. View budget summary per release
2. Initialize budget with planned amount
3. Add cost items by category: Production, Mixing, Mastering, Artwork, Video, Marketing, PR, Advertising, Distribution
4. Track actual vs. planned costs

### Budget Health States

- **On Budget** — Actual < 80% of planned
- **At Risk** — Actual > 80% of planned
- **Over Budget** — Actual > planned

---

## Troubleshooting

| Issue | Resolution |
|---|---|
| User cannot sign in | Verify Firebase Auth is configured. Check user exists in Auth console. |
| Release not visible | Confirm user is in the same org and has at least Viewer role. |
| Upload fails | Verify Cloudinary env vars are set. Check upload preset configuration. |
| Alerts not generating | Run diagnostics dashboard. Confirm rule engine has release data. |
| Budget not updating | Add cost items with "incurred" or "paid" status to trigger recalculation. |
