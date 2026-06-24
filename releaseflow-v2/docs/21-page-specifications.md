# Page Specifications

## Format

Each page spec follows this structure:

```
ID:     Unique identifier (P-{N})
Name:   Human-readable name
Route:  URL path
Layout: auth | app | onboarding | modal
Purpose: One-line purpose statement
Access:  Roles with entry
States:  List of visual/functional states
Data:    Data dependencies
Components: Key components on the page
Behaviors: Notable interactions
```

---

## Auth Pages

### P-1 Sign In

| Field | Value |
|---|---|
| Route | `/sign-in` |
| Layout | `(auth)` — centered card, no sidebar |
| Purpose | Authenticate user via email/password or SSO |
| Access | Unauthenticated visitors |
| States | Default (empty fields, button disabled), Filled (valid email, masked password, button enabled), Loading (spinner, "Signing in..."), Error ("Invalid email or password" inline), Rate-limit ("Too many attempts. Try again in 30 seconds.") |
| Data | None |
| Components | TextInput (email, password), PrimaryButton, SecondaryButton (Google, Apple), Link (forgot password, sign up), InfoBanner |
| Behaviors | Real-time validation on blur; SSO redirect to OAuth; rate-limit counter; info tip about work email/SSO |

### P-2 Sign Up

| Field | Value |
|---|---|
| Route | `/sign-up` |
| Layout | `(auth)` — centered card |
| Purpose | Register a new account |
| Access | Unauthenticated visitors |
| States | Default (empty fields), Validating (password strength indicator), Error (inline field errors, "email taken"), Success (redirect to `/onboarding`) |
| Data | None |
| Components | TextInput (name, email, password), Checkbox (terms), PrimaryButton (Create Account), Link (sign in), SecurityBadge |
| Behaviors | Real-time password strength (4 rules: 8+ chars, uppercase, number, special); terms checkbox required; email uniqueness check on blur |

### P-3 Forgot Password

| Field | Value |
|---|---|
| Route | `/forgot-password` |
| Layout | `(auth)` — centered card |
| Purpose | Request a password reset email |
| Access | Unauthenticated visitors |
| States | Default (empty email), Sent ("Check your email for a reset link"), Error ("No account found"), Rate-limit ("Too many requests. Try again in 60 seconds.") |
| Data | None |
| Components | TextInput (email), PrimaryButton (Send Reset Link), Link (back to sign in) |
| Behaviors | Rate-limit enforcement; confirmation screen after send |

### P-4 Invitation Accept

| Field | Value |
|---|---|
| Route | `/invite/[token]` |
| Layout | `(auth)` — branded email-like card |
| Purpose | Accept an organization invitation |
| Access | Token-gated (anyone with valid link) |
| States | Default (org name + role + accept button), Expired (link no longer valid), Already accepted (info message), Signed-in variant (for existing users) |
| Data | Invitation token, org name, role |
| Components | Card, PrimaryButton (Accept Invitation), Link (Sign in to accept), ExpirationNotice (7 days) |
| Behaviors | Magic-link for unregistered users (creates account on claim); expiration check on load; redirect to dashboard on accept |

---

## Onboarding Pages

### P-5 Onboarding — Create Account

| Field | Value |
|---|---|
| Route | `/onboarding` (step 1) |
| Layout | `(onboarding)` — centered card, step indicator |
| Purpose | Create account as first onboarding step |
| Access | Newly registered user (authenticated, no org) |
| States | Same as P-2 Sign Up but embedded in wizard |
| Data | None |
| Components | TextInput, PasswordStrengthIndicator, StepIndicator (5 steps, 0%), PrimaryButton |
| Behaviors | Progress bar at 0%; identical form to sign-up |

### P-6 Onboarding — Verify Email

| Field | Value |
|---|---|
| Route | `/onboarding` (step 1b) |
| Layout | `(onboarding)` — centered card |
| Purpose | Verify email address before proceeding |
| Access | Newly registered user |
| States | Sent ("We sent a verification link to..."), Resent ("Email resent"), Expired ("Link expired"), Verified (auto-advance to step 2) |
| Data | User email |
| Components | StepIndicator (20%), SecondaryButton (Resend), Link (Change email), InfoBanner (check spam) |
| Behaviors | Auto-advance on verification; optional skip (flagged in admin) |

### P-7 Onboarding — Create Organization

| Field | Value |
|---|---|
| Route | `/onboarding` (step 2) |
| Layout | `(onboarding)` — centered card |
| Purpose | Set up organization profile |
| Access | Authenticated user |
| States | Default (empty form), Validating (slug check), Error ("org name taken", "slug taken") |
| Data | None |
| Components | TextInput (org name, slug), Dropdown (org type, country, timezone, team size), PrimaryButton (Create Org), StepIndicator (40%) |
| Behaviors | Auto-slug generation; slug uniqueness check; back navigation to step 1b |

### P-8 Onboarding — Branding (Optional)

| Field | Value |
|---|---|
| Route | `/onboarding` (step 2a) or `/settings` |
| Layout | Card (inline in onboarding or settings page) |
| Purpose | Customize organization branding |
| Access | Owner, Admin |
| States | Default (default brand color), Uploading (logo upload progress), Saved |
| Data | None initially |
| Components | ColorPicker, FileUpload (logo drag-and-drop), Dropdown (default language), PrimaryButton (Save) |
| Behaviors | Entirely optional; skip uses defaults |

### P-9 Onboarding — Invite Team

| Field | Value |
|---|---|
| Route | `/onboarding` (step 3) |
| Layout | `(onboarding)` — centered card |
| Purpose | Send invitations to team members |
| Access | Authenticated user (will become Owner) |
| States | Default (empty email rows), Adding (new row added), Sending (invite progress), Error (bounced email badge) |
| Data | None |
| Components | MultiEmailInput, Dropdown (role per email), Radio (assign now / send later), PrimaryButton (Send Invites), Link (Skip), StepIndicator (50%) |
| Behaviors | Multi-line email list with "+ Add another"; per-email role assignment toggle; skip shows banner on dashboard |

### P-10 Onboarding — Create First Release

| Field | Value |
|---|---|
| Route | `/onboarding` (step 4) |
| Layout | `(onboarding)` — centered card |
| Purpose | Create the organization's first release |
| Access | Authenticated user |
| States | Default (unselected template), Selecting (card highlight), Creating (loading) |
| Data | None |
| Components | SegmentedButtonGroup (template cards), TextInput (title, artist), DatePicker, PrimaryButton (Create Release), StepIndicator (75%) |
| Behaviors | Mid-flow close saves as draft; template selection required |

### P-11 Onboarding — Completion

| Field | Value |
|---|---|
| Route | `/onboarding` (post-submit) |
| Layout | `(onboarding)` — centered card |
| Purpose | Celebrate onboarding completion and navigate to the app |
| Access | Authenticated user |
| States | Success (celebration icon, release info) |
| Data | Release id, org id |
| Components | CelebrationIcon, PrimaryButton (Go to Release), SecondaryButton (Go to Dashboard), FeedbackButtons (Yes/No) |
| Behaviors | Two CTAs: release detail or dashboard; feedback rating |

---

## App Pages

### P-12 Dashboard

| Field | Value |
|---|---|
| Route | `/dashboard` (also `/` redirects here) |
| Layout | `(app)` — sidebar + top nav + content area |
| Purpose | Central hub showing org overview, recent releases, tasks, deadlines |
| Access | All authenticated roles |
| States | Loading (initial data fetch), Empty (no orgs → welcome screen; no releases → empty release list), Populated (stat cards + lists) |
| Data | Organization profile, releases list (paginated, recent), pending tasks (filtered by user), upcoming deadlines, team members, recent activity, pending invitations |
| Components | OrgSwitcher, StatCard (×4), DataTable (releases), TaskListItem (pending tasks), DeadlineIndicator, TeamMemberListItem, ActivityFeedItem, PendingInvitationBanner, FAB, EmptyState (×2 — no org, no releases) |
| Behaviors | Org switcher dropdown at top; empty state branches (no org vs no releases); pending invitations banner at top; recent activity feed collapsible; mobile: sidebar collapses to bottom tab bar (<640px) |

### P-13 Releases List

| Field | Value |
|---|---|
| Route | `/releases` |
| Layout | `(app)` — sidebar + top nav + content area |
| Purpose | Browse and filter all releases |
| Access | Owner/Admin/PM/A&R (full); Artist/Producer/Engineer/Designer (self-scoped); Viewer (read-only) |
| States | Loading, Empty ("No releases yet" + CTA), Populated (data table with rows), Filtered (active filters applied) |
| Data | Releases list (paginated, 25 rows), filter options (status, stage, template) |
| Components | PageHeader ("Releases" + "+ New Release"), DataTable (sortable, filterable, paginated, expandable rows for tracks), SearchInput, Dropdown (filters), FAB, Checkbox (multi-select), EmptyState |
| Behaviors | Sortable columns; filterable by status/stage/template; multi-select for batch ops; row click → release detail; filter sidebar section in sidebar |

### P-14 Release Detail — Overview

| Field | Value |
|---|---|
| Route | `/releases/[id]/overview` |
| Layout | `(app)` — sidebar switched to release-level nav + release header + tab bar + content |
| Purpose | At-a-glance release status, progress, tasks, deadlines |
| Access | Owner/Admin/PM/A&R (full), Artist/Producer/Engineer/Designer (self-scoped read), Marketing/PR (full), Viewer (read-only) |
| States | Loading (skeleton cards), Populated (stat cards + pipeline + lists), Error (release not found/access denied) |
| Data | Release aggregate (state, metadata, progress), tracks count + completion, contributors count + roles, workflow stages + completion, pending tasks, upcoming deadlines, team members |
| Components | StatusBadge (header, always visible), StatCard (×4: Progress, Tracks, Contributors, Pending Tasks), StagePipeline (compact timeline), TaskListItem (pending, grouped), DeadlineIndicator (color-coded), TeamMemberListItem, QuickActions (AddTask, Upload, Invite), Breadcrumb |
| Behaviors | Progress bar is weighted composite (tracks 40% + contributors 30% + workflow 30%); stage pipeline animates active stage with glow pulse; quick actions open modals; mobile: stat cards stack, pipeline shows dots |

### P-15 Release Detail — Tracks

| Field | Value |
|---|---|
| Route | `/releases/[id]/tracks` |
| Layout | Release tab — content area |
| Purpose | Manage track list and metadata |
| Access | Owner/Admin/PM/A&R (full), Artist (self-scoped), Marketing/PR/Viewer (read-only), Producer/Engineer/Designer (no access) |
| States | Loading, Empty ("No tracks yet" + "Add track"), Populated (table with rows), Editing (inline row with open form) |
| Data | Tracks list, track metadata, validation rules |
| Components | DataTable (track listing: #, Title, Duration, ISRC, Status), TextInput (track fields), DurationInput (mm:ss), Dropdown (language), Toggle (explicit flag), ISRCDisplay (monospace), PrimaryButton (Add Track), Pagination (track switcher) |
| Behaviors | CRUD on tracks; inline row editing with autosave; ISRC auto-generation; duration regex validation; writers/producers as string arrays with autocomplete |

### P-16 Release Detail — Workflow

| Field | Value |
|---|---|
| Route | `/releases/[id]/workflow` |
| Layout | Release tab — content area |
| Purpose | View and manage workflow stage progress |
| Access | Owner/Admin/PM/A&R (full), all others (read-only) |
| States | Loading, Populated (stage list with progress bars), Empty (no stages — should not occur post-creation) |
| Data | Workflow stages (7 for Single/EP/Album, 6 for Remix), tasks per stage, stage states |
| Components | StagePipeline (vertical: name + progress bar + task count), ProgressBar (per stage, 6px height), TaskListItem (grouped by stage), AdminView (drag-to-reorder, stage settings) |
| Behaviors | Stage advancement is server-validated; V1: no approvals required, stages advance on manual task completion; admin view allows drag-to-reorder and stage configuration |

### P-17 Release Detail — Contributors

| Field | Value |
|---|---|
| Route | `/releases/[id]/contributors` |
| Layout | Release tab — content area |
| Purpose | Assign roles and manage contributor metadata |
| Access | Owner/Admin/PM/A&R (full), Artist (self-scoped), Viewer (read-only), others (no access) |
| States | Loading, Empty (no contributors, "Add contributor"), Populated (assignment table) |
| Data | Contributors list, org user list (for autocomplete), contributor taxonomy (12 roles), IPI database |
| Components | DataTable (Role, Name, Scope, IPI, Split, Status), Dropdown (role selector, scope selector), TextInput (IPI, split %), Typeahead (person search), PrimaryButton (Add Contributor), InfoBanner |
| Behaviors | Role taxonomy enforced (12 industry roles); at least one Artist per release; IPI required for Writer/Composer (warning); writer splits must sum to 100% (>100% warning, >110% error); unique (role + person + scope) enforced; scope can be release-level or track-level |

### P-18 Release Detail — Settings

| Field | Value |
|---|---|
| Route | `/releases/[id]/settings` |
| Layout | Release tab — content area |
| Purpose | Release-level configuration and lifecycle actions |
| Access | Owner/Admin/PM/A&R/Artist (self-scoped) |
| States | Default (metadata displayed), Editing (form active), Confirm (destructive action confirmation) |
| Data | Release metadata, template definition |
| Components | TextInput (metadata overrides), Dropdown (template change), DestructiveButton (Archive), DestructiveButton (Cancel), ConfirmationDialog |
| Behaviors | Template change with caution notice; archive/cancel are destructive and require confirmation dialog ("Explain what happened and what happens next"); cancellation transitions to CANCELLED status |

### P-19 Assets

| Field | Value |
|---|---|
| Route | `/assets` (list), `/assets/[id]` (detail) |
| Layout | `(app)` — sidebar + content area |
| Purpose | Global asset catalog across all releases |
| Access | Owner/Admin/PM/A&R/Artist/Designer/Marketing/PR/Publisher/Distributor (full), Producer/Engineer (self-scoped), Viewer (read-only) |
| States | Loading, Empty, Populated (grid or list), Filtering |
| Data | Assets across all releases (stems, mixes, masters, artwork) |
| Components | AssetThumbnail (120x120 or 80x80), Dropdown (filter by type), SearchInput, IconButton (download, version history, delete) |
| Behaviors | Grid or list view toggle; filter by asset type; global search; version history per asset; file type icon overlay |

### P-20 Tasks Board

| Field | Value |
|---|---|
| Route | `/tasks` |
| Layout | `(app)` — sidebar + content area |
| Purpose | Cross-release task management |
| Access | Owner/Admin/PM/A&R/Marketing/PR (full), Artist/Producer/Engineer/Designer (self-scoped), Viewer (read-only) |
| States | Loading, Empty, Populated, Filtered |
| Data | Tasks across all releases |
| Components | DataTable (compact), TaskListItem, Dropdown (filters: Assigned to Me, All Tasks, Overdue, By Stage), SearchInput |
| Behaviors | Cross-release view; filter by stage, assignment, overdue; overdue items highlighted red |

### P-21 Calendar

| Field | Value |
|---|---|
| Route | `/calendar` |
| Layout | `(app)` — sidebar + content area |
| Purpose | Timeline and date-based views of releases, tasks, and stages |
| Access | All roles |
| States | Loading, Populated, Empty |
| Data | Release street dates, task due dates, stage milestones |
| Components | CalendarGrid, TimelineView, GanttChart (stage durations), Dropdown (overlay selector), FilterControls |
| Behaviors | Multiple calendar overlays (Release, Task, Stage); Gantt-like timeline for stages |

### P-22 Marketing Hub

| Field | Value |
|---|---|
| Route | `/marketing` (hub), `/marketing/[id]` (detail) |
| Layout | `(app)` — sidebar + content area |
| Purpose | Campaign management and marketing collateral |
| Access | Owner/Admin (full), PM (self-scoped), Marketing/PR (full), Viewer (read-only), others (no access) |
| States | Loading, Empty, Populated |
| Data | Campaigns, campaign assets, budgets, timelines |
| Components | DataTable (campaign list), CampaignDetail (assets, timeline, budget), StatusBadge, PrimaryButton (New Campaign), EmptyState |
| Behaviors | Campaign CRUD; launch requires approval; archive old campaigns |

### P-23 Distribution Hub

| Field | Value |
|---|---|
| Route | `/distribution` |
| Layout | `(app)` — sidebar + content area |
| Purpose | Monitor and manage DSP distribution |
| Access | Owner/Admin/PM/Publisher/Distributor (full), Viewer (read-only), others (no access) |
| States | Loading, Empty, Populated |
| Data | Distribution status per store (Spotify, Apple Music, etc.) |
| Components | StatusBadge (per DSP: Submitted, Approved, Live, Rejected), DataTable, PrimaryButton (Submit), DestructiveButton (Takedown) |
| Behaviors | Submit releases to stores; monitor live status; takedown capability; store health dashboard |

### P-24 Reports / Analytics

| Field | Value |
|---|---|
| Route | `/reports` |
| Layout | `(app)` — sidebar + content area |
| Purpose | Data analytics and reporting |
| Access | Owner/Admin/PM/A&R/Marketing/PR/Publisher/Distributor (full), Artist/Producer/Engineer/Designer (read-only), Viewer (read-only) |
| States | Loading, Populated, Empty |
| Data | Release analytics, team productivity, asset usage |
| Components | Chart, DataTable, ExportButton, Dropdown (report type), DateRangePicker |
| Behaviors | Data exports (CSV/PDF); scheduled report generation; filter by date range |

### P-25 Settings — Organization

| Field | Value |
|---|---|
| Route | `/settings` |
| Layout | `(app)` — sidebar + settings sub-nav |
| Purpose | Organization-level configuration |
| Access | Owner/Admin (full), PM (self-scoped), all others (read-only) |
| States | Loading, Editing, Saved |
| Data | Organization profile, branding, team, workflows, billing |
| Components | SettingsNav (sub-navigation: Org, Team, Workflows, Templates, Integrations, Billing, Account), TextInput, Dropdown, ColorPicker, FileUpload, DataTable (team members), PrimaryButton (Save) |
| Behaviors | Nested settings pages; branding (color, logo, language); team management (invite, remove, role); workflow configuration; billing management |

### P-26 Settings — Account

| Field | Value |
|---|---|
| Route | `/settings/account` |
| Layout | Settings sub-page |
| Purpose | Personal profile and preferences |
| Access | Self (all authenticated users) |
| States | Default, Editing, Saved |
| Data | User profile, notification preferences |
| Components | TextInput (name, email, password), NotificationPreferences (per-role), PrimaryButton (Save) |
| Behaviors | Per-role notification preferences (Engineer gets task assigns, A&R gets approval requests); password change |

---

## Release Creation Modal

### P-27 Release Creation Wizard

| Field | Value |
|---|---|
| Route | No dedicated route — rendered as modal overlay on any page |
| Layout | Modal dialog with 3-step wizard + step indicator |
| Purpose | Create a new release in <60 seconds |
| Access | Owner/Admin/PM/A&R (full), Artist (self-scoped) |
| States | Step 1 (Basic Info): Default (empty), Filled (title+type+date), Error (validation); Step 2 (Workflow Template): Preview (stage pipeline visualization); Step 3 (Review & Create): Summary (title, type, date, workflow info), Loading (spinner during creation ~1.5s) |
| Data | Release types, workflow templates |
| Components | StepIndicator (3 steps: 33%, 66%, 100%), TextInput (release name), SegmentedButtonGroup (release type cards), DatePicker, Card (summary), PrimaryButton (Continue, Create), SecondaryButton (Back, Cancel), InfoBanner, Spinner |
| Behaviors | Step validation before advance; discard on close (low risk, short form); network failure → retry with preserved form; duplicate title → warning (non-blocking); success → redirect to `/releases/[id]/overview` + toast; target <60s E2E |

---

## Special Pages

### P-28 Notification Center (Slide-out Panel)

| Field | Value |
|---|---|
| Route | No route — triggered by bell icon in top nav |
| Layout | Right slide-out panel (400px) overlaying content |
| Purpose | View and manage notifications |
| Access | All authenticated users |
| States | Open (panel slides in), Empty ("No notifications"), Populated (notification list) |
| Data | User notifications (stage approvals, task assignments, mentions, deadlines, distribution status) |
| Components | SlideOutPanel (400px), NotificationItem (icon + action + entity + time), PrimaryButton (Mark all as read), Divider |
| Behaviors | 300ms slide-in animation; notification types color-coded; "Mark all as read" footer; click notification → navigate to relevant entity |
