# Artist Workspace — High-Fidelity Design

**Version:** 3.0 (Flagship)
**Status:** Approved
**Route:** `/artists/[id]` → redirects to `/artists/[id]/overview`
**Hero Component:** Active Releases

---

## Layout · 1440px Viewport

```
┌──────────────────────────────────────────────────────────────────────────────────────┐
│  Application Shell                                                                     │
│                                                                                        │
│  ┌───────────┐ ┌────────────────────────────────────────────────────────────────────┐ │
│  │ Sidebar   │ │ Top Nav · h 56px · bg Surface · border-b 1px #E4E4E7               │ │
│  │ w 240px   │ │ ┌─────────────────────────────────────────────────────────────────┐ │ │
│  │ bg #FFF   │ │ │ ◀ Back to Artists                      🔔(3)  👤                │ │ │
│  │           │ │ └─────────────────────────────────────────────────────────────────┘ │ │
│  │ ▸ Ops     │ │                                                                      │ │
│  │ ▸ Releases│ │  ─── Artist Header ─────────────────────────────────────────────   │ │
│  │ ▸ Tasks   │ │  ┌──────────────────────────────────────────────────────────────┐    │ │
│  │ ▸ Assets  │ │  │                                                                │    │ │
│  │ ◆ Artists │ │  │  ┌────────┐   Kinn Timo                                       │    │ │
│  │ ▸ Mktg    │ │  │  │ 🎤     │   Afro Tech · Deep House · Amapiano              │    │ │
│  │ ▸ Dist    │ │  │  │        │   South Africa · Active since 2024               │    │ │
│  │ ▸ Reports │ │  │  │ 800px  │                                                    │    │ │
│  │           │ │  │  └────────┘   ┌───────────┐ ┌──────────┐  ┌───────────────┐   │    │ │
│  │ ◀ Back    │ │  │               │ 🟢 ACTIVE │ │ 85% prof │  │  + Add Release│   │    │ │
│  │           │ │  │               └───────────┘ └──────────┘  │   (Primary)   │   │    │ │
│  │ Kinn T ───│ │  │                                            └───────────────┘   │    │ │
│  │ ◆ Overview│ │  └──────────────────────────────────────────────────────────────┘    │ │
│  │ ▸ Releases│ │  mb 24px                                                              │ │
│  │ ▸ Credits │ │                                                                      │ │
│  │ ▸ Assets  │ │  ─── Operational Summary ────────────────────────────────────────    │ │
│  │ ▸ Campaign│ │  ┌──────────────────────────────────────────────────────────────┐    │ │
│  │ ▸ PressKit│ │  │ 3 active releases across 2 labels. 12 tracks published.       │    │ │
│  │           │ │  │ 2 campaigns in progress. Profile is 85% complete.             │    │ │
│  │           │ │  │ Missing: Press photo, Instagram link.                         │    │ │
│  │           │ │  └──────────────────────────────────────────────────────────────┘    │ │
│  │           │ │  mb 32px                                                              │ │
│  │           │ │                                                                      │ │
│  │           │ │  ─── Active Releases ─── [HERO COMPONENT] ──────────────────────    │ │
│  │           │ │  ┌──────────────────────────────────────────────────────────────┐    │ │
│  │           │ │  │                                                                │    │ │
│  │           │ │  │  ┌──────────────────────────────────────────────────────────┐ │    │ │
│  │           │ │  │  │ Lua · EP · Primary Artist                    🟡 Attention │ │    │ │
│  │           │ │  │  │ Label: Acme Records · Nov 15, 2026 · Mastering stage    │ │    │ │
│  │           │ │  │  │ ┌──────────────────────────────────────────────────────┐ │ │    │ │
│  │           │ │  │  │ │ Planning ✓  Prod ✓  Mix ✓  Master ◉  Art ○  Dist ○ │ │ │    │ │
│  │           │ │  │  │ │ ████████████████████████████░░░░░░░░ 68% · 4/7 done │ │ │    │ │
│  │           │ │  │  │ └──────────────────────────────────────────────────────┘ │ │    │ │
│  │           │ │  │  │ 4 tasks assigned · 1 approval pending · 12d overdue     │ │    │ │
│  │           │ │  │  │                                    ┌──────────────────┐  │ │    │ │
│  │           │ │  │  │                                    │  Open Release →  │  │ │    │ │
│  │           │ │  │  │                                    └──────────────────┘  │ │    │ │
│  │           │ │  │  └──────────────────────────────────────────────────────────┘ │    │ │
│  │           │ │  │  mb 12px                                                       │    │ │
│  │           │ │  │                                                                │    │ │
│  │           │ │  │  ┌──────────────────────────────────────────────────────────┐ │    │ │
│  │           │ │  │  │ Midnight Sessions · Single · Producer      🟢 Healthy    │ │    │ │
│  │           │ │  │  │ Label: Acme Records · Oct 01, 2026 · Mixing stage       │ │    │ │
│  │           │ │  │  │ ┌──────────────────────────────────────────────────────┐ │ │    │ │
│  │           │ │  │  │ │ Planning ✓  Prod ✓  Mix ◉  Master ○  Art ○  Dist ○ │ │ │    │ │
│  │           │ │  │  │ │ ████████████████████░░░░░░░░░░░░░░ 57% · 4/7 done   │ │ │    │ │
│  │           │ │  │  │ └──────────────────────────────────────────────────────┘ │ │    │ │
│  │           │ │  │  │ 1 task assigned · 0 approvals pending · On track        │ │    │ │
│  │           │ │  │  │                                    ┌──────────────────┐  │ │    │ │
│  │           │ │  │  │                                    │  Open Release →  │  │ │    │ │
│  │           │ │  │  │                                    └──────────────────┘  │ │    │ │
│  │           │ │  │  └──────────────────────────────────────────────────────────┘ │    │ │
│  │           │ │  │  mb 12px                                                       │    │ │
│  │           │ │  │                                                                │    │ │
│  │           │ │  │  ┌──────────────────────────────────────────────────────────┐ │    │ │
│  │           │ │  │  │ Summer EP · EP · Producer                      ✓ Complete│ │    │ │
│  │           │ │  │  │ Label: Horizon Music · Aug 20, 2026 · Released           │ │    │ │
│  │           │ │  │  │ ┌──────────────────────────────────────────────────────┐ │ │    │ │
│  │           │ │  │  │ │ Plan ✓ Prod ✓ Mix ✓ Master ✓ Art ✓ Dist ✓ Release ✓ │ │ │    │ │
│  │           │ │  │  │ │ ████████████████████████████████████ 100% · 7/7 done │ │ │    │ │
│  │           │ │  │  │ └──────────────────────────────────────────────────────┘ │ │    │ │
│  │           │ │  │  │ Released Aug 20, 2026 · 5 tracks                        │ │    │ │
│  │           │ │  │  │                                    ┌──────────────────┐  │ │    │ │
│  │           │ │  │  │                                    │  View Release →  │  │ │    │ │
│  │           │ │  │  │                                    └──────────────────┘  │ │    │ │
│  │           │ │  │  └──────────────────────────────────────────────────────────┘ │    │ │
│  │           │ │  └──────────────────────────────────────────────────────────────┘    │ │
│  │           │ │  mb 32px                                                              │ │
│  │           │ │                                                                      │ │
│  │           │ │  ─── Profile ───────────────────────────────────────────────────    │ │
│  │           │ │  ┌──────────────────────────────────────────────────────────────┐    │ │
│  │           │ │  │ Bio:                                                          │    │ │
│  │           │ │  │ Kinn Timo is a South African producer and artist blending     │    │ │
│  │           │ │  │ Afro Tech with deep house influences. Known for intricate     │    │ │
│  │           │ │  │ percussion and melodic basslines, his debut EP "Lua"          │    │ │
│  │           │ │  │ reached #1 on the Afro House charts in 2025.                  │    │ │
│  │           │ │  │                                                                │    │ │
│  │           │ │  │ Social Links:                                                  │    │ │
│  │           │ │  │ ◐ Instagram  · instagram.com/kinntimo                         │    │ │
│  │           │ │  │ ◐ Spotify    · spotify.com/artist/1a2b3c                      │    │ │
│  │           │ │  │ ○ TikTok     · —                                              │    │ │
│  │           │ │  │ ○ YouTube    · —                                              │    │ │
│  │           │ │  │                                                                │    │ │
│  │           │ │  │ Profile Completeness:                                          │    │ │
│  │           │ │  │ ██████████████████████████████░░░░░  85%                      │    │ │
│  │           │ │  │ Missing: Press photo, Instagram link                          │    │ │
│  │           │ │  └──────────────────────────────────────────────────────────────┘    │ │
│  │           │ │  mb 32px                                                              │ │
│  │           │ │                                                                      │ │
│  │           │ │  ─── Attention Panel ───────────────────────────────────────────    │ │
│  │           │ │  ┌──────────────────────────────────────────────────────────────┐    │ │
│  │           │ │  │ ⏳ Pending: Rough mix review — Lua · Sam A&R · SLA: Aug 31    │    │ │
│  │           │ │  │    ┌──────────┐ ┌──────────┐                                   │    │ │
│  │           │ │  │    │  Review  │ │  Snooze  │                                   │    │ │
│  │           │ │  │    └──────────┘ └──────────┘                                   │    │ │
│  │           │ │  │                                                                │    │ │
│  │           │ │  │ 📋 Profile incomplete: Add press photo to reach 100%           │    │ │
│  │           │ │  │    ┌──────────────────┐                                         │    │ │
│  │           │ │  │    │  Upload Photo    │                                         │    │ │
│  │           │ │  │    └──────────────────┘                                         │    │ │
│  │           │ │  └──────────────────────────────────────────────────────────────┘    │ │
│  │           │ │  mb 48px                                                              │ │
│  │           │ │                                                                      │ │
│  │           │ │  ─── Activity Feed ──────────────────────────────────────────────    │ │
│  │           │ │  🔵 "Lua" advanced to Mastering · 2h ago                             │ │
│  │           │ │  📁 Press photo uploaded · 1d ago                                    │ │
│  │           │ │  🟢 "Midnight Sessions" entered Mixing · 3d ago                      │ │
│  │           │ │  💬 Alex PM: "Mastering session booked for Aug 25" · 5d ago          │ │
│  │           │ │  👤 Added as Primary Artist on "Lua" · Aug 01                        │ │
│  │           │ │                                                                      │ │
│  │           │ │  Showing 5 of 42 events · ─── Load more ───                          │ │
│  │           │ └──────────────────────────────────────────────────────────────────────┘ │
│  │           │                                                                          │
│  │           │  ┌──────────────────────────────────────────────────────────────────────┐ │
│  │           │  │ Context Rail · w 320px · bg #FAFAFA · border-l 1px #E4E4E7          │ │
│  │           │  │ Sticky top 56px · Independent scroll                                  │ │
│  │           │  │                                                                       │ │
│  │           │  │  ─── Artist Overview ──────────────────────────────────────────────  │ │
│  │           │  │  ┌────────────────────────────────────────────────────────────────┐  │ │
│  │           │  │  │ Status: 🟢 Active                                               │  │ │
│  │           │  │  │ Profile: 85% complete                                           │  │ │
│  │           │  │  │ ███████████████████████████░░░░░                                 │  │ │
│  │           │  │  │ Genres: Afro Tech, Deep House, Amapiano                        │  │ │
│  │           │  │  │ Country: South Africa                                           │  │ │
│  │           │  │  │ Active since: 2024                                              │  │ │
│  │           │  │  └────────────────────────────────────────────────────────────────┘  │ │
│  │           │  │  mb 24px                                                              │ │
│  │           │  │                                                                       │ │
│  │           │  │  ─── Release Health ──────────────────────────────────────────────   │ │
│  │           │  │  ┌────────────────────────────────────────────────────────────────┐  │ │
│  │           │  │  │ ┌──────┐ ┌──────┐ ┌──────┐                                     │  │ │
│  │           │  │  │ │  3   │ │  12  │ │  2   │                                     │  │ │
│  │           │  │  │ │Releas│ │Tracks│ │Campgn│                                     │  │ │
│  │           │  │  │ └──────┘ └──────┘ └──────┘                                     │  │ │
│  │           │  │  │                                                                 │  │ │
│  │           │  │  │ Active Releases:                        Health:                 │  │ │
│  │           │  │  │ Lua · EP · Mastering          🟡 Attention · 68%               │  │ │
│  │           │  │  │ Midnight Sessions · Mixing     🟢 Healthy · 57%                │  │ │
│  │           │  │  │                                                                 │  │ │
│  │           │  │  │ Completed:                                               │  │ │
│  │           │  │  │ Summer EP · Released            ✓ · 100%                       │  │ │
│  │           │  │  └────────────────────────────────────────────────────────────────┘  │ │
│  │           │  │  mb 24px                                                              │ │
│  │           │  │                                                                       │ │
│  │           │  │  ─── Attention ───────────────────────────────────────────────────   │ │
│  │           │  │  ┌────────────────────────────────────────────────────────────────┐  │ │
│  │           │  │  │ ⏳ 1 pending review · Rough mix (Lua)                           │  │ │
│  │           │  │  │ 🔴 1 overdue task · EQ drum stems (Lua, Aug 25)                │  │ │
│  │           │  │  │ 📋 Profile 85% · Missing press photo                           │  │ │
│  │           │  │  └────────────────────────────────────────────────────────────────┘  │ │
│  │           │  │  mb 24px                                                              │ │
│  │           │  │                                                                       │ │
│  │           │  │  ─── Recent Activity ──────────────────────────────────────────────   │ │
│  │           │  │  🔵 Stage advanced · 2h ago                                           │ │
│  │           │  │  📁 Asset uploaded · 1d ago                                           │ │
│  │           │  │  🟢 Release entered stage · 3d ago                                    │ │
│  │           │  │  💬 Comment · 5d ago                                                  │ │
│  │           │  └──────────────────────────────────────────────────────────────────────┘ │
│  └───────────┘                                                                            │
└──────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## Component Inventory

### Required Components Used

| Component | Section | PDS Ref | Purpose |
|-----------|---------|---------|---------|
| **Release Header** | Top section | PDS-11 | Adapted as Artist Header: artist photo, name, genres, country, status, profile completeness, primary action |
| **Operational Summary** | Below header | OI-015, SA-004 | Summary of artist's current operational state |
| **Active Releases** | Hero Component | SA-005, PDS-04 | Artist's releases with inline Journey, health, and stage progress |
| **Attention Panel** | Supporting | PDS-11 | Pending approvals, overdue tasks, profile gaps requiring action |
| **Activity Feed** | Bottom section | SA-008 | Chronological activity across all artist releases |
| **Context Rail** | Right panel | SA-007, PDS-11 | Artist overview, release health summary, attention items, recent activity |

### Components NOT Used on This Screen

| Component | Reason |
|-----------|--------|
| Release Journey | Embedded inline within each Active Release card, not a standalone hero (hero component is Active Releases per PDS-04) |
| Health Ring | Release-specific (OI-013); artist health is derived from aggregate release health shown as stat cards |
| Readiness Stack | Release-specific (OI-014); not applicable to artist-level view |
| Workflow Board | Release-specific; not applicable to artist-level view |

### Base Components Used

| Component | Usage |
|-----------|-------|
| Tabs | 6-tab navigation: Overview, Releases (3), Credits (12), Assets (8), Campaigns (2), Press Kit |
| StatusBadge | Artist status (ACTIVE), release health states |
| Button (M, 40px) | Review, Snooze, Upload Photo, Open Release |
| Button (L, primary) | + Add Release (primary action, top-right) |
| ProgressBar | Profile completeness, release stage progression |
| Card | Active release cards with inline journey |
| Badge | Release types (EP, Single, Remix) |
| MetricCard | Context Rail stat cards (releases, tracks, campaigns) |
| Timeline | Activity Feed events |
| EmptyState | No releases, no campaigns, incomplete profile prompts |

### Components Explicitly Excluded

No additional components beyond the required 9-component library.

---

## Interaction Notes

### Artist Header

| Interaction | Trigger | Result |
|-------------|---------|--------|
| Status badge click | Click "🟢 ACTIVE" | Dropdown: Active / Inactive / Hiatus |
| Profile badge click | Click "85%" | Scroll to Profile section |
| Primary Action | Click "+ Add Release" | Open Create Release modal, pre-populated with this artist |
| Back arrow | Click "◀ Back to Artists" | Navigate to `/artists` |
| Artist photo click | Click photo | Open full-size image viewer |

### Active Releases (Hero Component)

| Interaction | Trigger | Result |
|-------------|---------|--------|
| Release card click | Click anywhere on release card | Navigate to `/releases/[id]` |
| "Open Release →" | Click button | Navigate to `/releases/[id]` |
| "View Release →" | Click button | Navigate to completed release (read-only mode) |
| Inline journey stage | Click a stage dot | Scroll to that stage detail within the card (or navigate to release workflow) |
| Release card hover | Hover over card | Card elevates 2px. Border highlights. |
| Card sort | (implicit) | Active releases sorted by: urgency (blocked first) → due date → health |

### Profile Section

| Interaction | Trigger | Result |
|-------------|---------|--------|
| Social link click | Click "◐ Instagram" | Open external link in new tab |
| "Edit Profile" | Click | Inline edit mode for bio, genres, social links |

### Attention Panel

| Interaction | Trigger | Result |
|-------------|---------|--------|
| Review button | Click | Open Review Panel |
| Snooze button | Click | Snooze dialog: 24h / 3d / 1w |
| Upload Photo | Click | Open file upload modal for press photo |

### Activity Feed

| Interaction | Trigger | Result |
|-------------|---------|--------|
| Activity item click | Click any event | Navigate to relevant entity (release, stage, asset) |
| "Load more" | Click | Load next 10 events |

### Tab Navigation

| Tab | Content |
|-----|---------|
| Overview | Artist header, operational summary, active releases hero, profile, attention, activity |
| Releases | Table: all releases with role, type, date, health (per doc 49) |
| Credits | Tree view of all credits across releases (per TASK-2403) |
| Assets | Grid: artist photos, logos, press photos with metadata |
| Campaigns | List: active and completed campaigns featuring this artist |
| Press Kit | Auto-generated one-sheet: bio, photo, social links, discography + Download PDF |

### Context Rail

| Interaction | Trigger | Result |
|-------------|---------|--------|
| Release name click | Click "Lua · EP" in context rail | Navigate to `/releases/[lua-id]` |
| Stat card click | Click "3 Releases" | Switch to Releases tab |
| Attention item click | Click "1 pending review" | Scroll to Attention Panel |

---

## Mobile Adaptation

### ≥1024px (Desktop)
- Sidebar visible (240px)
- Content max-width 960px centered
- Context Rail visible (320px)
- Active Releases: full-width cards, inline journey visible
- Tabs: 6 tabs with labels + counts

### 768–1023px (Tablet)
- Sidebar: collapsed to hamburger
- Content full-width
- Context Rail: hidden. Key stats shown in-page (profile completeness, release count)
- Active Releases: cards stack full-width, inline journey truncated to dots
- Tabs: horizontal scroll with abbreviated labels

### <768px (Phone)
- **No sidebar**: Bottom tab bar
- **Context Rail**: Context info distributed into page
  - Artist stats become inline header elements
  - Attention becomes section below profile
- **Active Releases (Hero)**:
  - Cards stack full-width, single column
  - Inline journey: dots only + stage name (compact)
  - Health: dot + word only (no progress bar)
  - "Open Release" button full-width
- **Tabs**: Icons only, horizontal scroll. "More" dropdown for overflow.
- **Profile**: Bio truncated to 3 lines with "Read more" expand
- **Activity Feed**: Last 5 events with "Load more"

---

## Accessibility Notes

| Requirement | Implementation |
|-------------|---------------|
| Color dependency | Release health uses color + icon + text label. All status states have text and color. |
| Focus order | Artist Header → Tabs → Operational Summary → Active Releases → Profile → Attention Panel → Activity Feed → Context Rail |
| Keyboard nav | Tab through main content. Enter on release card to navigate. Arrow keys within tab bar. |
| Screen reader | Artist name: heading level 1. Release cards: role="article" with aria-label including release name, health state, and stage. Profile completeness: aria-valuenow="85" aria-valuetext="85 percent complete". Tab panel: role="tabpanel" with aria-labelledby referencing tab. |
| Touch targets | Minimum 44x44px. Release cards naturally large enough (full-width cards). |
| Contrast | #18181B on #FFFFFF = 15.3:1 (AAA). All status colors validated against backgrounds. |
| Motion | Card hover elevation: 100ms ease. No auto-animations. |
| Reduced motion | @media (prefers-reduced-motion): instant elevation, no transitions. |
| ARIA landmarks | role="banner" (top nav), role="navigation" (sidebar + tabs), role="main" (content), role="complementary" (Context Rail) |

---

## Compliance Checklist

| PDS Ref | Rule | Status |
|---------|------|--------|
| PDS-04 VL-101 | Typography leads hierarchy | ✅ Artist name 32px/600 → H2 20px/600 → Body 14px |
| PDS-04 VL-102 | Space communicates | ✅ 32px section gaps, 12px card padding, 8px internal gaps |
| PDS-04 VL-103 | Colour explains | ✅ Health states on releases. Profile completeness bar. Social link status dots. |
| PDS-04 VL-104 | Layout creates confidence | ✅ Header → Summary → Hero → Profile → Attention → Activity |
| PDS-05 DE-001 | Cognitive economy | ✅ Operational Summary presents full situation in 2 lines |
| PDS-05 DE-002 | Five second rule | ✅ Where am I (artist name), what's happening (summary), what needs attention (panel), what next (add release), is it healthy (context rail) |
| PDS-05 DE-003 | One Hero Component | ✅ Active Releases exclusively |
| PDS-05 DE-004 | Visual rhythm | ✅ 8/16/24/32/48 spacing scale |
| PDS-05 DE-005 | Progressive disclosure | ✅ Overview → Release card click → Release Workspace |
| PDS-05 DE-006 | Context never disappears | ✅ Artist name, tabs, context rail persist |
| PDS-06 VG-001 | Everything communicates | ✅ Every element answers a question |
| PDS-06 VG-002 | Progress grammar | ✅ Inline journey shows stage + completion + what's next |
| PDS-06 VG-003 | Health grammar | ✅ Five health states on release cards |
| PDS-06 VG-004 | Time grammar | ✅ Relative times on activity and deadlines |
| PDS-06 VG-005 | Collaboration grammar | ✅ Role Chips: Primary Artist, Producer |
| PDS-07 OI-015 | Operational Summary | ✅ Narrative summary present |
| PDS-08 IL-001 | Interactions disappear | ✅ One-click to release via cards |
| PDS-08 IL-002 | One primary action | ✅ + Add Release, top-right |
| PDS-08 IL-003 | Direct manipulation | ✅ Click release → open release |
| PDS-08 IL-004 | Progressive interaction | ✅ Primary → Secondary tabs → Advanced settings |
| PDS-08 IL-005 | Immediate feedback | ✅ Optimistic updates on actions |
| PDS-12 SA-001 | Universal structure | ✅ Shell → Header → Summary → Primary Action → Hero → Supporting → Activity |
| PDS-12 SA-002 | Application Shell | ✅ Sidebar + top nav persistent |
| PDS-12 SA-003 | Screen Header | ✅ Artist identity, breadcrumb, primary action |
| PDS-12 SA-004 | Operational Summary | ✅ Present at top |
| PDS-12 SA-005 | Hero Component | ✅ Active Releases |
| PDS-12 SA-006 | Supporting sections | ✅ Profile, Credits, Assets, Campaigns (via tabs) |
| PDS-12 SA-007 | Context Rail | ✅ Artist overview, release health, attention, activity |
| PDS-12 SA-015 | Artist Workspace Blueprint | ✅ Header → Overview → Discography → Assets → Credits → People → Activity |

---

## Implementation Tokens

```css
.artist-workspace {
  display: flex;
  height: calc(100vh - 56px);
  overflow: hidden;
}

.artist-main {
  flex: 1;
  overflow-y: auto;
  padding: 24px 32px;
  max-width: calc(100% - 320px);
}

/* --- Artist Header --- */
.artist-header {
  display: flex;
  align-items: flex-start;
  gap: 20px;
  margin-bottom: 24px;
  padding-bottom: 24px;
  border-bottom: 1px solid var(--color-border);
}

.artist-photo {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  background: var(--color-neutral-bg);
  flex-shrink: 0;
  overflow: hidden;
  cursor: pointer;
  transition: opacity 100ms ease;

  &:hover { opacity: 0.9; }

  img { width: 100%; height: 100%; object-fit: cover; }
}

.artist-identity {
  flex: 1;

  .artist-name {
    font: var(--display-sm); /* 32px / 600 */
    color: var(--color-text-primary);
    margin: 0;
  }

  .artist-genres {
    font: var(--text-body);
    color: var(--color-text-secondary);
    margin-top: 4px;

    .genre-separator { color: var(--color-text-muted); margin: 0 4px; }
  }

  .artist-location {
    font: var(--text-body-sm);
    color: var(--color-text-muted);
    margin-top: 2px;
  }
}

.artist-badges {
  display: flex;
  gap: 8px;
  margin-top: 12px;
}

.artist-actions {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 8px;
}

/* --- Operational Summary --- */
.ops-summary {
  margin-bottom: 32px;
  padding: 16px 20px;
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: 8px;
  font: var(--text-body);
  line-height: 1.7;
  color: var(--color-text-primary);
}

/* --- Active Releases (Hero) --- */
.active-releases {
  margin-bottom: 32px;

  .section-header {
    font: var(--text-h2);
    margin-bottom: 16px;
  }
}

.release-card {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: 8px;
  padding: 20px;
  margin-bottom: 12px;
  cursor: pointer;
  transition: all 100ms ease;

  &:hover {
    border-color: #EDE9FE;
    box-shadow: 0 2px 12px rgba(0,0,0,0.06);
    transform: translateY(-1px);
  }

  &:focus-visible {
    outline: 2px solid var(--color-primary);
    outline-offset: 2px;
  }

  .release-card-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 12px;
  }

  .release-card-identity {
    .release-name {
      font: var(--text-h3); /* 20px / 600 */
      color: var(--color-text-primary);
    }

    .release-type {
      font: var(--text-label);
      color: var(--color-text-muted);
      background: var(--color-neutral-bg);
      padding: 2px 6px;
      border-radius: 4px;
      margin-left: 8px;
    }

    .release-role {
      font: var(--text-body-sm);
      color: var(--color-text-secondary);
      margin-left: 8px;
    }

    .release-meta {
      font: var(--text-body-sm);
      color: var(--color-text-secondary);
      margin-top: 4px;
    }
  }

  .release-health-badge {
    font: var(--text-label);
    font-weight: 500;
    padding: 4px 12px;
    border-radius: 12px;
    flex-shrink: 0;

    &.excellent { background: #F0FDF4; color: #16A34A; }
    &.healthy   { background: #F0FDF4; color: #16A34A; }
    &.attention { background: #FEF3C7; color: #D97706; }
    &.blocked   { background: #FEF2F2; color: #DC2626; }
    &.critical  { background: #FEF2F2; color: #DC2626; }
    &.complete  { background: #F0FDF4; color: #16A34A; }
  }

  .release-journey-inline {
    margin-bottom: 12px;
    padding: 12px;
    background: #FAFAFA;
    border-radius: 6px;

    .journey-stages {
      display: flex;
      align-items: center;
      gap: 0;
      margin-bottom: 8px;
    }

    .journey-stage-dot {
      width: 14px;
      height: 14px;
      border-radius: 50%;
      flex-shrink: 0;
      border: 2px solid var(--color-border);

      &.completed { background: #16A34A; border-color: #16A34A; }
      &.active    { background: var(--color-primary); border-color: var(--color-primary); }
    }

    .journey-stage-connector {
      width: 24px;
      height: 2px;
      background: var(--color-border);
      flex-shrink: 0;

      &.completed { background: #16A34A; }
    }

    .journey-progress-bar {
      height: 4px;
      background: var(--color-neutral-bg);
      border-radius: 2px;
      overflow: hidden;

      .journey-progress-fill {
        height: 100%;
        background: var(--color-primary);
        border-radius: 2px;
        transition: width 300ms;

        &.complete { background: #16A34A; }
        &.attention { background: #D97706; }
        &.critical  { background: #DC2626; }
      }
    }

    .journey-progress-label {
      font: var(--text-caption);
      color: var(--color-text-secondary);
      text-align: right;
      margin-top: 4px;
    }
  }

  .release-card-footer {
    display: flex;
    justify-content: space-between;
    align-items: center;

    .release-concerns {
      font: var(--text-body-sm);
      color: var(--color-text-secondary);
      display: flex;
      gap: 12px;

      .concern-item {
        display: flex;
        align-items: center;
        gap: 4px;
      }
    }

    .release-card-action {
      font: var(--text-body-sm);
      font-weight: 500;
      color: var(--color-primary);
      padding: 6px 16px;
      border-radius: 6px;
      border: 1px solid #EDE9FE;
      background: transparent;
      cursor: pointer;
      transition: background 100ms ease;

      &:hover {
        background: #F5F3FF;
      }
    }
  }
}

/* --- Profile --- */
.profile-section {
  margin-bottom: 32px;

  .profile-bio {
    font: var(--text-body);
    line-height: 1.7;
    color: var(--color-text-primary);
    margin-bottom: 16px;
  }

  .profile-social-links {
    display: flex;
    flex-wrap: wrap;
    gap: 12px;
    margin-bottom: 16px;

    .social-link {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 8px 12px;
      background: var(--color-surface);
      border: 1px solid var(--color-border);
      border-radius: 6px;
      font: var(--text-body-sm);
      color: var(--color-text-secondary);
      cursor: pointer;

      &:hover { border-color: #EDE9FE; }

      &.connected { color: var(--color-text-primary); border-color: #BBF7D0; }
      &.missing   { color: var(--color-text-muted); }
    }
  }

  .profile-completeness {
    .completeness-bar {
      height: 8px;
      background: var(--color-neutral-bg);
      border-radius: 4px;
      overflow: hidden;
      margin-bottom: 8px;

      .completeness-fill {
        height: 100%;
        background: var(--color-primary);
        border-radius: 4px;
        transition: width 300ms;
      }
    }

    .completeness-label {
      font: var(--text-body-sm);
      color: var(--color-text-secondary);
      display: flex;
      justify-content: space-between;
    }

    .completeness-missing {
      font: var(--text-caption);
      color: var(--color-text-muted);
      margin-top: 4px;
    }
  }
}

/* --- Attention Panel --- */
.attention-panel {
  margin-bottom: 32px;

  .attention-item {
    border-left: 3px solid #7C3AED;
    background: #F5F3FF;
    padding: 12px;
    margin-bottom: 8px;
    border-radius: 0 6px 6px 0;

    .attention-title {
      font: var(--text-body);
      font-weight: 600;
      color: var(--color-text-primary);
      margin-bottom: 4px;
    }

    .attention-meta {
      font: var(--text-body-sm);
      color: var(--color-text-secondary);
      margin-bottom: 8px;
    }

    .attention-actions {
      display: flex;
      gap: 8px;
    }
  }
}

/* --- Activity Feed --- */
.activity-feed {
  margin-bottom: 48px;

  .activity-item {
    padding: 6px 0;
    font: var(--text-body-sm);
    color: var(--color-text-secondary);
    cursor: pointer;
    display: flex;
    align-items: center;
    gap: 8px;

    &:hover { color: var(--color-text-primary); }

    .activity-icon {
      width: 20px;
      height: 20px;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }

    .activity-time {
      color: var(--color-text-muted);
      margin-left: auto;
    }
  }

  .activity-load-more {
    display: block;
    text-align: center;
    padding: 8px;
    font: var(--text-body-sm);
    color: var(--color-primary);
    cursor: pointer;
    border-radius: 6px;

    &:hover { background: #F5F3FF; }
  }
}

/* --- Context Rail --- */
.context-rail {
  width: 320px;
  flex-shrink: 0;
  border-left: 1px solid var(--color-border);
  background: #FAFAFA;
  overflow-y: auto;
  padding: 24px 20px;
  position: sticky;
  top: 56px;
  height: calc(100vh - 56px);
}

.context-section {
  margin-bottom: 24px;

  .context-section-title {
    font: var(--text-label);
    color: var(--color-text-muted);
    text-transform: uppercase;
    letter-spacing: 0.05em;
    margin-bottom: 12px;
  }

  .context-stat-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 8px;

    .context-stat {
      text-align: center;
      padding: 12px 8px;
      background: var(--color-surface);
      border: 1px solid var(--color-border);
      border-radius: 6px;
      cursor: pointer;
      transition: border-color 100ms ease;

      &:hover { border-color: #EDE9FE; }

      .stat-value {
        font: var(--text-h1); /* 24px / 600 */
        color: var(--color-text-primary);
      }

      .stat-label {
        font: var(--text-caption);
        color: var(--color-text-muted);
      }
    }
  }

  .context-release-list {
    .context-release-item {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 8px 0;
      border-bottom: 1px solid var(--color-border);
      cursor: pointer;
      font: var(--text-body-sm);

      &:hover { color: var(--color-primary); }
      &:last-child { border-bottom: none; }

      .context-release-health {
        width: 8px;
        height: 8px;
        border-radius: 50%;
        flex-shrink: 0;
      }
    }
  }

  .context-attention-list {
    .context-attention-item {
      font: var(--text-body-sm);
      color: var(--color-text-secondary);
      padding: 4px 0;
      display: flex;
      align-items: center;
      gap: 6px;
    }
  }

  .context-activity-list {
    .context-activity-item {
      font: var(--text-caption);
      color: var(--color-text-muted);
      padding: 4px 0;
      display: flex;
      align-items: center;
      gap: 6px;
    }
  }
}

/* --- Responsive --- */
@media (max-width: 1279px) {
  .context-rail {
    width: 280px;
  }

  .artist-main {
    max-width: calc(100% - 280px);
  }
}

@media (max-width: 1023px) {
  .context-rail {
    display: none;
  }

  .artist-main {
    max-width: 100%;
  }

  .context-stat-grid {
    /* Move stats inline within page */
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 8px;
    margin-bottom: 24px;
  }
}

@media (max-width: 767px) {
  .artist-header {
    flex-wrap: wrap;
  }

  .artist-photo {
    width: 64px;
    height: 64px;
  }

  .artist-actions {
    width: 100%;
    flex-direction: row;
    justify-content: flex-end;
    margin-top: 8px;
  }

  .artist-name {
    font-size: 24px;
  }

  .release-card {
    padding: 16px;
  }

  .release-card-header {
    flex-direction: column;
    gap: 8px;
  }

  .release-journey-inline {
    .journey-stages { overflow-x: auto; }
    .journey-stage-connector { width: 16px; }
  }

  .release-card-footer {
    flex-direction: column;
    gap: 8px;

    .release-card-action {
      width: 100%;
      text-align: center;
    }
  }

  .profile-social-links {
    flex-direction: column;
    gap: 8px;

    .social-link { width: 100%; }
  }

  .context-stat-grid {
    grid-template-columns: repeat(3, 1fr);
  }

  .attention-item .attention-actions {
    flex-direction: column;

    button { width: 100%; }
  }
}

@media (prefers-reduced-motion: reduce) {
  .release-card { transition: none; }
  .completeness-fill { transition: none; }
  .journey-progress-fill { transition: none; }
}
```
