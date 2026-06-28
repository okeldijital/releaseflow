# Operations Center — High-Fidelity Design

**Version:** 3.0 (Flagship)
**Status:** Approved
**Route:** `/operations`
**Hero Component:** Release Health Table

---

## Layout · 1440px Viewport

```
┌──────────────────────────────────────────────────────────────────────────────────┐
│  Application Shell                                                                 │
│                                                                                    │
│  ┌───────────┐ ┌────────────────────────────────────────────────────────────────┐ │
│  │ Sidebar   │ │ Top Nav · h 56px · bg Surface · border-b 1px #E4E4E7          │ │
│  │ w 240px   │ │ ┌────────────────────────────────────────────────────────────┐ │ │
│  │ bg #FFF   │ │ │ Operations Center              Aug 25, 2026      🔔(3)  👤  │ │ │
│  │           │ │ └────────────────────────────────────────────────────────────┘ │ │
│  │ ◆ Ops     │ │                                                                  │ │
│  │ ▸ Releases│ │  ─── Operational Summary ───────────────────────────────────    │ │
│  │ ▸ Tasks   │ │  ┌──────────────────────────────────────────────────────────┐   │ │
│  │ ▸ Assets  │ │  │ 5 active releases · 2 blocked · 3 overdue deadlines      │   │ │
│  │ ▸ Calendar│ │  │ 2 releases at risk · 1 critical dependency unresolved    │   │ │
│  │ ▸ Artists │ │  │                                      [+ Create Release]   │   │ │
│  │ ▸ Mktg    │ │  └──────────────────────────────────────────────────────────┘   │ │
│  │ ▸ Dist    │ │  mb 32px                                                         │ │
│  │ ▸ Reports │ │                                                                  │ │
│  │           │ │  ─── Release Health ────────────────────────────────────────    │ │
│  │ Acme ▼    │ │  ┌──────────────────────────────────────────────────────────┐   │ │
│  └───────────┘ │  │ Release            │ Health   │ Stage    │ Deadline  │ Owner│  │ │
│  │             │  │────────────────────┼──────────┼──────────┼───────────┼─────│  │ │
│  │             │  │ Lua · EP           │ 🟡 Atten │ Mastering│ Aug 20 🔴 │ Alex│  │ │
│  │             │  │ Kinn Timo          │  ◉◉◉◉◉○○○ │ 4/7 done │ 5d overdue│  PM │  │ │
│  │             │  ├────────────────────┼──────────┼──────────┼───────────┼─────│  │ │
│  │             │  │ Mid Sess · Single  │ 🟡 Atten │ Mixing   │ Sep 10 🟢 │ SamW│  │ │
│  │             │  │ Various            │  ◉◉◉◉◉◉○○○ │ 5/7 done │ 16 days   │  PM │  │ │
│  │             │  ├────────────────────┼──────────┼──────────┼───────────┼─────│  │ │
│  │             │  │ Summer EP · EP     │ 🟢 Heal. │ Artwork  │ Aug 28 🟡 │ AMgr│  │ │
│  │             │  │ Maya Rivers        │  ◉◉◉◉◉◉◉○○ │ 6/7 done │ 3 days    │  Mgr│  │ │
│  │             │  ├────────────────────┼──────────┼──────────┼───────────┼─────│  │ │
│  │             │  │ Neon Remix · Remix │ 🔴 Crit  │ Prod     │ Sep 05 🟢 │ Alex│  │ │
│  │             │  │ DJ Spark           │  ◉◉◉◉○○○○○○│ 2/7 done │ 11 days   │  PM │  │ │
│  │             │  ├────────────────────┼──────────┼──────────┼───────────┼─────│  │ │
│  │             │  │ Winter Coll · Comp │ 🟡 Atten │ Planning │ Oct 01 🟢 │ AMgr│  │ │
│  │             │  │ Various            │  ◉◉◉○○○○○○ │ 1/7 done │ 37 days   │  Mgr│  │ │
│  │             │  └──────────────────────────────────────────────────────────┘   │ │
│  │             │  mb 48px                                                         │ │
│  │             │                                                                  │ │
│  │             │  ─── Attention ─────────────────────────────────────────────    │ │
│  │             │  ┌──────────────────────────────────────────────────────────┐   │ │
│  │             │  │ Alerts (3)                                                 │   │ │
│  │             │  │                                                            │   │ │
│  │             │  │ ┌── 3px #DC2626 ─────────────────────────────────────────┐│   │ │
│  │             │  │ │ 🔴 CRITICAL · Lua — Ad budget exceeded by $3,000        ││   │ │
│  │             │  │ │    Blocking: Campaign · 3 days · Owner: Alex PM         ││   │ │
│  │             │  │ │    ┌──────────┐ ┌──────────────┐                        ││   │ │
│  │             │  │ │    │ Resolve  │ │ Acknowledge  │                        ││   │ │
│  │             │  │ │    └──────────┘ └──────────────┘                        ││   │ │
│  │             │  │ └─────────────────────────────────────────────────────────┘│   │ │
│  │             │  │                                                            │   │ │
│  │             │  │ ┌── 3px #DC2626 ─────────────────────────────────────────┐│   │ │
│  │             │  │ │ 🔴 CRITICAL · Mid Sess — Cover art pending 4 days       ││   │ │
│  │             │  │ │    Reviewer: Sam A&R · Stage: Artwork                   ││   │ │
│  │             │  │ │    ┌──────────┐ ┌──────────┐                            ││   │ │
│  │             │  │ │    │  Nudge   │ │ Reassign │                            ││   │ │
│  │             │  │ │    └──────────┘ └──────────┘                            ││   │ │
│  │             │  │ └─────────────────────────────────────────────────────────┘│   │ │
│  │             │  │                                                            │   │ │
│  │             │  │ ┌── 3px #D97706 ─────────────────────────────────────────┐│   │ │
│  │             │  │ │ 🟡 WARNING · Sam W — 5 releases (overloaded)             ││   │ │
│  │             │  │ │    ┌──────────────┐                                      ││   │ │
│  │             │  │ │    │ Redistribute │                                      ││   │ │
│  │             │  │ │    └──────────────┘                                      ││   │ │
│  │             │  │ └─────────────────────────────────────────────────────────┘│   │ │
│  │             │  └──────────────────────────────────────────────────────────┘   │ │
│  │             │  mb 32px                                                         │ │
│  │             │                                                                  │ │
│  │             │  ┌──────────────────────────────────────────────────────────┐   │ │
│  │             │  │ Blocked Work (2)                                           │   │ │
│  │             │  │                                                            │   │ │
│  │             │  │ ┌── 3px #DC2626 ─────────────────────────────────────────┐│   │ │
│  │             │  │ │ 🔴 Mech License · Melodic Pub · 12 days blocked          ││   │ │
│  │             │  │ │    Blocks: Lua Distribution + T3,T4 · Contacted 3x      ││   │ │
│  │             │  │ │    ┌──────────┐ ┌──────────┐                            ││   │ │
│  │             │  │ │    │ Follow Up│ │ Escalate │                            ││   │ │
│  │             │  │ │    └──────────┘ └──────────┘                            ││   │ │
│  │             │  │ └─────────────────────────────────────────────────────────┘│   │ │
│  │             │  │                                                            │   │ │
│  │             │  │ ┌── 3px #D97706 ─────────────────────────────────────────┐│   │ │
│  │             │  │ │ 🟡 Mid Sess — Budget advertising +$3K forecast           ││   │ │
│  │             │  │ │    ┌──────────┐                                          ││   │ │
│  │             │  │ │    │  Adjust  │                                          ││   │ │
│  │             │  │ │    └──────────┘                                          ││   │ │
│  │             │  │ └─────────────────────────────────────────────────────────┘│   │ │
│  │             │  └──────────────────────────────────────────────────────────┘   │ │
│  │             │  mb 32px                                                         │ │
│  │             │                                                                  │ │
│  │             │  ┌──────────────────────────────────────────────────────────┐   │ │
│  │             │  │ Critical Deadlines (5)                                     │   │ │
│  │             │  │                                                            │   │ │
│  │             │  │  🔴 Lua · Mastering · Aug 20 · 5d ago · Sam Wilson        │   │ │
│  │             │  │  🔴 Lua · ISRC T4 · Aug 22 · 3d ago · Alex PM             │   │ │
│  │             │  │  🔴 Mid Sess · Artwork · Aug 18 · 7d ago · Sam A&R        │   │ │
│  │             │  │  🟡 Summer EP · ISRC · Aug 25 · Today · Alex PM           │   │ │
│  │             │  │  🟢 Neon Remix · Artwork · Aug 28 · 3 days · Taylor       │   │ │
│  │             │  └──────────────────────────────────────────────────────────┘   │ │
│  │             │  mb 48px                                                         │ │
│  │             │                                                                  │ │
│  │             │  ─── Org Pulse ─────────────────────────────────────────────    │ │
│  │             │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌────────┐│ │
│  │             │  │    5     │ │    2     │ │    3     │ │    2     │ │   2    ││ │
│  │             │  │  active  │ │ blocked  │ │ overdue  │ │   over   │ │shipped ││ │
│  │             │  │ releases │ │  stages  │ │deadlines │ │  budget  │ │this mo ││ │
│  │             │  └──────────┘ └──────────┘ └──────────┘ └──────────┘ └────────┘│ │
│  │             │                                                                  │ │
│  │             │  Last updated: 3m ago                                  [↻ Refresh]│ │
│  │             └──────────────────────────────────────────────────────────────────┘ │
│  └───────────┘                                                                      │
└──────────────────────────────────────────────────────────────────────────────────────┘
```

---

## Component Inventory

### Required Components

| Component | Section | PDS Ref | Purpose |
|-----------|---------|---------|---------|
| **Release Header** | (via table) | PDS-11 | Release identity inline within Health Table rows |
| **Operational Summary** | Top section | OI-015, SA-004 | Explains the current situation at a glance |
| **Release Health Table** | Hero Component | SA-005 | All releases with health, stage, deadline, owner |
| **Attention Panel** | Alerts section | PDS-11 | Alerts requiring immediate action |
| **Attention Panel** | Blocked Work section | PDS-11 | Dependencies blocking workflow progression |
| **Attention Panel** | Deadlines section | PDS-11 | Time-critical items sorted by urgency |
| **Context Rail** | N/A (Ops Center) | SA-007 | Not applicable to Operations Center; this is the aggregate view |

### Base Components Used

| Component | Usage |
|-----------|-------|
| Table | Release Health Table |
| Badge | Severity labels (CRITICAL, WARNING) |
| StatusBadge | Health state dots (🟢🟡🔴) |
| Button (M, 40px) | Resolve, Acknowledge, Follow Up, Escalate, Adjust |
| Button (L, primary) | + Create Release |
| ProgressBar | Health percentage inline |
| MetricCard | Org Pulse stat cards |
| Tabs | Top nav section filtering (all releases / at risk / blocked) |
| Segmented Control | Release Health table filter |

### Components Explicitly Excluded

- ~~Workflow Board~~ — Not on Ops Center (aggregate view)
- ~~Release Journey~~ — Not on Ops Center (single release detail)
- ~~Health Ring~~ — Not on Ops Center (single release detail)
- ~~Readiness Stack~~ — Not on Ops Center (single release detail)
- ~~Activity Feed~~ — Replaced by Org Pulse + Attention Panel

---

## Interaction Notes

### Release Health Table

| Interaction | Trigger | Result |
|-------------|---------|--------|
| Row click | Click any release row | Navigate to `/releases/[id]` |
| Health column sort | Click column header | Sort by health: Critical → Attention → Healthy → Excellent |
| Deadline column sort | Click column header | Sort chronologically |
| Stage column sort | Click column header | Sort by stage progression |
| Row hover | Hover over row | Row bg → #FAFAFA, subtle elevation |
| Filter | Click filter tabs | Filter table: All \| At Risk \| Blocked \| My Releases |

### Attention Panel — Alerts

| Interaction | Trigger | Result |
|-------------|---------|--------|
| Resolve | Click | Deep link to source entity (budget, stage, dependency) |
| Acknowledge | Click | Transition alert to acknowledged state, suppress notifications |
| Nudge | Click | Send notification to responsible person |
| Reassign | Click | Open reassignment modal |

### Attention Panel — Blocked Work

| Interaction | Trigger | Result |
|-------------|---------|--------|
| Follow Up | Click | Log contact attempt on dependency |
| Escalate | Click | Open escalation modal → reassign + notify stakeholders |
| Adjust | Click | Deep link to Budget Workspace |

### Attention Panel — Deadlines

| Interaction | Trigger | Result |
|-------------|---------|--------|
| Deadline row click | Click | Deep link to entity (stage, task, deliverable, checklist) |
| Deadline row hover | Hover | Row bg lightens, cursor pointer |

### Org Pulse

| Interaction | Trigger | Result |
|-------------|---------|--------|
| Stat card click | Click | Filter operations center to that category |
| Refresh icon | Click | Re-fetch all data (optimistic with timestamp update) |

### Primary Action

| Interaction | Trigger | Result |
|-------------|---------|--------|
| + Create Release | Click | Open Create Release modal |

---

## Mobile Adaptation

### ≥1024px (Desktop)
- Sidebar visible (240px)
- Content max-width 960px centered
- Release Health Table as full table
- Org Pulse: 5 cards in row
- Alert buttons inline (row)

### 768–1023px (Tablet)
- Sidebar collapsed to hamburger / icon rail (56px)
- Content full-width minus sidebar
- Release Health Table: horizontal scroll
- Org Pulse: 3+2 grid
- Section spacing: 24px (was 32px)

### <768px (Phone)
- No sidebar. Bottom tab bar for primary navigation
- Page padding: 16px
- Content max-width: 100vw - 32px
- **Release Health Table → Card list**
  - Each release becomes a card with left health border
  - Stacked vertically
  - Key info: release name, artist, health dot, stage, deadline
  - Tap to navigate
- **Alerts/Blockers**: Full-width cards, buttons stacked full-width
- **Deadlines**: Stacked mini-cards with left urgency border
- **Org Pulse**: 3+2 grid (cards ~100px wide)
- Section spacing: 24px
- **"Since you were away"**: Hidden on mobile; accessible via Activity tab

---

## Accessibility Notes

| Requirement | Implementation |
|-------------|---------------|
| Color dependency | All health states use icon + text alongside color (CRITICAL dot + "CRITICAL" label) |
| Focus order | Sidebar → Operational Summary → Primary Action → Release Health Table → Alerts → Blocked Work → Deadlines → Org Pulse → Refresh |
| Keyboard nav | Table rows: Enter to navigate, Tab between columns, Arrow keys to navigate rows |
| Screen reader | Table: role="grid", each row role="row" with aria-label including release name and health. Alert cards: role="alert" for critical, role="status" for warning. |
| Touch targets | Minimum 44x44px for all interactive elements (mobile). At 40px button height, ensures width ≥88px. |
| Contrast | #18181B on #FFFFFF = 15.3:1 (AAA). #DC2626 on #FEF2F2 = 6.2:1 (AA). #52525B on #FFFFFF = 7.1:1 (AAA). |
| Text scaling | Layout supports 200% text zoom without horizontal scroll at desktop |
| Motion | No auto-playing animations. Refresh icon static unless pressed. |
| ARIA landmarks | role="banner" (top nav), role="navigation" (sidebar), role="main" (content), role="region" per section with aria-label |

---

## Compliance Checklist

| PDS Ref | Rule | Status |
|---------|------|--------|
| PDS-04 VL-101 | Typography leads hierarchy | ✅ Page title 36px/700 → H2 20px/600 → Body 14px |
| PDS-04 VL-102 | Space communicates relationships | ✅ 32px between sections, 12px card padding, 8px between cards |
| PDS-04 VL-103 | Colour explains meaning | ✅ Severity colors mapped to operational states |
| PDS-04 VL-104 | Layout creates confidence | ✅ Consistent reading pattern: Identity → Situation → Decision → Work → History |
| PDS-05 DE-001 | Cognitive economy | ✅ Five questions answered in 5 seconds |
| PDS-05 DE-002 | Five second rule | ✅ Where am I, what's happening, what needs attention, what next, is it healthy |
| PDS-05 DE-003 | One Hero Component | ✅ Release Health Table only |
| PDS-05 DE-004 | Visual rhythm | ✅ Spacing follows 8/16/24/32/48/64/96 scale |
| PDS-05 DE-005 | Progressive disclosure | ✅ Table → click row → Release Workspace |
| PDS-05 DE-006 | Context never disappears | ✅ Page title, date, org pulse always visible |
| PDS-06 VG-001 | Everything communicates | ✅ No decorative elements; every dot, badge answers a question |
| PDS-06 VG-003 | Health grammar | ✅ Five health states used consistently |
| PDS-06 VG-004 | Time grammar | ✅ Relative times ("5d ago", "Today", "3 days") |
| PDS-07 OI-001 | Measure confidence | ✅ Health table reflects calculated health, not % complete |
| PDS-07 OI-002 | Release Health | ✅ Health inputs: workflow, dependencies, approvals, deliverables, schedule, budget, rights, distribution, alerts, blockers |
| PDS-07 OI-015 | Operational Summary | ✅ Summarises situation before detailed table |
| PDS-08 IL-001 | Interactions disappear | ✅ One click to navigate; no intermediate dialogs |
| PDS-08 IL-002 | One primary action | ✅ + Create Release, top-right |
| PDS-08 IL-004 | Progressive interaction | ✅ Primary (table) → Secondary (alerts) |
| PDS-08 IL-005 | Immediate feedback | ✅ Optimistic updates on acknowledge/refresh |
| PDS-12 SA-001 | Universal screen structure | ✅ Shell → Header → Summary → Primary Action → Hero → Supporting → Activity → Footer |
| PDS-12 SA-002 | Application Shell | ✅ Sidebar + top nav persistent |
| PDS-12 SA-003 | Screen Header | ✅ Page title, date, primary action |
| PDS-12 SA-004 | Operational Summary | ✅ Present at top |
| PDS-12 SA-005 | Hero Component | ✅ Release Health Table |
| PDS-12 SA-013 | Ops Center Blueprint | ✅ Attention → Release Health → Pipeline → Activity |

---

## Implementation Tokens

```css
.operations-center {
  max-width: 960px;
  margin: 0 auto;
  padding: 24px;
}

.ops-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;

  .page-title {
    font: var(--display-sm); /* 36px / 700 */
    color: var(--color-text-primary); /* #18181B */
  }

  .page-date {
    font: var(--text-caption); /* 12px / 400 */
    color: var(--color-text-muted); /* #A1A1AA */
  }
}

.ops-summary {
  margin-bottom: 32px;
  padding: 16px 20px;
  background: var(--color-surface); /* #FFFFFF */
  border: 1px solid var(--color-border); /* #E4E4E7 */
  border-radius: 8px;
  display: flex;
  justify-content: space-between;
  align-items: center;

  .summary-text {
    font: var(--text-body); /* 14px / 400 */
    color: var(--color-text-primary);
    line-height: 1.6;
  }

  .summary-metrics {
    display: flex;
    gap: 16px;
    font: var(--text-body-sm); /* 12px / 400 */
    color: var(--color-text-secondary); /* #52525B */
  }

  .summary-metric-value {
    font-weight: 600;
    color: var(--color-text-primary);
  }
}

.ops-section {
  margin-bottom: 32px;

  .section-header {
    font: var(--text-h2); /* 20px / 600 */
    color: var(--color-text-primary);
    margin-bottom: 12px;
    display: flex;
    align-items: center;
    gap: 8px;

    .section-count {
      font: var(--text-label); /* 12px / 500 */
      color: var(--color-text-secondary);
      padding: 2px 8px;
      background: var(--color-neutral-bg); /* #F4F4F5 */
      border-radius: 12px;
    }
  }
}

.release-health-table {
  width: 100%;
  border-collapse: separate;
  border-spacing: 0;
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: 8px;
  overflow: hidden;

  th {
    font: var(--text-label); /* 12px / 500 */
    color: var(--color-text-secondary);
    text-align: left;
    padding: 10px 12px;
    border-bottom: 1px solid var(--color-border);
    text-transform: uppercase;
    letter-spacing: 0.05em;
    cursor: pointer;
    user-select: none;

    &:hover { color: var(--color-text-primary); }
  }

  td {
    padding: 14px 12px;
    font: var(--text-body); /* 14px / 400 */
    border-bottom: 1px solid var(--color-border);
    vertical-align: middle;
  }

  tr:last-child td { border-bottom: none; }

  tr.release-row {
    cursor: pointer;
    transition: background 100ms ease;

    &:hover { background: #FAFAFA; }
    &:focus-visible {
      outline: 2px solid var(--color-primary);
      outline-offset: -2px;
    }
  }

  .release-name {
    font-weight: 600;
    color: var(--color-text-primary);
  }

  .release-artist {
    font: var(--text-body-sm); /* 12px / 400 */
    color: var(--color-text-secondary);
    margin-top: 2px;
  }

  .release-type {
    font: var(--text-label);
    color: var(--color-text-muted);
    background: var(--color-neutral-bg);
    padding: 2px 6px;
    border-radius: 4px;
    margin-left: 8px;
  }

  .health-cell {
    display: flex;
    align-items: center;
    gap: 8px;

    .health-dot {
      width: 10px;
      height: 10px;
      border-radius: 50%;
      flex-shrink: 0;
    }

    .health-label {
      font: var(--text-body-sm);
      font-weight: 500;
    }

    .health-bar {
      width: 80px;
      height: 4px;
      background: var(--color-neutral-bg);
      border-radius: 2px;
      margin-left: 8px;

      .health-bar-fill {
        height: 100%;
        border-radius: 2px;
        transition: width 300ms ease;
      }
    }

    &.excellent { .health-dot { background: #16A34A; } .health-bar-fill { background: #16A34A; } .health-label { color: #16A34A; } }
    &.healthy   { .health-dot { background: #16A34A; } .health-bar-fill { background: #16A34A; } .health-label { color: #16A34A; } }
    &.attention { .health-dot { background: #D97706; } .health-bar-fill { background: #D97706; } .health-label { color: #D97706; } }
    &.blocked   { .health-dot { background: #DC2626; } .health-bar-fill { background: #DC2626; } .health-label { color: #DC2626; } }
    &.critical  { .health-dot { background: #DC2626; } .health-bar-fill { background: #DC2626; } .health-label { color: #DC2626; } }
  }

  .deadline-cell {
    .deadline-date {
      font-weight: 500;
    }

    .deadline-relative {
      font: var(--text-body-sm);
      margin-left: 6px;
    }

    &.overdue     { .deadline-date { color: #DC2626; } .deadline-relative { color: #DC2626; } }
    &.this-week   { .deadline-date { color: #D97706; } .deadline-relative { color: #52525B; } }
    &.future      { .deadline-date { color: #18181B; } .deadline-relative { color: #A1A1AA; } }
  }
}

.alert-card {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-left: 3px solid var(--alert-severity-color, var(--color-border));
  border-radius: 0 6px 6px 0;
  padding: 12px;
  margin-bottom: 8px;

  &.critical  { --alert-severity-color: #DC2626; background: #FEF2F2; }
  &.warning   { --alert-severity-color: #D97706; background: #FEF3C7; }
  &.info      { --alert-severity-color: #2563EB; background: #EFF6FF; }
  &.acknowledged {
    --alert-severity-color: #A1A1AA;
    background: #FAFAFA;
  }

  .alert-severity-badge {
    font: var(--text-label);
    font-weight: 500;
    margin-bottom: 4px;

    .critical & { color: #DC2626; }
    .warning &  { color: #D97706; }
    .info &     { color: #2563EB; }
  }

  .alert-title {
    font: var(--text-body);
    font-weight: 600;
    color: var(--color-text-primary);
    margin-bottom: 4px;
  }

  .alert-description {
    font: var(--text-body-sm);
    color: var(--color-text-secondary);
    margin-bottom: 8px;
  }

  .alert-actions {
    display: flex;
    gap: 8px;
  }
}

.org-pulse-grid {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 12px;
}

.org-pulse-card {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: 8px;
  padding: 16px;
  cursor: pointer;
  transition: border-color 100ms ease;

  &:hover {
    border-color: #EDE9FE;
  }

  .pulse-value {
    font: var(--text-h1); /* 24px / 600 */
    color: var(--color-text-primary);
    margin-bottom: 4px;
  }

  .pulse-label {
    font: var(--text-body-sm); /* 12px / 400 */
    color: var(--color-text-secondary);
  }
}

.ops-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font: var(--text-caption); /* 11px / 400 */
  color: var(--color-text-muted); /* #A1A1AA */

  .refresh-btn {
    display: flex;
    align-items: center;
    gap: 4px;
    cursor: pointer;
    padding: 4px 8px;
    border-radius: 4px;
    transition: background 100ms ease;

    &:hover { background: var(--color-neutral-bg); }
  }
}

/* Responsive */
@media (max-width: 1023px) {
  .org-pulse-grid {
    grid-template-columns: repeat(3, 1fr);
  }
}

@media (max-width: 767px) {
  .ops-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 4px;
  }

  .ops-summary {
    flex-direction: column;
    gap: 12px;
  }

  .release-health-table {
    /* Convert to card list */
    display: block;

    thead { display: none; }
    tbody, tr, td { display: block; }

    tr.release-row {
      border: 1px solid var(--color-border);
      border-radius: 8px;
      padding: 12px;
      margin-bottom: 8px;
    }

    td {
      padding: 4px 0;
      border-bottom: none;
    }

    .health-cell {
      margin-bottom: 8px;
    }
  }

  .org-pulse-grid {
    grid-template-columns: repeat(3, 1fr);
  }

  .alert-actions {
    flex-direction: column;

    button { width: 100%; }
  }
}
```
