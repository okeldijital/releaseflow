# Interaction Specifications

## Format

Each interaction spec follows this structure:

```
ID:      Unique identifier (I-{N})
Name:    Flow name
Trigger: What initiates the flow
Flow:    Step-by-step sequence
Variants: Alternative paths / edge cases
States:  UI states throughout the flow
Validation: Rules enforced
Feedback: What the user sees
```

---

## Authentication Flows

### I-1 Sign In (Email + Password)

| Field | Value |
|---|---|
| Trigger | User navigates to `/sign-in` |
| Flow | 1. Page renders with empty email (placeholder `jane@label.com`) + password fields + disabled button. 2. User types email; validation on blur. 3. User types password (masked). 4. Button enables when both fields valid. 5. User clicks "Sign In" → button shows spinner + "Signing in...". 6. Server validates → 200: redirect to `/dashboard`. 401: inline error "Invalid email or password". 429: rate-limit message with counter. |
| Variants | SSO — click "Continue with Google/Apple" → OAuth redirect → callback → dashboard. Forgot password → navigate to `/forgot-password`. Sign up → navigate to `/sign-up`. |
| Validation | Email format regex; password non-empty |
| Feedback | Loading spinner on button; inline error messages below fields; rate-limit counter; SSO redirect loading |

### I-2 Registration

| Field | Value |
|---|---|
| Trigger | User navigates to `/sign-up` |
| Flow | 1. Empty form with full name, work email, password fields; terms checkbox unchecked; button disabled. 2. User types password → real-time strength indicator with 4 checklist items. 3. All fields valid + terms checked → button enables. 4. User clicks "Create Account" → loading. 5. Success: redirect to `/onboarding`. Error: inline field errors. Email taken: "An account with this email already exists. Sign in". |
| Variants | Already have account → link to sign-in |
| Validation | Email format; password ≥8 chars + uppercase + number + special; name non-empty; terms required |
| Feedback | Password strength checkboxes fill live; inline field errors; encryption badge |

### I-3 Forgot Password

| Field | Value |
|---|---|
| Trigger | User clicks "Forgot password?" on sign-in |
| Flow | 1. Empty email field + "Send Reset Link" button. 2. User enters email + clicks button. 3. Email found → "Check your email for a reset link." Email not found → "No account found with this email address." Rate-limited → "Too many requests. Try again in 60 seconds." |
| Variants | Remember password → link back to sign-in |
| Validation | Email format; rate-limit check |
| Feedback | Success message with back-to-login link; inline error for not-found; rate-limit counter |

### I-4 Invitation Accept

| Field | Value |
|---|---|
| Trigger | User visits `/invite/[token]` from email link |
| Flow | 1. Token validated → org name + role displayed + "Accept Invitation" button. 2. User clicks Accept → if logged in: redirect to dashboard with confirmation; if not: magic-link creates account on claim. 3. Token expired → "Link expired. Contact your admin for a new invitation." |
| Variants | Already accepted → info message. Already has account → "Sign in to accept" link. |
| Validation | Token validity; expiration (7 days); org membership |
| Feedback | Acceptance confirmation; expiration notice; sign-in redirect |

---

## Onboarding Flows

### I-5 Email Verification

| Field | Value |
|---|---|
| Trigger | Account created in onboarding step 1 |
| Flow | 1. "We sent a verification link to [email]" with mail icon. 2. User checks email + clicks link. 3. System verifies → auto-advance to step 2. OR user clicks "Resend email" → "Email resent. Check your inbox." OR user clicks "Change email" → return to step 1. 4. Link expired → "Link expired. Request a new one." 5. User may skip verification (flagged in admin). |
| Variants | Skip allowed (non-blocking, admin-flagged) |
| Validation | Token validity; email format on change |
| Feedback | Verification link status; resend confirmation; spam folder tip |

### I-6 Organization Creation

| Field | Value |
|---|---|
| Trigger | Onboarding step 2 |
| Flow | 1. User enters org name → slug auto-generates from name. 2. User selects org type (Record Label, Independent Artist, Management Company, Publisher, Agency). 3. User selects country, timezone, team size. 4. User clicks "Create Org". 5. Slug uniqueness check → taken: inline suggestion ("acme-records is taken. Try..."). 6. Org provisioned → advance to step 3. |
| Variants | Back to step 1b; branding optional (step 2a); existing user creating additional org (skip account step) |
| Validation | Org name + slug uniqueness; all required fields present |
| Feedback | Slug inline validation with suggestions; form preserved on error |

### I-7 Team Invitation

| Field | Value |
|---|---|
| Trigger | Onboarding step 3 |
| Flow | 1. Empty email row with role dropdown. 2. User enters email + optionally assigns role. 3. User clicks "+ Add another" → new row appears. 4. User selects "Yes, assign now" (radio) → per-email role dropdowns shown. OR "Send later" → role dropdowns hidden. 5. User clicks "Send Invites" → emails sent. OR user clicks "Skip — I'll do this later" → banner shown on dashboard. |
| Variants | Invite bounces → warning badge + resend. Skip to dashboard → persistent banner. |
| Validation | Email format per row; unique email addresses |
| Feedback | Invite sent confirmation; bounce warning badge; skip redirects to dashboard with banner |

### I-8 First Release Creation (Onboarding)

| Field | Value |
|---|---|
| Trigger | Onboarding step 4 |
| Flow | 1. Template card selector (Single/EP/Album with icons + track counts). 2. User enters release title + artist name. 3. User selects target release date (date picker with "No fixed date" checkbox). 4. User clicks "Create Release". 5. System creates release in DRAFT state. 6. Redirect to completion screen (not release detail). |
| Variants | Back to step 3; close mid-flow → saved as draft, resume from dashboard |
| Validation | Template required; title required; date valid (optional) |
| Feedback | Progress indicator (75% → 100%); celebration on completion; two CTAs (Go to Release, Go to Dashboard) |

---

## Release Management Flows

### I-9 Release Creation (3-Step Wizard)

| Field | Value |
|---|---|
| Trigger | User clicks "+ New Release" (sidebar, FAB, empty state CTA) |
| Flow | **Step 1 (33%):** Modal opens. User enters release name (required), selects type (Single/EP/Album/Remix card selector, required), picks date (optional, "No fixed date" checkbox). Clicks "Continue". **Step 2 (66%):** Stage pipeline preview shown based on selected type. Read-only visualization. Clicks "Continue". **Step 3 (100%):** Summary card (title, type, date, workflow info). Info note about auto-track creation. Clicks "🚀 Create". → ~1.5s loading → redirect to `/releases/{id}/overview` + toast "Midnight Sessions created". |
| Variants | Cancel → close modal (discard). Network failure → retry button, form preserved. Duplicate title → warning (non-blocking). Empty title → inline error. No type → inline error. |
| Validation | Title required; type required; date valid (if entered) |
| Feedback | Step indicator (33% → 66% → 100%); inline field errors; toast on success; loading spinner during creation |

### I-10 Release Status Transition

| Field | Value |
|---|---|
| Trigger | User clicks status action button (e.g., "Begin Planning", "Start Production", "Mark Ready", "Publish") |
| Flow | 1. Button visibility determined by allowed transitions from current state. 2. User clicks action. 3. Server validates transition rules (entry criteria). 4. Valid → status changes, activity logged, UI updates (status badge, stage pipeline). 5. Invalid → error message. |
| Allowed transitions | DRAFT → PLANNING, CANCELLED. PLANNING → PRODUCTION, DRAFT, CANCELLED. PRODUCTION → ON HOLD, READY, PLANNING, CANCELLED. ON HOLD → PRODUCTION, CANCELLED. READY → RELEASED, PRODUCTION, CANCELLED. RELEASED → ARCHIVED, READY. ARCHIVED (terminal). CANCELLED (terminal). |
| Special rules | ON HOLD requires reason (min 10 chars). RELEASED → READY requires Owner/Admin. Auto-archive: daily check RELEASED + 30 days + 0 pending tasks. |
| Feedback | Status badge updates immediately; activity log entry created; notification sent to relevant roles |

### I-11 ON HOLD / Resume

| Field | Value |
|---|---|
| Trigger | PM, Admin, or Owner clicks "Hold" in PRODUCTION or other eligible state |
| Flow | 1. Modal opens: "Hold release" with reason field (min 10 chars). 2. User enters reason + clicks "Hold". 3. Status → ON HOLD. 4. All stage progress frozen. Tasks locked. 5. To resume: user clicks "Resume" → status returns to PRODUCTION. |
| Variants | Hold escalated → cancellation |
| Validation | Reason ≥10 characters; only valid from eligible states |
| Feedback | Status badge updates to ON HOLD; modal closes; reason stored in activity log |

### I-12 Release Creation Flow (3-Step)

| Field | Value |
|---|---|
| Trigger | FAB or "+ New Release" button |
| Flow | **Step 1:** Enter title + select type + optionally set date. **Step 2:** Preview workflow stages. **Step 3:** Review summary + create. On success: redirect + toast. |
| Variants | Discard on close (short form, low risk); network retry; duplicate title warning |
| Feedback | Step indicator; inline field errors; loading spinner; success toast |

---

## Workspace Interactions

### I-13 Tab Switching

| Field | Value |
|---|---|
| Trigger | User clicks a tab in the release workspace tab bar |
| Flow | 1. Active tab loses highlight. 2. Target tab gains bottom border + Primary color. 3. Content area replaces with target tab's panel. 4. Scroll state maintained per tab. |
| Variants | Tabs hidden based on role permissions — no loading of restricted content. Mobile: horizontal scroll with "More..." overflow. |
| Feedback | Visual state change on tab (text + icon color); content area transition (200ms fade) |

### I-14 Stage Advancement

| Field | Value |
|---|---|
| Trigger | All tasks in current stage marked DONE (V1: manual advancement without approvals) |
| Flow | 1. Last task in stage transitions to DONE. 2. System checks: all tasks DONE + required approvals (V1: 0 required). 3. Stage transitions to COMPLETED. 4. Next stage transitions from PENDING to IN_PROGRESS. 5. Stage pipeline UI updates: completed stage gets ✓, next stage gets ◌ with glow pulse. |
| Variants | Stage skipped (if configurable, requires `stage:skip` permission). Stage put on hold. |
| Validation | All tasks must be DONE; required approval count met (V1: none) |
| Feedback | Stage pipeline animation (glow pulse); progress bar update; notification to stage assignees |

### I-15 Task Creation & Assignment

| Field | Value |
|---|---|
| Trigger | User with `task:create` permission clicks "Add Task" |
| Flow | 1. Modal/form opens: title (required), description, assignee (typeahead from org users), due date, stage association. 2. User fills + saves. 3. Task created in TODO state. 4. `TaskAssigned` event published → notification sent to assignee. 5. Task appears in assignee's "My Tasks" view and in stage's task list. |
| Variants | Task created without assignee (unassigned). Task created without due date. |
| Validation | Title required; assignee must be org member with appropriate role; due date must be future |
| Feedback | Toast on creation; notification bell badge for assignee; task appears in list |

### I-16 Task Completion

| Field | Value |
|---|---|
| Trigger | Assignee clicks checkbox on task |
| Flow | 1. Task state transitions to DONE. 2. System checks stage-level completion: are all tasks in this stage DONE? 3. Yes → stage advancement evaluation. 4. No → wait for remaining tasks. |
| Variants | Task submitted for review (IN_PROGRESS → REVIEW) → reviewer approves (REVIEW → DONE). Task blocked (→ BLOCKED) → resolved (→ IN_PROGRESS). |
| Validation | Task must be in progress state; reviewer must have `task:approve` permission |
| Feedback | Checkbox fills; task moves to completed section; stage progress updates; notification sent if stage completes |

### I-17 Adding a Track

| Field | Value |
|---|---|
| Trigger | User clicks "+ Add track" in Tracks tab |
| Flow | 1. New row added to track listing table. 2. User enters title (required), duration (required, mm:ss), optionally: version, writers, producers, ISRC (auto-generated if empty), language (default "en"), explicit flag (default Not Explicit). 3. Autosave on blur. |
| Variants | Multiple tracks added; track edited inline after creation; track deleted |
| Validation | Title 1-200 chars, trimmed; duration matches `/^\d{1,3}:\d{2}$/`; ISRC 12 alphanumeric, uppercase format; track numbers unique within release |
| Feedback | Row appears in table; field-level validation; autosave indicator |

### I-18 Adding a Contributor

| Field | Value |
|---|---|
| Trigger | User clicks "+ Add contributor" in Contributors tab |
| Flow | 1. New assignment row appears. 2. User selects role from 12-role taxonomy dropdown. 3. User enters name (typeahead from org users or free-text). 4. User selects scope (Release-level or Track-level). 5. User optionally enters IPI (required for Writer/Composer, warning) + split %. 6. Save. |
| Variants | Contributor removed; split edited; scope changed |
| Validation | At least one Artist per release; unique (role + person + scope); writer splits sum to 100% (>100% warning, >110% error); IPI required for Writer/Composer (warning) |
| Feedback | Row appears in table; validation warnings inline; role badge shown |

---

## Navigation & Global Interactions

### I-19 Sidebar Mode Switch (Org → Release)

| Field | Value |
|---|---|
| Trigger | User navigates from release list to a specific release detail page |
| Flow | 1. Sidebar switches from org-level nav (Dashboard, Releases, Assets, Tasks, Calendar, Marketing, Distribution, Reports, Settings) to release-level nav. 2. Top bar shows "◀ Back to Releases". 3. Release header shown (title, type, artist, status badge). 4. Tab bar displayed below header. |
| Reverse | User clicks "◀ Back to Releases" or navigates to org-level page → sidebar returns to org-level nav |
| Feedback | Sidebar content replaces; breadcrumb updates; active section highlights |

### I-20 Org Switcher

| Field | Value |
|---|---|
| Trigger | User clicks org name in sidebar or dashboard header |
| Flow | 1. Dropdown opens with list of orgs user belongs to, active org marked with ●. 2. Divider + "✚ Create new organization". 3. User selects different org → dashboard content reloads for selected org. 4. User selects "Create new organization" → navigates to onboarding. |
| Feedback | Dropdown open/close animation; content refresh on switch |

### I-21 Notification Center

| Field | Value |
|---|---|
| Trigger | User clicks bell icon 🔔 in top nav |
| Flow | 1. Slide-out panel (400px) animates in from right at 300ms. 2. Notification list rendered, grouped by type/urgency. 3. Each item: icon + bold user + action + entity name + relative time. 4. Click notification → navigate to relevant entity + panel closes. 5. Click "Mark all as read" → all notifications marked read. 6. Click outside or close → panel slides out. |
| Variants | Empty state → "No notifications" |
| Feedback | Slide animation; unread badge on bell updates; notification read state updates |

### I-22 Search

| Field | Value |
|---|---|
| Trigger | User focuses search input in top nav |
| Flow | 1. Placeholder "Search releases, tasks, assets..." shown. 2. User types query. 3. Results dropdown appears below search (defaults to release titles, then tasks, then assets). 4. User clicks result → navigates to entity. 5. User presses Enter → navigates to search results page. |
| Feedback | Real-time result filtering; result count shown; keyboard navigation within results |

### I-23 FAB Quick Actions

| Field | Value |
|---|---|
| Trigger | User clicks FAB "+" button in bottom-right |
| Flow | 1. FAB expands to show speed-dial menu: New Release, New Task, Upload Asset, Invite Member. 2. User clicks action → relevant modal opens or navigation occurs. 3. FAB collapses. |
| Variants | Role-dependent items hidden (e.g., no "New Release" for users without permission) |
| Feedback | Menu expands/collapses with 200ms ease; contextual actions based on current page |

---

## Validation & Error Behaviors

### I-24 Form Field Validation

| Field | Value |
|---|---|
| Behavior | Validated on blur (focus loss) for individual fields; full form validated on submit |
| Visual | Error state: border `#DC2626`, ring 2px `#FEE2E2`, error message below field (12px, `#DC2626`). Success/filled: default border, primary text |
| Field-specific rules | Email: format regex. Password: 4-strength rules. Duration: `/^\d{1,3}:\d{2}$/`. ISRC: 12 alphanumeric, uppercase. Slug: alphanumeric + hyphens, unique. IPI: numeric, 11 digits. Split: sum to 100%. |
| Feedback | Inline error messages; password strength indicator; slug availability indicator; autosave on blur |

### I-25 Loading States

| Field | Value |
|---|---|
| How | Button spinners replace text; skeleton rows for tables; skeleton cards for stat cards; page-level loading overlay for full-page loads |
| Duration | Creation: ~1.5s; login: variable (network); page load: <2s target; data fetch: variable with skeleton |
| Transition | Content fade in at 200ms ease-out after load completes |
| Feedback | Spinner animation (Primary `#7C3AED`); skeleton shimmer effect |

### I-26 Error States

| Field | Value |
|---|---|
| Types | Network failure (retry button, form preserved), Validation (inline field errors), Auth (401 → "Invalid email or password"), Rate-limit (counter display), Not found (404 → release not found), Permission (403 → access denied), Conflict (duplicate title warning) |
| Feedback | Inline field errors; error banners (bg `#FEE2E2`, icon ❌); toast for transient errors; retry buttons for network failures; form state preserved on error |

---

## Animations & Transitions

| ID | Element | Animation | Duration | Easing |
|----|---------|-----------|----------|--------|
| C-1 | Button hover/active | Background color transition | 100ms | ease-out |
| C-2 | Progress bar width | Width transition | 300ms | ease |
| C-3 | Active stage indicator | Glow pulse | Continuous | — |
| C-4 | Clickable card hover | Shadow + border transition | 150ms | ease |
| C-5 | Modal open/close | Slide + fade | 300ms | ease-in-out |
| C-6 | Notification panel slide | Slide from right | 300ms | ease-in-out |
| C-7 | Page route change | Fade | 200ms | ease-out |
| C-8 | Toggle switch | Knob slide | 200ms | ease-in-out |
| C-9 | FAB expand | Speed-dial menu | 200ms | ease |

---

## Constraint Summary

| Rule | Applies to |
|------|-----------|
| One toast at a time; queue rest | All toasts |
| Buttons hidden for disallowed transitions (never disabled without explanation) | Status actions, role-gated actions |
| Server-side validation enforces all state transitions | Release status, stage state, task state |
| Form state preserved on network failure | Release creation, all forms |
| Terminal states (ARCHIVED, CANCELLED) lock all edits | Release, stages, tasks |
| RELEASED locks metadata, allows status + analytics reads | Release metadata |
| Discard confirmation only for high-risk actions (archive, cancel, delete) | Destructive actions |
| Role-based hiding (not greying out) of unavailable items | Navigation, tabs, actions |
