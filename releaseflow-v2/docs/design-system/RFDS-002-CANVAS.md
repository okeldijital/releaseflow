# RFDS-002 — Canvas System

**Status:** Active
**Version:** 1.0

---

## The Canvas

The canvas is the full application page. It contains the navigation rail and five content zones.

```
┌─────────────────────────────────────────────────────┐
│                                                     │
│  Navigation Rail (left, fixed)                     │
│  ┌────┬─────────────────────────────────────────┐  │
│  │    │                                         │  │
│  │ N  │  ┌─────────────────────────────────┐   │  │
│  │ a  │  │ Situation Zone (Hero)           │   │  │
│  │ v  │  └─────────────────────────────────┘   │  │
│  │    │                                         │  │
│  │    │  ┌─────────────────────────────────┐   │  │
│  │    │  │ Decision Zone                    │   │  │
│  │    │  └─────────────────────────────────┘   │  │
│  │    │                                         │  │
│  │    │  ┌─────────────────────────────────┐   │  │
│  │    │  │ Evidence Zone (Tables, Metrics)  │   │  │
│  │    │  └─────────────────────────────────┘   │  │
│  │    │                                         │  │
│  │    │  ┌─────────────────────────────────┐   │  │
│  │    │  │ Context Zone (Context Rail)      │   │  │
│  │    │  └─────────────────────────────────┘   │  │
│  │    │                                         │  │
│  │    │  ┌─────────────────────────────────┐   │  │
│  │    │  │ History Zone                     │   │  │
│  │    │  └─────────────────────────────────┘   │  │
│  │    │                                         │  │
│  └────┴─────────────────────────────────────────┘  │
│                                                     │
└─────────────────────────────────────────────────────┘
```

---

## The Six Zones

### 1. Application Header
- Position: top of the canvas
- Height: 64px (from PDS)
- Content: breadcrumbs, search, notifications, command palette, user menu, org switcher
- Persistent: yes, always visible

### 2. Navigation Rail
- Position: left side of canvas
- Width: 72px (collapsed) or 256px (expanded) — from PDS
- Content: navigation, brand, user
- Peripheral: visually quieter than content

### 3. Situation Zone
- Purpose: current operational state
- Top of content area, immediately after the header
- Examples: page hero, briefing
- Priority: 100 (from RFDS-001 attention model)

### 4. Decision Zone
- Purpose: what requires action
- Directly below Situation
- Examples: assessment, immediate actions
- Priority: 80–90

### 5. Evidence Zone
- Purpose: supporting data for decisions
- Below Decision
- Examples: tables, metrics, org pulse
- Priority: 70

### 6. Context Zone
- Purpose: supplemental information, navigation between related items
- Position: right side of canvas or below Evidence
- Examples: context rail, tabs
- Priority: 50

### 7. History Zone
- Purpose: chronological record of what happened
- Bottom of content area
- Examples: activity feed, audit log
- Priority: 10

---

## Canvas Padding

The canvas breathes. The page content should never touch the edge of the browser.

| Breakpoint | Side Padding | Top Padding |
|-----------|-------------|------------|
| Desktop ≥1024px | 32px (px-8) | 40px (py-10) |
| Laptop 768–1023px | 24px (px-6) | 32px (py-8) |
| Tablet 640–767px | 20px (px-5) | 24px (py-6) |
| Mobile <640px | 16px (px-4) | 20px (py-5) |

---

## Canvas Behaviour

- The navigation rail is always visible on desktop. On mobile, it overlays as a drawer.
- Content always flows within the content area, never bleeding under the rail.
- The 64px topbar and 72–256px nav rail together define the available content area.
- Content scrolls vertically. The rail and topbar stay fixed.

---

## When to Use Each Zone

| Zone | Use When | Avoid When |
|------|---------|------------|
| Situation | The user needs to know what is happening before anything else | The answer is simple enough to fit in a subtitle |
| Decision | The user should do something specific now | The data is reference, not actionable |
| Evidence | The user needs the numbers to confirm the decision | The data is historical or exploratory |
| Context | The user might want to navigate or see details | The information is required for the decision |
| History | The user wants to verify what happened | The events are too recent to need recording |
| Navigation | The user needs to move elsewhere | The user is in the middle of a task |
