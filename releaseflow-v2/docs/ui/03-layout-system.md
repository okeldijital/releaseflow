# Layout System — ReleaseFlow UI

> Version: 1.0 | Last Updated: 2026-06-24

---

## Shell Layout

The application shell wraps every authenticated page.

```
┌──────────────────────────────────────────────────────┐
│ Sidebar (260px)  │  Topbar (h: 64px)                 │
│                  ├───────────────────────────────────┤
│ Navigation       │                                   │
│                  │  Content Area                     │
│ • Dashboard      │  (scrollable)                     │
│ • Releases       │                                   │
│ • Artists        │                                   │
│ • Campaigns      │                                   │
│ • Organizations  │                                   │
│ • Contributor    │                                   │
│                  │                                   │
│ ──────────       │                                   │
│ User Avatar      │                                   │
│ Sign Out         │                                   │
│                  │                                   │
└──────────────────┴───────────────────────────────────┘
```

### Sidebar

| Property | Value |
|---|---|
| Width | `260px` (fixed) |
| Background | `surface.900` (dark) or `surface.50` (light) |
| Padding | `space.4` |
| Logo area | Height `64px`, matches Topbar |
| Nav items | `44px` height, `8px` gap |
| Active state | Left border `3px primary.500`, bg `surface.800` |
| User section | Bottom, border-top `surface.700` |
| Collapsible | Mobile: overlay + backdrop; Desktop: always visible |

### Topbar

| Property | Value |
|---|---|
| Height | `64px` |
| Background | `surface.50` with `blur(8px)` backdrop |
| Border bottom | `1px surface.200` |
| Content | Left: mobile hamburger; Center: breadcrumb; Right: org selector + notifications |
| Sticky | `position: sticky; top: 0; z-index: 40` |

### Content Area

| Property | Value |
|---|---|
| Padding | `space.8` (32px) horizontal, `space.6` (24px) vertical |
| Max width | `1200px` centered (default), full-width for data grids |
| Background | `surface.50` |
| Scroll | Auto, independent from sidebar |

---

## Workspace Layout

Detail views with primary content and context panel.

```
┌──────────────────────────────────────────────────────┐
│ Topbar                                               │
├──────────────────────────────────────────────────────┤
│                                        │             │
│  Main Area (flex-1)                    │ Context     │
│                                        │ Rail (320px)│
│  ┌──────────────────────────┐          │             │
│  │ Header + Actions         │          │ • Metadata  │
│  └──────────────────────────┘          │ • Status    │
│                                        │ • Activity  │
│  ┌──────────────────────────┐          │ • Timeline  │
│  │ Workflow / Stages        │          │             │
│  └──────────────────────────┘          │             │
│                                        │             │
│  ┌──────────────────────────┐          │             │
│  │ Tracks / Deliverables    │          │             │
│  └──────────────────────────┘          │             │
│                                        │             │
└──────────────────────────────────────────────────────┘
```

### Main Area

| Property | Value |
|---|---|
| Flex | `1` (fills remaining space) |
| Max width | None (constrained by context rail) |
| Scroll | Vertical, independent |
| Gap | `space.6` (24px) between sections |

### Context Rail

| Property | Value |
|---|---|
| Width | `320px` |
| Background | `surface.100` |
| Border left | `1px surface.200` |
| Position | Sticky, top: `64px` (below topbar) |
| Sections | Metadata block, Status badge, Activity feed, Timeline |
| Scroll | Independent vertical scroll |

---

## Dashboard Layout

Metric overview with work area and activity feed.

```
┌──────────────────────────────────────────────────────┐
│ Topbar                                               │
├──────────────────────────────────────────────────────┤
│                                                      │
│  Metrics Row (3 columns)                             │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐              │
│  │ Metric   │ │ Metric   │ │ Metric   │              │
│  │ Card     │ │ Card     │ │ Card     │              │
│  └──────────┘ └──────────┘ └──────────┘              │
│                                                      │
│  ┌───────────────────────┐ ┌────────────────────┐    │
│  │ Work Area (2/3)       │ │ Activity (1/3)     │    │
│  │                       │ │                    │    │
│  │ • Recent Releases     │ │ • Recent events    │    │
│  │ • Tasks               │ │ • Notifications    │    │
│  │ • Budget Overview     │ │ • Alerts           │    │
│  │                       │ │                    │    │
│  └───────────────────────┘ └────────────────────┘    │
│                                                      │
└──────────────────────────────────────────────────────┘
```

### Metrics Row

| Property | Value |
|---|---|
| Grid | `grid-cols-3` (responsive: 1 col on mobile) |
| Gap | `space.4` (16px) |
| Card height | `120px` (fixed) |

### Work Area

| Property | Value |
|---|---|
| Width | `2/3` (responsive: full-width on mobile) |
| Sections | Recent Releases, My Tasks, Budget Overview |
| Section gap | `space.6` (24px) |

### Activity

| Property | Value |
|---|---|
| Width | `1/3` (responsive: full-width on mobile) |
| Sections | Notifications, Alerts, Timeline |
| Max items | 10 per section, "View all" link |
| Scroll | Fixed height `400px`, internal scroll |

---

## Responsive Breakpoints

| Breakpoint | Min Width | Layout |
|---|---|---|
| `sm` | `640px` | Single column, sidebar hidden (mobile) |
| `md` | `768px` | Sidebar appears, 2-column grids |
| `lg` | `1024px` | Context rail appears, 3-column grids |
| `xl` | `1280px` | Full layout, wider content area |
| `2xl` | `1536px` | Dashboard: 4 metric columns |

### Mobile Adaptations

| Component | Mobile | Desktop |
|---|---|---|
| Sidebar | Overlay, triggered by hamburger | Always visible |
| Context Rail | Bottom sheet or full-width section | Sticky right panel |
| Metric Cards | Stacked vertically | 3-4 column grid |
| Tables | Card list view | Full table |
| Modals | Full-screen sheet | Centered dialog |
