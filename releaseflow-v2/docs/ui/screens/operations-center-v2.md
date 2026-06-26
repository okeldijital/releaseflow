# Operations Center v2 — Visual Spec

## Route

`/operations`

## Layout Shell

```
┌──────────────────────────────────────────────────────────────────────────┐
│  operations layout · 1440px viewport                                     │
│                                                                           │
│  ┌────────────┐ ┌────────────────────────────────────────────────────────┐
│  │ Sidebar    │ │ Top Nav bar · h 56px · bg Surface                      │
│  │ w 240px    │ │ ────────────────────────────────────────────────────   │
│  │ bg Surface │ │                                                        │
│  │            │ │  Operations Center              Aug 25, 2026            │
│  │            │ │  ───────────────────────────────────────────────────   │
│  │            │ │                                                        │
│  │            │ │  ─── Since Aug 22 ────────────────────────────────────  │
│  │            │ │  [Card · p 16px · mb 8px]                               │
│  │            │ │                                                        │
│  │            │ │  ─── Alerts (3) ───────────────────────────────────────  │
│  │            │ │  ┌────────────────────────────────────────────────────┐ │
│  │            │ │  │ Alert card · p 12px · mb 8px                      │ │
│  │            │ │  │ ┌── left border 3px severity color                 │ │
│  │            │ │  │ │                                                  │ │
│  │            │ │  │ │ 🔴 CRITICAL                                      │ │
│  │            │ │  │ │ Lua — Advertising budget exceeded by $3,000     │ │
│  │            │ │  │ │ Blocking: Campaign · 3 days                      │ │
│  │            │ │  │ │                                                  │ │
│  │            │ │  │ │ ┌──────────┐ ┌──────────────┐                    │ │
│  │            │ │  │ │ │ Resolve  │ │ Acknowledge  │  ← btn M 40px     │ │
│  │            │ │  │ │ └──────────┘ └──────────────┘                    │ │
│  │            │ │  │ └──────────────────────────────────────────────────┤ │
│  │            │ │  └────────────────────────────────────────────────────┘ │
│  │            │ │                                                        │
│  │            │ │  ─── Blocked Work (2) ────────────────────────────────  │
│  │            │ │  ┌────────────────────────────────────────────────────┐ │
│  │            │ │  │ Blocker card · same pattern as alert              │ │
│  │            │ │  │ ┌── left border 3px red                           │ │
│  │            │ │  │ │ Follow Up / Escalate buttons                    │ │
│  │            │ │  └────────────────────────────────────────────────────┘ │
│  │            │ │                                                        │
│  │            │ │  ─── Critical Deadlines (5) ──────────────────────────  │
│  │            │ │  ┌────────────────────────────────────────────────────┐ │
│  │            │ │  │ Deadline rows · h 40px · body 14px                │ │
│  │            │ │  │ Color dot · release · item · date · owner          │ │
│  │            │ │  └────────────────────────────────────────────────────┘ │
│  │            │ │                                                        │
│  │            │ │  ─── Org Pulse ──────────────────────────────────────  │
│  │            │ │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ │
│  │            │ │  │ Stat     │ │ Stat     │ │ Stat     │ │ Stat     │ │
│  │            │ │  │ Card     │ │ Card     │ │ Card     │ │ Card     │ │
│  │            │ │  └──────────┘ └──────────┘ └──────────┘ └──────────┘ │
│  │            │ │  ┌──────────┐                                          │
│  │            │ │  │ Stat     │                                          │
│  │            │ │  │ Card     │                                          │
│  │            │ │  └──────────┘                                          │
│  │            │ │                                                        │
│  │            │ │  Last updated: 3m ago                          [Refresh]│
│  │            └──┘                                                       │
│  └────────────┘                                                          │
└──────────────────────────────────────────────────────────────────────────┘
```

---

## Spacing

All values in px. Everything on the 4px grid.

```
┌─────────────────────────────────────────────────────────────────────────┐
│ Section Spacing                                                          │
│                                                                          │
│  Content max-width: 960px · centered within content area (1200 - 240)   │
│                                                                          │
│  ─── Section ────────────────────────────────────────────────────────   │
│  │ mb 32px (2xl) between sections                                       │
│  │                                                                       │
│  │  Section header · H2 · mb 12px                                       │
│  │  ───────────────────────────────────────────                          │
│  │                                                                       │
│  │  Card / Row                                                           │
│  │  │ mb 8px (sm) between cards within a section                        │
│  │  │ p 12px (md) inside card                                            │
│  │  │                                                                    │
│  │  │  Inner elements: gap 8px (sm)                                     │
│  │  └────────────────────────────────────────────────────────────────── │
│  └────────────────────────────────────────────────────────────────────── │
└─────────────────────────────────────────────────────────────────────────┘
```

| Token | Value | Usage |
|-------|-------|-------|
| Page padding | 24px (xl) | Content inset from viewport edge |
| Section gap | 32px (2xl) | Between major sections |
| Section header margin | 12px (md) | Below section title |
| Card padding | 12px (md) | Inside all cards |
| Card gap | 8px (sm) | Between cards stacked in a section |
| Element gap | 8px (sm) | Between label and value, icon and text |
| Button gap | 8px (sm) | Between adjacent buttons |
| Org Pulse card gap | 12px (md) | Between stat cards in the grid |

---

## Typography

```
┌─────────────────────────────────────────────────────────────────────────┐
│ Section       │ Element            │ Token         │ Size / Weight     │
│───────────────┼────────────────────┼───────────────┼───────────────────│
│ Page          │ Page title         │ Display       │ 36px / 700        │
│               │ Date               │ Body Small    │ 12px / 400        │
│───────────────┼────────────────────┼───────────────┼───────────────────│
│ Since away    │ Section title      │ H3            │ 16px / 600        │
│               │ Release name       │ Body · 600    │ 14px / 600        │
│               │ Activity summary   │ Body Small    │ 12px / 400        │
│───────────────┼────────────────────┼───────────────┼───────────────────│
│ Alerts        │ Section title      │ H2            │ 20px / 600        │
│               │ Alert count badge  │ Label         │ 12px / 500        │
│               │ Severity badge     │ Label         │ 12px / 500        │
│               │ Alert title        │ Body · 600    │ 14px / 600        │
│               │ Alert description  │ Body          │ 14px / 400        │
│               │ Alert metadata     │ Body Small    │ 12px / 400        │
│               │ Button text        │ Label         │ 12px / 500        │
│───────────────┼────────────────────┼───────────────┼───────────────────│
│ Blocked Work  │ (same as Alerts)   │               │                   │
│───────────────┼────────────────────┼───────────────┼───────────────────│
│ Deadlines     │ Table row          │ Body          │ 14px / 400        │
│               │ Urgency dot        │ —             │ 8px diameter      │
│               │ Owner name         │ Body Small    │ 12px / 400        │
│───────────────┼────────────────────┼───────────────┼───────────────────│
│ Org Pulse     │ Stat number        │ H1            │ 24px / 600        │
│               │ Stat label         │ Body Small    │ 12px / 400        │
│───────────────┼────────────────────┼───────────────┼───────────────────│
│ Footer        │ Updated timestamp  │ Caption       │ 11px / 400        │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Colors

```
┌─────────────────────────────────────────────────────────────────────────┐
│ Element                │ Token              │ Hex          │ Notes      │
│────────────────────────┼────────────────────┼──────────────┼────────────│
│ Page background        │ Background         │ #FAFAFA      │ Full page  │
│ Content area           │ (transparent)      │ —            │ Inherits bg│
│ Sidebar                │ Surface            │ #FFFFFF      │            │
│ Top Nav                │ Surface            │ #FFFFFF      │            │
│────────────────────────┼────────────────────┼──────────────┼────────────│
│ Section header         │ Text Primary       │ #18181B      │ H2 weight  │
│ Section count badge    │ Neutral            │ bg #F4F4F5   │ text #52525B│
│────────────────────────┼────────────────────┼──────────────┼────────────│
│ Alert card - bg        │ Surface            │ #FFFFFF      │            │
│ Alert card - border    │ Border             │ #E4E4E7      │ 1px solid  │
│ Alert card - left strip│ Severity color     │ #DC2626 crit │ 3px solid  │
│ Alert title            │ Text Primary       │ #18181B      │ 600 weight │
│ Alert description      │ Text Secondary     │ #52525B      │            │
│────────────────────────┼────────────────────┼──────────────┼────────────│
│ Alert - Critical       │ Error + Error Muted│ #DC2626 text │ bg #FEF2F2 │
│ Alert - Warning        │ Warning + Warn Muted│ #D97706 text│ bg #FEF3C7 │
│ Alert - Info           │ Info + Info Muted  │ #2563EB text │ bg #DBEAFE │
│────────────────────────┼────────────────────┼──────────────┼────────────│
│ Acknowledged strip     │ Text Muted         │ #A1A1AA      │ replaces   │
│                        │                    │              │ severity   │
│────────────────────────┼────────────────────┼──────────────┼────────────│
│ Deadline - overdue     │ Error              │ #DC2626 dot  │            │
│ Deadline - this week   │ Warning            │ #D97706 dot  │            │
│ Deadline - future      │ Success            │ #16A34A dot  │            │
│────────────────────────┼────────────────────┼──────────────┼────────────│
│ Org Pulse - number     │ Text Primary       │ #18181B      │ H1 600     │
│                        │ (or status color)  │ (color if >0)│            │
│ Org Pulse - label      │ Text Secondary     │ #52525B      │            │
│ Org Pulse - card bg    │ Surface            │ #FFFFFF      │            │
│────────────────────────┼────────────────────┼──────────────┼────────────│
│ Refresh timestamp      │ Text Muted         │ #A1A1AA      │ Caption    │
└─────────────────────────────────────────────────────────────────────────┘
```

### Severity Color Mapping

```
Critical (🔴):   text #DC2626  bg #FEF2F2  left strip #DC2626
Warning  (🟡):   text #D97706  bg #FEF3C7  left strip #D97706
Info     (🔵):   text #2563EB  bg #EFF6FF  left strip #2563EB
Acknowledged:    text #A1A1AA  bg #FAFAFA  left strip #A1A1AA
```

---

## Card Hierarchy

### Level 1: Alert / Blocker Card

```
┌── 3px left strip (severity color) ─────────────────────────────────────┐
│ 12px padding all sides                                                  │
│                                                                          │
│  🔴 CRITICAL                                          ← Label 12px/500  │
│                                                                          │
│  Lua — Advertising budget exceeded by $3,000         ← Body 14px/600   │
│  Blocking: Campaign · 3 days                          ← Body Small 12px │
│  Owner: Alex PM                                                        │
│                                                                          │
│  ┌──────────┐ ┌──────────────┐    ← btns M 40px, gap 8px              │
│  │ Resolve  │ │ Acknowledge  │                                         │
│  └──────────┘ └──────────────┘                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

### Level 2: Stat Card (Org Pulse)

```
┌──────────────────────┐
│ 16px padding         │
│                      │
│  5                    │  ← H1 24px/600, #18181B or status color
│  active releases     │  ← Body Small 12px/400, #52525B
│                      │
└──────────────────────┘
│ 2px top strip if >0  │
│ Green  if healthy    │
│ Red    if critical   │
└──────────────────────┘
```

### Level 3: Deadline Row

```
┌─────────────────────────────────────────────────────────────────────────┐
│  12px padding horizontal, 8px vertical                                  │
│                                                                          │
│  🔴 Lua · Mastering · Aug 20 · 5 days overdue · Sam Wilson              │
│  │   │       │           │           │                 │                │
│  │   │       │           │           │                 └ Body Small 12px│
│  │   │       │           │           └ Body Small 12px, color-coded    │
│  │   │       │           └ Body 14px                                    │
│  │   │       └ Body 14px                                                │
│  │   └ Body 14px/600 (release name)                                     │
│  └ 8px dot, severity color                                              │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Visual Density Rules

| Rule | Value |
|------|-------|
| Maximum content width | 960px centered |
| Cards per section | No artificial limit. Scroll, don't paginate. |
| Text truncation | Release names: 24 chars. Alert titles: 60 chars. |
| Section collapse | None. All sections visible. Information density is a feature. |
| Spacing philosophy | Compact, not cramped. 12px card padding is the minimum. Never 8px. |
| Scroll | Vertical only. No horizontal scroll except for Org Pulse cards on narrow viewports. |

---

## Responsive Behavior

### 1024–1279px (Small Desktop)

| Change | Detail |
|--------|--------|
| Content max-width | Full width minus 240px sidebar |
| Org Pulse cards | 4 then 1 on second row |
| Alert cards | Full width |
| Deadline rows | Full width |

### 768–1023px (Tablet)

| Change | Detail |
|--------|--------|
| Sidebar | Collapsed to icons only (56px) or hamburger |
| Content max-width | Full width minus sidebar width |
| Org Pulse cards | 3 + 2 grid |
| Section spacing | 24px (xl) between sections (was 32px) |

### <768px (Phone)

| Change | Detail |
|--------|--------|
| Sidebar | Hidden. Bottom tab bar instead. |
| Content max-width | 100vw - 32px page padding |
| Page padding | 16px |
| Section spacing | 24px (xl) |
| Card padding | 12px (md) — unchanged |
| Org Pulse cards | 3 + 2 grid (cards at ~100px wide each) |
| Alert buttons | Full width stacked (not inline) |
| Deadline rows | Stacked. Each deadline is a mini-card with left border. |
| "Since you were away" | Hidden on mobile. Accessible via "What's new" tab. |

---

## Implementation Tokens

```css
.operations-page {
  max-width: 960px;
  margin: 0 auto;
  padding: 24px;
}

.operations-section {
  margin-bottom: 32px;

  & h2 {
    font: var(--text-h2);
    color: var(--color-text-primary);
    margin-bottom: 12px;
  }
}

.alert-card {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-left: 3px solid var(--alert-severity-color, var(--color-border));
  padding: 12px;
  margin-bottom: 8px;

  &.critical  { --alert-severity-color: var(--color-error); }
  &.warning   { --alert-severity-color: var(--color-warning); }
  &.info      { --alert-severity-color: var(--color-info); }
  &.acknowledged {
    --alert-severity-color: var(--color-text-muted);
    background: var(--color-background);
  }

  .alert-severity {
    font: var(--text-label);
  }

  .alert-title {
    font: var(--text-body);
    font-weight: 600;
    color: var(--color-text-primary);
  }

  .alert-description {
    font: var(--text-body-sm);
    color: var(--color-text-secondary);
  }

  .alert-actions {
    display: flex;
    gap: 8px;
    margin-top: 8px;
  }
}

.stat-card {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  padding: 16px;

  .stat-number {
    font: var(--text-h1);
    color: var(--color-text-primary);
  }

  .stat-label {
    font: var(--text-body-sm);
    color: var(--color-text-secondary);
  }
}

.deadline-row {
  padding: 8px 12px;
  display: flex;
  align-items: center;
  gap: 8px;
  font: var(--text-body);

  .urgency-dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    flex-shrink: 0;
  }

  .release-name {
    font-weight: 600;
  }

  .owner {
    font: var(--text-body-sm);
    margin-left: auto;
  }
}
```
