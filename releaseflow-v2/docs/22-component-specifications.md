# Component Specifications

## Format

Each component spec follows this structure:

```
ID:       Unique identifier (C-{N})
Name:     Component name
Variants: Distinct visual/functional variants
States:   All possible states
Styling:  Colors, dimensions, typography
Behavior: Interactions and transitions
Usage:    Where the component appears
```

---

## C-1 Button

| Field | Value |
|---|---|
| Variants | Primary, Secondary, Ghost, Destructive, Link |
| Sizes | S (32px h, 8px px), M (40px h, 12px px), L (48px h, 16px px) |
| States | Default, Hover, Focus (2px ring Primary Muted `#EDE9FE`), Active (100ms ease-out), Loading (spinner replaces text, e.g. "Signing in..."), Disabled |
| Styling | Primary: bg `#7C3AED` / hover `#6D28D9`, text `#FFFFFF`, radius 6px. Secondary: bg `#FFFFFF`, border `#E4E4E7`, text `#18181B`, hover bg `#F4F4F5`. Ghost: transparent, text `#52525B`, hover bg `#F4F4F5`. Destructive: bg `#DC2626`, text `#FFFFFF`. Link: transparent, text Primary, underline on hover |
| Behavior | Focus ring consistent with input focus pattern; disabled state avoided per design principle (hide unless explanation needed) |
| Usage | All pages — sign in, create, save, cancel, delete, back, continue |

## C-2 Text Input

| Field | Value |
|---|---|
| Dimensions | Height 40px, padding `0 12px`, radius 6px, font Body (14px/400) |
| Label | 12px/500, color `#52525B` (Text Secondary) |
| States | Default (border `#E4E4E7`, bg `#FFFFFF`), Hover (border `#A1A1AA`), Focus (border `#7C3AED`, ring 2px `#EDE9FE`), Error (border `#DC2626`, ring 2px `#FEE2E2`), Disabled (bg `#F4F4F5`, text `#A1A1AA`), Filled (text `#18181B`), Placeholder (text `#A1A1AA`) |
| Behavior | Helper text or error message below at 12px/400 |
| Usage | Email, password, name, search, title, slug, release/track fields |

## C-3 Select / Dropdown

| Field | Value |
|---|---|
| Dimensions | Height 40px, radius 6px, same border/background as Text Input |
| Label | 12px/500, `#52525B` |
| Menu | Max-height 240px, scrollable, chevron `▼` indicator |
| States | Default, Hover, Focus (ring 2px `#EDE9FE`), Open (menu visible), Selected (checkmark `✓` on active option) |
| Behavior | Selected option shown in trigger; dropdown menu with separators between groups; option selected on click; menu closes on selection or click outside |
| Usage | Org type, country, timezone, team size, language, role, filters, org switcher |

## C-4 Date Picker

| Field | Value |
|---|---|
| Dimensions | Matches Text Input — height 40px, radius 6px |
| Display | Medium date format ("Aug 15, 2026"), calendar icon `📅` on right |
| Popover | Month/year header, day grid, prev/next month arrows |
| States | Default, Focus (ring 2px `#EDE9FE`), Selected (date highlighted Primary), Hover (day highlight) |
| Behavior | Popover opens on click/focus; date selected on day click; popover closes on selection or click outside |
| Usage | Release date, target date, deadline picker |

## C-5 Toggle / Checkbox / Radio

| Field | Value |
|---|---|
| Toggle states | Off (bg `#E4E4E7`, knob `#FFFFFF`), On (bg `#7C3AED`, knob `#FFFFFF`), Focus (ring 2px `#EDE9FE`) |
| Checkbox | Custom styled, Primary `#7C3AED` when checked; used in tables (select-all + row), terms agreement, task rows (circular `☐`) |
| Radio | Used for SSO options, invite-role timing; selected: filled center dot |
| Behavior | Toggle: 200ms ease-in-out transition. Checkbox: table header selects all visible rows. Task checkbox toggles task state |
| Usage | Registration terms, no-fixed-date, SSO buttons, invite-role timing, multi-select in tables |

## C-6 Card

| Field | Value |
|---|---|
| Default styling | bg `#FFFFFF`, border 1px `#E4E4E7`, radius 8px, shadow `0 1px 2px rgba(0,0,0,0.04)`, padding 16px, inner gap 12px |
| Stat Card variant | Icon 32px centered top, number H2 (20px) weight 700 Primary, trend line 12px Success, sub-label 14px Text Secondary |
| Clickable Card variant | Hover: border `#EDE9FE`, shadow `0 4px 12px rgba(0,0,0,0.08)`, cursor pointer, transition 150ms ease |
| States | Default, Hover (clickable variant), Selected (clickable variant, primary border) |
| Usage | Dashboard stat cards, release cards, summary cards, info banners, invitation cards, completion card |

## C-7 Data Table

| Field | Value |
|---|---|
| Header | bg `#F4F4F5`, font Label (12px/500) |
| Cells | Body (14px/400), padding `12px 16px` |
| Borders | Horizontal only, color `#E4E4E7` |
| States | Hover row (bg `#F5F3FF`), Selected row (bg `#EDE9FE`, left border accent), Sorted column (arrow indicator), Loading (skeleton rows), Empty (empty state pattern) |
| Variants | Default (release list), Compact (activity feed), Tree (workflow stages with nested tasks), Expandable (release row → tracks), Sortable, Filterable |
| Pagination | "Showing X of Y" with page controls; 25 rows default |
| Behavior | Sortable by clicking header; filterable by column dropdown; expandable rows (chevron toggle); multi-select via checkbox column |
| Usage | Release list, track listing, contributor assignment, task board, asset catalog, team members |

## C-8 Tab / Tab Bar

| Field | Value |
|---|---|
| States | Active (bottom border Primary `#7C3AED`, icon + text Primary), Inactive (icon + text `#52525B`), Hover (bg `#F5F3FF` implied) |
| Mobile | Horizontally scrollable with "More..." overflow |
| Behavior | Active tab maintains scroll state; inactive tabs show/hide based on role permissions |
| Usage | Release workspace tabs (Overview, Tracks, Contributors, Workflow, Settings), Settings sub-navigation, stage sub-tabs |

## C-9 Badge

| Field | Value |
|---|---|
| Styling | Radius 9999px, padding `2px 10px`, font Label (12px/500), optional leading dot |
| Variants | Default (bg `#F4F4F5`, text `#52525B`), Success (bg `#DCFCE7`, text `#16A34A`), Warning (bg `#FEF3C7`, text `#D97706`), Error (bg `#FEE2E2`, text `#DC2626`), Info (bg `#DBEAFE`, text `#2563EB`), Neutral (bg `#EDE9FE`, text `#7C3AED`) |
| Release Status specials | DRAFT (border only, muted), PLANNING (blue `#DBEAFE`), PRODUCTION (purple `#EDE9FE`), ON HOLD (amber `#FEF3C7`), READY (green `#DCFCE7`), RELEASED (green solid `#16A34A`), ARCHIVED (stone `#F4F4F5`), CANCELLED (red `#FEE2E2` + strikethrough) |
| Usage | Release status in header, release type badge, stage badge, task status, "Coming Soon" |

## C-10 Status Indicator (Dot)

| Field | Value |
|---|---|
| Colors | Idea `#8B5CF6`, In Progress `#2563EB`, Review `#D97706`, Approved `#16A34A`, Live `#16A34A`, Blocked `#DC2626`, Archived `#78716C` |
| Size | 8px diameter circle |
| Usage | Leading dot in status badges, deadline indicators, stage pipeline |

## C-11 Progress Bar

| Field | Value |
|---|---|
| Dimensions | Height 6px, radius 9999px |
| Fill colors | In Progress (Primary `#7C3AED`), At Risk (Warning `#D97706`), Complete (Success `#16A34A`) |
| Transition | Width change at 300ms ease |
| Usage | Stage-level progress (workflow tab), dashboard stat card, release card, onboarding wizard |

## C-12 Stage Pipeline

| Field | Value |
|---|---|
| State indicators | ✓ (green, complete), ◌ (blue, glow pulse animation, active), ○ (border only, muted, pending), ● (red, blocked) |
| Dimensions | Per-stage box ~40×40px, connected by horizontal line |
| Variants | Compact (dashboard overview, mobile dots), Full (workflow tab, vertical with per-stage progress bars) |
| Behavior | Active stage pulses; completed stages animate fill on transition |
| Usage | Release dashboard overview, release creation step 2 (template preview), workflow tab |

## C-13 Empty State

| Field | Value |
|---|---|
| Icon | 64px, centered, opacity 0.4 |
| Title | H2 (1.5rem/24px, 600), `#18181B` |
| Body | Body (14px/400), `#52525B` |
| CTA | Primary button L-size (48px) |
| Tip | Info background `#DBEAFE` with icon |
| Usage | No orgs, no releases, empty tabs, empty task list, empty assets |

## C-14 Info Banner / Tip Banner

| Field | Value |
|---|---|
| Variants | Tip (bg `#DBEAFE`, icon 💡), Info (bg `#F5F3FF`, icon ℹ️), Security (bg `#DBEAFE`, icon 🔒), Warning (bg `#FEF3C7`, icon ⚠️), Error (bg `#FEE2E2`, icon ❌), Success (bg `#DCFCE7`, icon ✅) |
| Styling | Padding 12px 16px, radius 6px, flex row with icon + text |
| Usage | Login tip, empty state tips, release creation info, onboarding tips, contributor tip |

## C-15 Modal / Dialog

| Field | Value |
|---|---|
| Default width | Content Default (896px) or Content Narrow (672px) |
| Shadow | `0 10px 15px rgba(0,0,0,0.08)` |
| Motion | 300ms ease-in-out (slide/fade) |
| Backdrop | Semi-transparent overlay |
| Anatomy | Title bar with close ×, step indicator (wizard variant), content area, footer with actions |
| States | Open, Loading (spinner in footer), Error (inline error in content area), Closing (300ms fade) |
| Confirmation variant | Title + description ("Explain what happened and what happens next") + DestructiveButton + Cancel |
| Usage | Release creation wizard, confirmation dialogs (archive, cancel, delete) |

## C-16 Toast / Notification

| Field | Value |
|---|---|
| Content | Action message + entity name |
| Duration | ~1.5s display (success/creation) |
| Constraint | One at a time; queue rest |
| Position | Top-right (implied) |
| Usage | "Midnight Sessions created" on release creation success |

## C-17 Notification Slide-out Panel

| Field | Value |
|---|---|
| Width | 400px (Panel Width) |
| Shadow | `0 20px 25px rgba(0,0,0,0.12)` |
| Motion | 300ms ease-in-out slide from right |
| Anatomy | Title "Notifications", notification list, "Mark all as read" button footer |
| Notification item | Status icon (color-coded) + bold user + action text + entity name + relative timestamp |
| Usage | Triggered from bell icon in top nav |

## C-18 Activity Feed Item

| Field | Value |
|---|---|
| Anatomy | Icon + bold user (600) + action + entity + metadata line (entity name · relative time) |
| Icon colors | Color-coded by type (status dot or emoji: 🔵 🟢 🟡 💬 👤) |
| Timestamp | Relative ("2h ago", "1d ago"), Body small, `#A1A1AA` |
| Line spacing | 16px between items (4× grid) |
| Usage | Dashboard recent activity, release activity tab |

## C-19 Task List Item

| Field | Value |
|---|---|
| Anatomy | Checkbox `☐` + title + release context + due date + assignee avatar |
| Due date colors | Today: `#DC2626`, Tomorrow: `#D97706`, Future: `#16A34A`, TBD: `#A1A1AA` |
| Urgency indicators | 🔴 today/overdue, 🟡 tomorrow/approaching, 🟢 future, ⚪ TBD |
| Assignee | Avatar 24px + name |
| Behavior | Checkbox toggles task completion; click navigates to task detail |
| Usage | Dashboard pending tasks, workflow tab tasks, tasks board |

## C-20 Sidebar Navigation

| Field | Value |
|---|---|
| Width | 240px |
| Active item | Icon + text Primary `#7C3AED` |
| Inactive | Icon + text `#52525B` |
| Background | `#FFFFFF` (Surface) |
| Dividers | `#E4E4E7` between sections |
| Expandable sections | `▸` caret toggle |
| Mobile | Collapses to bottom tab bar (<640px) with 5 tabs; touch targets 44×44px min |
| Behavior | Switches between org-level nav and release-level nav when viewing a release; "Back to Releases" link in release-level nav |
| Usage | All app pages |

## C-21 Top Navigation

| Field | Value |
|---|---|
| Anatomy | Logo ◐ ReleaseFlow (left), Nav links (Dashboard, Releases ▼, Tasks, + New), Search (center), Notifications 🔔, Avatar 👤 (right) |
| Behavior | Search defaults to release titles; notifications bell shows unread indicator; avatar triggers account menu |
| Usage | All authenticated pages |

## C-22 Breadcrumb

| Field | Value |
|---|---|
| Format | `Dashboard > Releases > Midnight Sessions` |
| Separator | `>` chevron, `#A1A1AA` |
| Active (last) | `#18181B` (Text Primary) |
| Inactive | `#52525B` (Text Secondary) |
| Hover | `#7C3AED` (Primary) |
| Usage | Release detail sub-pages, settings pages |

## C-23 Empty State

| Field | Value |
|---|---|
| Icon | 64px, centered, opacity 0.4 |
| Title | H2 (1.5rem/24px, 600), `#18181B` |
| Body | Body (14px/400), `#52525B` |
| CTA | Primary button (L size: 48px) |
| Tip | Info background `#DBEAFE` |
| Usage | No orgs, no releases, empty tabs, empty task list, empty assets |

## C-24 Stat Card

| Field | Value |
|---|---|
| Dimensions | Card (8px radius, 1px border, 16px padding) |
| Anatomy | Icon (32px), Number (H2 20px 700 Primary), Label (14px/400 Text Secondary), Trend (12px Success with arrow) |
| States | Default, Hover (shadow elevation) |
| Usage | Dashboard overview, release overview |

## C-25 Quick Actions Bar

| Field | Value |
|---|---|
| Anatomy | Row of buttons: Add Task, Upload, Invite |
| States | Default, Hover, Disabled (if action not permitted) |
| Behavior | Each button opens relevant modal or navigates to entity |
| Usage | Release overview tab |

## C-26 Floating Action Button (FAB)

| Field | Value |
|---|---|
| Anatomy | Primary circle button with "+" icon; expands to speed-dial menu |
| Actions | New Release, New Task, Upload Asset, Invite Member |
| Behavior | Role-dependent visibility (e.g., New Release hidden if user cannot create); contextual to current page |
| Usage | Dashboard, Releases, Assets, Tasks |

## C-27 File Upload / Drop Zone

| Field | Value |
|---|---|
| Anatomy | Square preview area with placeholder icon + "Drop or click to upload" text |
| States | Default, Dragging (border highlight), Uploading (progress), Uploaded (preview), Error (format/size) |
| Usage | Brand logo upload, asset upload |

## C-28 Segmented Button Group

| Field | Value |
|---|---|
| Anatomy | Row of selectable cards (icon + label + subtitle) |
| States | Unselected (default card), Selected (Primary border or fill) |
| Usage | Release type picker (creation flow), template selection (onboarding) |

## C-29 Asset Thumbnail

| Field | Value |
|---|---|
| Dimensions | 120×120px (grid) or 80×80px (list) |
| Anatomy | File format icon overlay, filename (truncated), meta line (specs, size, version), action icons on hover |
| Usage | Asset catalog, release assets tab |

## C-30 Step Indicator

| Field | Value |
|---|---|
| Anatomy | "Step X of Y: Label" + progress circles (◉ completed, ○ future) + percentage |
| Variants | 3-step (release creation: 33%, 66%, 100%), 5-step (onboarding: 20%, 40%, 50%, 75%, 100%) |
| Behavior | Current step label highlighted; completed steps show checkmark |
| Usage | Release creation modal, onboarding wizard |

## C-31 Team Member List Item

| Field | Value |
|---|---|
| Anatomy | Avatar + Name (Body 14px) + Role (12px Text Secondary) + Status ("Active on X tasks" or "—", 12px Text Muted) |
| Usage | Dashboard team section, release overview team members |

## C-32 Deadline Indicator

| Field | Value |
|---|---|
| Color coding | 🔴 Today/overdue → `#DC2626`, 🟡 Tomorrow → `#D97706`, 🟢 Future → `#16A34A`, ⚪ TBD → `#A1A1AA` |
| Format | Emoji + date + label |
| Usage | Upcoming deadlines list, task due dates, release list deadline column |

## C-33 Pagination

| Field | Value |
|---|---|
| Format | "Showing X of Y" + page numbers `← 1 2 3 ... N →` |
| Default | 25 rows per page; user can increase |
| Behavior | Previous/Next arrows; ellipsis for large sets |
| Usage | Data table footer (release list, track listing, asset catalog) |

## C-34 Confirmation Dialog

| Field | Value |
|---|---|
| Anatomy | Title + description ("Explain what happened and what happens next") + DestructiveButton + Cancel |
| Usage | Archive release, cancel release, delete asset, destructive actions |

## C-35 Password Strength Indicator

| Field | Value |
|---|---|
| Anatomy | 4 requirement checkboxes (8+ chars, uppercase, number, special char) |
| Behavior | Real-time update as user types; each requirement fills independently |
| Usage | Sign up, onboarding step 1 |

## C-36 Spinner

| Field | Value |
|---|---|
| Usage | Button loading state ("Signing in..."), release creation (~1.5s), SSO redirect, form submission |

## C-37 Avatar

| Field | Value |
|---|---|
| Sizes | 24px (task row), 32px (team list), 40px (user menu) |
| Format | Initials avatar or user photo |
| Usage | Task assignee, team member list, top nav user menu, activity feed |

## C-38 Multi-Email Input

| Field | Value |
|---|---|
| Anatomy | List of email rows, each with role dropdown; "+ Add another" link at bottom |
| States | Default (empty), Filled (email rows), Error (invalid email format, bounced badge) |
| Usage | Invite team (onboarding step 3, settings) |
